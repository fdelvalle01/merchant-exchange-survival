package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.OrderSide;
import lombok.Data;

@Data
public class OrderRequest {
    private Long assetId;
    private OrderSide side;
    private int quantity;
}
