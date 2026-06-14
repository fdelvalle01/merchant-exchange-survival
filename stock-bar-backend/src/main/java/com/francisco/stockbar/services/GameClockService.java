package com.francisco.stockbar.services;

import com.francisco.stockbar.config.SurvivalProperties;
import com.francisco.stockbar.dto.GameStateResponse;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameClockService {

    private static final String SYSTEM_USER = "GAME_CLOCK";

    private final PlayerCompanyService playerCompanyService;
    private final PlayerCompanyRepository playerCompanyRepository;
    private final MarketEventRepository marketEventRepository;
    private final WorldEventService worldEventService;
    private final SurvivalProperties survivalProperties;
    private final SealedAuctionService sealedAuctionService;
    private final RelicService relicService;

    @Transactional
    public GameStateResponse getCurrentState() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        PlayerCompany refreshed = playerCompanyService.refreshCompanyValue(company);
        PlayerCompany saved = playerCompanyRepository.save(refreshed);
        return toGameState(saved);
    }

    @Transactional
    public GameStateResponse endDay() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        playerCompanyService.applySurvivalDefaults(company);

        if (company.getStatus() != PlayerCompanyStatus.ACTIVE) {
            PlayerCompany refreshed = playerCompanyService.refreshCompanyValue(company);
            return toGameState(refreshed);
        }

        LocalDateTime now = LocalDateTime.now();
        BigDecimal dailyBurn = dailyBurn(company);

        sealedAuctionService.expireAtEndDay(company);
        company.setGameDay(company.getGameDay() + 1);
        company.setCash(money(company.getCash()).subtract(dailyBurn).setScale(2, RoundingMode.HALF_UP));
        company.setLastDayProcessedAt(now);
        recordEvent("DAILY_BURN_APPLIED", "Guild operating costs reduced cash by " + dailyBurn + ".", now);

        applyDebtInterest(company, now);
        maybeGenerateWorldEvent();

        PlayerCompany refreshed = playerCompanyService.refreshCompanyValue(company);
        updateCriticalDays(refreshed);
        // TODO: Forced liquidation is configured but intentionally deferred to a later survival phase.
        boolean protectedByRelic = relicService.hasBankruptcyProtection(refreshed);
        boolean bankruptcyPrevented = evaluateTerminalState(refreshed, protectedByRelic);
        relicService.processEndDay(refreshed, bankruptcyPrevented);

        PlayerCompany saved = playerCompanyRepository.save(refreshed);
        sealedAuctionService.spawnForNewDay(saved);
        return toGameState(saved);
    }

    private BigDecimal dailyBurn(PlayerCompany company) {
        if (company.getDailyBurnRate() == null || company.getDailyBurnRate().compareTo(BigDecimal.ZERO) <= 0) {
            company.setDailyBurnRate(survivalProperties.getDailyBurnRate().setScale(2, RoundingMode.HALF_UP));
        }

        return money(company.getDailyBurnRate());
    }

    private void applyDebtInterest(PlayerCompany company, LocalDateTime timestamp) {
        BigDecimal debt = money(company.getDebt());
        if (debt.compareTo(BigDecimal.ZERO) <= 0
                || survivalProperties.getDebtDailyInterestPct().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal interest = debt
                .multiply(survivalProperties.getDebtDailyInterestPct())
                .setScale(2, RoundingMode.HALF_UP);
        if (interest.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        company.setDebt(debt.add(interest).setScale(2, RoundingMode.HALF_UP));
        recordEvent("DEBT_INTEREST_APPLIED", "Debt interest added " + interest + " to guild obligations.", timestamp);
    }

    private void maybeGenerateWorldEvent() {
        if (!survivalProperties.isRandomEventOnEndDayEnabled()) {
            return;
        }

        double chance = survivalProperties.getRandomEventChance()
                .max(BigDecimal.ZERO)
                .min(BigDecimal.ONE)
                .doubleValue();
        if (ThreadLocalRandom.current().nextDouble() >= chance) {
            return;
        }

        try {
            worldEventService.generateRandomWorldEvent();
        } catch (RuntimeException exception) {
            log.warn("Random end-day world event skipped: {}", exception.getMessage());
        }
    }

    private void updateCriticalDays(PlayerCompany company) {
        boolean critical = money(company.getCash()).compareTo(BigDecimal.ZERO) < 0
                || "CRITICAL".equals(company.getRiskLevel());

        company.setCriticalDays(critical ? company.getCriticalDays() + 1 : 0);
    }

    private boolean evaluateTerminalState(PlayerCompany company, boolean bankruptcyProtected) {
        if (company.getStatus() == PlayerCompanyStatus.BANKRUPT
                || company.getStatus() == PlayerCompanyStatus.VICTORIOUS) {
            return false;
        }

        if (money(company.getCompanyValue()).compareTo(BigDecimal.ZERO) <= 0) {
            if (bankruptcyProtected) return true;
            bankrupt(company, "Company value fell below zero.");
            return false;
        }

        if (company.getCriticalDays() != null && company.getCriticalDays() >= 3) {
            if (bankruptcyProtected) return true;
            bankrupt(company, "Liquidity collapse: cash remained negative or critical for 3 days.");
            return false;
        }

        if (company.getReputation() != null && company.getReputation() <= 0) {
            if (bankruptcyProtected) return true;
            bankrupt(company, "The guild council revoked your trading license.");
            return false;
        }

        if (money(company.getCompanyValue()).compareTo(money(company.getVictoryTarget())) >= 0) {
            company.setStatus(PlayerCompanyStatus.VICTORIOUS);
            recordEvent(
                    "VICTORY_ACHIEVED",
                    "Your merchant house has become a dominant market power.",
                    LocalDateTime.now()
            );
        }
        return false;
    }

    private void bankrupt(PlayerCompany company, String reason) {
        company.setStatus(PlayerCompanyStatus.BANKRUPT);
        company.setBankruptcyReason(reason);
        recordEvent("BANKRUPTCY_DECLARED", reason, LocalDateTime.now());
    }

    private GameStateResponse toGameState(PlayerCompany company) {
        BigDecimal portfolioValue = playerCompanyService.getPortfolioMarketValue(company);
        BigDecimal costBasis = playerCompanyService.getPortfolioCostBasis(company);
        BigDecimal unrealizedPnl = portfolioValue.subtract(costBasis).setScale(2, RoundingMode.HALF_UP);
        return GameStateResponse.from(company, portfolioValue, unrealizedPnl);
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
}
