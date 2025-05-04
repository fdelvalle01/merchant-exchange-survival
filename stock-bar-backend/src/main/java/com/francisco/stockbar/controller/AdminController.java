package com.francisco.stockbar.controller;

import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.SaleRepository;
import com.francisco.stockbar.repository.ProductRepository;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PriceHistoryRepository priceHistoryRepo;
    private final SaleRepository saleRepo;
    private final ProductRepository productRepository;

    @DeleteMapping("/reset")
    public String resetDB() {
        priceHistoryRepo.deleteAll();
        saleRepo.deleteAll();
        productRepository.deleteAll();
        return "🔥 Base de datos limpiada";
    }

     @PostMapping("/reset-prices")
    public String resetPrices() {
        List<Product> products = productRepository.findAll();

        for (Product p : products) {
            p.setCurrentPrice(p.getBasePrice());
            p.setMaxPrice(p.getBasePrice());
            p.setLastPurchasedAt(null); // opcional
        }

        productRepository.saveAll(products);
        return "✅ Precios reiniciados correctamente a basePrice.";
    }
}
