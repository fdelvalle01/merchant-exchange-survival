package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.OrderRequest;
import com.francisco.stockbar.dto.OrderResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.MarketOrder;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private MarketOrderRepository marketOrderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private MarketEventRepository marketEventRepository;

    @Mock
    private PlayerCompanyService playerCompanyService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                marketOrderRepository,
                productRepository,
                saleRepository,
                holdingRepository,
                marketEventRepository,
                playerCompanyService
        );
    }

    @Test
    void buyStoresOrderSaleAndHolding() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(100000));
        OrderRequest request = orderRequest(OrderSide.BUY, 3);

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);
        when(holdingRepository.findByPlayerCompanyAndProduct(company, product)).thenReturn(Optional.empty());
        when(marketOrderRepository.save(any(MarketOrder.class))).thenAnswer(invocation -> {
            MarketOrder order = invocation.getArgument(0);
            order.setId(99L);
            return order;
        });
        when(holdingRepository.save(any(Holding.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(request);

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getAssetId()).isEqualTo(12L);
        assertThat(response.getAssetName()).isEqualTo("Black Harbor Shipping");
        assertThat(response.getSide()).isEqualTo(OrderSide.BUY);
        assertThat(response.getExecutedPrice()).isEqualByComparingTo("4400.00");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("13200.00");
        assertThat(response.getRealizedPnl()).isEqualByComparingTo("0.00");
        assertThat(product.getCurrentPrice()).isEqualByComparingTo("4400.00");
        assertThat(product.getLastPurchasedAt()).isNotNull();
        assertThat(company.getCash()).isEqualByComparingTo("86800.00");
        verify(saleRepository).save(any(Sale.class));
        verify(productRepository).save(product);
        verify(holdingRepository).save(any(Holding.class));
        verify(playerCompanyService).refreshCompanyValue(company);
    }

    @Test
    void buyUpdatesQuantityAndAveragePriceForExistingHolding() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(100000));
        Holding holding = Holding.builder()
                .playerCompany(company)
                .product(product)
                .quantity(2)
                .averagePrice(BigDecimal.valueOf(4000))
                .build();

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);
        when(holdingRepository.findByPlayerCompanyAndProduct(company, product)).thenReturn(Optional.of(holding));
        when(marketOrderRepository.save(any(MarketOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrder(orderRequest(OrderSide.BUY, 3));

        assertThat(holding.getQuantity()).isEqualTo(5);
        assertThat(holding.getAveragePrice()).isEqualByComparingTo("4240.00");
        assertThat(company.getCash()).isEqualByComparingTo("86800.00");
    }

    @Test
    void sellIncreasesCashReducesHoldingAndAccumulatesRealizedPnl() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(10000));
        Holding holding = Holding.builder()
                .playerCompany(company)
                .product(product)
                .quantity(5)
                .averagePrice(BigDecimal.valueOf(4000))
                .build();

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);
        when(holdingRepository.findByPlayerCompanyAndProduct(company, product)).thenReturn(Optional.of(holding));
        when(marketOrderRepository.save(any(MarketOrder.class))).thenAnswer(invocation -> {
            MarketOrder order = invocation.getArgument(0);
            order.setId(100L);
            return order;
        });

        OrderResponse response = orderService.createOrder(orderRequest(OrderSide.SELL, 2));

        assertThat(response.getSide()).isEqualTo(OrderSide.SELL);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("8800.00");
        assertThat(response.getRealizedPnl()).isEqualByComparingTo("800.00");
        assertThat(product.getCurrentPrice()).isEqualByComparingTo("4400.00");
        assertThat(company.getCash()).isEqualByComparingTo("18800.00");
        assertThat(company.getRealizedPnl()).isEqualByComparingTo("800.00");
        assertThat(holding.getQuantity()).isEqualTo(3);
        verify(holdingRepository).save(holding);
        verify(saleRepository, never()).save(any());
        verify(playerCompanyService).refreshCompanyValue(company);
    }

    @Test
    void sellDeletesHoldingWhenQuantityReachesZero() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(10000));
        Holding holding = Holding.builder()
                .playerCompany(company)
                .product(product)
                .quantity(2)
                .averagePrice(BigDecimal.valueOf(4000))
                .build();

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);
        when(holdingRepository.findByPlayerCompanyAndProduct(company, product)).thenReturn(Optional.of(holding));
        when(marketOrderRepository.save(any(MarketOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrder(orderRequest(OrderSide.SELL, 2));

        verify(holdingRepository).delete(holding);
        verify(holdingRepository, never()).save(holding);
    }

    @Test
    void sellRejectsWhenHoldingIsMissing() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(10000));

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);
        when(holdingRepository.findByPlayerCompanyAndProduct(company, product)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(orderRequest(OrderSide.SELL, 1)))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("Not enough holdings to sell this asset.");
                });

        verify(marketOrderRepository, never()).save(any());
    }

    @Test
    void buyRejectsInsufficientFundsWithConflict() {
        Product product = product();
        PlayerCompany company = playerCompany(BigDecimal.valueOf(1000));

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        assertThatThrownBy(() -> orderService.createOrder(orderRequest(OrderSide.BUY, 1)))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("Insufficient funds");
                });

        assertThat(company.getCash()).isEqualByComparingTo("1000");
        verify(marketOrderRepository, never()).save(any());
        verify(holdingRepository, never()).save(any());
    }

    private OrderRequest orderRequest(OrderSide side, int quantity) {
        OrderRequest request = new OrderRequest();
        request.setAssetId(12L);
        request.setSide(side);
        request.setQuantity(quantity);
        return request;
    }

    private Product product() {
        return Product.builder()
                .id(12L)
                .name("Black Harbor Shipping")
                .currentPrice(BigDecimal.valueOf(4400))
                .enabled(true)
                .build();
    }

    private PlayerCompany playerCompany(BigDecimal cash) {
        return PlayerCompany.builder()
                .id(1L)
                .username("trader")
                .companyName("Trader Trading Company")
                .cash(cash)
                .debt(BigDecimal.ZERO)
                .companyValue(cash)
                .realizedPnl(BigDecimal.ZERO)
                .reputation(50)
                .riskLevel("LOW")
                .build();
    }
}
