package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.WorldNewsItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorldNewsRepository extends JpaRepository<WorldNewsItem, Long> {
    List<WorldNewsItem> findAllByOrderByTimestampDesc(Pageable pageable);
}
