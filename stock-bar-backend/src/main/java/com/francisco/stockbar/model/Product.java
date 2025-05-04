package com.francisco.stockbar.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal currentPrice;

    private String imageUrl;

    private Boolean enabled;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime lastPurchasedAt;

    @Column(name = "max_price")
    private BigDecimal maxPrice;


}
