package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.ProductBoardDTO;
import com.francisco.stockbar.dto.ProductDTO;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.services.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final ProductService productService; // ✅ <- FALTABA ESTO

    @GetMapping
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product create(@RequestBody Product product) {
        product.setCurrentPrice(product.getBasePrice());
        product.setMaxPrice(product.getBasePrice()); // 👈 nuevo
        return productRepository.save(product);
    }

    @GetMapping("/detailed")
    public List<ProductDTO> getDetailedProducts() {
        return productService.getAllWithDiffs();
    }

    @GetMapping("/board")
        public List<ProductBoardDTO> getBoard() {
            List<Product> products = productRepository.findAll();

            return products.stream()
                .map(p -> {
                    BigDecimal basePrice = p.getBasePrice();
                    BigDecimal currentPrice = p.getCurrentPrice();
                    BigDecimal maxPrice = p.getMaxPrice() != null ? p.getMaxPrice() : basePrice;

                    BigDecimal priceChange = currentPrice.subtract(basePrice);
                    BigDecimal percentageChange = BigDecimal.ZERO;
                    if (basePrice.compareTo(BigDecimal.ZERO) > 0) {
                        percentageChange = priceChange
                            .divide(basePrice, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                    }

                    BigDecimal dropFromMax = maxPrice.subtract(currentPrice);
                    double percentageDropFromMax = 0.0;
                    if (maxPrice.compareTo(BigDecimal.ZERO) > 0 && dropFromMax.compareTo(BigDecimal.ZERO) > 0) {
                        percentageDropFromMax = dropFromMax
                            .divide(maxPrice, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue();
                    }

                    String trend;
                    if (currentPrice.compareTo(basePrice) > 0) {
                        trend = "up";
                    } else if (currentPrice.compareTo(basePrice) < 0) {
                        trend = "down";
                    } else {
                        trend = "flat";
                    }

                    List<Map<String, Object>> history = priceHistoryRepository
                        .findTop10ByProductIdOrderByTimestampDesc(p.getId())
                        .stream()
                        .sorted(Comparator.comparing(PriceHistory::getTimestamp))
                        .map(h -> {
                            Map<String, Object> hist = new HashMap<>();
                            hist.put("timestamp", h.getTimestamp().toString());
                            hist.put("price", h.getPrice());
                            return hist;
                        })
                        .collect(Collectors.toList());

                    return ProductBoardDTO.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .basePrice(basePrice.doubleValue())
                        .currentPrice(currentPrice.doubleValue())
                        .maxPrice(maxPrice.doubleValue())
                        .priceChange(priceChange.doubleValue())
                        .percentageChange(percentageChange.doubleValue())
                        .percentageDropFromMax(percentageDropFromMax)
                        .trend(trend)
                        .imageUrl(p.getImageUrl())
                        .sector(p.getSector())
                        .history(history)
                        .build();
                })
                .collect(Collectors.toList());
        }
}
