package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.AuctionSelectionRequest;
import com.francisco.stockbar.dto.AuctionSelectionResponse;
import com.francisco.stockbar.dto.SealedAuctionResponse;
import com.francisco.stockbar.services.SealedAuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game/auctions")
@RequiredArgsConstructor
public class SealedAuctionController {

    private final SealedAuctionService sealedAuctionService;

    @GetMapping("/active")
    public SealedAuctionResponse active() {
        return sealedAuctionService.getActiveAuction().orElse(null);
    }

    @GetMapping("/{id}")
    public SealedAuctionResponse detail(@PathVariable Long id) {
        return sealedAuctionService.getAuction(id);
    }

    @PostMapping("/{id}/select")
    public AuctionSelectionResponse select(
            @PathVariable Long id,
            @RequestBody AuctionSelectionRequest request
    ) {
        return sealedAuctionService.select(id, request.getCardPosition());
    }
}
