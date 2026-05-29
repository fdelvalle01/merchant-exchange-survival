package com.francisco.stockbar.services;

import com.francisco.stockbar.config.MarketEngineProperties;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketEngineService {

    private static final BigDecimal MIN_ABSOLUTE_PRICE = BigDecimal.valueOf(0.01).setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final String SYSTEM_USER = "MARKET_ENGINE";

    private final ProductRepository productRepository;
    private final MarketOrderRepository marketOrderRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketEventRepository marketEventRepository;
    private final MarketEngineProperties cfg;

    @Scheduled(fixedRateString = "${game.market-engine.update-rate-millis:30000}")
    public void scheduledMarketEngineTick() {
        if (cfg.isEnabled()) {
            runMarketTick();
        }
    }

    @Transactional
    public void runMarketTick() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusSeconds(cfg.getPressureLookbackSeconds());
        List<Product> products = productRepository.findAll();

        for (Product product : products) {
            if (Boolean.FALSE.equals(product.getEnabled())) {
                continue;
            }

            applyMarketEngineMove(product, since, now);
        }
    }

    private void applyMarketEngineMove(Product product, LocalDateTime since, LocalDateTime timestamp) {
        BigDecimal basePrice = money(product.getBasePrice());
        if (basePrice.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal previousPrice = money(product.getCurrentPrice());
        if (previousPrice.compareTo(BigDecimal.ZERO) <= 0) {
            previousPrice = basePrice;
        }

        long buyQuantity = recentQuantity(product, OrderSide.BUY, since);
        long sellQuantity = recentQuantity(product, OrderSide.SELL, since);
        long netPressure = buyQuantity - sellQuantity;

        BigDecimal pressurePct = pressurePercent(netPressure);
        BigDecimal pressurePrice = previousPrice
                .multiply(BigDecimal.ONE.add(pressurePct))
                .setScale(6, RoundingMode.HALF_UP);
        BigDecimal revertedPrice = applyFairValueReversion(pressurePrice, basePrice);
        BigDecimal nextPrice = clampToBounds(revertedPrice, basePrice).setScale(2, RoundingMode.HALF_UP);

        if (nextPrice.compareTo(previousPrice) == 0) {
            return;
        }

        product.setCurrentPrice(nextPrice);
        updateMaxPrice(product, nextPrice, basePrice);
        productRepository.save(product);
        savePriceHistory(product, nextPrice, timestamp);
        recordMarketEngineEvent(product, previousPrice, nextPrice, netPressure, timestamp);
    }

    private long recentQuantity(Product product, OrderSide side, LocalDateTime since) {
        Long quantity = marketOrderRepository.sumQuantityByProductAndSideSince(
                product,
                side,
                OrderStatus.FILLED,
                since
        );
        return quantity == null ? 0L : quantity;
    }

    private BigDecimal pressurePercent(long netPressure) {
        if (netPressure == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal factor = netPressure > 0 ? cfg.getBuyImpactFactor() : cfg.getSellImpactFactor();
        BigDecimal magnitude = factor
                .multiply(BigDecimal.valueOf(Math.abs(netPressure)))
                .min(cfg.getMaxPressureImpactPct());

        return netPressure > 0 ? magnitude : magnitude.negate();
    }

    private BigDecimal applyFairValueReversion(BigDecimal price, BigDecimal basePrice) {
        int comparison = price.compareTo(basePrice);
        if (comparison == 0 || cfg.getReversionRatePct().compareTo(BigDecimal.ZERO) <= 0) {
            return price;
        }

        BigDecimal move = basePrice.subtract(price).multiply(cfg.getReversionRatePct());
        BigDecimal candidate = price.add(move);

        if (comparison < 0 && candidate.compareTo(basePrice) > 0) {
            return basePrice;
        }

        if (comparison > 0 && candidate.compareTo(basePrice) < 0) {
            return basePrice;
        }

        return candidate;
    }

    private BigDecimal clampToBounds(BigDecimal price, BigDecimal basePrice) {
        BigDecimal floor = basePrice.multiply(cfg.getMinPriceMultiplier()).max(MIN_ABSOLUTE_PRICE);
        BigDecimal ceiling = basePrice.multiply(cfg.getMaxPriceMultiplier()).max(floor);

        if (price.compareTo(floor) < 0) {
            return floor;
        }

        if (price.compareTo(ceiling) > 0) {
            return ceiling;
        }

        return price.max(MIN_ABSOLUTE_PRICE);
    }

    private void updateMaxPrice(Product product, BigDecimal price, BigDecimal basePrice) {
        BigDecimal currentMax = product.getMaxPrice() != null ? product.getMaxPrice() : basePrice;
        if (currentMax == null || price.compareTo(currentMax) > 0) {
            product.setMaxPrice(price);
        }
    }

    private void savePriceHistory(Product product, BigDecimal price, LocalDateTime timestamp) {
        priceHistoryRepository.save(
                PriceHistory.builder()
                        .product(product)
                        .price(price)
                        .timestamp(timestamp)
                        .build()
        );
    }

    private void recordMarketEngineEvent(
            Product product,
            BigDecimal previousPrice,
            BigDecimal nextPrice,
            long netPressure,
            LocalDateTime timestamp
    ) {
        String type = eventType(previousPrice, nextPrice, netPressure);
        BigDecimal movePct = nextPrice
                .subtract(previousPrice)
                .abs()
                .divide(previousPrice, 6, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(2, RoundingMode.HALF_UP);

        marketEventRepository.save(
                MarketEvent.builder()
                        .type(type)
                        .description(eventDescription(type, product.getName(), movePct))
                        .executedBy(SYSTEM_USER)
                        .timestamp(timestamp)
                        .build()
        );
    }

    private String eventType(BigDecimal previousPrice, BigDecimal nextPrice, long netPressure) {
        if (netPressure > 0 && nextPrice.compareTo(previousPrice) > 0) {
            return "PRICE_PRESSURE_UP";
        }

        if (netPressure < 0 && nextPrice.compareTo(previousPrice) < 0) {
            return "PRICE_PRESSURE_DOWN";
        }

        return "PRICE_REVERSION";
    }

    private String eventDescription(String type, String productName, BigDecimal movePct) {
        return switch (type) {
            case "PRICE_PRESSURE_UP" -> "Buy pressure lifted " + productName + " by " + movePct + "%.";
            case "PRICE_PRESSURE_DOWN" -> "Sell pressure pushed " + productName + " down by " + movePct + "%.";
            default -> "Price reversion moved " + productName + " closer to fair value by " + movePct + "%.";
        };
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
