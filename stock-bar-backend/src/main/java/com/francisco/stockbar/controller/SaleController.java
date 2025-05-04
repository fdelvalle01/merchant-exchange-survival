package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    @PostMapping
    public Sale registerSale(@RequestBody SaleRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Sale sale = Sale.builder()
                .product(product)
                .quantity(request.getQuantity())
                .build();

        // Guardamos la venta
        Sale savedSale = saleRepository.save(sale);

        // ✅ Actualizamos el campo lastPurchasedAt
        product.setLastPurchasedAt(java.time.LocalDateTime.now());
        productRepository.save(product);

        return savedSale;
    }


    @GetMapping
    public List<Sale> getAll() {
        return saleRepository.findAll();
    }
}
