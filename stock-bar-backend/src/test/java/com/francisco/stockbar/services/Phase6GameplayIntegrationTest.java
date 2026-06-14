package com.francisco.stockbar.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.francisco.stockbar.dto.AuctionSelectionResponse;
import com.francisco.stockbar.dto.GameStateResponse;
import com.francisco.stockbar.dto.RelicActivationRequest;
import com.francisco.stockbar.dto.RelicActivationResponse;
import com.francisco.stockbar.dto.RelicResponse;
import com.francisco.stockbar.dto.SealedAuctionResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.CompanyRelic;
import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.model.SealedAuctionCard;
import com.francisco.stockbar.repository.CompanyRelicRepository;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.RelicHistoryRepository;
import com.francisco.stockbar.repository.SealedAuctionCardRepository;
import com.francisco.stockbar.repository.SealedAuctionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:phase6-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never",
        "game.survival.random-event-on-end-day-enabled=false",
        "game.sealed-auction.appearance-chance=0",
        "game.sealed-auction.positive-outcome-weight=100",
        "game.sealed-auction.negative-outcome-weight=0",
        "game.sealed-auction.neutral-outcome-weight=0"
})
@Transactional
class Phase6GameplayIntegrationTest {

    @Autowired
    private SealedAuctionService sealedAuctionService;

    @Autowired
    private RelicService relicService;

    @Autowired
    private GameClockService gameClockService;

    @Autowired
    private GameRestartService gameRestartService;

    @Autowired
    private PlayerCompanyService playerCompanyService;

    @Autowired
    private PlayerCompanyRepository playerCompanyRepository;

    @Autowired
    private SealedAuctionRepository sealedAuctionRepository;

    @Autowired
    private SealedAuctionCardRepository sealedAuctionCardRepository;

    @Autowired
    private CompanyRelicRepository companyRelicRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private RelicHistoryRepository relicHistoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("phase6-trader", "n/a", List.of())
        );
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void auctionGeneratesFourPersistentHiddenCardsAndChargesOnlyOnce() throws Exception {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuctionResponse auction = sealedAuctionService.forceSpawn();

        assertThat(auction.getCards()).hasSize(4);
        assertThat(auction.getCards()).allSatisfy(card -> {
            assertThat(card.getRevealed()).isFalse();
            assertThat(card.getSelected()).isFalse();
        });
        String publicJson = objectMapper.writeValueAsString(auction);
        assertThat(publicJson)
                .doesNotContain("relicDefinitionId")
                .doesNotContain("effectValue")
                .doesNotContain("generatedOrder")
                .doesNotContain("gameSeed");

        SealedAuction entity = sealedAuctionRepository.findById(auction.getId()).orElseThrow();
        List<SealedAuctionCard> before = sealedAuctionCardRepository.findByAuctionOrderByPositionAsc(entity);
        assertThat(before).hasSize(4);
        assertThat(before.stream().map(card -> card.getRelicDefinition().getCode()).distinct().count())
                .isGreaterThanOrEqualTo(3);

        AuctionSelectionResponse first = sealedAuctionService.select(auction.getId(), 2);
        BigDecimal cashAfterFirstClaim = company.getCash();
        AuctionSelectionResponse retry = sealedAuctionService.select(auction.getId(), 2);

        assertThat(first.getRelic().getId()).isEqualTo(retry.getRelic().getId());
        assertThat(cashAfterFirstClaim).isEqualByComparingTo("90000.00");
        assertThat(company.getCash()).isEqualByComparingTo(cashAfterFirstClaim);
        assertThat(sealedAuctionService.getAuction(auction.getId()).getSelectedRelic().getId())
                .isEqualTo(first.getRelic().getId());
        assertThat(companyRelicRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)).hasSize(1);
        assertThatThrownBy(() -> sealedAuctionService.select(auction.getId(), 3))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already resolved");
    }

    @Test
    void auctionRejectsInsufficientCashAndOtherCompanyOwnership() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuctionResponse auction = sealedAuctionService.forceSpawn();
        company.setCash(BigDecimal.ZERO);
        playerCompanyRepository.save(company);

        assertThatThrownBy(() -> sealedAuctionService.select(auction.getId(), 1))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Insufficient cash");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("other-company", "n/a", List.of())
        );
        assertThatThrownBy(() -> sealedAuctionService.getAuction(auction.getId()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void openingAuctionDetailIsIdempotent() {
        SealedAuctionResponse auction = sealedAuctionService.forceSpawn();

        SealedAuctionResponse first = sealedAuctionService.getAuction(auction.getId());
        SealedAuctionResponse second = sealedAuctionService.getAuction(auction.getId());

        assertThat(first.getId()).isEqualTo(auction.getId());
        assertThat(second.getId()).isEqualTo(auction.getId());
        assertThat(sealedAuctionRepository.findById(auction.getId()).orElseThrow().getOpenedAt()).isNotNull();
    }

    @Test
    void relicsEquipMoveUnequipAndBookReturnsQualitativeForecast() {
        Product product = productRepository.save(Product.builder()
                .name("Omen Test Asset")
                .sector("ARCANE")
                .basePrice(new BigDecimal("100.00"))
                .currentPrice(new BigDecimal("112.00"))
                .maxPrice(new BigDecimal("112.00"))
                .enabled(true)
                .build());
        RelicResponse book = relicService.grantTestRelic("BOOK_OF_THREE_OMENS");

        RelicResponse equipped = relicService.equip(book.getId(), 1);
        assertThat(equipped.getEquippedSlot()).isEqualTo(1);
        RelicResponse moved = relicService.equip(book.getId(), 4);
        assertThat(moved.getEquippedSlot()).isEqualTo(4);

        RelicActivationRequest request = new RelicActivationRequest();
        request.setTargetProductId(product.getId());
        RelicActivationResponse activation = relicService.activate(book.getId(), request);

        assertThat(activation.getForecast()).hasSize(3);
        assertThat(activation.getForecast()).allSatisfy(day ->
                assertThat(day.getOutlook()).isIn("BULLISH", "BEARISH", "VOLATILE", "STABLE", "UNKNOWN")
        );
        assertThat(activation.getConfidence()).isIn("LOW", "MEDIUM", "HIGH");
        assertThat(activation.getRelic().getStatus()).isEqualTo("CONSUMED");
        assertThat(activation.getRelic().getEquippedSlot()).isNull();
        assertThat(relicHistoryRepository.findTop100ByPlayerCompanyOrderByCreatedAtDesc(
                playerCompanyService.getOrCreateCompanyForCurrentUser()
        )).isNotEmpty();
    }

    @Test
    void fortuneDraughtRestoresTreasuryOnlyOnce() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        company.setCash(new BigDecimal("50000.00"));
        playerCompanyRepository.save(company);
        RelicResponse draught = relicService.grantTestRelic("FORTUNE_DRAUGHT");
        relicService.equip(draught.getId(), 2);

        RelicActivationResponse activation = relicService.activate(draught.getId(), new RelicActivationRequest());

        assertThat(activation.getCash()).isEqualByComparingTo("58000.00");
        assertThat(activation.getRelic().getStatus()).isEqualTo("CONSUMED");
        assertThatThrownBy(() -> relicService.activate(draught.getId(), new RelicActivationRequest()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("must be equipped");
    }

    @Test
    void ringPreventsExactlyTwoEndDayBankruptcyEvaluations() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        company.setCash(new BigDecimal("100.00"));
        company.setCompanyValue(new BigDecimal("100.00"));
        company.setDailyBurnRate(new BigDecimal("500.00"));
        company.setCriticalDays(0);
        playerCompanyRepository.save(company);

        RelicResponse ring = relicService.grantTestRelic("RING_OF_LAST_MERCY");
        relicService.equip(ring.getId(), 1);
        relicService.activate(ring.getId(), new RelicActivationRequest());

        GameStateResponse first = gameClockService.endDay();
        GameStateResponse second = gameClockService.endDay();
        GameStateResponse third = gameClockService.endDay();

        assertThat(first.getStatus()).isEqualTo("ACTIVE");
        assertThat(second.getStatus()).isEqualTo("ACTIVE");
        assertThat(third.getStatus()).isEqualTo("BANKRUPT");
        CompanyRelic storedRing = companyRelicRepository.findById(ring.getId()).orElseThrow();
        assertThat(storedRing.getStatus().name()).isEqualTo("EXPIRED");
    }

    @Test
    void restartClearsOnlyCompanyRunAndReturnsToDayOne() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        long previousSeed = company.getGameSeed();
        Product product = productRepository.save(Product.builder()
                .name("Restart Test Asset")
                .sector("TRADE")
                .basePrice(new BigDecimal("100.00"))
                .currentPrice(new BigDecimal("100.00"))
                .maxPrice(new BigDecimal("100.00"))
                .enabled(true)
                .build());
        holdingRepository.save(Holding.builder()
                .playerCompany(company)
                .product(product)
                .quantity(2)
                .averagePrice(new BigDecimal("100.00"))
                .build());
        SealedAuctionResponse auction = sealedAuctionService.forceSpawn();
        sealedAuctionService.select(auction.getId(), 1);

        company.setCash(new BigDecimal("-415.00"));
        company.setCompanyValue(new BigDecimal("-415.00"));
        company.setGameDay(90);
        company.setCriticalDays(3);
        company.setRiskLevel("CRITICAL");
        company.setStatus(PlayerCompanyStatus.BANKRUPT);
        company.setBankruptcyReason("Company value fell below zero.");
        playerCompanyRepository.save(company);

        var restarted = gameRestartService.restartCurrentGame();

        assertThat(restarted.getStatus()).isEqualTo("ACTIVE");
        assertThat(restarted.getGameDay()).isEqualTo(1);
        assertThat(restarted.getCash()).isEqualByComparingTo("100000.00");
        assertThat(restarted.getCompanyValue()).isEqualByComparingTo("100000.00");
        assertThat(restarted.getBankruptcyReason()).isNull();
        assertThat(company.getGameSeed()).isNotEqualTo(previousSeed);
        assertThat(holdingRepository.findByPlayerCompany(company)).isEmpty();
        assertThat(companyRelicRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)).isEmpty();
        assertThat(relicHistoryRepository.findByPlayerCompany(company)).isEmpty();
        assertThat(sealedAuctionRepository.findByPlayerCompany(company)).isEmpty();
        assertThat(productRepository.findById(product.getId())).isPresent();
        assertThatThrownBy(gameRestartService::restartCurrentGame)
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("still active");
    }
}
