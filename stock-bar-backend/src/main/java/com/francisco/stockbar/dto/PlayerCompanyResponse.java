package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.PlayerCompany;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PlayerCompanyResponse {
    private Long id;
    private String username;
    private String companyName;
    private BigDecimal cash;
    private BigDecimal debt;
    private BigDecimal companyValue;
    private BigDecimal realizedPnl;
    private BigDecimal portfolioValue;
    private Integer reputation;
    private String riskLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PlayerCompanyResponse from(PlayerCompany company) {
        return from(company, BigDecimal.ZERO);
    }

    public static PlayerCompanyResponse from(PlayerCompany company, BigDecimal portfolioValue) {
        return PlayerCompanyResponse.builder()
                .id(company.getId())
                .username(company.getUsername())
                .companyName(company.getCompanyName())
                .cash(company.getCash())
                .debt(company.getDebt())
                .companyValue(company.getCompanyValue())
                .realizedPnl(company.getRealizedPnl())
                .portfolioValue(portfolioValue)
                .reputation(company.getReputation())
                .riskLevel(company.getRiskLevel())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
