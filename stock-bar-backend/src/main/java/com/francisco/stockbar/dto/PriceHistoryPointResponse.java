package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.PriceHistory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PriceHistoryPointResponse {
    private LocalDateTime timestamp;
    private BigDecimal price;

    public static PriceHistoryPointResponse from(PriceHistory history) {
        return PriceHistoryPointResponse.builder()
                .timestamp(history.getTimestamp())
                .price(history.getPrice())
                .build();
    }
}
