package com.francisco.stockbar.dto;

import lombok.Data;

@Data
public class SaleRequest { 
    private Long productId;
    private int quantity;
}
