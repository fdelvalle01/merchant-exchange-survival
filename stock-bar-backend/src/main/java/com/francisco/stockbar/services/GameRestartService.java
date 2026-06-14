package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.PlayerCompanyResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.MarketEvent;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.PlayerCompanyStatus;
import com.francisco.stockbar.model.SealedAuction;
import com.francisco.stockbar.repository.CompanyRelicRepository;
import com.francisco.stockbar.repository.HoldingRepository;
import com.francisco.stockbar.repository.MarketEventRepository;
import com.francisco.stockbar.repository.MarketOrderRepository;
import com.francisco.stockbar.repository.PlayerCompanyRepository;
import com.francisco.stockbar.repository.RelicHistoryRepository;
import com.francisco.stockbar.repository.SealedAuctionCardRepository;
import com.francisco.stockbar.repository.SealedAuctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameRestartService {

    private static final SecureRandom SEED_GENERATOR = new SecureRandom();

    private final PlayerCompanyService playerCompanyService;
    private final PlayerCompanyRepository playerCompanyRepository;
    private final HoldingRepository holdingRepository;
    private final MarketOrderRepository marketOrderRepository;
    private final RelicHistoryRepository relicHistoryRepository;
    private final CompanyRelicRepository companyRelicRepository;
    private final SealedAuctionCardRepository sealedAuctionCardRepository;
    private final SealedAuctionRepository sealedAuctionRepository;
    private final MarketEventRepository marketEventRepository;

    @Transactional
    public PlayerCompanyResponse restartCurrentGame() {
        PlayerCompany company = playerCompanyService.getCompanyForCurrentUserForUpdate();
        if (company.getStatus() == PlayerCompanyStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "The current company is still active.");
        }

        List<SealedAuction> auctions = sealedAuctionRepository.findByPlayerCompany(company);

        relicHistoryRepository.deleteAll(
                relicHistoryRepository.findByPlayerCompany(company)
        );
        relicHistoryRepository.flush();

        companyRelicRepository.deleteAll(
                companyRelicRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)
        );
        companyRelicRepository.flush();

        for (SealedAuction auction : auctions) {
            sealedAuctionCardRepository.deleteAll(
                    sealedAuctionCardRepository.findByAuctionOrderByPositionAsc(auction)
            );
        }
        sealedAuctionCardRepository.flush();
        sealedAuctionRepository.deleteAll(auctions);
        sealedAuctionRepository.flush();

        marketOrderRepository.deleteAll(
                marketOrderRepository.findByPlayerCompanyOrderByCreatedAtDesc(company)
        );
        marketOrderRepository.flush();
        holdingRepository.deleteAll(holdingRepository.findByPlayerCompany(company));
        holdingRepository.flush();

        playerCompanyService.resetForNewGame(company, nextSeed(company.getGameSeed()));
        PlayerCompany saved = playerCompanyRepository.save(company);

        marketEventRepository.save(MarketEvent.builder()
                .type("GAME_RESTARTED")
                .description("A new merchant company run began at Day 1.")
                .executedBy(company.getUsername())
                .timestamp(LocalDateTime.now())
                .build());

        return PlayerCompanyResponse.from(saved);
    }

    private long nextSeed(Long previousSeed) {
        long next;
        do {
            next = SEED_GENERATOR.nextLong(1, Long.MAX_VALUE);
        } while (previousSeed != null && next == previousSeed);
        return next;
    }
}
