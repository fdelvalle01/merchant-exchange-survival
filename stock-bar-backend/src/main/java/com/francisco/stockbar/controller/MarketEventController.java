package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.MarketEventResponse;
import com.francisco.stockbar.repository.MarketEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-events")
@RequiredArgsConstructor
public class MarketEventController {

    private final MarketEventRepository marketEventRepository;

    @GetMapping
    public List<MarketEventResponse> getMarketEvents(
            @RequestParam(defaultValue = "100") int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);

        return marketEventRepository
                .findAllByOrderByTimestampDesc(PageRequest.of(0, safeLimit))
                .stream()
                .map(MarketEventResponse::from)
                .toList();
    }
}
