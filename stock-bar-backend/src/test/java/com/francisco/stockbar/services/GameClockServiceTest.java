package com.francisco.stockbar.services;

import com.francisco.stockbar.config.SurvivalProperties;
import com.francisco.stockbar.dto.GameStateResponse;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameClockServiceTest {

    @Mock
    private PlayerCompanyService playerCompanyService;

    @Mock
    private PlayerCompanyRepository playerCompanyRepository;

    @Mock
    private MarketEventRepository marketEventRepository;

    @Mock
    private WorldEventService worldEventService;

    @Mock
    private SealedAuctionService sealedAuctionService;

    @Mock
    private RelicService relicService;

    private SurvivalProperties survivalProperties;
    private GameClockService gameClockService;
    private BigDecimal portfolioValue;
    private BigDecimal portfolioCostBasis;

    @BeforeEach
    void setUp() {
        survivalProperties = new SurvivalProperties();
        survivalProperties.setRandomEventOnEndDayEnabled(false);
        gameClockService = new GameClockService(
                playerCompanyService,
                playerCompanyRepository,
                marketEventRepository,
                worldEventService,
                survivalProperties,
                sealedAuctionService,
                relicService
        );
        portfolioValue = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        portfolioCostBasis = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        lenient().when(playerCompanyRepository.save(any(PlayerCompany.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(playerCompanyService.refreshCompanyValue(any(PlayerCompany.class)))
                .thenAnswer(invocation -> refresh(invocation.getArgument(0)));
        lenient().when(playerCompanyService.getPortfolioMarketValue(any(PlayerCompany.class)))
                .thenAnswer(invocation -> portfolioValue);
        lenient().when(playerCompanyService.getPortfolioCostBasis(any(PlayerCompany.class)))
                .thenAnswer(invocation -> portfolioCostBasis);
    }

    @Test
    void endDayIncrementsGameDay() {
        PlayerCompany company = company("10000.00", "500.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getGameDay()).isEqualTo(2);
    }

    @Test
    void endDayDeductsDailyBurnRateFromCash() {
        PlayerCompany company = company("10000.00", "500.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getCash()).isEqualByComparingTo("9500.00");
        verify(marketEventRepository).save(any(MarketEvent.class));
    }

    @Test
    void endDayCalculatesCashRunwayDays() {
        PlayerCompany company = company("10000.00", "500.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getCashRunwayDays()).isEqualByComparingTo("19.0");
    }

    @Test
    void companyValueBelowZeroSetsBankrupt() {
        PlayerCompany company = company("100.00", "500.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getStatus()).isEqualTo("BANKRUPT");
        assertThat(response.getBankruptcyReason()).isEqualTo("Company value fell below zero.");
    }

    @Test
    void negativeCashIncrementsCriticalDays() {
        portfolioValue = money("1000.00");
        PlayerCompany company = company("100.00", "200.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getCash()).isEqualByComparingTo("-100.00");
        assertThat(response.getCriticalDays()).isEqualTo(1);
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void negativeCashForThreeCriticalDaysSetsBankrupt() {
        portfolioValue = money("1000.00");
        PlayerCompany company = company("100.00", "200.00");
        company.setCriticalDays(2);
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getCriticalDays()).isEqualTo(3);
        assertThat(response.getStatus()).isEqualTo("BANKRUPT");
        assertThat(response.getBankruptcyReason()).isEqualTo("Liquidity collapse: cash remained negative or critical for 3 days.");
    }

    @Test
    void companyValueAtVictoryTargetSetsVictorious() {
        PlayerCompany company = company("1000500.00", "500.00");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getStatus()).isEqualTo("VICTORIOUS");
        assertThat(response.getVictoryMessage()).isEqualTo("Your merchant house has become a dominant market power.");
    }

    @Test
    void bankruptStatusPreventsAdditionalDayProcessing() {
        PlayerCompany company = company("1000.00", "500.00");
        company.setGameDay(5);
        company.setStatus(PlayerCompanyStatus.BANKRUPT);
        company.setBankruptcyReason("Already bankrupt.");
        when(playerCompanyService.getOrCreateCompanyForCurrentUser()).thenReturn(company);

        GameStateResponse response = gameClockService.endDay();

        assertThat(response.getGameDay()).isEqualTo(5);
        assertThat(response.getCash()).isEqualByComparingTo("1000.00");
        assertThat(response.getStatus()).isEqualTo("BANKRUPT");
        verify(playerCompanyRepository, never()).save(any(PlayerCompany.class));
    }

    private PlayerCompany refresh(PlayerCompany company) {
        BigDecimal cash = money(company.getCash());
        BigDecimal debt = money(company.getDebt());
        BigDecimal companyValue = cash.add(portfolioValue).subtract(debt).setScale(2, RoundingMode.HALF_UP);
        company.setCompanyValue(companyValue);
        company.setCashRunwayDays(runway(cash, money(company.getDailyBurnRate())));
        company.setRiskLevel(risk(company));
        return company;
    }

    private String risk(PlayerCompany company) {
        if (money(company.getCash()).compareTo(BigDecimal.ZERO) < 0
                || money(company.getCompanyValue()).compareTo(BigDecimal.ZERO) <= 0
                || company.getCashRunwayDays().compareTo(BigDecimal.valueOf(2)) <= 0) {
            return "CRITICAL";
        }

        return "LOW";
    }

    private BigDecimal runway(BigDecimal cash, BigDecimal dailyBurn) {
        if (dailyBurn.compareTo(BigDecimal.ZERO) <= 0 || cash.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }

        return cash.divide(dailyBurn, 1, RoundingMode.HALF_UP);
    }

    private PlayerCompany company(String cash, String dailyBurnRate) {
        BigDecimal initialCash = money(cash);
        BigDecimal burn = money(dailyBurnRate);
        return PlayerCompany.builder()
                .id(1L)
                .username("trader")
                .companyName("Trader Trading Company")
                .cash(initialCash)
                .debt(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .companyValue(initialCash)
                .realizedPnl(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .reputation(50)
                .riskLevel("LOW")
                .gameDay(1)
                .status(PlayerCompanyStatus.ACTIVE)
                .dailyBurnRate(burn)
                .cashRunwayDays(runway(initialCash, burn))
                .criticalDays(0)
                .victoryTarget(money("1000000.00"))
                .build();
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
