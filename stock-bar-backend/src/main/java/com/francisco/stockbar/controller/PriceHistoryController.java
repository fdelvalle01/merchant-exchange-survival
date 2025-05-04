package com.francisco.stockbar.controller;

import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-history")
@RequiredArgsConstructor
public class PriceHistoryController {

    private final PriceHistoryRepository priceHistoryRepository;

    @GetMapping
    public List<PriceHistory> getByProductId(@RequestParam Long productId) {
        return priceHistoryRepository.findByProductIdOrderByTimestampDesc(productId);
    }
}
