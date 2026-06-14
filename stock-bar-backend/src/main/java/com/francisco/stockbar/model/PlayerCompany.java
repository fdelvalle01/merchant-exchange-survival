package com.francisco.stockbar.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "player_company",
        uniqueConstraints = @UniqueConstraint(name = "uk_player_company_username", columnNames = "username")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal cash;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal debt;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal companyValue;

    @Builder.Default
    @Column(nullable = false, precision = 14, scale = 2, columnDefinition = "numeric(14,2) default 0")
    private BigDecimal realizedPnl = BigDecimal.ZERO.setScale(2);

    @Column(nullable = false)
    private Integer reputation;

    @Column(nullable = false)
    private String riskLevel;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 1")
    private Integer gameDay = 1;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "bigint default 1")
    private Long gameSeed = 1L;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'ACTIVE'")
    private PlayerCompanyStatus status = PlayerCompanyStatus.ACTIVE;

    @Builder.Default
    @Column(nullable = false, precision = 14, scale = 2, columnDefinition = "numeric(14,2) default 500.00")
    private BigDecimal dailyBurnRate = BigDecimal.valueOf(500).setScale(2);

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 1, columnDefinition = "numeric(10,1) default 0.0")
    private BigDecimal cashRunwayDays = BigDecimal.ZERO.setScale(1);

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer criticalDays = 0;

    @Builder.Default
    @Column(nullable = false, precision = 14, scale = 2, columnDefinition = "numeric(14,2) default 1000000.00")
    private BigDecimal victoryTarget = BigDecimal.valueOf(1_000_000).setScale(2);

    private LocalDateTime lastDayProcessedAt;

    @Column(length = 600)
    private String bankruptcyReason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (realizedPnl == null) {
            realizedPnl = BigDecimal.ZERO.setScale(2);
        }
        applySurvivalDefaults();
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        if (realizedPnl == null) {
            realizedPnl = BigDecimal.ZERO.setScale(2);
        }
        applySurvivalDefaults();
        updatedAt = LocalDateTime.now();
    }

    private void applySurvivalDefaults() {
        if (gameDay == null || gameDay < 1) {
            gameDay = 1;
        }
        if (gameSeed == null || gameSeed == 0L) {
            gameSeed = 1L;
        }
        if (status == null) {
            status = PlayerCompanyStatus.ACTIVE;
        }
        if (dailyBurnRate == null) {
            dailyBurnRate = BigDecimal.valueOf(500).setScale(2);
        }
        if (cashRunwayDays == null) {
            cashRunwayDays = BigDecimal.ZERO.setScale(1);
        }
        if (criticalDays == null || criticalDays < 0) {
            criticalDays = 0;
        }
        if (victoryTarget == null) {
            victoryTarget = BigDecimal.valueOf(1_000_000).setScale(2);
        }
    }
}
