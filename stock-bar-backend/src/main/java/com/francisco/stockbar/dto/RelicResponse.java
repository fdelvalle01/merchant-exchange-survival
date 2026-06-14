package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.CompanyRelic;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RelicResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String category;
    private String targetType;
    private String activationType;
    private Integer durationDays;
    private Integer chargesRemaining;
    private String effectType;
    private String iconKey;
    private String status;
    private Integer acquiredAtDay;
    private Integer equippedSlot;
    private Integer activatedAtDay;
    private Integer expiresAtDay;
    private Integer daysRemaining;
    private Long targetProductId;
    private Long sourceAuctionId;

    public static RelicResponse from(CompanyRelic relic, int currentDay) {
        Integer expiresAtDay = relic.getExpiresAtDay();
        Integer remaining = expiresAtDay == null ? null : Math.max(0, expiresAtDay - currentDay);
        return RelicResponse.builder()
                .id(relic.getId())
                .code(relic.getRelicDefinition().getCode())
                .name(relic.getRelicDefinition().getName())
                .description(relic.getRelicDefinition().getDescription())
                .category(relic.getRelicDefinition().getCategory().name())
                .targetType(relic.getRelicDefinition().getTargetType().name())
                .activationType(relic.getRelicDefinition().getActivationType().name())
                .durationDays(relic.getRelicDefinition().getDurationDays())
                .chargesRemaining(relic.getChargesRemaining())
                .effectType(relic.getRelicDefinition().getEffectType().name())
                .iconKey(relic.getRelicDefinition().getIconKey())
                .status(relic.getStatus().name())
                .acquiredAtDay(relic.getAcquiredAtDay())
                .equippedSlot(relic.getEquippedSlot())
                .activatedAtDay(relic.getActivatedAtDay())
                .expiresAtDay(expiresAtDay)
                .daysRemaining(remaining)
                .targetProductId(relic.getTargetProductId())
                .sourceAuctionId(relic.getSourceAuction() == null ? null : relic.getSourceAuction().getId())
                .build();
    }
}
