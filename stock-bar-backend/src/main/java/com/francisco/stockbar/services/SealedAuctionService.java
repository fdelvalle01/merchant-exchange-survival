package com.francisco.stockbar.services;

import com.francisco.stockbar.config.AuctionProperties;
import com.francisco.stockbar.dto.AuctionCardResponse;
import com.francisco.stockbar.dto.AuctionSelectionResponse;
import com.francisco.stockbar.dto.RelicResponse;
import com.francisco.stockbar.dto.SealedAuctionResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.AuctionOutcomePolarity;
import com.francisco.stockbar.model.AuctionStatus;
import com.francisco.stockbar.model.CompanyRelic;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.model.RelicDefinition;
import com.francisco.stockbar.model.RelicHistory;
import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.model.SealedAuctionCard;
import com.francisco.stockbar.repository.CompanyRelicRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import com.francisco.stockbar.repository.RelicDefinitionRepository;
import com.francisco.stockbar.repository.RelicHistoryRepository;
import com.francisco.stockbar.repository.SealedAuctionCardRepository;
import com.francisco.stockbar.repository.SealedAuctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SealedAuctionService {

    private static final int CARD_COUNT = 4;
    private static final String AUCTION_TITLE = "The Auction of Four Fates";
    private static final String CUTPURSE = "CUTPURSE_IN_THE_HALL";
    private static final String VAULT_THEFT = "VAULT_THEFT";
    private static final String COMPANY_BLACKOUT = "COMPANY_BLACKOUT";
    private static final String BROKEN_SEAL = "BROKEN_SEAL";
    private static final List<String> NEGATIVE_OUTCOMES = List.of(CUTPURSE, VAULT_THEFT, COMPANY_BLACKOUT);

    private final SealedAuctionRepository sealedAuctionRepository;
    private final SealedAuctionCardRepository sealedAuctionCardRepository;
    private final RelicDefinitionRepository relicDefinitionRepository;
    private final CompanyRelicRepository companyRelicRepository;
    private final PlayerCompanyRepository playerCompanyRepository;
    private final RelicHistoryRepository relicHistoryRepository;
    private final MarketEventRepository marketEventRepository;
    private final PlayerCompanyService playerCompanyService;
    private final RelicService relicService;
    private final DeterministicGameRng deterministicGameRng;
    private final AuctionProperties properties;

    @Transactional
    public Optional<SealedAuctionResponse> getActiveAuction() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        expirePastDue(company);
        Optional<SealedAuction> auction = sealedAuctionRepository
                .findFirstByPlayerCompanyAndAvailableFromDayOrderByCreatedAtDesc(company, company.getGameDay());
        if (auction.isEmpty() && company.getStatus() == PlayerCompanyStatus.ACTIVE) {
            auction = maybeSpawn(company, false);
        }
        return auction.map(item -> toResponse(item, company.getGameDay()));
    }

    @Transactional
    public SealedAuctionResponse getAuction(Long auctionId) {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuction auction = sealedAuctionRepository.findOwnedForUpdate(auctionId, company)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sealed auction not found."));
        if (auction.getOpenedAt() == null) {
            auction.setOpenedAt(LocalDateTime.now());
            sealedAuctionRepository.save(auction);
            event(company, "SEALED_AUCTION_ENTERED", "The sealed lots were inspected without charging an entry bid.");
        }
        return toResponse(auction, company.getGameDay());
    }

    @Transactional
    public AuctionSelectionResponse select(Long auctionId, Integer cardPosition) {
        if (cardPosition == null || cardPosition < 1 || cardPosition > CARD_COUNT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected lot is invalid.");
        }

        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuction auction = sealedAuctionRepository.findOwnedForUpdate(auctionId, company)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sealed auction not found."));

        if (auction.getStatus() == AuctionStatus.RESOLVED) {
            SealedAuctionCard selectedCard = selectedCard(auction);
            if (!selectedCard.getPosition().equals(cardPosition)) {
                throw new ApiException(HttpStatus.CONFLICT, "Auction already resolved with another lot.");
            }
            CompanyRelic existingRelic = companyRelicRepository
                    .findByPlayerCompanyAndSourceAuction(company, auction)
                    .orElse(null);
            return selectionResponse(auction, selectedCard, existingRelic, company);
        }

        if (auction.getStatus() == AuctionStatus.EXPIRED || company.getGameDay() > auction.getClosesAtDay()) {
            auction.setStatus(AuctionStatus.EXPIRED);
            sealedAuctionRepository.save(auction);
            throw new ApiException(HttpStatus.CONFLICT, "This sealed auction has expired.");
        }
        if (auction.getStatus() != AuctionStatus.AVAILABLE && auction.getStatus() != AuctionStatus.ENTERED) {
            throw new ApiException(HttpStatus.CONFLICT, "This sealed auction is not available.");
        }
        if (company.getStatus() != PlayerCompanyStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "Company is not active.");
        }

        BigDecimal entryCost = money(auction.getEntryCost());
        if (money(company.getCash()).compareTo(entryCost) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Insufficient cash.");
        }

        SealedAuctionCard card = sealedAuctionCardRepository.findByAuctionAndPosition(auction, cardPosition)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Selected lot is invalid."));

        company.setCash(money(company.getCash()).subtract(entryCost));
        card.setSelected(true);
        card.setRevealed(true);
        auction.setSelectedCardId(card.getId());
        auction.setStatus(AuctionStatus.RESOLVED);
        auction.setResolvedAt(LocalDateTime.now());

        CompanyRelic relic = resolveOutcome(company, auction, card);
        sealedAuctionCardRepository.save(card);
        sealedAuctionRepository.save(auction);
        playerCompanyRepository.save(company);
        playerCompanyService.refreshCompanyValue(company);

        OutcomeView outcome = outcomeView(card);
        history(company, relic, outcome, card.getResolutionDetails());
        event(
                company,
                "SEALED_AUCTION_RESOLVED",
                "Lot " + cardPosition + " revealed " + outcome.title() + ": " + card.getResolutionDetails()
        );
        return selectionResponse(auction, card, relic, company);
    }

    @Transactional
    public SealedAuctionResponse forceSpawn() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        return toResponse(maybeSpawn(company, true).orElseThrow(), company.getGameDay());
    }

    @Transactional
    public SealedAuctionResponse expireActive() {
        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuction auction = sealedAuctionRepository.findByPlayerCompanyAndStatusIn(
                        company,
                        EnumSet.of(AuctionStatus.AVAILABLE, AuctionStatus.ENTERED)
                )
                .stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active sealed auction."));
        auction.setStatus(AuctionStatus.EXPIRED);
        sealedAuctionRepository.save(auction);
        event(company, "SEALED_AUCTION_EXPIRED", "The active sealed auction was expired by Game Master.");
        return toResponse(auction, company.getGameDay());
    }

    @Transactional
    public void expireAtEndDay(PlayerCompany company) {
        sealedAuctionRepository.findByPlayerCompanyAndStatusIn(
                        company,
                        EnumSet.of(AuctionStatus.AVAILABLE, AuctionStatus.ENTERED)
                )
                .stream()
                .filter(auction -> auction.getClosesAtDay() <= company.getGameDay())
                .forEach(auction -> {
                    auction.setStatus(AuctionStatus.EXPIRED);
                    sealedAuctionRepository.save(auction);
                    event(company, "SEALED_AUCTION_EXPIRED", "The Auction of Four Fates closed without a claim.");
                });
    }

    @Transactional
    public void spawnForNewDay(PlayerCompany company) {
        if (company.getStatus() == PlayerCompanyStatus.ACTIVE) {
            maybeSpawn(company, false);
        }
    }

    private Optional<SealedAuction> maybeSpawn(PlayerCompany company, boolean force) {
        Optional<SealedAuction> currentDay = sealedAuctionRepository
                .findFirstByPlayerCompanyAndAvailableFromDayOrderByCreatedAtDesc(company, company.getGameDay());
        if (currentDay.isPresent()) {
            return currentDay;
        }

        boolean hasActive = !sealedAuctionRepository.findByPlayerCompanyAndStatusIn(
                company,
                EnumSet.of(AuctionStatus.AVAILABLE, AuctionStatus.ENTERED)
        ).isEmpty();
        if (hasActive) {
            return Optional.empty();
        }

        double chance = properties.getAppearanceChance()
                .max(BigDecimal.ZERO)
                .min(BigDecimal.ONE)
                .doubleValue();
        double roll = deterministicGameRng.unit(company.getGameSeed(), company.getGameDay(), 0x6A, 0);
        if (!force && roll >= chance) {
            return Optional.empty();
        }

        SealedAuction auction = sealedAuctionRepository.save(
                SealedAuction.builder()
                        .playerCompany(company)
                        .title(AUCTION_TITLE)
                        .entryCost(money(properties.getEntryCost()))
                        .availableFromDay(company.getGameDay())
                        .closesAtDay(company.getGameDay() + Math.max(1, properties.getDurationDays()) - 1)
                        .status(AuctionStatus.AVAILABLE)
                        .build()
        );
        generateCards(company, auction);
        event(company, "SEALED_AUCTION_CREATED", "The Auction of Four Fates opened for day " + company.getGameDay() + ".");
        return Optional.of(auction);
    }

    private void generateCards(PlayerCompany company, SealedAuction auction) {
        List<RelicDefinition> definitions = relicDefinitionRepository.findByEnabledTrueOrderByCodeAsc();
        if (definitions.size() < 3) {
            throw new ApiException(HttpStatus.CONFLICT, "The relic catalog is not ready.");
        }

        int positiveStart = deterministicGameRng.index(
                definitions.size(),
                company.getGameSeed(),
                company.getGameDay(),
                auction.getId(),
                200
        );
        int positiveSequence = 0;
        for (int position = 1; position <= CARD_COUNT; position++) {
            AuctionOutcomePolarity polarity = choosePolarity(company, auction, position);
            RelicDefinition relicDefinition = null;
            String outcomeCode;

            if (polarity == AuctionOutcomePolarity.POSITIVE) {
                int definitionIndex = (positiveStart + positiveSequence) % definitions.size();
                positiveSequence++;
                relicDefinition = definitions.get(definitionIndex);
                outcomeCode = relicDefinition.getCode();
            } else if (polarity == AuctionOutcomePolarity.NEGATIVE) {
                int outcomeIndex = deterministicGameRng.index(
                        NEGATIVE_OUTCOMES.size(),
                        company.getGameSeed(),
                        company.getGameDay(),
                        auction.getId(),
                        300 + position
                );
                outcomeCode = NEGATIVE_OUTCOMES.get(outcomeIndex);
            } else {
                outcomeCode = BROKEN_SEAL;
            }

            sealedAuctionCardRepository.save(
                    SealedAuctionCard.builder()
                            .auction(auction)
                            .position(position)
                            .relicDefinition(relicDefinition)
                            .outcomePolarity(polarity)
                            .outcomeCode(outcomeCode)
                            .revealed(false)
                            .selected(false)
                            .generatedOrder(deterministicGameRng.value(
                                    company.getGameSeed(),
                                    company.getGameDay(),
                                    auction.getId(),
                                    position
                            ))
                            .build()
            );
        }
    }

    private AuctionOutcomePolarity choosePolarity(PlayerCompany company, SealedAuction auction, int position) {
        int positive = Math.max(0, properties.getPositiveOutcomeWeight());
        int negative = Math.max(0, properties.getNegativeOutcomeWeight());
        int neutral = Math.max(0, properties.getNeutralOutcomeWeight());
        int total = positive + negative + neutral;
        if (total <= 0) {
            return AuctionOutcomePolarity.POSITIVE;
        }

        int roll = deterministicGameRng.index(
                total,
                company.getGameSeed(),
                company.getGameDay(),
                auction.getId(),
                100 + position
        );
        if (roll < positive) return AuctionOutcomePolarity.POSITIVE;
        if (roll < positive + negative) return AuctionOutcomePolarity.NEGATIVE;
        return AuctionOutcomePolarity.NEUTRAL;
    }

    private CompanyRelic resolveOutcome(PlayerCompany company, SealedAuction auction, SealedAuctionCard card) {
        AuctionOutcomePolarity polarity = effectivePolarity(card);
        if (polarity == AuctionOutcomePolarity.POSITIVE) {
            if (card.getRelicDefinition() == null) {
                throw new ApiException(HttpStatus.CONFLICT, "Selected relic outcome is unavailable.");
            }
            CompanyRelic relic = relicService.acquire(company, card.getRelicDefinition(), auction);
            card.setResolutionDetails(card.getRelicDefinition().getDescription());
            return relic;
        }

        if (polarity == AuctionOutcomePolarity.NEUTRAL) {
            card.setResolutionDetails("The seal breaks into dust. Nothing of value remains.");
            return null;
        }

        switch (card.getOutcomeCode()) {
            case CUTPURSE -> applyCutpurse(company, card);
            case VAULT_THEFT -> applyVaultTheft(company, auction, card);
            case COMPANY_BLACKOUT -> applyBlackout(company, card);
            default -> throw new ApiException(HttpStatus.CONFLICT, "Selected auction outcome is unavailable.");
        }
        return null;
    }

    private void applyCutpurse(PlayerCompany company, SealedAuctionCard card) {
        BigDecimal loss = money(properties.getCutpurseLoss()).max(BigDecimal.ZERO.setScale(2));
        company.setCash(money(company.getCash()).subtract(loss));
        card.setResolutionDetails(
                "A thief disappears into the crowd with part of your treasury. Lost " + loss + " cash."
        );
    }

    private void applyVaultTheft(PlayerCompany company, SealedAuction auction, SealedAuctionCard card) {
        BigDecimal min = percentage(properties.getVaultTheftMinPct());
        BigDecimal max = percentage(properties.getVaultTheftMaxPct());
        if (min.compareTo(max) > 0) {
            BigDecimal swap = min;
            min = max;
            max = swap;
        }
        BigDecimal unit = BigDecimal.valueOf(deterministicGameRng.unit(
                company.getGameSeed(),
                company.getGameDay(),
                auction.getId(),
                400 + card.getPosition()
        ));
        BigDecimal rate = min.add(max.subtract(min).multiply(unit)).setScale(4, RoundingMode.HALF_UP);
        BigDecimal availableCash = money(company.getCash()).max(BigDecimal.ZERO.setScale(2));
        BigDecimal loss = availableCash.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        company.setCash(money(company.getCash()).subtract(loss));
        card.setResolutionDetails(
                "A sealed lot was bait. Your vault is lighter than before. Lost "
                        + loss + " cash (" + rate.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP) + "%)."
        );
    }

    private void applyBlackout(PlayerCompany company, SealedAuctionCard card) {
        company.setBuyBlockedUntilDay(company.getGameDay() + 1);
        card.setResolutionDetails(
                "A power failure strikes your company desk. BUY orders are unavailable until the next day; SELL remains open."
        );
    }

    private void expirePastDue(PlayerCompany company) {
        sealedAuctionRepository.findByPlayerCompanyAndStatusIn(
                        company,
                        EnumSet.of(AuctionStatus.AVAILABLE, AuctionStatus.ENTERED)
                )
                .stream()
                .filter(auction -> company.getGameDay() > auction.getClosesAtDay())
                .forEach(auction -> {
                    auction.setStatus(AuctionStatus.EXPIRED);
                    sealedAuctionRepository.save(auction);
                });
    }

    private SealedAuctionCard selectedCard(SealedAuction auction) {
        if (auction.getSelectedCardId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Resolved auction has no selected card.");
        }
        return sealedAuctionCardRepository.findById(auction.getSelectedCardId())
                .filter(card -> card.getAuction().getId().equals(auction.getId()))
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Selected auction card is unavailable."));
    }

    private AuctionSelectionResponse selectionResponse(
            SealedAuction auction,
            SealedAuctionCard card,
            CompanyRelic relic,
            PlayerCompany company
    ) {
        OutcomeView outcome = outcomeView(card);
        return AuctionSelectionResponse.builder()
                .auctionId(auction.getId())
                .status(auction.getStatus().name())
                .selectedCardPosition(card.getPosition())
                .selectedOutcomePolarity(outcome.polarity().name())
                .selectedOutcomeCode(outcome.code())
                .selectedOutcomeTitle(outcome.title())
                .selectedOutcomeDescription(resolvedDescription(card, outcome))
                .relic(relic == null ? null : RelicResponse.from(relic, company.getGameDay()))
                .cash(company.getCash())
                .build();
    }

    private SealedAuctionResponse toResponse(SealedAuction auction, int currentDay) {
        List<SealedAuctionCard> cards = sealedAuctionCardRepository.findByAuctionOrderByPositionAsc(auction);
        SealedAuctionCard selectedCard = cards.stream()
                .filter(card -> Boolean.TRUE.equals(card.getSelected()))
                .findFirst()
                .orElse(null);
        RelicResponse selectedRelic = auction.getStatus() == AuctionStatus.RESOLVED
                ? companyRelicRepository.findByPlayerCompanyAndSourceAuction(auction.getPlayerCompany(), auction)
                        .map(relic -> RelicResponse.from(relic, currentDay))
                        .orElse(null)
                : null;
        OutcomeView outcome = auction.getStatus() == AuctionStatus.RESOLVED && selectedCard != null
                ? outcomeView(selectedCard)
                : null;

        return SealedAuctionResponse.builder()
                .id(auction.getId())
                .title(auction.getTitle())
                .entryCost(auction.getEntryCost())
                .availableFromDay(auction.getAvailableFromDay())
                .closesAtDay(auction.getClosesAtDay())
                .daysRemaining(Math.max(0, auction.getClosesAtDay() - currentDay))
                .status(auction.getStatus().name())
                .selectedCardPosition(selectedCard == null ? null : selectedCard.getPosition())
                .selectedOutcomePolarity(outcome == null ? null : outcome.polarity().name())
                .selectedOutcomeCode(outcome == null ? null : outcome.code())
                .selectedOutcomeTitle(outcome == null ? null : outcome.title())
                .selectedOutcomeDescription(
                        outcome == null ? null : resolvedDescription(selectedCard, outcome)
                )
                .selectedRelic(selectedRelic)
                .cards(cards.stream()
                        .map(card -> AuctionCardResponse.builder()
                                .position(card.getPosition())
                                .revealed(Boolean.TRUE.equals(card.getRevealed()))
                                .selected(Boolean.TRUE.equals(card.getSelected()))
                                .build())
                        .toList())
                .build();
    }

    private OutcomeView outcomeView(SealedAuctionCard card) {
        AuctionOutcomePolarity polarity = effectivePolarity(card);
        String code = card.getOutcomeCode() == null ? "" : card.getOutcomeCode();
        if (polarity == AuctionOutcomePolarity.POSITIVE && card.getRelicDefinition() != null) {
            return new OutcomeView(
                    polarity,
                    card.getRelicDefinition().getCode(),
                    card.getRelicDefinition().getName(),
                    card.getRelicDefinition().getDescription()
            );
        }
        return switch (code) {
            case CUTPURSE -> new OutcomeView(
                    polarity, CUTPURSE, "Cutpurse in the Hall",
                    "A thief disappears into the crowd with part of your treasury."
            );
            case VAULT_THEFT -> new OutcomeView(
                    polarity, VAULT_THEFT, "Vault Theft",
                    "A sealed lot was bait. Your vault is lighter than before."
            );
            case COMPANY_BLACKOUT -> new OutcomeView(
                    polarity, COMPANY_BLACKOUT, "Company Blackout",
                    "BUY orders are unavailable until the next day. SELL remains open."
            );
            case BROKEN_SEAL -> new OutcomeView(
                    polarity, BROKEN_SEAL, "Broken Seal",
                    "The seal breaks into dust. Nothing of value remains."
            );
            default -> new OutcomeView(polarity, code, "Sealed Outcome", "The sealed lot has been resolved.");
        };
    }

    private AuctionOutcomePolarity effectivePolarity(SealedAuctionCard card) {
        return card.getOutcomePolarity() == null
                ? AuctionOutcomePolarity.POSITIVE
                : card.getOutcomePolarity();
    }

    private String resolvedDescription(SealedAuctionCard card, OutcomeView outcome) {
        return card.getResolutionDetails() == null || card.getResolutionDetails().isBlank()
                ? outcome.description()
                : card.getResolutionDetails();
    }

    private void history(
            PlayerCompany company,
            CompanyRelic relic,
            OutcomeView outcome,
            String details
    ) {
        relicHistoryRepository.save(
                RelicHistory.builder()
                        .playerCompany(company)
                        .companyRelic(relic)
                        .eventType("SEALED_AUCTION_OUTCOME")
                        .gameDay(company.getGameDay())
                        .details(outcome.polarity() + " - " + outcome.title() + ": "
                                + (details == null ? outcome.description() : details))
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

    private BigDecimal percentage(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value)
                .max(BigDecimal.ZERO)
                .min(BigDecimal.ONE);
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private record OutcomeView(
            AuctionOutcomePolarity polarity,
            String code,
            String title,
            String description
    ) {
    }
}
