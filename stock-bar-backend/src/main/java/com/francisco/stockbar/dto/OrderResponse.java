package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.MarketOrder;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private Long assetId;
    private String assetName;
    private OrderSide side;
    private Integer quantity;
    private BigDecimal executedPrice;
    private BigDecimal totalAmount;
    private BigDecimal realizedPnl;
    private OrderStatus status;
    private BigDecimal companyCash;
    private LocalDateTime timestamp;

    public static OrderResponse from(MarketOrder order) {
        Product product = order.getProduct();
        PlayerCompany company = order.getPlayerCompany();

        return OrderResponse.builder()
                .id(order.getId())
                .assetId(product != null ? product.getId() : null)
                .assetName(product != null ? product.getName() : null)
                .side(order.getSide())
                .quantity(order.getQuantity())
                .executedPrice(order.getExecutedPrice())
                .totalAmount(order.getTotalAmount())
                .realizedPnl(order.getRealizedPnl())
                .status(order.getStatus())
                .companyCash(company != null ? company.getCash() : null)
                .timestamp(order.getCreatedAt())
                .build();
    }
}
