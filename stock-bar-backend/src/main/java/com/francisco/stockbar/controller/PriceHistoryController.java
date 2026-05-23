package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.PriceHistoryPointResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/price-history")
@RequiredArgsConstructor
public class PriceHistoryController {

    private final PriceHistoryRepository priceHistoryRepository;

    @GetMapping
    public List<PriceHistoryPointResponse> getByProductId(
            @RequestParam Long productId,
            @RequestParam(defaultValue = "80") int limit
    ) {
        if (productId == null || productId <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "productId debe ser un numero positivo.");
        }

        int safeLimit = Math.min(Math.max(limit, 1), 500);

        return priceHistoryRepository
                .findByProductIdOrderByTimestampDesc(productId, PageRequest.of(0, safeLimit))
                .stream()
                .sorted(Comparator.comparing(history -> history.getTimestamp()))
                .map(PriceHistoryPointResponse::from)
                .toList();
    }
}
