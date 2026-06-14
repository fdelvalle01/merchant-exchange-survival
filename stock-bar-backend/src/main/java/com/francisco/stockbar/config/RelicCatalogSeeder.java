package com.francisco.stockbar.config;

import com.francisco.stockbar.model.RelicActivationType;
import com.francisco.stockbar.model.RelicCategory;
import com.francisco.stockbar.model.RelicDefinition;
import com.francisco.stockbar.model.RelicEffectType;
import com.francisco.stockbar.model.RelicTargetType;
import com.francisco.stockbar.repository.RelicDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class RelicCatalogSeeder implements ApplicationRunner {

    private final RelicDefinitionRepository relicDefinitionRepository;
    private final AuctionProperties properties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        upsert(
                "RING_OF_LAST_MERCY",
                "Ring of Last Mercy",
                "Prevents bankruptcy during the next two End Day evaluations without restoring cash.",
                RelicCategory.PASSIVE,
                RelicTargetType.COMPANY,
                2,
                null,
                RelicEffectType.BANKRUPTCY_PROTECTION,
                BigDecimal.valueOf(2),
                "ring"
        );
        upsert(
                "BOOK_OF_THREE_OMENS",
                "Book of Three Omens",
                "Reveals a qualitative three-day outlook for one market asset.",
                RelicCategory.TARGETED,
                RelicTargetType.PRODUCT,
                null,
                1,
                RelicEffectType.QUALITATIVE_FORECAST,
                BigDecimal.valueOf(3),
                "book"
        );
        upsert(
                "FORTUNE_DRAUGHT",
                "Fortune Draught",
                "Restores emergency treasury reserves, capped by the configured treasury limit.",
                RelicCategory.CONSUMABLE,
                RelicTargetType.COMPANY,
                null,
                1,
                RelicEffectType.TREASURY_RECOVERY,
                properties.getFortuneRecovery(),
                "draught"
        );
    }

    private void upsert(
            String code,
            String name,
            String description,
            RelicCategory category,
            RelicTargetType targetType,
            Integer durationDays,
            Integer maxCharges,
            RelicEffectType effectType,
            BigDecimal effectValue,
            String iconKey
    ) {
        RelicDefinition definition = relicDefinitionRepository.findByCode(code)
                .orElseGet(RelicDefinition::new);
        definition.setCode(code);
        definition.setName(name);
        definition.setDescription(description);
        definition.setCategory(category);
        definition.setTargetType(targetType);
        definition.setActivationType(RelicActivationType.MANUAL);
        definition.setDurationDays(durationDays);
        definition.setMaxCharges(maxCharges);
        definition.setEffectType(effectType);
        definition.setEffectValue(effectValue);
        definition.setIconKey(iconKey);
        definition.setEnabled(true);
        relicDefinitionRepository.save(definition);
    }
}
