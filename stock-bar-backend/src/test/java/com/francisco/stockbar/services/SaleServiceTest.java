package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.OrderRequest;
import com.francisco.stockbar.dto.OrderResponse;
import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.dto.SaleResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private OrderService orderService;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(orderService);
    }

    @Test
    void registerSaleDelegatesToBuyOrder() {
        SaleRequest request = new SaleRequest();
        request.setProductId(12L);
        request.setQuantity(3);
        when(orderService.createOrder(any(OrderRequest.class))).thenReturn(OrderResponse.builder()
                .id(99L)
                .assetId(12L)
                .assetName("Black Harbor Shipping")
                .side(OrderSide.BUY)
                .quantity(3)
                .executedPrice(BigDecimal.valueOf(4400))
                .totalAmount(BigDecimal.valueOf(13200))
                .realizedPnl(BigDecimal.ZERO)
                .status(OrderStatus.FILLED)
                .timestamp(LocalDateTime.now())
                .build());

        SaleResponse response = saleService.registerSale(request);

        ArgumentCaptor<OrderRequest> captor = ArgumentCaptor.forClass(OrderRequest.class);
        verify(orderService).createOrder(captor.capture());
        assertThat(captor.getValue().getAssetId()).isEqualTo(12L);
        assertThat(captor.getValue().getSide()).isEqualTo(OrderSide.BUY);
        assertThat(captor.getValue().getQuantity()).isEqualTo(3);
        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getProductId()).isEqualTo(12L);
        assertThat(response.getProductName()).isEqualTo("Black Harbor Shipping");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("13200");
    }

    @Test
    void registerSaleRejectsInvalidQuantityWithBadRequest() {
        SaleRequest request = new SaleRequest();
        request.setProductId(12L);
        request.setQuantity(0);

        assertThatThrownBy(() -> saleService.registerSale(request))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
