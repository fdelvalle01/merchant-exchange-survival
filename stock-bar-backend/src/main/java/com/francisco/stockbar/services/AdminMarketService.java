package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.PriceAdjustmentRequest;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminMarketService {

    private static final BigDecimal DEFAULT_MARKET_MOVE_PERCENT = BigDecimal.valueOf(20);
    private static final String SYSTEM_USER = "ADMIN";

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketEventRepository marketEventRepository;

    @Transactional
    public String crashMarket() {
        List<Product> products = productRepository.findAll();
        applyMarketMove(products, DEFAULT_MARKET_MOVE_PERCENT.negate());
        recordEvent("MARKET_CRASH", "Crash general aplicado: -" + DEFAULT_MARKET_MOVE_PERCENT + "%");
        return "Crash general aplicado a " + products.size() + " productos.";
    }

    @Transactional
    public String boomMarket() {
        List<Product> products = productRepository.findAll();
        applyMarketMove(products, DEFAULT_MARKET_MOVE_PERCENT);
        recordEvent("MARKET_BOOM", "Boom general aplicado: +" + DEFAULT_MARKET_MOVE_PERCENT + "%");
        return "Boom general aplicado a " + products.size() + " productos.";
    }

    @Transactional
    public String resetMarket() {
        List<Product> products = productRepository.findAll();

        for (Product product : products) {
            BigDecimal basePrice = requireBasePrice(product);
            product.setCurrentPrice(basePrice);
            product.setMaxPrice(basePrice);
            product.setLastPurchasedAt(null);
            productRepository.save(product);
            savePriceHistory(product, basePrice);
        }

        recordEvent("MARKET_RESET", "Reset general aplicado: precios a basePrice");
        return "Reset market aplicado a " + products.size() + " productos.";
    }

    @Transactional
    public String increaseProductPrice(Long productId, PriceAdjustmentRequest request) {
        Product product = getProduct(productId);
        BigDecimal percent = validatePercent(request);
        BigDecimal nextPrice = applyProductMove(product, percent);
        recordEvent("PRODUCT_PRICE_UP", product.getName() + " subio " + percent + "% a " + nextPrice);
        return product.getName() + " subio " + percent + "%.";
    }

    @Transactional
    public String decreaseProductPrice(Long productId, PriceAdjustmentRequest request) {
        Product product = getProduct(productId);
        BigDecimal percent = validatePercent(request);
        BigDecimal nextPrice = applyProductMove(product, percent.negate());
        recordEvent("PRODUCT_PRICE_DOWN", product.getName() + " bajo " + percent + "% a " + nextPrice);
        return product.getName() + " bajo " + percent + "%.";
    }

    @Transactional
    public String resetProductPrice(Long productId) {
        Product product = getProduct(productId);
        BigDecimal basePrice = requireBasePrice(product);
        product.setCurrentPrice(basePrice);
        product.setMaxPrice(basePrice);
        product.setLastPurchasedAt(null);
        productRepository.save(product);
        savePriceHistory(product, basePrice);
        recordEvent("MARKET_RESET", product.getName() + " reseteado a basePrice " + basePrice);
        return product.getName() + " reseteado a basePrice.";
    }

    private void applyMarketMove(List<Product> products, BigDecimal percent) {
        for (Product product : products) {
            applyProductMove(product, percent);
        }
    }

    private BigDecimal applyProductMove(Product product, BigDecimal percent) {
        BigDecimal currentPrice = currentOrBasePrice(product);
        BigDecimal factor = BigDecimal.ONE.add(percent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal nextPrice = currentPrice.multiply(factor).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        product.setCurrentPrice(nextPrice);
        updateMaxPrice(product, nextPrice);
        productRepository.save(product);
        savePriceHistory(product, nextPrice);

        return nextPrice;
    }

    private Product getProduct(Long productId) {
        if (productId == null || productId <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "productId debe ser un numero positivo.");
        }

        return productRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
    }

    private BigDecimal validatePercent(PriceAdjustmentRequest request) {
        if (request == null || request.getPercent() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "percent es requerido.");
        }

        if (request.getPercent().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "percent debe ser mayor que cero.");
        }

        return request.getPercent();
    }

    private BigDecimal currentOrBasePrice(Product product) {
        if (product.getCurrentPrice() != null) {
            return product.getCurrentPrice();
        }

        return requireBasePrice(product);
    }

    private BigDecimal requireBasePrice(Product product) {
        if (product.getBasePrice() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Producto sin basePrice configurado.");
        }

        return product.getBasePrice();
    }

    private void updateMaxPrice(Product product, BigDecimal price) {
        BigDecimal currentMax = product.getMaxPrice() != null ? product.getMaxPrice() : product.getBasePrice();
        if (currentMax == null || price.compareTo(currentMax) > 0) {
            product.setMaxPrice(price);
        }
    }

    private void savePriceHistory(Product product, BigDecimal price) {
        priceHistoryRepository.save(
                PriceHistory.builder()
                        .product(product)
                        .price(price)
                        .build()
        );
    }

    private void recordEvent(String type, String description) {
        marketEventRepository.save(
                MarketEvent.builder()
                        .type(type)
                        .description(description)
                        .executedBy(SYSTEM_USER)
                        .build()
        );
    }
}
