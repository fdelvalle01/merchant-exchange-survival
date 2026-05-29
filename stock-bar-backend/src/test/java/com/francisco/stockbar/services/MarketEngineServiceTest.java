package com.francisco.stockbar.services;

import com.francisco.stockbar.config.MarketEngineProperties;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketEngineServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private MarketOrderRepository marketOrderRepository;

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Mock
    private MarketEventRepository marketEventRepository;

    private MarketEngineProperties properties;
    private MarketEngineService marketEngineService;

    @BeforeEach
    void setUp() {
        properties = new MarketEngineProperties();
        marketEngineService = new MarketEngineService(
                productRepository,
                marketOrderRepository,
                priceHistoryRepository,
                marketEventRepository,
                properties
        );
    }

    @Test
    void buyPressureRaisesPrice() {
        Product product = product("Ironhill Mines", "100.00", "100.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 10L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isGreaterThan(BigDecimal.valueOf(100));
        verifyMarketEventType("PRICE_PRESSURE_UP");
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    @Test
    void sellPressureLowersPrice() {
        Product product = product("Black Harbor Shipping", "100.00", "100.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 0L, 10L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isLessThan(BigDecimal.valueOf(100));
        verifyMarketEventType("PRICE_PRESSURE_DOWN");
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    @Test
    void buyPressureBelowThresholdDoesNotMovePrice() {
        Product product = product("Ironhill Mines", "100.00", "100.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 1L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isEqualByComparingTo("100.00");
        verify(productRepository, never()).save(any(Product.class));
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
        verify(marketEventRepository, never()).save(any(MarketEvent.class));
    }

    @Test
    void reversionRaisesAssetBelowBasePrice() {
        Product product = product("Royal Grain Company", "100.00", "80.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 0L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isGreaterThan(BigDecimal.valueOf(80));
        assertThat(product.getCurrentPrice()).isLessThan(BigDecimal.valueOf(100));
        verifyMarketEventType("PRICE_REVERSION");
    }

    @Test
    void reversionLowersAssetAboveBasePrice() {
        Product product = product("Silvercrown Bank", "100.00", "120.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 0L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isLessThan(BigDecimal.valueOf(120));
        assertThat(product.getCurrentPrice()).isGreaterThan(BigDecimal.valueOf(100));
        verifyMarketEventType("PRICE_REVERSION");
    }

    @Test
    void reversionDoesNotOvershootBasePrice() {
        properties.setReversionRatePct(BigDecimal.valueOf(1.50));
        Product product = product("Arcane Research Guild", "100.00", "90.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 0L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isEqualByComparingTo("100.00");
        verifyMarketEventType("PRICE_REVERSION");
    }

    @Test
    void priceDoesNotExceedMaxMultiplier() {
        configureExtremePressure();
        Product product = product("Northwind Logistics", "100.00", "490.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 1000L, 0L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isEqualByComparingTo("500.00");
        assertThat(product.getMaxPrice()).isEqualByComparingTo("500.00");
    }

    @Test
    void priceDoesNotFallBelowMinMultiplier() {
        configureExtremePressure();
        Product product = product("Old Dragon Brewery", "100.00", "20.00");
        when(productRepository.findAll()).thenReturn(List.of(product));
        stubPressure(product, 0L, 1000L);

        marketEngineService.runMarketTick();

        assertThat(product.getCurrentPrice()).isEqualByComparingTo("20.00");
    }

    private void configureExtremePressure() {
        properties.setDefaultLiquidityDepth(BigDecimal.ONE);
        properties.setBuyImpactFactor(BigDecimal.ONE);
        properties.setSellImpactFactor(BigDecimal.ONE);
        properties.setMaxPressureImpactPct(BigDecimal.ONE);
        properties.setReversionEnabled(false);
    }

    private void stubPressure(Product product, long buyQuantity, long sellQuantity) {
        when(marketOrderRepository.sumQuantityByProductAndSideSince(
                eq(product),
                eq(OrderSide.BUY),
                eq(OrderStatus.FILLED),
                any(LocalDateTime.class)
        )).thenReturn(buyQuantity);
        when(marketOrderRepository.sumQuantityByProductAndSideSince(
                eq(product),
                eq(OrderSide.SELL),
                eq(OrderStatus.FILLED),
                any(LocalDateTime.class)
        )).thenReturn(sellQuantity);
    }

    private void verifyMarketEventType(String type) {
        ArgumentCaptor<MarketEvent> eventCaptor = ArgumentCaptor.forClass(MarketEvent.class);
        verify(marketEventRepository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getType()).isEqualTo(type);
    }

    private Product product(String name, String basePrice, String currentPrice) {
        return Product.builder()
                .id(1L)
                .name(name)
                .basePrice(new BigDecimal(basePrice))
                .currentPrice(new BigDecimal(currentPrice))
                .maxPrice(new BigDecimal(basePrice))
                .enabled(true)
                .build();
    }
}
