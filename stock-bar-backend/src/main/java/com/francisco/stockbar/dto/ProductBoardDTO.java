package com.francisco.stockbar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBoardDTO {
    private Long id;
    private String name;
    private double basePrice;
    private double currentPrice;
    private double priceChange;
    private double percentageChange;
    private String trend;
    private String imageUrl;
    private String sector;
    private double percentageDropFromMax;
    private List<Map<String, Object>> history;
    private double maxPrice;

}
