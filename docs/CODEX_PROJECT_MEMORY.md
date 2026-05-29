# Codex Project Memory - Merchant Exchange Survival

This document is a working memory for future development sessions. It captures product direction, implementation rules, style decisions, and gameplay logic that should stay consistent.

## Product Identity

- Product name: **Merchant Exchange Survival**.
- Genre: economic survival game with a desktop-style trading terminal.
- Fantasy: the player operates a merchant company in a medieval/fantasy kingdom market.
- The project should feel like a game system, not a generic CRUD financial app.
- Internal technical names may still say `stockbar` for compatibility, but visible branding should be Merchant Exchange Survival.

## Core Gameplay Loop

```txt
Asset selection
  -> BUY/SELL through Investment Ticket
  -> Holdings and cash update
  -> World news changes prices
  -> Portfolio P/L changes
  -> Company value and risk update
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

- `VIEWER`: market/read-only/news.
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
- Investment Ticket and Asset Detail update automatically when `selectedProduct` changes.

Do not create parallel selected-asset state inside apps unless there is a specific local UI reason.

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

Backend rules:

- Keep logic in services.
- Controllers should stay thin.
- Use `BigDecimal` for money.
- Round money consistently to two decimals where existing services do.
- Preserve existing API contracts unless the user explicitly asks for a contract change.
- Keep `/api/sales` compatibility unless explicitly removed.
- For backend changes, run at least `mvn test`; use `mvn clean test` when verifying compilation after DTO/entity changes.

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
