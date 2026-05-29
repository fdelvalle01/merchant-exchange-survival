package com.francisco.stockbar.dto;

import com.francisco.stockbar.model.PlayerCompany;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class GameStateResponse {
    private Long companyId;
    private String companyName;
    private BigDecimal cash;
    private BigDecimal debt;
    private BigDecimal companyValue;
    private BigDecimal portfolioValue;
    private BigDecimal realizedPnl;
    private BigDecimal unrealizedPnl;
    private Integer reputation;
    private String riskLevel;
    private Integer gameDay;
    private String status;
    private BigDecimal dailyBurnRate;
    private BigDecimal cashRunwayDays;
    private Integer criticalDays;
    private BigDecimal victoryTarget;
    private String bankruptcyReason;
    private String victoryMessage;
    private LocalDateTime lastDayProcessedAt;

    public static GameStateResponse from(
            PlayerCompany company,
            BigDecimal portfolioValue,
            BigDecimal unrealizedPnl
    ) {
        String status = company.getStatus() != null ? company.getStatus().name() : null;

        return GameStateResponse.builder()
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .cash(company.getCash())
                .debt(company.getDebt())
                .companyValue(company.getCompanyValue())
                .portfolioValue(portfolioValue)
                .realizedPnl(company.getRealizedPnl())
                .unrealizedPnl(unrealizedPnl)
                .reputation(company.getReputation())
                .riskLevel(company.getRiskLevel())
                .gameDay(company.getGameDay())
                .status(status)
                .dailyBurnRate(company.getDailyBurnRate())
                .cashRunwayDays(company.getCashRunwayDays())
                .criticalDays(company.getCriticalDays())
                .victoryTarget(company.getVictoryTarget())
                .bankruptcyReason(company.getBankruptcyReason())
                .victoryMessage("VICTORIOUS".equals(status)
                        ? "Your merchant house has become a dominant market power."
                        : null)
                .lastDayProcessedAt(company.getLastDayProcessedAt())
                .build();
    }
}
