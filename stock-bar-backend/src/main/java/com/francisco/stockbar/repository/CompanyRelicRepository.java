package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.CompanyRelic;
import com.francisco.stockbar.model.CompanyRelicStatus;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.RelicEffectType;
import com.francisco.stockbar.model.SealedAuction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompanyRelicRepository extends JpaRepository<CompanyRelic, Long> {
    List<CompanyRelic> findByPlayerCompanyOrderByCreatedAtDesc(PlayerCompany company);
    Optional<CompanyRelic> findByPlayerCompanyAndEquippedSlot(PlayerCompany company, Integer equippedSlot);
    Optional<CompanyRelic> findByPlayerCompanyAndSourceAuction(PlayerCompany company, SealedAuction auction);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CompanyRelic r where r.id = :id and r.playerCompany = :company")
    Optional<CompanyRelic> findOwnedForUpdate(@Param("id") Long id, @Param("company") PlayerCompany company);

    @Query("""
            select r from CompanyRelic r
            where r.playerCompany = :company
              and r.status in :statuses
              and r.relicDefinition.effectType = :effectType
            """)
    List<CompanyRelic> findEffects(
            @Param("company") PlayerCompany company,
            @Param("statuses") Collection<CompanyRelicStatus> statuses,
            @Param("effectType") RelicEffectType effectType
    );
}
