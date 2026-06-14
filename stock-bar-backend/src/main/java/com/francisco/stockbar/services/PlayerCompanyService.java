package com.francisco.stockbar.services;

import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.Holding;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PlayerCompanyService {

    private static final BigDecimal INITIAL_CASH = BigDecimal.valueOf(100000).setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal INITIAL_DEBT = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal DEFAULT_DAILY_BURN_RATE = BigDecimal.valueOf(500).setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal DEFAULT_VICTORY_TARGET = BigDecimal.valueOf(1_000_000).setScale(2, RoundingMode.HALF_UP);
    private static final int INITIAL_REPUTATION = 50;
    private static final String INITIAL_RISK_LEVEL = "LOW";

    private final PlayerCompanyRepository playerCompanyRepository;
    private final HoldingRepository holdingRepository;

    @Transactional
    public PlayerCompany getOrCreateCompanyForCurrentUser() {
        String username = currentUsername();

        return playerCompanyRepository.findByUsername(username)
                .orElseGet(() -> playerCompanyRepository.save(
                        PlayerCompany.builder()
                                .username(username)
                                .companyName(defaultCompanyName(username))
                                .cash(INITIAL_CASH)
                                .debt(INITIAL_DEBT)
                                .companyValue(INITIAL_CASH)
                                .realizedPnl(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                                .reputation(INITIAL_REPUTATION)
                                .riskLevel(INITIAL_RISK_LEVEL)
                                .gameDay(1)
                                .gameSeed(seedFor(username))
                                .status(PlayerCompanyStatus.ACTIVE)
                                .dailyBurnRate(DEFAULT_DAILY_BURN_RATE)
                                .cashRunwayDays(INITIAL_CASH.divide(DEFAULT_DAILY_BURN_RATE, 1, RoundingMode.HALF_UP))
                                .criticalDays(0)
                                .victoryTarget(DEFAULT_VICTORY_TARGET)
                                .build()
                ));
    }

    @Transactional
    public PlayerCompany getCompanyForCurrentUserForUpdate() {
        String username = currentUsername();
        return playerCompanyRepository.findByUsernameForUpdate(username)
                .orElseGet(this::getOrCreateCompanyForCurrentUser);
    }

    public void resetForNewGame(PlayerCompany company, long gameSeed) {
        company.setCash(INITIAL_CASH);
        company.setDebt(INITIAL_DEBT);
        company.setCompanyValue(INITIAL_CASH);
        company.setRealizedPnl(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        company.setReputation(INITIAL_REPUTATION);
        company.setRiskLevel(INITIAL_RISK_LEVEL);
        company.setGameDay(1);
        company.setGameSeed(gameSeed);
        company.setStatus(PlayerCompanyStatus.ACTIVE);
        company.setDailyBurnRate(DEFAULT_DAILY_BURN_RATE);
        company.setCashRunwayDays(INITIAL_CASH.divide(DEFAULT_DAILY_BURN_RATE, 1, RoundingMode.HALF_UP));
        company.setCriticalDays(0);
        company.setVictoryTarget(DEFAULT_VICTORY_TARGET);
        company.setLastDayProcessedAt(null);
        company.setBankruptcyReason(null);
    }

    @Transactional
    public PlayerCompany refreshCompanyValue(PlayerCompany company) {
        BigDecimal portfolioValue = getPortfolioMarketValue(company);
        BigDecimal costBasis = getPortfolioCostBasis(company);

        if (company.getRealizedPnl() == null) {
            company.setRealizedPnl(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }
        applySurvivalDefaults(company);

        company.setCompanyValue(
                money(company.getCash())
                        .add(portfolioValue)
                        .subtract(money(company.getDebt()))
                        .setScale(2, RoundingMode.HALF_UP)
        );
        updateCashRunway(company);
        company.setRiskLevel(calculateRiskLevel(company, portfolioValue, costBasis));
        return playerCompanyRepository.save(company);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPortfolioMarketValue(PlayerCompany company) {
        return holdingRepository.findByPlayerCompany(company)
                .stream()
                .filter(holding -> holding.getQuantity() != null && holding.getQuantity() > 0)
                .map(this::marketValueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPortfolioCostBasis(PlayerCompany company) {
        return holdingRepository.findByPlayerCompany(company)
                .stream()
                .filter(holding -> holding.getQuantity() != null && holding.getQuantity() > 0)
                .map(holding -> money(holding.getAveragePrice())
                        .multiply(BigDecimal.valueOf(holding.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal marketValueOf(Holding holding) {
        BigDecimal currentPrice = money(holding.getProduct().getCurrentPrice());
        return currentPrice
                .multiply(BigDecimal.valueOf(holding.getQuantity() == null ? 0 : holding.getQuantity()))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    public void applySurvivalDefaults(PlayerCompany company) {
        if (company.getGameDay() == null || company.getGameDay() < 1) {
            company.setGameDay(1);
        }
        if (company.getGameSeed() == null || company.getGameSeed() == 0L) {
            company.setGameSeed(seedFor(company.getUsername()));
        }
        if (company.getStatus() == null) {
            company.setStatus(PlayerCompanyStatus.ACTIVE);
        }
        if (company.getDailyBurnRate() == null || company.getDailyBurnRate().compareTo(BigDecimal.ZERO) <= 0) {
            company.setDailyBurnRate(DEFAULT_DAILY_BURN_RATE);
        }
        if (company.getCashRunwayDays() == null) {
            company.setCashRunwayDays(BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP));
        }
        if (company.getCriticalDays() == null || company.getCriticalDays() < 0) {
            company.setCriticalDays(0);
        }
        if (company.getVictoryTarget() == null || company.getVictoryTarget().compareTo(BigDecimal.ZERO) <= 0) {
            company.setVictoryTarget(DEFAULT_VICTORY_TARGET);
        }
    }

    public BigDecimal updateCashRunway(PlayerCompany company) {
        BigDecimal dailyBurnRate = money(company.getDailyBurnRate());
        BigDecimal cash = money(company.getCash());
        BigDecimal runway = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);

        if (dailyBurnRate.compareTo(BigDecimal.ZERO) > 0 && cash.compareTo(BigDecimal.ZERO) > 0) {
            runway = cash.divide(dailyBurnRate, 1, RoundingMode.HALF_UP);
        }

        company.setCashRunwayDays(runway);
        return runway;
    }

    private String calculateRiskLevel(PlayerCompany company, BigDecimal portfolioValue, BigDecimal costBasis) {
        BigDecimal companyValue = money(company.getCompanyValue());
        BigDecimal debt = money(company.getDebt());
        BigDecimal unrealizedPnl = portfolioValue.subtract(costBasis).setScale(2, RoundingMode.HALF_UP);
        BigDecimal unrealizedPnlPercent = BigDecimal.ZERO;
        BigDecimal debtRatio = BigDecimal.ZERO;

        if (costBasis.compareTo(BigDecimal.ZERO) > 0) {
            unrealizedPnlPercent = unrealizedPnl
                    .divide(costBasis, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        if (companyValue.compareTo(BigDecimal.ZERO) > 0) {
            debtRatio = debt.divide(companyValue, 6, RoundingMode.HALF_UP);
        }

        BigDecimal cash = money(company.getCash());
        BigDecimal cashRunwayDays = company.getCashRunwayDays() == null
                ? BigDecimal.ZERO
                : company.getCashRunwayDays();

        if (companyValue.compareTo(BigDecimal.ZERO) <= 0
                || cash.compareTo(BigDecimal.ZERO) < 0
                || cashRunwayDays.compareTo(BigDecimal.valueOf(2)) <= 0
                || debtRatio.compareTo(BigDecimal.valueOf(0.60)) >= 0
                || unrealizedPnlPercent.compareTo(BigDecimal.valueOf(-30)) <= 0) {
            return "CRITICAL";
        }

        if (cashRunwayDays.compareTo(BigDecimal.valueOf(5)) <= 0
                || debtRatio.compareTo(BigDecimal.valueOf(0.35)) >= 0
                || unrealizedPnlPercent.compareTo(BigDecimal.valueOf(-15)) <= 0) {
            return "HIGH";
        }

        if (cashRunwayDays.compareTo(BigDecimal.valueOf(10)) <= 0
                || debtRatio.compareTo(BigDecimal.valueOf(0.15)) >= 0
                || unrealizedPnlPercent.compareTo(BigDecimal.valueOf(-5)) <= 0) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user required.");
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            Jwt jwt = jwtAuthentication.getToken();
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return username;
            }
            if (jwt.getSubject() != null && !jwt.getSubject().isBlank()) {
                return jwt.getSubject();
            }
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user required.");
        }

        return username;
    }

    private String defaultCompanyName(String username) {
        String cleanUsername = username == null || username.isBlank()
                ? "Merchant"
                : username.substring(0, 1).toUpperCase(Locale.ROOT) + username.substring(1);
        return cleanUsername + " Trading Company";
    }

    private long seedFor(String username) {
        long hash = username == null ? 1L : Integer.toUnsignedLong(username.hashCode());
        return hash == 0L ? 1L : hash;
    }
}
