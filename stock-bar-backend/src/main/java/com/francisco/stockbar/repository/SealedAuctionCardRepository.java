package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.model.SealedAuctionCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SealedAuctionCardRepository extends JpaRepository<SealedAuctionCard, Long> {
    List<SealedAuctionCard> findByAuctionOrderByPositionAsc(SealedAuction auction);
    Optional<SealedAuctionCard> findByAuctionAndPosition(SealedAuction auction, Integer position);
}
