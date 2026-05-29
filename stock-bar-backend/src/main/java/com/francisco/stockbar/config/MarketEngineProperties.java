package com.francisco.stockbar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "game.market-engine")
public class MarketEngineProperties {

    private boolean enabled = true;
    private long updateRateMillis = 30000;
    private long pressureLookbackSeconds = 60;
    private BigDecimal buyImpactFactor = BigDecimal.valueOf(0.002);
    private BigDecimal sellImpactFactor = BigDecimal.valueOf(0.0025);
    private BigDecimal maxPressureImpactPct = BigDecimal.valueOf(0.08);
    private BigDecimal reversionRatePct = BigDecimal.valueOf(0.01);
    private BigDecimal minPriceMultiplier = BigDecimal.valueOf(0.20);
    private BigDecimal maxPriceMultiplier = BigDecimal.valueOf(5.00);
}
