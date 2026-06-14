package com.francisco.stockbar.services;

import com.francisco.stockbar.config.AuctionProperties;
import com.francisco.stockbar.dto.AuctionCardResponse;
import com.francisco.stockbar.dto.AuctionSelectionResponse;
import com.francisco.stockbar.dto.RelicResponse;
import com.francisco.stockbar.dto.SealedAuctionResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.AuctionStatus;
import com.francisco.stockbar.model.CompanyRelic;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.model.RelicDefinition;
import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.model.SealedAuctionCard;
import com.francisco.stockbar.repository.CompanyRelicRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import com.francisco.stockbar.repository.RelicDefinitionRepository;
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

    private final SealedAuctionRepository sealedAuctionRepository;
    private final SealedAuctionCardRepository sealedAuctionCardRepository;
    private final RelicDefinitionRepository relicDefinitionRepository;
    private final CompanyRelicRepository companyRelicRepository;
    private final PlayerCompanyRepository playerCompanyRepository;
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
        SealedAuction auction = sealedAuctionRepository.findByIdAndPlayerCompany(auctionId, company)
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
            throw new ApiException(HttpStatus.BAD_REQUEST, "Card position must be between 1 and 4.");
        }

        PlayerCompany company = playerCompanyService.getOrCreateCompanyForCurrentUser();
        SealedAuction auction = sealedAuctionRepository.findOwnedForUpdate(auctionId, company)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sealed auction not found."));

        if (auction.getStatus() == AuctionStatus.RESOLVED) {
            SealedAuctionCard selectedCard = selectedCard(auction);
            if (!selectedCard.getPosition().equals(cardPosition)) {
                throw new ApiException(HttpStatus.CONFLICT, "This auction was already resolved with another lot.");
            }
            CompanyRelic existingRelic = companyRelicRepository
                    .findByPlayerCompanyAndSourceAuction(company, auction)
                    .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Resolved auction reward is unavailable."));
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
            throw new ApiException(HttpStatus.CONFLICT, "Only an active company can enter a sealed auction.");
        }

        BigDecimal entryCost = money(auction.getEntryCost());
        if (money(company.getCash()).compareTo(entryCost) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Insufficient cash for the sealed auction entry bid.");
        }

        SealedAuctionCard card = sealedAuctionCardRepository.findByAuctionAndPosition(auction, cardPosition)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Auction card is unavailable."));

        company.setCash(money(company.getCash()).subtract(entryCost));
        playerCompanyRepository.save(company);
        playerCompanyService.refreshCompanyValue(company);

        card.setSelected(true);
        card.setRevealed(true);
        sealedAuctionCardRepository.save(card);

        auction.setSelectedCardId(card.getId());
        auction.setStatus(AuctionStatus.RESOLVED);
        auction.setResolvedAt(LocalDateTime.now());
        sealedAuctionRepository.save(auction);

        CompanyRelic relic = relicService.acquire(company, card.getRelicDefinition(), auction);
        event(company, "SEALED_AUCTION_RESOLVED", "Lot " + cardPosition + " revealed " + card.getRelicDefinition().getName() + ".");
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

        int start = deterministicGameRng.index(
                definitions.size(),
                company.getGameSeed(),
                company.getGameDay(),
                auction.getId(),
                0
        );
        for (int position = 1; position <= CARD_COUNT; position++) {
            int definitionIndex = position <= definitions.size()
                    ? (start + position - 1) % definitions.size()
                    : deterministicGameRng.index(
                            definitions.size(),
                            company.getGameSeed(),
                            company.getGameDay(),
                            auction.getId(),
                            position
                    );
            sealedAuctionCardRepository.save(
                    SealedAuctionCard.builder()
                            .auction(auction)
                            .position(position)
                            .relicDefinition(definitions.get(definitionIndex))
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
        return AuctionSelectionResponse.builder()
                .auctionId(auction.getId())
                .status(auction.getStatus().name())
                .selectedCardPosition(card.getPosition())
                .relic(RelicResponse.from(relic, company.getGameDay()))
                .cash(company.getCash())
                .build();
    }

    private SealedAuctionResponse toResponse(SealedAuction auction, int currentDay) {
        List<SealedAuctionCard> cards = sealedAuctionCardRepository.findByAuctionOrderByPositionAsc(auction);
        Integer selectedPosition = cards.stream()
                .filter(card -> Boolean.TRUE.equals(card.getSelected()))
                .map(SealedAuctionCard::getPosition)
                .findFirst()
                .orElse(null);
        RelicResponse selectedRelic = auction.getStatus() == AuctionStatus.RESOLVED
                ? companyRelicRepository.findByPlayerCompanyAndSourceAuction(auction.getPlayerCompany(), auction)
                        .map(relic -> RelicResponse.from(relic, currentDay))
                        .orElse(null)
                : null;
        return SealedAuctionResponse.builder()
                .id(auction.getId())
                .title(auction.getTitle())
                .entryCost(auction.getEntryCost())
                .availableFromDay(auction.getAvailableFromDay())
                .closesAtDay(auction.getClosesAtDay())
                .daysRemaining(Math.max(0, auction.getClosesAtDay() - currentDay))
                .status(auction.getStatus().name())
                .selectedCardPosition(selectedPosition)
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
