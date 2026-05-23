package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class SaleResponse {
    private Long id;
    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal executedPrice;
    private BigDecimal totalAmount;
    private LocalDateTime timestamp;

    public static SaleResponse from(Sale sale) {
        Product product = sale.getProduct();

        return SaleResponse.builder()
                .id(sale.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .quantity(sale.getQuantity())
                .executedPrice(sale.getExecutedPrice())
                .totalAmount(sale.getTotalAmount())
                .timestamp(sale.getTimestamp())
                .build();
    }
}
