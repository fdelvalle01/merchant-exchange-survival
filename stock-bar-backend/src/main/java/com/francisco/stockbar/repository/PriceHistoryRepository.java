package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    List<PriceHistory> findByProductIdOrderByTimestampDesc(Long productId);
    
    List<PriceHistory> findTop10ByProductIdOrderByTimestampDesc(Long productId);

}

