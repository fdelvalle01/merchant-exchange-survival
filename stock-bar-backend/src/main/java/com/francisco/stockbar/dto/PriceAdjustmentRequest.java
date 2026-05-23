package com.francisco.stockbar.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PriceAdjustmentRequest {
    private BigDecimal percent;
}
