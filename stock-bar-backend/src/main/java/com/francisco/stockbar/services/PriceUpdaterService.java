package com.francisco.stockbar.services;

import com.francisco.stockbar.config.PriceProperties;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceUpdaterService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketEventRepository marketEventRepository;
    private final PriceProperties cfg;

    @Scheduled(fixedRateString = "${price.update-rate-millis}")
    public void actualizarPrecios() {
        LocalDateTime desde = LocalDateTime.now().minusMinutes(2);
        List<Product> productos = productRepository.findAll();

        for (Product producto : productos) {
            int totalVendidas = saleRepository
                    .findByProductIdAndTimestampAfter(producto.getId(), desde)
                    .stream()
                    .mapToInt(Sale::getQuantity)
                    .sum();

            if (totalVendidas > 0) {
                BigDecimal currentPrice = producto.getCurrentPrice();
                BigDecimal basePrice = producto.getBasePrice();

                BigDecimal changePct = cfg.getImpactFactor()
                        .multiply(BigDecimal.valueOf(totalVendidas));
                BigDecimal candidate = currentPrice
                        .multiply(BigDecimal.ONE.add(changePct))
                        .setScale(2, RoundingMode.HALF_UP);

                BigDecimal ceiling = basePrice
                        .multiply(cfg.getMaxMultiplier())
                        .setScale(2, RoundingMode.HALF_UP);

                BigDecimal newPrice = candidate.min(ceiling);

                BigDecimal maxPriceActual = Optional.ofNullable(producto.getMaxPrice())
                        .orElse(basePrice);
                if (newPrice.compareTo(maxPriceActual) > 0) {
                    producto.setMaxPrice(newPrice);
                }

                producto.setCurrentPrice(newPrice);
                productRepository.save(producto);

                priceHistoryRepository.save(
                        PriceHistory.builder()
                                .product(producto)
                                .price(newPrice)
                                .build()
                );

                marketEventRepository.save(
                        MarketEvent.builder()
                                .type("PRICE_UPDATED")
                                .description(producto.getName() + " subio a " + newPrice + " por " + totalVendidas + " trades recientes")
                                .executedBy("SCHEDULER")
                                .build()
                );

                log.info("Subido {} a ${} ({} ventas)", producto.getName(), newPrice, totalVendidas);
            }
        }
    }
}
