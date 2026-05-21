package com.francisco.stockbar.services;

import com.francisco.stockbar.config.PriceProperties;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
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
    private final PriceProperties cfg;  // ← inyectamos las props

    @Scheduled(fixedRateString = "${price.degrade-rate-millis}")
    public void degradarPrecios() {
        List<Product> productos = productRepository.findAll();
        log.info("📉 Iniciando degradación de precios");

        for (Product producto : productos) {
            LocalDateTime ultimaCompra = producto.getLastPurchasedAt();
            if (ultimaCompra == null) continue;

            long segundos = Duration.between(ultimaCompra, LocalDateTime.now()).getSeconds();
            if (segundos <= cfg.getDegradeThresholdSeconds()) continue;  // espera el umbral

            BigDecimal actual    = producto.getCurrentPrice();
            BigDecimal basePrice = producto.getBasePrice();

            // 1) Calcula el factor de degradación (de cfg.getDegradePerMinutePct() por min, hasta cfg.getDegradeMaxPct())
            long minutos = segundos / 60;
            BigDecimal pctDown = cfg.getDegradePerMinutePct()
                                    .multiply(BigDecimal.valueOf(minutos))
                                    .min(cfg.getDegradeMaxPct());
            BigDecimal factor  = BigDecimal.ONE.subtract(pctDown);

            BigDecimal candidato = actual.multiply(factor)
                                          .setScale(2, RoundingMode.HALF_UP);

            // 2) Suelo simétrico: basePrice * cfg.getMinMultiplier()
            BigDecimal floor = basePrice.multiply(cfg.getMinMultiplier())
                                        .setScale(2, RoundingMode.HALF_UP);

            // 3) Aplica el suelo
            BigDecimal nuevo = candidato.max(floor); // .max porque floor es el límite inferior

            

            // 4) Guarda el cambio
            producto.setCurrentPrice(nuevo);
            productRepository.save(producto);

            priceHistoryRepository.save(
                PriceHistory.builder()
                    .product(producto)
                    .price(nuevo)
                    .build()
            );

            log.info("📉 Degradado {} a ${} ({} min sin venta)", 
                     producto.getName(), nuevo, minutos);
        }
    }
}
