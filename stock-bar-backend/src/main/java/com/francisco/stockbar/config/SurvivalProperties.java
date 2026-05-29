package com.francisco.stockbar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "game.survival")
public class SurvivalProperties {

    private BigDecimal dailyBurnRate = BigDecimal.valueOf(500);
    private BigDecimal debtDailyInterestPct = BigDecimal.valueOf(0.001);
    private boolean randomEventOnEndDayEnabled = true;
    private BigDecimal randomEventChance = BigDecimal.valueOf(0.35);
    private boolean forcedLiquidationEnabled = false;
    private BigDecimal forcedLiquidationDiscountPct = BigDecimal.valueOf(0.10);
}
