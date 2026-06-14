package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.RelicHistory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RelicHistoryResponse {
    private Long id;
    private Long relicId;
    private String eventType;
    private Integer gameDay;
    private String details;
    private LocalDateTime createdAt;

    public static RelicHistoryResponse from(RelicHistory history) {
        return RelicHistoryResponse.builder()
                .id(history.getId())
                .relicId(history.getCompanyRelic() == null ? null : history.getCompanyRelic().getId())
                .eventType(history.getEventType())
                .gameDay(history.getGameDay())
                .details(history.getDetails())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
