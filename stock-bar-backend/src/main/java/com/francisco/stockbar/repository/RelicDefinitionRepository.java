package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.RelicDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RelicDefinitionRepository extends JpaRepository<RelicDefinition, Long> {
    Optional<RelicDefinition> findByCode(String code);
    List<RelicDefinition> findByEnabledTrueOrderByCodeAsc();
}
