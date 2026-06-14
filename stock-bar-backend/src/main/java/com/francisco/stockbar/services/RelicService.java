package com.francisco.stockbar.services;

import com.francisco.stockbar.config.AuctionProperties;
import com.francisco.stockbar.dto.ForecastDayResponse;
import com.francisco.stockbar.dto.RelicActivationRequest;
import com.francisco.stockbar.dto.RelicActivationResponse;
import com.francisco.stockbar.dto.RelicHistoryResponse;
import com.francisco.stockbar.dto.RelicResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.CompanyRelic;
import com.francisco.stockbar.model.CompanyRelicStatus;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.model.RelicDefinition;
import com.francisco.stockbar.model.RelicEffectType;
import com.francisco.stockbar.model.RelicHistory;
import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.repository.CompanyRelicRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import com.francisco.stockbar.repository.ProductRepository;
import com.francisco.stockbar.repository.RelicDefinitionRepository;
import com.francisco.stockbar.repository.RelicHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RelicService {

    private final CompanyRelicRepository companyRelicRepository;
    private final RelicDefinitionRepository relicDefinitionRepository;
    private final RelicHistoryRepository relicHistoryRepository;
    private final ProductRepository productRepository;
    private final PlayerCompanyRepository playerCompanyRepository;
    private final MarketEventRepository marketEventRepository;
    private final PlayerCompanyService playerCompanyService;
    private final DeterministicGameRng deterministicGameRng;
    private final AuctionProperties properties;

    @Transactional(readOnly = true)
    public List<RelicResponse> getRelics() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        return companyRelicRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)
                .stream()
                .map(relic -> RelicResponse.from(relic, company.getGameDay()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RelicHistoryResponse> getHistory() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        return relicHistoryRepository.findTop100ByPlayerCompanyOrderByCreatedAtDesc(company)
                .stream()
                .map(RelicHistoryResponse::from)
                .toList();
    }

    @Transactional
    public CompanyRelic acquire(PlayerCompany company, RelicDefinition definition, SealedAuction auction) {
        CompanyRelic relic = companyRelicRepository.save(
                CompanyRelic.builder()
                        .playerCompany(company)
                        .relicDefinition(definition)
                        .sourceAuction(auction)
                        .status(CompanyRelicStatus.IN_INVENTORY)
                        .acquiredAtDay(company.getGameDay())
                        .chargesRemaining(definition.getMaxCharges())
                        .build()
        );
        history(company, relic, "RELIC_ACQUIRED", "Acquired from sealed auction " + auction.getId() + ".");
        event(company, "RELIC_ACQUIRED", definition.getName() + " entered the Vault.");
        return relic;
    }

    @Transactional
    public RelicResponse grantTestRelic(String code) {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        RelicDefinition definition = relicDefinitionRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Relic definition not found."));
        CompanyRelic relic = companyRelicRepository.save(
                CompanyRelic.builder()
                        .playerCompany(company)
                        .relicDefinition(definition)
                        .status(CompanyRelicStatus.IN_INVENTORY)
                        .acquiredAtDay(company.getGameDay())
                        .chargesRemaining(definition.getMaxCharges())
                        .build()
        );
        history(company, relic, "RELIC_ACQUIRED", "Granted by Game Master.");
        return RelicResponse.from(relic, company.getGameDay());
    }

    @Transactional
    public RelicResponse equip(Long relicId, Integer slot) {
        validateSlot(slot);
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        CompanyRelic relic = ownedForUpdate(relicId, company);
        validateEquippable(relic);

        Integer previousSlot = relic.getEquippedSlot();
        CompanyRelic occupied = companyRelicRepository.findByPlayerCompanyAndEquippedSlot(company, slot)
                .filter(existing -> !existing.getId().equals(relic.getId()))
                .orElse(null);

        if (occupied != null && occupied.getStatus() == CompanyRelicStatus.ACTIVE && previousSlot == null) {
            throw new ApiException(HttpStatus.CONFLICT, "An active relic cannot be replaced.");
        }

        if (occupied != null) {
            occupied.setEquippedSlot(null);
            if (occupied.getStatus() == CompanyRelicStatus.EQUIPPED) {
                occupied.setStatus(CompanyRelicStatus.IN_INVENTORY);
            }
            companyRelicRepository.saveAndFlush(occupied);
        }

        relic.setEquippedSlot(slot);
        if (relic.getStatus() == CompanyRelicStatus.IN_INVENTORY) {
            relic.setStatus(CompanyRelicStatus.EQUIPPED);
        }
        CompanyRelic saved = companyRelicRepository.saveAndFlush(relic);

        if (occupied != null && previousSlot != null) {
            occupied.setEquippedSlot(previousSlot);
            if (occupied.getStatus() == CompanyRelicStatus.IN_INVENTORY) {
                occupied.setStatus(CompanyRelicStatus.EQUIPPED);
            }
            companyRelicRepository.save(occupied);
        }

        history(company, saved, "RELIC_EQUIPPED", "Equipped in slot " + slot + ".");
        event(company, "RELIC_EQUIPPED", saved.getRelicDefinition().getName() + " equipped in slot " + slot + ".");
        return RelicResponse.from(saved, company.getGameDay());
    }

    @Transactional
    public RelicResponse unequip(Long relicId) {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        CompanyRelic relic = ownedForUpdate(relicId, company);
        if (relic.getStatus() == CompanyRelicStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "An active relic cannot be unequipped.");
        }
        if (relic.getStatus() != CompanyRelicStatus.EQUIPPED) {
            throw new ApiException(HttpStatus.CONFLICT, "Relic is not equipped.");
        }
        relic.setEquippedSlot(null);
        relic.setStatus(CompanyRelicStatus.IN_INVENTORY);
        CompanyRelic saved = companyRelicRepository.save(relic);
        history(company, saved, "RELIC_UNEQUIPPED", "Returned to Vault inventory.");
        event(company, "RELIC_UNEQUIPPED", saved.getRelicDefinition().getName() + " returned to inventory.");
        return RelicResponse.from(saved, company.getGameDay());
    }

    @Transactional
    public RelicActivationResponse activate(Long relicId, RelicActivationRequest request) {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        CompanyRelic relic = ownedForUpdate(relicId, company);
        if (relic.getStatus() != CompanyRelicStatus.EQUIPPED || relic.getEquippedSlot() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Relic must be equipped before activation.");
        }

        return switch (relic.getRelicDefinition().getEffectType()) {
            case BANKRUPTCY_PROTECTION -> activateRing(company, relic);
            case QUALITATIVE_FORECAST -> activateBook(company, relic, request);
            case TREASURY_RECOVERY -> activateDraught(company, relic);
        };
    }

    @Transactional(readOnly = true)
    public boolean hasBankruptcyProtection(PlayerCompany company) {
        return companyRelicRepository.findEffects(
                        company,
                        EnumSet.of(CompanyRelicStatus.ACTIVE),
                        RelicEffectType.BANKRUPTCY_PROTECTION
                )
                .stream()
                .anyMatch(relic -> relic.getExpiresAtDay() != null && relic.getExpiresAtDay() >= company.getGameDay());
    }

    @Transactional
    public void processEndDay(PlayerCompany company, boolean bankruptcyPrevented) {
        List<CompanyRelic> activeRings = companyRelicRepository.findEffects(
                company,
                EnumSet.of(CompanyRelicStatus.ACTIVE),
                RelicEffectType.BANKRUPTCY_PROTECTION
        );

        for (CompanyRelic relic : activeRings) {
            history(
                    company,
                    relic,
                    "RELIC_DAY_TICKED",
                    bankruptcyPrevented ? "Bankruptcy evaluation prevented." : "Protection day elapsed."
            );
            if (bankruptcyPrevented) {
                event(company, "BANKRUPTCY_PREVENTED", "Ring of Last Mercy prevented bankruptcy.");
            }
            if (relic.getExpiresAtDay() != null && company.getGameDay() >= relic.getExpiresAtDay()) {
                relic.setStatus(CompanyRelicStatus.EXPIRED);
                relic.setEquippedSlot(null);
                companyRelicRepository.save(relic);
                history(company, relic, "RELIC_EXPIRED", "Two End Day protection cycles completed.");
                event(company, "RELIC_EXPIRED", relic.getRelicDefinition().getName() + " expired.");
            }
        }
    }

    private RelicActivationResponse activateRing(PlayerCompany company, CompanyRelic relic) {
        int duration = relic.getRelicDefinition().getDurationDays() == null
                ? 2
                : relic.getRelicDefinition().getDurationDays();
        relic.setStatus(CompanyRelicStatus.ACTIVE);
        relic.setActivatedAtDay(company.getGameDay());
        relic.setExpiresAtDay(company.getGameDay() + duration);
        CompanyRelic saved = companyRelicRepository.save(relic);
        activated(company, saved, "Bankruptcy protection active for " + duration + " End Day cycles.");
        return RelicActivationResponse.builder()
                .relic(RelicResponse.from(saved, company.getGameDay()))
                .cash(company.getCash())
                .build();
    }

    private RelicActivationResponse activateDraught(PlayerCompany company, CompanyRelic relic) {
        BigDecimal currentCash = money(company.getCash());
        BigDecimal cap = money(properties.getFortuneTreasuryCap());
        BigDecimal recovery = money(relic.getRelicDefinition().getEffectValue());
        BigDecimal restored = recovery.min(cap.subtract(currentCash).max(BigDecimal.ZERO));
        if (restored.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Treasury reserve is already at its recovery cap.");
        }

        company.setCash(currentCash.add(restored));
        playerCompanyRepository.save(company);
        playerCompanyService.refreshCompanyValue(company);
        consume(relic, company.getGameDay(), null);
        CompanyRelic saved = companyRelicRepository.save(relic);
        activated(company, saved, "Treasury restored by " + restored + ".");
        return RelicActivationResponse.builder()
                .relic(RelicResponse.from(saved, company.getGameDay()))
                .cash(company.getCash())
                .build();
    }

    private RelicActivationResponse activateBook(
            PlayerCompany company,
            CompanyRelic relic,
            RelicActivationRequest request
    ) {
        if (request == null || request.getTargetProductId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A target product is required.");
        }
        Product product = productRepository.findById(request.getTargetProductId())
                .filter(item -> !Boolean.FALSE.equals(item.getEnabled()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target product not found."));

        List<ForecastDayResponse> forecast = forecast(company, product);
        String confidence = confidence(product);
        consume(relic, company.getGameDay(), product.getId());
        CompanyRelic saved = companyRelicRepository.save(relic);
        activated(company, saved, "Three-day omen read for " + product.getName() + ".");
        return RelicActivationResponse.builder()
                .relic(RelicResponse.from(saved, company.getGameDay()))
                .cash(company.getCash())
                .targetProductId(product.getId())
                .targetProductName(product.getName())
                .forecast(forecast)
                .confidence(confidence)
                .build();
    }

    private List<ForecastDayResponse> forecast(PlayerCompany company, Product product) {
        BigDecimal base = money(product.getBasePrice());
        BigDecimal current = money(product.getCurrentPrice());
        double engineBias = base.compareTo(BigDecimal.ZERO) == 0
                ? 0
                : current.subtract(base)
                        .divide(base, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();

        return java.util.stream.IntStream.rangeClosed(1, 3)
                .mapToObj(offset -> {
                    double deterministicNoise = deterministicGameRng.unit(
                            company.getGameSeed(),
                            company.getGameDay(),
                            product.getId(),
                            offset
                    ) * 8 - 4;
                    double score = (-engineBias * 0.35) + deterministicNoise;
                    String outlook;
                    if (Math.abs(deterministicNoise) >= 3.5) {
                        outlook = "VOLATILE";
                    } else if (score >= 1.5) {
                        outlook = "BULLISH";
                    } else if (score <= -1.5) {
                        outlook = "BEARISH";
                    } else {
                        outlook = "STABLE";
                    }
                    return ForecastDayResponse.builder().dayOffset(offset).outlook(outlook).build();
                })
                .toList();
    }

    private String confidence(Product product) {
        BigDecimal base = money(product.getBasePrice());
        if (base.compareTo(BigDecimal.ZERO) <= 0) {
            return "LOW";
        }
        BigDecimal divergence = money(product.getCurrentPrice())
                .subtract(base)
                .abs()
                .divide(base, 4, RoundingMode.HALF_UP);
        if (divergence.compareTo(BigDecimal.valueOf(0.15)) >= 0) return "HIGH";
        if (divergence.compareTo(BigDecimal.valueOf(0.05)) >= 0) return "MEDIUM";
        return "LOW";
    }

    private void consume(CompanyRelic relic, int day, Long targetProductId) {
        relic.setActivatedAtDay(day);
        relic.setTargetProductId(targetProductId);
        relic.setChargesRemaining(0);
        relic.setStatus(CompanyRelicStatus.CONSUMED);
        relic.setEquippedSlot(null);
    }

    private void activated(PlayerCompany company, CompanyRelic relic, String details) {
        history(company, relic, "RELIC_ACTIVATED", details);
        if (relic.getStatus() == CompanyRelicStatus.CONSUMED) {
            history(company, relic, "RELIC_CONSUMED", details);
        }
        event(company, "RELIC_ACTIVATED", relic.getRelicDefinition().getName() + ": " + details);
    }

    private CompanyRelic ownedForUpdate(Long relicId, PlayerCompany company) {
        return companyRelicRepository.findOwnedForUpdate(relicId, company)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Relic not found."));
    }

    private void validateEquippable(CompanyRelic relic) {
        if (relic.getStatus() == CompanyRelicStatus.CONSUMED
                || relic.getStatus() == CompanyRelicStatus.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "Consumed or expired relics cannot be equipped.");
        }
    }

    private void validateSlot(Integer slot) {
        if (slot == null || slot < 1 || slot > 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Relic slot must be between 1 and 4.");
        }
    }

    private void history(PlayerCompany company, CompanyRelic relic, String eventType, String details) {
        relicHistoryRepository.save(
                RelicHistory.builder()
                        .playerCompany(company)
                        .companyRelic(relic)
                        .eventType(eventType)
                        .gameDay(company.getGameDay())
                        .details(details)
                        .build()
        );
    }

    private void event(PlayerCompany company, String type, String description) {
        marketEventRepository.save(
                MarketEvent.builder()
                        .type(type)
                        .description(description)
                        .executedBy(company.getUsername())
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
