package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.Sale;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByProductIdAndTimestampAfter(Long productId, LocalDateTime timestamp);

}
