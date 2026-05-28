package com.francisco.stockbar.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        if (realizedPnl == null) {
            realizedPnl = BigDecimal.ZERO.setScale(2);
        }
        updatedAt = LocalDateTime.now();
    }
}
