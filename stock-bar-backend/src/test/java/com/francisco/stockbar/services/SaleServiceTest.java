package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.dto.SaleResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.MarketEventRepository;
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
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private MarketEventRepository marketEventRepository;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(saleRepository, productRepository, marketEventRepository);
    }

    @Test
    void registerSaleStoresExecutedPriceAndTotalAmount() {
        Product product = Product.builder()
                .id(12L)
                .name("Cerveza Kunstmann")
                .currentPrice(BigDecimal.valueOf(4400))
                .enabled(true)
                .build();
        SaleRequest request = new SaleRequest();
        request.setProductId(12L);
        request.setQuantity(3);

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> {
            Sale sale = invocation.getArgument(0);
            sale.setId(99L);
            return sale;
        });

        SaleResponse response = saleService.registerSale(request);

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getProductId()).isEqualTo(12L);
        assertThat(response.getProductName()).isEqualTo("Cerveza Kunstmann");
        assertThat(response.getExecutedPrice()).isEqualByComparingTo("4400");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("13200.00");
        assertThat(product.getLastPurchasedAt()).isNotNull();
        verify(productRepository).save(product);
    }

    @Test
    void registerSaleRejectsInvalidQuantityWithBadRequest() {
        SaleRequest request = new SaleRequest();
        request.setProductId(12L);
        request.setQuantity(0);

        assertThatThrownBy(() -> saleService.registerSale(request))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(saleRepository, never()).save(any());
    }

    @Test
    void registerSaleRejectsMissingProductWithNotFound() {
        SaleRequest request = new SaleRequest();
        request.setProductId(999L);
        request.setQuantity(1);

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> saleService.registerSale(request))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        verify(saleRepository, never()).save(any());
    }

    @Test
    void registerSaleRejectsDisabledProductWithConflict() {
        Product product = Product.builder()
                .id(12L)
                .name("Cerveza Kunstmann")
                .currentPrice(BigDecimal.valueOf(4400))
                .enabled(false)
                .build();
        SaleRequest request = new SaleRequest();
        request.setProductId(12L);
        request.setQuantity(1);

        when(productRepository.findById(12L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> saleService.registerSale(request))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT));

        verify(saleRepository, never()).save(any());
    }
}
