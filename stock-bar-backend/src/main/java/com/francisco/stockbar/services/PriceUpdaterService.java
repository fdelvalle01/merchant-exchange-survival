package com.francisco.stockbar.services;

import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceUpdaterService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    @Scheduled(fixedRate = 30000)
    public void actualizarPrecios() {
        LocalDateTime desde = LocalDateTime.now().minusMinutes(2);
        List<Product> productos = productRepository.findAll();

        for (Product producto : productos) {
            List<Sale> ventas = saleRepository.findByProductIdAndTimestampAfter(producto.getId(), desde);
            int totalVendidas = ventas.stream().mapToInt(Sale::getQuantity).sum();
            
            if (totalVendidas > 0) {
                BigDecimal currentPrice = producto.getCurrentPrice();
                BigDecimal factor = BigDecimal.valueOf(1 + (0.05 * totalVendidas));
                BigDecimal nuevoPrecio = currentPrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);

                // ✅ ACTUALIZA MAX PRICE SI ES NECESARIO
                BigDecimal maxPriceActual = producto.getMaxPrice() != null ? producto.getMaxPrice() : BigDecimal.ZERO;
                if (nuevoPrecio.compareTo(maxPriceActual) > 0) {
                    producto.setMaxPrice(nuevoPrecio);
                }

                producto.setCurrentPrice(nuevoPrecio);
                productRepository.save(producto);

                priceHistoryRepository.save(
                    PriceHistory.builder()
                        .product(producto)
                        .price(nuevoPrecio)
                        .build()
                );

                log.info("💸 Subido {} a ${} ({} ventas)", producto.getName(), nuevoPrecio, totalVendidas);
            }
        }
    }
}
