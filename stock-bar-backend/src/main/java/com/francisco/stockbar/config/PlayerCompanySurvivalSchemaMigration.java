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
public class PlayerCompanySurvivalSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            addSurvivalColumnsIfMissing();
            backfillSurvivalColumns();
            enforceSurvivalColumnNullability();
        } catch (RuntimeException exception) {
            log.warn("Player company survival schema backfill skipped: {}", exception.getMessage());
        }
    }

    private void addSurvivalColumnsIfMissing() {
        jdbcTemplate.execute("alter table player_company add column if not exists game_day integer default 1");
        jdbcTemplate.execute("alter table player_company add column if not exists game_seed bigint default 0");
        jdbcTemplate.execute("alter table player_company add column if not exists status varchar(20) default 'ACTIVE'");
        jdbcTemplate.execute("alter table player_company add column if not exists daily_burn_rate numeric(14,2) default 500.00");
        jdbcTemplate.execute("alter table player_company add column if not exists cash_runway_days numeric(10,1) default 0.0");
        jdbcTemplate.execute("alter table player_company add column if not exists critical_days integer default 0");
        jdbcTemplate.execute("alter table player_company add column if not exists victory_target numeric(14,2) default 1000000.00");
        jdbcTemplate.execute("alter table player_company add column if not exists last_day_processed_at timestamp");
        jdbcTemplate.execute("alter table player_company add column if not exists bankruptcy_reason varchar(600)");
        jdbcTemplate.execute("alter table player_company add column if not exists buy_blocked_until_day integer");
    }

    private void backfillSurvivalColumns() {
        jdbcTemplate.update("""
                update player_company
                set game_day = coalesce(game_day, 1),
                    game_seed = case
                        when game_seed is null or game_seed in (0, 1)
                        then abs(hashtext(username)::bigint) + 1
                        else game_seed
                    end,
                    status = coalesce(status, 'ACTIVE'),
                    daily_burn_rate = coalesce(daily_burn_rate, 500.00),
                    cash_runway_days = case
                        when cash is not null and cash > 0 and coalesce(daily_burn_rate, 500.00) > 0
                        then round(cash / coalesce(daily_burn_rate, 500.00), 1)
                        else 0.0
                    end,
                    critical_days = coalesce(critical_days, 0),
                    victory_target = coalesce(victory_target, 1000000.00)
                where game_day is null
                   or game_seed is null
                   or game_seed = 0
                   or game_seed = 1
                   or status is null
                   or daily_burn_rate is null
                   or cash_runway_days is null
                   or critical_days is null
                   or victory_target is null
                """);
    }

    private void enforceSurvivalColumnNullability() {
        jdbcTemplate.execute("alter table player_company alter column game_day set not null");
        jdbcTemplate.execute("alter table player_company alter column game_seed set not null");
        jdbcTemplate.execute("alter table player_company alter column game_seed set default 1");
        jdbcTemplate.execute("alter table player_company alter column status set not null");
        jdbcTemplate.execute("alter table player_company alter column daily_burn_rate set not null");
        jdbcTemplate.execute("alter table player_company alter column cash_runway_days set not null");
        jdbcTemplate.execute("alter table player_company alter column critical_days set not null");
        jdbcTemplate.execute("alter table player_company alter column victory_target set not null");
    }
}
