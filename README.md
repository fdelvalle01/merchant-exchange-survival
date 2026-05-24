# Stock Bar Exchange

Stock Bar Exchange is a full-stack trading desktop simulation where bar products behave like financial instruments.

The project combines a trading-style desktop UI, market data, order entry, price simulation, admin market controls, price history, market events, Keycloak authentication, role-based access control, PostgreSQL persistence and a Docker Compose demo stack.

The concept is simple: beers and drinks are traded like assets in a stock exchange.

## Screenshots

Recommended screenshot folder:

```txt
docs/
  images/
    login.png
    trading-desktop.png
    admin-market-controls.png
```

Example:

```md
![Login](docs/images/login.png)
![Trading Desktop](docs/images/trading-desktop.png)
![Admin Market Controls](docs/images/admin-market-controls.png)
```

## Demo Concept

Stock Bar Exchange simulates a tavern marketplace where each product has market behavior similar to a financial instrument.

Each product has:

- Base price
- Current market price
- Maximum price
- Price variation
- Historical prices
- Market events
- Buy orders
- Admin-controlled market movements

Users interact with the system depending on their role:

| Role | Permissions |
| --- | --- |
| `VIEWER` | View market, ticker and product details |
| `TRADER` | View market and send buy orders |
| `ADMIN_BAR` | Full access, including admin market controls |

## Main Features

### Frontend

- React + TypeScript + Vite
- Trading desktop web interface
- Medieval / Nordic / fantasy market visual style
- Movable internal desktop windows
- Ticker Tape
- Market Board
- Product Detail with real price history
- Order Ticket
- My Orders
- Admin Market Controls
- Keycloak login
- Role-based UI
- Axios interceptor with Bearer token
- Friendly API error handling

### Backend

- Spring Boot REST API
- PostgreSQL persistence
- Spring Security OAuth2 Resource Server
- JWT validation with Keycloak
- Role-based endpoint protection
- Product market model
- Sales registration
- Executed price snapshot
- Total amount calculation
- Price history
- Market events
- Admin market simulation endpoints
- Global exception handler

### Infrastructure

- Docker Compose full local demo
- PostgreSQL container
- Keycloak container
- Backend container
- Frontend container
- Realm, users and roles prepared for local testing

## Trading Desktop

The frontend works like a small desktop operating system for trading apps.

| App | Description |
| --- | --- |
| Market Board | Displays products and current market prices |
| Product Detail | Shows selected product data and price history |
| Order Ticket | Sends buy orders to the backend |
| My Orders | Shows local session orders as `FILLED` or `REJECTED` |
| Admin Market Controls | Allows admins to simulate crash, boom, reset and price movements |

The desktop supports:

- Opening internal apps from the sidebar
- Moving windows inside the workspace
- Focusing windows using z-index
- Closing and minimizing windows
- Keeping product selection shared across apps

## Architecture

```txt
React Trading Desktop
        |
        v
Keycloak Login
        |
        v
Axios with Bearer Token
        |
        v
Spring Boot API
        |
        v
PostgreSQL
```

Market flow:

```txt
Admin Market Controls
        |
        v
Backend updates product price
        |
        v
PriceHistory is stored
        |
        v
MarketEvent is stored
        |
        v
Frontend refreshes MarketBoard / Ticker / ProductDetail
        |
        v
Trader sends order
        |
        v
Backend registers Sale with executedPrice and totalAmount
        |
        v
MyOrders shows FILLED or REJECTED for the local session
```

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Axios
- Keycloak JS
- React RND
- Recharts

### Backend

- Java 17
- Spring Boot
- Spring Security
- OAuth2 Resource Server
- Spring Data JPA
- PostgreSQL
- OpenAPI / Swagger

### Infrastructure

- Docker
- Docker Compose
- Keycloak
- PostgreSQL

## Authentication And Authorization

The system uses Keycloak for authentication and role-based authorization.

Available roles:

- `ADMIN_BAR`
- `TRADER`
- `VIEWER`

Role behavior:

| Role | Market | Product Detail | Order Ticket | My Orders | Admin Controls |
| --- | --- | --- | --- | --- | --- |
| `VIEWER` | Yes | Yes | No | No | No |
| `TRADER` | Yes | Yes | Yes | Yes | No |
| `ADMIN_BAR` | Yes | Yes | Yes | Yes | Yes |

Backend endpoint protection:

| Endpoint | Roles |
| --- | --- |
| `GET /api/products/**` | `VIEWER`, `TRADER`, `ADMIN_BAR` |
| `GET /api/price-history/**` | `VIEWER`, `TRADER`, `ADMIN_BAR` |
| `GET /api/market-events/**` | `VIEWER`, `TRADER`, `ADMIN_BAR` |
| `POST /api/sales` | `TRADER`, `ADMIN_BAR` |
| `POST /api/admin/**` | `ADMIN_BAR` |
| `DELETE /api/admin/**` | `ADMIN_BAR` |

Swagger/OpenAPI remains open for local development.

## Run With Docker Compose

From the project root:

```bash
docker compose up -d --build
```

Stop the environment:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

Use a clean start when changing the Keycloak realm import:

```bash
docker compose down -v
docker compose up -d --build
```

## Local URLs

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080` |
| Swagger / OpenAPI | `http://localhost:8080/swagger-ui/index.html` |
| Keycloak | `http://localhost:8081` |
| Keycloak Admin Console | `http://localhost:8081/admin` |
| PostgreSQL | `localhost:5432` |

## Test Users

| User | Password | Role |
| --- | --- | --- |
| `admin` | `admin` | `ADMIN_BAR` |
| `trader` | `trader` | `TRADER` |
| `viewer` | `viewer` | `VIEWER` |

## Main API Endpoints

### Products

```http
GET /api/products
GET /api/products/detailed
GET /api/products/board
POST /api/products
```

### Sales

```http
GET /api/sales
POST /api/sales
```

Sale request:

```json
{
  "productId": 12,
  "quantity": 1
}
```

Sale response:

```json
{
  "id": 206,
  "productId": 12,
  "productName": "Cerveza Kunstmann",
  "quantity": 1,
  "executedPrice": 6600,
  "totalAmount": 6600,
  "timestamp": "2026-05-21T19:30:00"
}
```

The frontend does not send the price. The backend uses the current product market price as the executed price.

### Price History

```http
GET /api/price-history?productId=12&limit=80
```

Example response:

```json
[
  {
    "timestamp": "2026-05-21T19:20:00",
    "price": 5500
  },
  {
    "timestamp": "2026-05-21T19:21:00",
    "price": 6050
  }
]
```

### Market Events

```http
GET /api/market-events?limit=100
```

Possible events:

- `SALE_REGISTERED`
- `PRICE_UPDATED`
- `MARKET_CRASH`
- `MARKET_BOOM`
- `MARKET_RESET`
- `PRODUCT_PRICE_UP`
- `PRODUCT_PRICE_DOWN`

### Admin Market Controls

```http
POST /api/admin/market/crash
POST /api/admin/market/boom
POST /api/admin/market/reset
POST /api/admin/products/{id}/price/up
POST /api/admin/products/{id}/price/down
POST /api/admin/products/{id}/reset
```

Example price movement request:

```json
{
  "percent": 10
}
```

## Database Model

Main tables:

- `product`
- `sale`
- `price_history`
- `market_event`

### product

Stores tradable bar products.

- `id`
- `name`
- `base_price`
- `current_price`
- `max_price`
- `enabled`
- `image_url`
- `created_at`
- `last_purchased_at`

### sale

Stores executed buy orders.

- `id`
- `product_id`
- `quantity`
- `executed_price`
- `total_amount`
- `timestamp`

### price_history

Stores product price evolution.

- `id`
- `product_id`
- `price`
- `timestamp`

### market_event

Stores relevant market actions.

- `id`
- `type`
- `description`
- `executed_by`
- `timestamp`

## Local Development

### Backend

```bash
cd stock-bar-backend
mvn spring-boot:run
```

### Frontend

```bash
cd stock-bar-frontend
npm install
npm run dev
```

### Keycloak For Local Development

The Docker Compose demo uses Keycloak on port `8081`.

If you run Keycloak manually, keep the frontend variables aligned:

```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=stockbar
VITE_KEYCLOAK_CLIENT_ID=stockbar-frontend
```

## Validation

Frontend:

```bash
cd stock-bar-frontend
npm install
npx tsc --noEmit
npm run build
```

Backend:

```bash
cd stock-bar-backend
mvn clean test
mvn clean package
```

Docker:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

## Suggested Demo Flow

1. Open `http://localhost:5173`.
2. Login as `viewer / viewer`.
3. Validate that only read-only market apps are available.
4. Logout.
5. Login as `trader / trader`.
6. Open Market Board.
7. Select a product.
8. Open Product Detail.
9. Send a buy order from Order Ticket.
10. Validate the order appears in My Orders.
11. Logout.
12. Login as `admin / admin`.
13. Open Admin Market Controls.
14. Simulate boom, crash or product price movement.
15. Validate Market Board, Ticker and Product Detail update.
16. Check Market Events.

## Roadmap

Planned improvements:

- WebSocket market feed
- Persistent user order history
- Portfolio / positions app
- Better price chart with line chart or candlesticks
- Flyway or Liquibase migrations
- CI/CD pipeline
- Observability with Prometheus and Grafana
- Cloud deployment
- More advanced market simulation rules
- SELL orders
- Product volume model
- Audit dashboard for admins

## Purpose

This project was built as a portfolio project to demonstrate:

- Full-stack architecture
- Trading-style frontend design
- Desktop-like web application structure
- Secure backend APIs
- Keycloak authentication
- Role-based access control
- Dockerized local environment
- Market simulation logic
- PostgreSQL persistence
- Clean frontend modularization
- Spring Boot backend design

## Project Pitch

Stock Bar Exchange is a full-stack trading desktop simulation where beers behave like financial instruments.

It includes a movable web desktop interface, Keycloak authentication, role-based access control, market admin tools, price history, order entry, market events and a Docker Compose demo stack.

Built with React, TypeScript, Spring Boot, PostgreSQL, Keycloak and Docker Compose.
