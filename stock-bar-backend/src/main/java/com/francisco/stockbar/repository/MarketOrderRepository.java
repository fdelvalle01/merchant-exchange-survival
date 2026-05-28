package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.MarketOrder;
import com.francisco.stockbar.model.PlayerCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketOrderRepository extends JpaRepository<MarketOrder, Long> {
    List<MarketOrder> findByPlayerCompanyOrderByCreatedAtDesc(PlayerCompany playerCompany);
}
