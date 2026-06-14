package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class RelicActivationResponse {
    private RelicResponse relic;
    private BigDecimal cash;
    private Long targetProductId;
    private String targetProductName;
    private List<ForecastDayResponse> forecast;
    private String confidence;
}
