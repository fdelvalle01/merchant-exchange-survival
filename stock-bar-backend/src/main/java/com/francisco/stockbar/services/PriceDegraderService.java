package com.francisco.stockbar.services;

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

    @Scheduled(fixedRate = 30000)
    public void degradarPrecios() {
        List<Product> productos = productRepository.findAll();
        log.info("📉 Entrando a for DeradarPrecio )");

        for (Product producto : productos) {
            LocalDateTime ultimaCompra = producto.getLastPurchasedAt();
            if (ultimaCompra == null) continue;

            long segundos = Duration.between(ultimaCompra, LocalDateTime.now()).getSeconds();
            BigDecimal actual = producto.getCurrentPrice();
            BigDecimal base = producto.getBasePrice();

            if (segundos > 60) {
                long minutos = segundos / 60;
                double factor = 1.0 - Math.min(0.01 * minutos, 0.3); // hasta 30% máximo

                BigDecimal nuevo = actual.multiply(BigDecimal.valueOf(factor)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal minimoPermitido = base.subtract(BigDecimal.valueOf(1000)); // no baja más de $1000

                if (nuevo.compareTo(minimoPermitido) < 0) {
                    nuevo = minimoPermitido;
                }

                producto.setCurrentPrice(nuevo);
                productRepository.save(producto);

                priceHistoryRepository.save(
                    PriceHistory.builder()
                        .product(producto)
                        .price(nuevo)
                        .build()
                );

                log.info("📉 Degradado {} a ${} ({} min sin compra)", producto.getName(), nuevo, minutos);
            }
        }
    }
}
