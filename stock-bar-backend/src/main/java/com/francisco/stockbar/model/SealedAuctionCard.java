package com.francisco.stockbar.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "sealed_auction_cards",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sealed_auction_card_position",
                columnNames = {"auction_id", "position"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SealedAuctionCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private SealedAuction auction;

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relic_definition_id")
    private RelicDefinition relicDefinition;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, columnDefinition = "varchar(16) default 'POSITIVE'")
    private AuctionOutcomePolarity outcomePolarity = AuctionOutcomePolarity.POSITIVE;

    @Column(nullable = false, length = 80, columnDefinition = "varchar(80) default 'RING_OF_LAST_MERCY'")
    private String outcomeCode;

    @Column(length = 800)
    private String resolutionDetails;

    @Builder.Default
    @Column(nullable = false)
    private Boolean revealed = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean selected = false;

    @Column(nullable = false)
    private Long generatedOrder;
}
