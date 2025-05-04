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
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Product product;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

}
