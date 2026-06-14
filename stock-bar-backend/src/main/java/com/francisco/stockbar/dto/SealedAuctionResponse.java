package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class SealedAuctionResponse {
    private Long id;
    private String title;
    private BigDecimal entryCost;
    private Integer availableFromDay;
    private Integer closesAtDay;
    private Integer daysRemaining;
    private String status;
    private Integer selectedCardPosition;
    private RelicResponse selectedRelic;
    private List<AuctionCardResponse> cards;
}
