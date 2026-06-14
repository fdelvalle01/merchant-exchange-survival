package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionCardResponse {
    private Integer position;
    private Boolean revealed;
    private Boolean selected;
}
