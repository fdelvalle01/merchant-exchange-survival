package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.dto.SaleResponse;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.SaleRepository;
import com.francisco.stockbar.services.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleRepository saleRepository;
    private final SaleService saleService;

    @PostMapping
    public SaleResponse registerSale(@RequestBody SaleRequest request) {
        return saleService.registerSale(request);
    }

    @GetMapping
    public List<Sale> getAll() {
        return saleRepository.findAll();
    }
}
