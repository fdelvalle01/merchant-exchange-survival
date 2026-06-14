package com.francisco.stockbar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "game.sealed-auction")
public class AuctionProperties {
    private BigDecimal entryCost = BigDecimal.valueOf(10_000);
    private int cardCount = 4;
    private BigDecimal appearanceChance = BigDecimal.valueOf(0.30);
    private int durationDays = 1;
    private BigDecimal fortuneRecovery = BigDecimal.valueOf(8_000);
    private BigDecimal fortuneTreasuryCap = BigDecimal.valueOf(100_000);
}
