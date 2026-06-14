package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ForecastDayResponse {
    private Integer dayOffset;
    private String outlook;
}
