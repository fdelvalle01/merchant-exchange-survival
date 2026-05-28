package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.PortfolioHoldingResponse;
import com.francisco.stockbar.services.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public List<PortfolioHoldingResponse> getPortfolio() {
        return portfolioService.getPortfolioForCurrentUser();
    }
}
