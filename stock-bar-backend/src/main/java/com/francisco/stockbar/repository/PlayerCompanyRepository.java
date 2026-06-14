package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.PlayerCompany;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlayerCompanyRepository extends JpaRepository<PlayerCompany, Long> {
    Optional<PlayerCompany> findByUsername(String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select company from PlayerCompany company where company.username = :username")
    Optional<PlayerCompany> findByUsernameForUpdate(@Param("username") String username);
}
