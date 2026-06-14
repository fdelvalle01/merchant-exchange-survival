package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.AuctionStatus;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.SealedAuction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SealedAuctionRepository extends JpaRepository<SealedAuction, Long> {

    Optional<SealedAuction> findFirstByPlayerCompanyAndAvailableFromDayOrderByCreatedAtDesc(
            PlayerCompany company,
            Integer day
    );

    Optional<SealedAuction> findByIdAndPlayerCompany(Long id, PlayerCompany company);

    List<SealedAuction> findByPlayerCompany(PlayerCompany company);

    List<SealedAuction> findByPlayerCompanyAndStatusIn(PlayerCompany company, Collection<AuctionStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from SealedAuction a where a.id = :id and a.playerCompany = :company")
    Optional<SealedAuction> findOwnedForUpdate(@Param("id") Long id, @Param("company") PlayerCompany company);
}
