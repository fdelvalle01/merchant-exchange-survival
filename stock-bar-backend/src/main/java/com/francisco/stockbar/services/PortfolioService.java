package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.PortfolioHoldingResponse;
import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.HoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PlayerCompanyService playerCompanyService;
    private final HoldingRepository holdingRepository;

    @Transactional
    public List<PortfolioHoldingResponse> getPortfolioForCurrentUser() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();

        return holdingRepository.findByPlayerCompany(company)
                .stream()
                .filter(holding -> holding.getQuantity() != null && holding.getQuantity() > 0)
                .sorted(Comparator.comparing(holding -> holding.getProduct().getName()))
                .map(this::toResponse)
                .toList();
    }

    private PortfolioHoldingResponse toResponse(Holding holding) {
        Product product = holding.getProduct();
        BigDecimal averagePrice = money(holding.getAveragePrice());
        BigDecimal currentPrice = money(product.getCurrentPrice());
        BigDecimal quantity = BigDecimal.valueOf(holding.getQuantity());
        BigDecimal marketValue = currentPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal costBasis = averagePrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal unrealizedPnl = marketValue.subtract(costBasis).setScale(2, RoundingMode.HALF_UP);
        BigDecimal unrealizedPnlPercent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (costBasis.compareTo(BigDecimal.ZERO) > 0) {
            unrealizedPnlPercent = unrealizedPnl
                    .divide(costBasis, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return PortfolioHoldingResponse.builder()
                .assetId(product.getId())
                .assetName(product.getName())
                .quantity(holding.getQuantity())
                .averagePrice(averagePrice)
                .currentPrice(currentPrice)
                .marketValue(marketValue)
                .unrealizedPnl(unrealizedPnl)
                .unrealizedPnlPercent(unrealizedPnlPercent)
                .createdAt(holding.getCreatedAt())
                .updatedAt(holding.getUpdatedAt())
                .build();
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
