package com.francisco.stockbar.dto;

import lombok.Data;

@Data
public class RelicReorderRequest {
    private Long relicId;
    private Integer targetSlot;
}
