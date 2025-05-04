package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
