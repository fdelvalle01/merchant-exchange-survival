# Codex Project Memory - Merchant Exchange Survival

This document is a working memory for future development sessions. It captures product direction, implementation rules, style decisions, and gameplay logic that should stay consistent.

## Documentation Map

- `README.md`: product pitch, current status, quick start, and documentation index.
- `docs/GAMEPLAY.md`: player-facing rules and gameplay loop.
- `docs/ARQUITECTURA-MERCHANT-EXCHANGE-SURVIVAL.md`: canonical AS-IS technical analysis.
- `docs/REQ-001-trading-desktop.md`: current desktop behavior.
- `docs/REQ-007-keycloak.md`: current security and role matrix.
- `docs/REQ-008-docker-compose.md`: local stack and persistence caveats.
- `docs/RESUMEN-TECNICO-TRADING-BAR-EXCHANGE.md`: historical note only.

When old project notes conflict with current code or the canonical architecture
document, trust the current code first.

## Product Identity

- Product name: **Merchant Exchange Survival**.
- Genre: economic survival game with a desktop-style trading terminal.
- Fantasy: the player operates a merchant company in a medieval/fantasy kingdom market.
- The project should feel like a game system, not a generic CRUD financial app.
- Internal technical names may still say `stockbar` for compatibility, but visible branding should be Merchant Exchange Survival.

## Core Gameplay Loop

```txt
Asset selection
  -> BUY/SELL through Royal Ticket
  -> Holdings and cash update
  -> World news changes prices
  -> Portfolio P/L changes
  -> Company value and risk update
  -> End Day applies operating costs and possible random events
  -> Player reacts
```

Important principle: market events should be presented as **Guild Herald news**, not as technical database events.

## Current Implemented Phases

- Phase 1: branding and fictional assets.
- Phase 2: `PlayerCompany`, cash, holdings, portfolio, company dashboard.
- Phase 3: real BUY/SELL, `MarketOrder`, realized P/L, Trade History.
- Phase 4: World News + Risk System through Guild Herald.
- Phase 4.2: improved portfolio-aware news semantics.
- Market Engine 2.0: simulated market authority with BUY/SELL pressure and fair value reversion.
- Phase 5: Survival Rules & Game Clock.
- Phase 6A: Sealed Auction, Inventory & Active Relics.
- UX polish: portfolio holdings select global asset.
- Auth polish: custom frontend login screen and custom Keycloak login theme.

## Roles And Auth

Auth provider:

- Keycloak remains the source of authentication.
- Do not replace OIDC with manual token endpoint login in the frontend.
- Frontend uses `keycloak-js`.
- Backend validates JWT as OAuth2 Resource Server.

Realm/client compatibility:

- Realm: `stockbar`
- Frontend client: `stockbar-frontend`
- API client/resource id: `stockbar-api`

Visible branding:

- Use Merchant Exchange Survival in UI.
- Custom Keycloak theme path:

```txt
docker/keycloak/themes/merchant-exchange/login
```

Demo users:

| User | Password | Role |
| --- | --- | --- |
| `viewer` | `viewer` | `VIEWER` |
| `trader` | `trader` | `TRADER` |
| `admin` | `admin` | `ADMIN_BAR` |

Role behavior:

- `VIEWER`: read-only market/news plus own company and portfolio.
- `TRADER`: can use ticket, portfolio, company dashboard, orders.
- `ADMIN_BAR`: trader permissions plus Game Master Controls.

## Frontend Architecture

Main area:

```txt
stock-bar-frontend/src/trading-desktop
```

Core files:

- `TradingDesktop.tsx`: owns global selected asset and shared state.
- `components/Workspace.tsx`: passes shared app props to desktop windows.
- `desktopApps.ts`: app registry and role access.
- `types.ts`: shared frontend types.
- `marketUtils.ts`: money/percentage helpers.
- `newsUtils.ts`: portfolio-aware news impact semantics.

Important desktop apps:

- `MarketBoardApp.tsx`
- `ProductDetailApp.tsx`
- `OrderTicketApp.tsx`
- `PortfolioApp.tsx`
- `CompanyDashboardApp.tsx`
- `MyOrdersApp.tsx`
- `GuildHeraldApp.tsx`
- `AdminMarketControlsApp.tsx`

Global selected asset:

- Source of truth: `selectedInstrumentId` in `TradingDesktop.tsx`.
- Callback: `onSelectProduct(product)`.
- Market Board, Portfolio, and Company Dashboard should use this same callback.
- Royal Ticket and Asset Detail update automatically when `selectedProduct` changes.

Do not create parallel selected-asset state inside apps unless there is a specific local UI reason.

Survival UI:

- `CompanyDashboardApp.tsx` owns the visible `END DAY` action.
- `stock-bar-frontend/src/trading-desktop/services/gameApi.ts` calls `/api/game/state` and `/api/game/end-day`.
- After End Day, refresh products, company, portfolio, orders, news, and market events.
- `OrderTicketApp.tsx` must disable BUY/SELL if `company.status !== ACTIVE`.
- Terminal states:
  - `BANKRUPT`: show defeat messaging and block trading.
  - `VICTORIOUS`: show victory messaging and block trading for now.

## Frontend Style Rules

Visual direction:

- Dark medieval trading desk.
- Quiet operational tool with fantasy/game identity.
- Use amber/stone/black foundation sparingly, with semantic green/red/amber risk and P/L colors.
- Avoid generic finance dashboard look.
- Avoid one-note bright palettes.
- Avoid marketing landing pages. First screen should be useful or auth-related.

UI conventions:

- Desktop windows use compact, utilitarian layouts.
- Cards are acceptable for repeated items, modals, and framed tools.
- Avoid cards inside cards.
- Tables should stay dense and readable.
- Buttons should have clear hover/focus states.
- Text must not overflow buttons or compact controls.
- Use existing `react-icons/fa` pattern unless there is a good reason to introduce another icon set.

Logo assets:

```txt
stock-bar-frontend/public/branding/merchant-logo.png
docker/keycloak/themes/merchant-exchange/login/resources/img/merchant-logo.png
```

## News Semantics

Guild Herald should not say a news item hurt or benefited the player if the player bought after the event.

The frontend compares:

```txt
news.timestamp vs holding.createdAt
```

If holding existed at event time:

- POSITIVE -> `BENEFITS YOU`
- NEGATIVE -> `HURTS YOU`
- MIXED -> `AFFECTS YOU`
- NEUTRAL -> `WATCH`

If holding was opened after event time:

- POSITIVE -> `BOUGHT AFTER RALLY`
- NEGATIVE -> `BOUGHT THE DIP`
- MIXED -> `POST-EVENT ENTRY`
- NEUTRAL -> `RELATED POSITION`

Mixed impact display:

- Use `Market volatility - X%`.
- Do not render mixed as a simple positive or negative move.

Important file:

```txt
stock-bar-frontend/src/trading-desktop/newsUtils.ts
```

## Backend Architecture

Main area:

```txt
stock-bar-backend/src/main/java/com/francisco/stockbar
```

Main layers:

- `controller`
- `services`
- `repository`
- `model`
- `dto`

Main entities:

- `Product`
- `PlayerCompany`
- `Holding`
- `MarketOrder`
- `WorldNewsItem`
- `PriceHistory`
- `MarketEvent`
- `Sale` for legacy compatibility

Important services:

- `PlayerCompanyService`
- `PortfolioService`
- `OrderService`
- `WorldEventService`
- `AdminMarketService`
- `GameClockService`

Survival files:

- `PlayerCompanyStatus`
- `SurvivalProperties`
- `GameController`
- `GameStateResponse`
- `PlayerCompanySurvivalSchemaMigration`

Backend rules:

- Keep logic in services.
- Controllers should stay thin.
- Use `BigDecimal` for money.
- Round money consistently to two decimals where existing services do.
- Preserve existing API contracts unless the user explicitly asks for a contract change.
- Keep `/api/sales` compatibility unless explicitly removed.
- For backend changes, run at least `mvn test`; use `mvn clean test` when verifying compilation after DTO/entity changes.
- When adding non-null fields to existing entities, provide SQL defaults or a migration/backfill path. Hibernate `ddl-auto=update` can fail on existing rows if a new column is `NOT NULL` without a default.

## Trading Logic

BUY:

- Validate request.
- Validate asset exists and is enabled.
- Validate quantity > 0.
- Calculate total amount from current price.
- Reject insufficient cash.
- Decrease company cash.
- Create or update holding.
- Recalculate weighted average price.
- Save `MarketOrder` with side BUY and status FILLED.
- Register `ORDER_BUY_FILLED`.
- Refresh company value.

SELL:

- Validate request.
- Validate asset exists and is enabled.
- Validate quantity > 0.
- Validate holding exists.
- Validate enough quantity.
- Execute at current price.
- Calculate realized P/L:

```txt
(executedPrice - holding.averagePrice) * quantity
```

- Increase company cash.
- Reduce or delete holding.
- Add realized P/L to `PlayerCompany.realizedPnl`.
- Save `MarketOrder` with side SELL and status FILLED.
- Register `ORDER_SELL_FILLED`.
- Refresh company value.

Company value:

```txt
cash + portfolioMarketValue - debt
```

Portfolio:

- Do not show zero-quantity positions.
- Response includes holding `createdAt` and `updatedAt` for news timing logic.

Trading status:

- `OrderService` must not move asset prices directly.
- `OrderService` rejects BUY/SELL with `409` when `PlayerCompany.status` is not `ACTIVE`.
- BUY/SELL still execute immediately against `Product.currentPrice` when active.

## Market Engine 2.0

Design decision:

- Do not implement a real order book yet.
- Do not implement matching engine, limit orders, pending orders, partial fills, bots, or auctions yet.
- BUY and SELL remain instant execution against `Product.currentPrice`.
- The Market Engine is the market authority that moves prices after trades and events.

Conceptual model:

```txt
nextPrice =
  previousPrice
  + buyPressureImpact
  - sellPressureImpact
  + newsShockImpact
  + fairValueReversion
```

Implemented backend pieces:

- `MarketEngineService`
- `MarketEngineProperties`
- `MarketOrderRepository.sumQuantityByProductAndSideSince(...)`

Configuration prefix:

```yaml
game:
  market-engine:
```

Default behavior:

- Recent BUY quantity creates positive pressure.
- Recent SELL quantity creates negative pressure.
- Low quantity below `min-pressure-threshold` should not move price.
- Pressure impact is scaled by `default-liquidity-depth`.
- Net pressure is capped by `max-pressure-impact-pct`.
- Fair value is currently `Product.basePrice`.
- Reversion moves gradually toward `basePrice`.
- Reversion must not overshoot `basePrice`.
- Price is clamped between `basePrice * min-price-multiplier` and `basePrice * max-price-multiplier`.
- Price never falls below `0.01`.
- `PriceHistory` is saved only when the rounded price changes.
- `MarketEvent` is saved for relevant engine moves.

Market event types:

- `PRICE_PRESSURE_UP`
- `PRICE_PRESSURE_DOWN`
- `PRICE_REVERSION`
- `MARKET_ENGINE_TICK` is reserved in frontend types but not emitted by default.

Legacy Stock Bar schedulers:

- `PriceUpdaterService` and `PriceDegraderService` are now conditional.
- They only run with `price.legacy-enabled=true`.
- Keep them disabled for Merchant Exchange Survival.

Anti-exploit defaults:

```yaml
game:
  market-engine:
    min-pressure-threshold: 5
    default-liquidity-depth: 100
    buy-impact-factor: 0.001
    sell-impact-factor: 0.0015
    max-pressure-impact-pct: 0.04
    reversion-rate-pct: 0.005
    reversion-enabled: true
```

Goal: a small player BUY should not guarantee an immediate profitable resale.

## Survival Rules & Game Clock

Design principle:

```txt
The market gives opportunities, but time and liquidity can kill you.
```

Player company survival fields:

- `gameDay`, starts at `1`.
- `status`: `ACTIVE`, `BANKRUPT`, `VICTORIOUS`.
- `dailyBurnRate`, default `500.00`.
- `cashRunwayDays`, calculated from `cash / dailyBurnRate`.
- `criticalDays`, consecutive critical liquidity/risk days.
- `victoryTarget`, default `1_000_000.00`.
- `lastDayProcessedAt`.
- `bankruptcyReason`.

Endpoints:

- `GET /api/game/state`
- `POST /api/game/end-day`

Security:

- `/api/game/state` and `/api/game/end-day` are for `TRADER` and `ADMIN_BAR`.
- `VIEWER` cannot advance a company day.

End Day flow:

- If company status is not `ACTIVE`, return current state without processing another day.
- Increment `gameDay`.
- Deduct `dailyBurnRate` from cash.
- Apply debt interest if debt exists.
- Optionally generate random world news based on `game.survival.random-event-chance`.
- Refresh portfolio value, company value, unrealized P/L, cash runway, and risk.
- Increment `criticalDays` when cash is negative or risk is `CRITICAL`.
- Set `BANKRUPT` when company value is `<= 0` or critical days reach `3`.
- Set `VICTORIOUS` when company value reaches `victoryTarget`.

Technical events:

- `DAILY_BURN_APPLIED`
- `DEBT_INTEREST_APPLIED`
- `BANKRUPTCY_DECLARED`
- `VICTORY_ACHIEVED`

Deferred:

- Forced liquidation is intentionally not implemented yet.
- Config placeholders exist:
  - `game.survival.forced-liquidation-enabled`
  - `game.survival.forced-liquidation-discount-pct`

Important migration note:

- Phase 5 initially caused production/dev Docker DB failures because Hibernate tried to add new `NOT NULL` `player_company` columns to existing rows.
- Fix retained in code:
  - SQL defaults in `PlayerCompany` column definitions.
  - `PlayerCompanySurvivalSchemaMigration` adds missing columns, backfills existing companies, then enforces not-null.
- If `/api/company/me` or `/api/orders` returns 500 with `column pc1_0.cash_runway_days does not exist`, rebuild/restart backend so this migration runs:

```bash
docker compose up -d --build backend
```

## World News Logic

World event types:

- `ROYAL_CONTRACT`
- `MINING_ACCIDENT`
- `PORT_BLOCKADE`
- `BANKING_CRISIS`
- `HARVEST_BOOM`
- `PLAGUE_OUTBREAK`
- `WAR_RUMORS`
- `MAGIC_DISCOVERY`

Each world event should:

- Generate immersive title/summary/body.
- Affect an asset, sector, or broad market.
- Update `Product.currentPrice`.
- Never allow negative prices.
- Update `maxPrice` when applicable.
- Save `PriceHistory`.
- Save `WorldNewsItem`.
- Register technical `MarketEvent` when useful.

Frontend after event should refresh:

- products/assets
- news
- company
- portfolio

## Risk Logic

Risk levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

Dashboard risk alerts:

- Low cash
- High concentration
- Negative unrealized P/L
- Critical risk

Risk should feel like a gameplay warning layer, not a raw backend enum only.

## Docker And Keycloak Notes

Run stack:

```bash
docker compose up -d --build
```

Keycloak import behavior:

- If the realm already exists in the persistent volume, Keycloak skips realm import.
- `keycloak-config` service applies `loginTheme=merchant-exchange` idempotently.
- Use `docker compose down -v` only when a clean volume reset is intended.

Database bootstrap behavior:

- Docker sets `SPRING_SQL_INIT_MODE=always`.
- The current `data.sql` upsert overwrites live product fields including
  `current_price` and `max_price`.
- Restarting the backend can therefore restore demo prices while companies,
  holdings, orders, news, and events remain persisted.
- Treat this as a local-demo limitation. A production evolution should use
  versioned migrations and seed only missing products.

Useful validation:

```bash
docker compose config --quiet
docker compose ps
```

## Development Workflow

General:

- Prefer `rg` / `rg --files` for search.
- Read existing patterns before editing.
- Keep edits scoped.
- Do not revert unrelated user changes.
- Use `apply_patch` for manual edits.
- Avoid destructive git commands unless the user explicitly requests them.

Frontend validation:

```bash
cd stock-bar-frontend
npm run build
```

Backend validation:

```bash
cd stock-bar-backend
mvn test
mvn clean test
```

Docker validation:

```bash
docker compose up -d --build
docker compose ps
```

## Known Good Acceptance Checks

- Frontend builds with `npm run build`.
- Backend tests pass with `mvn clean test` when backend is touched.
- Docker Compose stack starts.
- `viewer/viewer`, `trader/trader`, and `admin/admin` authenticate through Keycloak.
- BUY decreases cash and creates/updates holding.
- SELL increases cash and reduces/removes holding.
- Realized P/L accumulates.
- Guild Herald shows news feed, filters, toasts, and personal impact semantics.
- Market Board and Portfolio reflect price changes.
- Company Dashboard shows company value, portfolio value, P/L, and risk alerts.
- Portfolio and Company Dashboard holdings select the global asset.

## Product Direction

Next strong candidates:

- Order Book visual app.
- Debt and interest pressure.
- Auctions.
- AI rival guilds.
- SSE/WebSocket market updates.
- Better migrations with Flyway or Liquibase.
- CI/CD.
- Cloud deployment.

Keep the guiding idea: every technical system should become a gameplay affordance.

## Phase 6A - Sealed Auction, Inventory & Active Relics

Implemented June 13, 2026.

Architecture decisions:

- Reuse `PlayerCompany` as the company-scoped game session.
- Persist `gameSeed`; never expose it through DTOs.
- Generate four cards before selection with centralized SHA-256 deterministic RNG.
- Keep auction and relic authority in backend services.
- Keep Vault as the only inventory application and add a lower desktop slot bar.
- Use cash as the real survival resource; Fortune Draught is treasury recovery.
- Since there is no future market queue, Book of Three Omens uses current/base
  market-engine state plus deterministic variation and returns qualitative data.

Backend:

- Models: `SealedAuction`, `SealedAuctionCard`, `RelicDefinition`,
  `CompanyRelic`, `RelicHistory`.
- Services: `SealedAuctionService`, `RelicService`, `DeterministicGameRng`.
- Defensive schema hardening: `Phase6SchemaMigration`.
- Idempotent catalog: `RelicCatalogSeeder`.
- Ring protects exactly two End Day bankruptcy evaluations.
- Book consumes once after a product target is confirmed.
- Fortune Draught restores `8,000` cash up to the configured `100,000` cap.
- Terminal runs restart through `POST /api/game/restart`; the operation clears
  only company-owned run data, returns to Day 1 with a new seed, and preserves
  shared products, prices and news.
- Auction selection uses ownership checks, pessimistic locking and idempotent retry.

Frontend:

- Special Market Board row and central `SealedAuctionModal`.
- Vault tabs `HOLDINGS` and `INVENTORY`.
- Four `ActiveRelicsBar` slots.
- Drag/drop plus button and keyboard alternatives.
- Game Master spawn, expire and grant controls.
- Vitest/Testing Library is now configured.

Verification baseline:

```bash
cd stock-bar-backend
mvn test

cd stock-bar-frontend
npm test
npm run build

docker compose up -d --build
docker compose ps
```

Verified result on June 13, 2026:

- 32 backend tests passed.
- 4 frontend tests passed.
- Frontend production build passed.
- PostgreSQL migration/catalog checks passed.
- Backend, frontend, Keycloak and PostgreSQL were healthy in Docker.

Known limitations:

- Hibernate still creates new tables; Flyway/Liquibase remains deferred.
- Book forecasts are qualitative approximations until a real future event queue exists.
- Frontend tests cover core components, not a browser-level E2E flow.
- The requested concept PNG was absent from the checkout.
