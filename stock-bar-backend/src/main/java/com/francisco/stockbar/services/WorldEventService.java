package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.WorldNewsResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.NewsDirection;
import com.francisco.stockbar.model.NewsSeverity;
import com.francisco.stockbar.model.PriceHistory;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.WorldEventType;
import com.francisco.stockbar.model.WorldNewsItem;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PriceHistoryRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.WorldNewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class WorldEventService {

    private static final BigDecimal MIN_PRICE = BigDecimal.valueOf(0.01).setScale(2, RoundingMode.HALF_UP);
    private static final String SYSTEM_USER = "WORLD_ENGINE";

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketEventRepository marketEventRepository;
    private final WorldNewsRepository worldNewsRepository;

    @Value("${game.events.enabled:false}")
    private boolean scheduledEventsEnabled;

    @Transactional
    public WorldNewsResponse generateRandomWorldEvent() {
        WorldEventType[] values = WorldEventType.values();
        WorldEventType type = values[ThreadLocalRandom.current().nextInt(values.length)];
        return triggerWorldEvent(type);
    }

    @Transactional
    public WorldNewsResponse triggerWorldEvent(WorldEventType type) {
        if (type == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "World event type is required.");
        }

        return switch (type) {
            case ROYAL_CONTRACT -> royalContract();
            case MINING_ACCIDENT -> singleAssetEvent(
                    type,
                    "Industrial Safety",
                    "Mining Accident Reported",
                    "A serious accident has disrupted operations at %s.",
                    "Witnesses report a collapsed shaft and halted ore lifts. Guild inspectors have ordered a shutdown while crews search the lower tunnels.",
                    NewsSeverity.HIGH,
                    NewsDirection.NEGATIVE,
                    product -> productName(product).contains("ironhill") || sector(product).equals("MINING"),
                    8,
                    22
            );
            case PORT_BLOCKADE -> sectorEvent(
                    type,
                    "Trade Routes",
                    "Northern Port Blockade",
                    "Royal ships have blocked trade routes, disrupting maritime commerce.",
                    "Harbor bells rang through the night as patrol ships sealed the northern route. Freight captains are raising prices and delaying contracts.",
                    NewsSeverity.HIGH,
                    NewsDirection.NEGATIVE,
                    "SHIPPING",
                    product -> sector(product).equals("SHIPPING"),
                    8,
                    18
            );
            case BANKING_CRISIS -> sectorEvent(
                    type,
                    "Banking Houses",
                    "Silvercrown Liquidity Crisis",
                    "Fear spreads across the banking houses after a sudden liquidity shock.",
                    "Messengers from Silvercrown arrived before dawn, carrying requests for emergency credit. Merchant houses are pulling funds until the ledgers settle.",
                    NewsSeverity.CRITICAL,
                    NewsDirection.NEGATIVE,
                    "BANKING",
                    product -> sector(product).equals("BANKING") || sector(product).equals("FINANCE"),
                    10,
                    25
            );
            case HARVEST_BOOM -> sectorEvent(
                    type,
                    "Harvest",
                    "Exceptional Harvest Season",
                    "Granaries are full and food merchants are reporting record yields.",
                    "Clear skies and steady roads have delivered a rare surplus. Brewers, bakers, and grain factors are bidding aggressively for storage space.",
                    NewsSeverity.MEDIUM,
                    NewsDirection.POSITIVE,
                    "GRAIN/FOOD",
                    product -> sector(product).equals("GRAIN") || sector(product).equals("FOOD"),
                    6,
                    16
            );
            case PLAGUE_OUTBREAK -> sectorEvent(
                    type,
                    "Public Health",
                    "Plague Outbreak in the Eastern Villages",
                    "Trade slows down as quarantine orders affect several routes.",
                    "Local magistrates have closed eastern toll roads and posted quarantine banners. Merchants are rerouting shipments through longer, costlier paths.",
                    NewsSeverity.CRITICAL,
                    NewsDirection.NEGATIVE,
                    "GENERAL",
                    product -> true,
                    5,
                    14
            );
            case WAR_RUMORS -> warRumors();
            case MAGIC_DISCOVERY -> sectorEvent(
                    type,
                    "Arcane Research",
                    "Arcane Breakthrough Announced",
                    "Researchers claim a breakthrough in mana extraction technology.",
                    "The research guild unveiled a condenser array said to triple stable mana yields. Speculators are already crowding the arcane counters.",
                    NewsSeverity.HIGH,
                    NewsDirection.POSITIVE,
                    "ARCANE",
                    product -> sector(product).equals("ARCANE") || sector(product).equals("RESEARCH"),
                    8,
                    20
            );
        };
    }

    @Transactional(readOnly = true)
    public List<WorldNewsResponse> getNews(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        return worldNewsRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, safeLimit))
                .stream()
                .map(WorldNewsResponse::from)
                .toList();
    }

    @Scheduled(fixedRateString = "${game.events.fixed-rate-millis:60000}")
    public void scheduledWorldEvent() {
        if (scheduledEventsEnabled) {
            generateRandomWorldEvent();
        }
    }

    private WorldNewsResponse royalContract() {
        Product product = randomEnabledProduct();
        BigDecimal impactPercent = randomSignedImpact(NewsDirection.POSITIVE, 5, 15);
        LocalDateTime now = LocalDateTime.now();
        applyEventImpact(List.of(product), impactPercent);

        return createWorldNewsItem(
                WorldEventType.ROYAL_CONTRACT,
                "World Contract",
                "Royal Contract Awarded",
                "The crown has signed a major supply contract with " + product.getName() + ".",
                "Royal quartermasters have placed a rush order with " + product.getName() + ". Traders expect caravans, labor, and coin to flow toward the winning guild before the week is out.",
                NewsSeverity.MEDIUM,
                sector(product),
                product.getName(),
                impactPercent,
                NewsDirection.POSITIVE,
                now
        );
    }

    private WorldNewsResponse singleAssetEvent(
            WorldEventType type,
            String category,
            String title,
            String summaryTemplate,
            String bodyTemplate,
            NewsSeverity severity,
            NewsDirection direction,
            Predicate<Product> matcher,
            int minPercent,
            int maxPercent
    ) {
        Product product = productsMatching(matcher).stream()
                .findFirst()
                .orElseGet(this::randomEnabledProduct);
        BigDecimal impactPercent = randomSignedImpact(direction, minPercent, maxPercent);
        LocalDateTime now = LocalDateTime.now();
        applyEventImpact(List.of(product), impactPercent);

        return createWorldNewsItem(
                type,
                category,
                title,
                summaryTemplate.formatted(product.getName()),
                bodyTemplate.formatted(product.getName()),
                severity,
                sector(product),
                product.getName(),
                impactPercent,
                direction,
                now
        );
    }

    private WorldNewsResponse sectorEvent(
            WorldEventType type,
            String category,
            String title,
            String summary,
            String body,
            NewsSeverity severity,
            NewsDirection direction,
            String affectedSector,
            Predicate<Product> matcher,
            int minPercent,
            int maxPercent
    ) {
        List<Product> affectedProducts = productsMatching(matcher);
        if (affectedProducts.isEmpty()) {
            affectedProducts = List.of(randomEnabledProduct());
        }

        BigDecimal impactPercent = randomSignedImpact(direction, minPercent, maxPercent);
        LocalDateTime now = LocalDateTime.now();
        applyEventImpact(affectedProducts, impactPercent);

        return createWorldNewsItem(
                type,
                category,
                title,
                summary,
                body,
                severity,
                affectedSector,
                affectedProducts.size() == 1 ? affectedProducts.get(0).getName() : null,
                impactPercent,
                direction,
                now
        );
    }

    private WorldNewsResponse warRumors() {
        List<Product> defensiveWinners = productsMatching(product ->
                sector(product).equals("MINING") || sector(product).equals("BANKING") || sector(product).equals("ARCANE"));
        List<Product> exposedLosers = productsMatching(product ->
                sector(product).equals("SHIPPING") || sector(product).equals("LOGISTICS") || sector(product).equals("GRAIN") || sector(product).equals("FOOD"));

        if (defensiveWinners.isEmpty() && exposedLosers.isEmpty()) {
            exposedLosers = List.of(randomEnabledProduct());
        }

        BigDecimal positiveImpact = randomSignedImpact(NewsDirection.POSITIVE, 3, 9);
        BigDecimal negativeImpact = randomSignedImpact(NewsDirection.NEGATIVE, 4, 12);
        LocalDateTime now = LocalDateTime.now();

        if (!defensiveWinners.isEmpty()) {
            applyEventImpact(defensiveWinners, positiveImpact);
        }
        if (!exposedLosers.isEmpty()) {
            applyEventImpact(exposedLosers, negativeImpact);
        }

        return createWorldNewsItem(
                WorldEventType.WAR_RUMORS,
                "Border Politics",
                "War Rumors Spread Across the Border",
                "Merchants are repositioning as rumors of conflict shake the markets.",
                "Letters from the border speak of troop movements and hurried purchases. Defensive suppliers are finding bids, while exposed trade routes face sudden discounts.",
                NewsSeverity.HIGH,
                "MIXED",
                null,
                positiveImpact.abs().max(negativeImpact.abs()).setScale(2, RoundingMode.HALF_UP),
                NewsDirection.MIXED,
                now
        );
    }

    private void applyEventImpact(List<Product> products, BigDecimal impactPercent) {
        for (Product product : products) {
            BigDecimal currentPrice = money(product.getCurrentPrice());
            BigDecimal factor = BigDecimal.ONE.add(impactPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
            BigDecimal nextPrice = currentPrice.multiply(factor).setScale(2, RoundingMode.HALF_UP).max(MIN_PRICE);
            BigDecimal currentMax = product.getMaxPrice() != null ? product.getMaxPrice() : product.getBasePrice();

            product.setCurrentPrice(nextPrice);
            if (currentMax == null || nextPrice.compareTo(currentMax) > 0) {
                product.setMaxPrice(nextPrice);
            }
            productRepository.save(product);
            savePriceHistoryForAffectedAsset(product, nextPrice);
        }
    }

    private void savePriceHistoryForAffectedAsset(Product product, BigDecimal price) {
        priceHistoryRepository.save(PriceHistory.builder()
                .product(product)
                .price(price)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private WorldNewsResponse createWorldNewsItem(
            WorldEventType type,
            String category,
            String title,
            String summary,
            String body,
            NewsSeverity severity,
            String affectedSector,
            String affectedAssetName,
            BigDecimal impactPercent,
            NewsDirection direction,
            LocalDateTime timestamp
    ) {
        WorldNewsItem newsItem = worldNewsRepository.save(WorldNewsItem.builder()
                .type(type)
                .category(category)
                .title(title)
                .summary(summary)
                .body(body)
                .severity(severity)
                .affectedSector(affectedSector)
                .affectedAssetName(affectedAssetName)
                .impactPercent(impactPercent.setScale(2, RoundingMode.HALF_UP))
                .direction(direction)
                .isRead(false)
                .timestamp(timestamp)
                .build());

        saveMarketEvent(type, title, summary, timestamp);
        return WorldNewsResponse.from(newsItem);
    }

    private void saveMarketEvent(WorldEventType type, String title, String summary, LocalDateTime timestamp) {
        marketEventRepository.save(MarketEvent.builder()
                .type("WORLD_" + type.name())
                .description(title + " - " + summary)
                .executedBy(SYSTEM_USER)
                .timestamp(timestamp)
                .build());
    }

    private List<Product> productsMatching(Predicate<Product> matcher) {
        return productRepository.findAll()
                .stream()
                .filter(product -> !Boolean.FALSE.equals(product.getEnabled()))
                .filter(matcher)
                .sorted(Comparator.comparing(Product::getName))
                .toList();
    }

    private Product randomEnabledProduct() {
        List<Product> products = productsMatching(product -> true);
        if (products.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "No enabled assets available for world event.");
        }

        return products.get(ThreadLocalRandom.current().nextInt(products.size()));
    }

    private BigDecimal randomSignedImpact(NewsDirection direction, int minPercent, int maxPercent) {
        BigDecimal magnitude = BigDecimal.valueOf(ThreadLocalRandom.current().nextDouble(minPercent, maxPercent))
                .setScale(2, RoundingMode.HALF_UP);

        if (direction == NewsDirection.NEGATIVE) {
            return magnitude.negate();
        }

        return magnitude;
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String productName(Product product) {
        return product.getName() == null ? "" : product.getName().toLowerCase(Locale.ROOT);
    }

    private String sector(Product product) {
        return product.getSector() == null ? "" : product.getSector().toUpperCase(Locale.ROOT);
    }
}
