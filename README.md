# 🍺 Stock Bar Exchange

**Stock Bar Exchange** is a full-stack trading desktop simulation where bar products behave like financial instruments.

The project combines a real-time market board, order entry, price simulation, market admin controls, price history, role-based access control and a movable desktop-like frontend interface.

The concept is simple: beers and drinks are traded like assets in a stock exchange.

---

## 🚀 Demo Concept

Stock Bar Exchange simulates a tavern marketplace where each product has:

- Base price
- Current market price
- Price variation
- Historical prices
- Market events
- Buy orders
- Admin-controlled market movements

Users can interact with the system depending on their role:

| Role | Permissions |
|---|---|
| VIEWER | View market, product detail and ticker |
| TRADER | View market and send buy orders |
| ADMIN_BAR | Full access, including market controls |

---

## 🧩 Main Features

### Frontend

- Trading desktop web interface
- Medieval / nordic / fantasy market visual style
- Movable internal windows
- Market Board
- Product Detail
- Order Ticket
- My Orders
- Admin Market Controls
- Ticker Tape
- Keycloak login
- Role-based UI

### Backend

- Spring Boot REST API
- PostgreSQL persistence
- JWT authentication with Keycloak
- Role-based endpoint protection
- Product management
- Sales registration
- Executed price snapshot
- Price history
- Market events
- Admin market simulation endpoints

---

## 🖥️ Trading Desktop

The frontend works like a small desktop operating system for trading apps.

Internal apps:

- **Market Board**: displays products and market prices.
- **Product Detail**: shows selected product data and price history.
- **Order Ticket**: sends buy orders to the backend.
- **My Orders**: shows local session orders as FILLED or REJECTED.
- **Admin Market Controls**: allows an admin user to simulate crash, boom, reset and product price movements.

---

## 🏗️ Architecture

```txt
React Trading Desktop
        ↓
Keycloak Login
        ↓
Axios with Bearer Token
        ↓
Spring Boot API
        ↓
PostgreSQL