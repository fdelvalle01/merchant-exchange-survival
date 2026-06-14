package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.RelicHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RelicHistoryRepository extends JpaRepository<RelicHistory, Long> {
    List<RelicHistory> findTop100ByPlayerCompanyOrderByCreatedAtDesc(PlayerCompany company);
    List<RelicHistory> findByPlayerCompany(PlayerCompany company);
}
