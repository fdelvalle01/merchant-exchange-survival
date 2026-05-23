package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.MarketEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarketEventRepository extends JpaRepository<MarketEvent, Long> {
    List<MarketEvent> findAllByOrderByTimestampDesc(Pageable pageable);
}
