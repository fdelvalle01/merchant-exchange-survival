package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AuctionSelectionResponse {
    private Long auctionId;
    private String status;
    private Integer selectedCardPosition;
    private String selectedOutcomePolarity;
    private String selectedOutcomeCode;
    private String selectedOutcomeTitle;
    private String selectedOutcomeDescription;
    private RelicResponse relic;
    private BigDecimal cash;
}
