package com.francisco.stockbar.services;

import com.francisco.stockbar.config.PriceProperties;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceDegraderService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketEventRepository marketEventRepository;
    private final PriceProperties cfg;

    @Scheduled(fixedRateString = "${price.degrade-rate-millis}")
    public void degradarPrecios() {
        List<Product> productos = productRepository.findAll();
        log.info("Iniciando degradacion de precios");

        for (Product producto : productos) {
            LocalDateTime ultimaCompra = producto.getLastPurchasedAt();
            if (ultimaCompra == null) continue;

            long segundos = Duration.between(ultimaCompra, LocalDateTime.now()).getSeconds();
            if (segundos <= cfg.getDegradeThresholdSeconds()) continue;

            BigDecimal actual = producto.getCurrentPrice();
            BigDecimal basePrice = producto.getBasePrice();
            long minutos = segundos / 60;
            BigDecimal pctDown = cfg.getDegradePerMinutePct()
                    .multiply(BigDecimal.valueOf(minutos))
                    .min(cfg.getDegradeMaxPct());
            BigDecimal factor = BigDecimal.ONE.subtract(pctDown);
            BigDecimal candidato = actual.multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal floor = basePrice.multiply(cfg.getMinMultiplier())
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal nuevo = candidato.max(floor);

            producto.setCurrentPrice(nuevo);
            productRepository.save(producto);

            priceHistoryRepository.save(
                    PriceHistory.builder()
                            .product(producto)
                            .price(nuevo)
                            .build()
            );

            marketEventRepository.save(
                    MarketEvent.builder()
                            .type("PRICE_UPDATED")
                            .description(producto.getName() + " bajo a " + nuevo + " por inactividad")
                            .executedBy("SCHEDULER")
                            .build()
            );

            log.info("Degradado {} a ${} ({} min sin venta)", producto.getName(), nuevo, minutos);
        }
    }
}
