package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.PlayerCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerCompanyRepository extends JpaRepository<PlayerCompany, Long> {
    Optional<PlayerCompany> findByUsername(String username);
}
