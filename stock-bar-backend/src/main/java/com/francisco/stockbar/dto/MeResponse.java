package com.francisco.stockbar.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MeResponse {
    private String username;
    private List<String> roles;
}
