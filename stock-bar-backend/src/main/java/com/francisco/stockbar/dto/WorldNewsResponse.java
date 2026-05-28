package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.NewsDirection;
import com.francisco.stockbar.model.NewsSeverity;
import com.francisco.stockbar.model.WorldEventType;
import com.francisco.stockbar.model.WorldNewsItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WorldNewsResponse {
    private Long id;
    private WorldEventType type;
    private String category;
    private String title;
    private String summary;
    private String description;
    private NewsSeverity severity;
    private String affectedSector;
    private String affectedAssetName;
    private BigDecimal impactPercent;
    private NewsDirection direction;
    private Boolean isRead;
    private LocalDateTime timestamp;

    public static WorldNewsResponse from(WorldNewsItem item) {
        return WorldNewsResponse.builder()
                .id(item.getId())
                .type(item.getType())
                .category(item.getCategory())
                .title(item.getTitle())
                .summary(item.getSummary())
                .description(item.getBody())
                .severity(item.getSeverity())
                .affectedSector(item.getAffectedSector())
                .affectedAssetName(item.getAffectedAssetName())
                .impactPercent(item.getImpactPercent())
                .direction(item.getDirection())
                .isRead(item.getIsRead())
                .timestamp(item.getTimestamp())
                .build();
    }
}
