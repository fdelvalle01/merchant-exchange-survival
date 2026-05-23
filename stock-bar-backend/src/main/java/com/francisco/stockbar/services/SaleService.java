package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.dto.SaleResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final MarketEventRepository marketEventRepository;

    @Transactional
    public SaleResponse registerSale(SaleRequest request) {
        validateRequest(request);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));

        if (Boolean.FALSE.equals(product.getEnabled())) {
            throw new ApiException(HttpStatus.CONFLICT, "Producto deshabilitado para venta.");
        }

        BigDecimal executedPrice = product.getCurrentPrice();
        if (executedPrice == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Producto sin precio actual configurado.");
        }

        BigDecimal totalAmount = executedPrice
                .multiply(BigDecimal.valueOf(request.getQuantity()))
                .setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();

        Sale sale = Sale.builder()
                .product(product)
                .quantity(request.getQuantity())
                .executedPrice(executedPrice)
                .totalAmount(totalAmount)
                .timestamp(now)
                .build();

        Sale savedSale = saleRepository.save(sale);
        product.setLastPurchasedAt(now);
        productRepository.save(product);
        marketEventRepository.save(
                MarketEvent.builder()
                        .type("SALE_REGISTERED")
                        .description(product.getName() + " venta registrada x" + request.getQuantity())
                        .executedBy("SYSTEM")
                        .timestamp(now)
                        .build()
        );

        return SaleResponse.from(savedSale);
    }

    private void validateRequest(SaleRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body requerido.");
        }

        if (request.getProductId() == null || request.getProductId() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "productId debe ser un numero positivo.");
        }

        if (request.getQuantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "quantity debe ser mayor que cero.");
        }
    }
}
