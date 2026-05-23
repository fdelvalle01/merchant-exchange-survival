package com.francisco.stockbar.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;

    @Column(length = 600)
    private String description;

    private String executedBy;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
