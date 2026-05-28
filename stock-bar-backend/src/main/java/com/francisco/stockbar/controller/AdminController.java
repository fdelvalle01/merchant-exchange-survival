package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.PriceAdjustmentRequest;
import com.francisco.stockbar.dto.WorldNewsResponse;
import com.francisco.stockbar.model.WorldEventType;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import com.francisco.stockbar.repository.WorldNewsRepository;
import com.francisco.stockbar.services.AdminMarketService;
import com.francisco.stockbar.services.WorldEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PriceHistoryRepository priceHistoryRepo;
    private final SaleRepository saleRepo;
    private final MarketOrderRepository marketOrderRepo;
    private final HoldingRepository holdingRepo;
    private final WorldNewsRepository worldNewsRepository;
    private final ProductRepository productRepository;
    private final MarketEventRepository marketEventRepository;
    private final AdminMarketService adminMarketService;
    private final WorldEventService worldEventService;

    @DeleteMapping("/reset")
    public String resetDB() {
        priceHistoryRepo.deleteAll();
        saleRepo.deleteAll();
        marketOrderRepo.deleteAll();
        holdingRepo.deleteAll();
        worldNewsRepository.deleteAll();
        marketEventRepository.deleteAll();
        productRepository.deleteAll();
        return "Base de datos limpiada";
    }

    @PostMapping("/reset-prices")
    public String resetPrices() {
        return adminMarketService.resetMarket();
    }

    @PostMapping("/market/crash")
    public String crashMarket() {
        return adminMarketService.crashMarket();
    }

    @PostMapping("/market/boom")
    public String boomMarket() {
        return adminMarketService.boomMarket();
    }

    @PostMapping("/market/reset")
    public String resetMarket() {
        return adminMarketService.resetMarket();
    }

    @PostMapping("/products/{id}/price/up")
    public String increaseProductPrice(
            @PathVariable Long id,
            @RequestBody PriceAdjustmentRequest request
    ) {
        return adminMarketService.increaseProductPrice(id, request);
    }

    @PostMapping("/products/{id}/price/down")
    public String decreaseProductPrice(
            @PathVariable Long id,
            @RequestBody PriceAdjustmentRequest request
    ) {
        return adminMarketService.decreaseProductPrice(id, request);
    }

    @PostMapping("/products/{id}/reset")
    public String resetProductPrice(@PathVariable Long id) {
        return adminMarketService.resetProductPrice(id);
    }

    @PostMapping("/events/random")
    public WorldNewsResponse generateRandomEvent() {
        return worldEventService.generateRandomWorldEvent();
    }

    @PostMapping("/events/{type}")
    public WorldNewsResponse triggerWorldEvent(@PathVariable WorldEventType type) {
        return worldEventService.triggerWorldEvent(type);
    }
}
