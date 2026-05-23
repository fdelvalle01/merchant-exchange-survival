package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.MarketEvent;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MarketEventResponse {
    private Long id;
    private String type;
    private String description;
    private String executedBy;
    private LocalDateTime timestamp;

    public static MarketEventResponse from(MarketEvent event) {
        return MarketEventResponse.builder()
                .id(event.getId())
                .type(event.getType())
                .description(event.getDescription())
                .executedBy(event.getExecutedBy())
                .timestamp(event.getTimestamp())
                .build();
    }
}
