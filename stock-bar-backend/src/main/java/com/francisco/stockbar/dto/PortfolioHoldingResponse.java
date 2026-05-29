package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PortfolioHoldingResponse {
    private Long assetId;
    private String assetName;
    private Integer quantity;
    private BigDecimal averagePrice;
    private BigDecimal currentPrice;
    private BigDecimal marketValue;
    private BigDecimal unrealizedPnl;
    private BigDecimal unrealizedPnlPercent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
