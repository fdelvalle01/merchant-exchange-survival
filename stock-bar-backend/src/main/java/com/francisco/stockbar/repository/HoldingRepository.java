package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    Optional<Holding> findByPlayerCompanyAndProduct(PlayerCompany playerCompany, Product product);

    List<Holding> findByPlayerCompany(PlayerCompany playerCompany);
}
