package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.OrderRequest;
import com.francisco.stockbar.dto.OrderResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.MarketOrder;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.Sale;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String SYSTEM_USER = "SYSTEM";

    private final MarketOrderRepository marketOrderRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final HoldingRepository holdingRepository;
    private final MarketEventRepository marketEventRepository;
    private final PlayerCompanyService playerCompanyService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        validateRequest(request);

        Product product = productRepository.findById(request.getAssetId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Activo no encontrado."));

        if (Boolean.FALSE.equals(product.getEnabled())) {
            throw new ApiException(HttpStatus.CONFLICT, "Activo deshabilitado para operar.");
        }

        BigDecimal executedPrice = money(product.getCurrentPrice());
        if (executedPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Activo sin precio actual configurado.");
        }

        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        MarketOrder order = switch (request.getSide()) {
            case BUY -> fillBuyOrder(company, product, request.getQuantity(), executedPrice);
            case SELL -> fillSellOrder(company, product, request.getQuantity(), executedPrice);
        };

        return OrderResponse.from(order);
    }

    @Transactional
    public List<OrderResponse> getOrdersForCurrentUser() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();

        return marketOrderRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    private MarketOrder fillBuyOrder(
            PlayerCompany company,
            Product product,
            int quantity,
            BigDecimal executedPrice
    ) {
        BigDecimal totalAmount = executedPrice
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentCash = money(company.getCash());

        if (currentCash.compareTo(totalAmount) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Insufficient funds");
        }

        LocalDateTime now = LocalDateTime.now();
        company.setCash(currentCash.subtract(totalAmount).setScale(2, RoundingMode.HALF_UP));
        upsertHolding(company, product, quantity, totalAmount);

        MarketOrder order = marketOrderRepository.save(MarketOrder.builder()
                .playerCompany(company)
                .product(product)
                .side(OrderSide.BUY)
                .quantity(quantity)
                .executedPrice(executedPrice)
                .totalAmount(totalAmount)
                .realizedPnl(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .status(OrderStatus.FILLED)
                .createdAt(now)
                .build());

        saleRepository.save(Sale.builder()
                .product(product)
                .quantity(quantity)
                .executedPrice(executedPrice)
                .totalAmount(totalAmount)
                .timestamp(now)
                .build());
        product.setLastPurchasedAt(now);
        productRepository.save(product);
        recordEvent("ORDER_BUY_FILLED", product.getName() + " buy filled x" + quantity, now);
        playerCompanyService.refreshCompanyValue(company);

        return order;
    }

    private MarketOrder fillSellOrder(
            PlayerCompany company,
            Product product,
            int quantity,
            BigDecimal executedPrice
    ) {
        Holding holding = holdingRepository.findByPlayerCompanyAndProduct(company, product)
                .filter(currentHolding -> currentHolding.getQuantity() != null && currentHolding.getQuantity() > 0)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Not enough holdings to sell this asset."));

        int currentQuantity = holding.getQuantity();
        if (currentQuantity < quantity) {
            throw new ApiException(HttpStatus.CONFLICT, "Not enough holdings to sell this asset.");
        }

        LocalDateTime now = LocalDateTime.now();
        BigDecimal totalAmount = executedPrice
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal averagePrice = money(holding.getAveragePrice());
        BigDecimal realizedPnl = executedPrice
                .subtract(averagePrice)
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
        int nextQuantity = currentQuantity - quantity;

        company.setCash(money(company.getCash()).add(totalAmount).setScale(2, RoundingMode.HALF_UP));
        company.setRealizedPnl(money(company.getRealizedPnl()).add(realizedPnl).setScale(2, RoundingMode.HALF_UP));

        if (nextQuantity == 0) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(nextQuantity);
            holdingRepository.save(holding);
        }

        MarketOrder order = marketOrderRepository.save(MarketOrder.builder()
                .playerCompany(company)
                .product(product)
                .side(OrderSide.SELL)
                .quantity(quantity)
                .executedPrice(executedPrice)
                .totalAmount(totalAmount)
                .realizedPnl(realizedPnl)
                .status(OrderStatus.FILLED)
                .createdAt(now)
                .build());

        recordEvent(
                "ORDER_SELL_FILLED",
                product.getName() + " sell filled x" + quantity + " P/L " + realizedPnl,
                now
        );
        playerCompanyService.refreshCompanyValue(company);

        return order;
    }

    private void upsertHolding(
            PlayerCompany company,
            Product product,
            int purchasedQuantity,
            BigDecimal purchaseTotal
    ) {
        Holding holding = holdingRepository.findByPlayerCompanyAndProduct(company, product)
                .orElseGet(() -> Holding.builder()
                        .playerCompany(company)
                        .product(product)
                        .quantity(0)
                        .averagePrice(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                        .build());

        int existingQuantity = holding.getQuantity() == null ? 0 : holding.getQuantity();
        BigDecimal existingAveragePrice = money(holding.getAveragePrice());
        BigDecimal existingCostBasis = existingAveragePrice
                .multiply(BigDecimal.valueOf(existingQuantity))
                .setScale(2, RoundingMode.HALF_UP);
        int nextQuantity = existingQuantity + purchasedQuantity;
        BigDecimal nextAveragePrice = existingCostBasis
                .add(purchaseTotal)
                .divide(BigDecimal.valueOf(nextQuantity), 2, RoundingMode.HALF_UP);

        holding.setQuantity(nextQuantity);
        holding.setAveragePrice(nextAveragePrice);
        holdingRepository.save(holding);
    }

    private void recordEvent(String type, String description, LocalDateTime timestamp) {
        marketEventRepository.save(
                MarketEvent.builder()
                        .type(type)
                        .description(description)
                        .executedBy(SYSTEM_USER)
                        .timestamp(timestamp)
                        .build()
        );
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateRequest(OrderRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body requerido.");
        }

        if (request.getAssetId() == null || request.getAssetId() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "assetId debe ser un numero positivo.");
        }

        if (request.getSide() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "side debe ser BUY o SELL.");
        }

        if (request.getQuantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "quantity debe ser mayor que cero.");
        }
    }
}
