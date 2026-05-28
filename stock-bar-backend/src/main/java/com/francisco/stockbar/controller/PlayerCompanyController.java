package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.PlayerCompanyResponse;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.services.PlayerCompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class PlayerCompanyController {

    private final PlayerCompanyService playerCompanyService;

    @GetMapping("/me")
    public PlayerCompanyResponse me() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        PlayerCompany refreshedCompany = playerCompanyService.refreshCompanyValue(company);
        BigDecimal portfolioValue = playerCompanyService.getPortfolioMarketValue(refreshedCompany);
        return PlayerCompanyResponse.from(refreshedCompany, portfolioValue);
    }
}
