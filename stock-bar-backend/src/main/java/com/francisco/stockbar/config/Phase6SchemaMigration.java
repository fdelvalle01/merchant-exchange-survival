package com.francisco.stockbar.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class Phase6SchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                    create unique index if not exists uk_company_active_auction
                    on sealed_auctions(company_id)
                    where status in ('AVAILABLE', 'ENTERED')
                    """);
            jdbcTemplate.execute("""
                    create unique index if not exists uk_company_relic_slot
                    on company_relics(company_id, equipped_slot)
                    where equipped_slot is not null
                    """);
            jdbcTemplate.execute("create index if not exists ix_auction_company_status on sealed_auctions(company_id, status)");
            jdbcTemplate.execute("create index if not exists ix_company_relic_status on company_relics(company_id, status)");
            jdbcTemplate.execute("create index if not exists ix_relic_history_company on relic_history(company_id, created_at desc)");
            jdbcTemplate.execute("""
                    do $$
                    begin
                        if not exists (select 1 from pg_constraint where conname = 'ck_company_relic_slot') then
                            alter table company_relics
                            add constraint ck_company_relic_slot
                            check (equipped_slot is null or equipped_slot between 1 and 4);
                        end if;
                    end $$;
                    """);
            jdbcTemplate.execute("""
                    do $$
                    begin
                        if not exists (select 1 from pg_constraint where conname = 'ck_auction_card_position') then
                            alter table sealed_auction_cards
                            add constraint ck_auction_card_position
                            check (position between 1 and 4);
                        end if;
                    end $$;
                    """);
        } catch (RuntimeException exception) {
            log.warn("Phase 6 schema hardening skipped: {}", exception.getMessage());
        }
    }
}
