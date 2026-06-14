# REQ-001 - Merchant Exchange Survival Trading Desktop

## Estado

Implementado y evolucionado mas alla de la primera version heredada de Stock Bar
Exchange.

La ruta `/` contiene el frontend principal del juego: un escritorio oscuro de
trading medieval con aplicaciones internas, ventanas movibles y estado
compartido de instrumento.

## Objetivo Actual

Ofrecer una terminal desde la cual el jugador pueda:

- Comprender el estado de su compania.
- Observar el mercado.
- Comprar y vender.
- Gestionar el portfolio.
- Leer noticias.
- Avanzar la simulacion.
- Usar controles administrativos cuando corresponda.

## Estructura

```text
TradingDesktop
  TopBar
  TickerTape
  Sidebar
  Workspace
    DesktopWindow[]
      CompanyKeepApp
      MarketBoardApp
      OrderTicketApp
      PortfolioApp
      MyOrdersApp
      NewsFeedApp
      ProductDetailApp
      AdminMarketControlsApp
  StatusBar
```

Codigo principal:

```text
stock-bar-frontend/src/trading-desktop/
```

## Aplicaciones Registradas

| ID | Nombre visual | Roles |
|---|---|---|
| `company` | Company Keep | VIEWER, TRADER, ADMIN_BAR |
| `market` | Market Board | VIEWER, TRADER, ADMIN_BAR |
| `ticket` | Royal Ticket | TRADER, ADMIN_BAR |
| `portfolio` | Vault | VIEWER, TRADER, ADMIN_BAR |
| `orders` | Trade Ledger | TRADER, ADMIN_BAR |
| `herald` | Guild Herald | VIEWER, TRADER, ADMIN_BAR |
| `detail` | Asset Chronicle | VIEWER, TRADER, ADMIN_BAR |
| `admin` | Game Master | ADMIN_BAR |

Phase 6A agrega elementos del escritorio, no aplicaciones nuevas:

- Fila `ROYAL SEALED AUCTION` dentro de Market Board.
- Modal central de cuatro cartas, fuera de `react-rnd`.
- Pestaña `INVENTORY` dentro de Vault.
- Barra inferior `ACTIVE RELICS` con cuatro slots sobre Status Bar.

## Comportamiento De Ventanas

El desktop permite:

- Abrir aplicaciones desde Sidebar.
- Traer una ventana al frente.
- Arrastrar.
- Redimensionar.
- Minimizar y restaurar.
- Cerrar.
- Mantener ventanas dentro del viewport.

El estado se administra con `useDesktopWindows`.

## Estado Compartido

El producto seleccionado vive en el nivel del desktop. Puede cambiar desde:

- Market Board.
- Vault.
- Company Keep.

El cambio se refleja en:

- Royal Ticket.
- Asset Chronicle.

## Integracion Backend

| Recurso | Uso |
|---|---|
| `/api/products` | Market, ticker, ticket y detalle |
| `/api/company/me` | Company Keep |
| `/api/portfolio` | Company Keep y Vault |
| `/api/orders` | Royal Ticket y Trade Ledger |
| `/api/news` | Guild Herald y notificaciones |
| `/api/game/state` | Estado de jornada |
| `/api/game/end-day` | Avance del juego |
| `/api/price-history` | Asset Chronicle |
| `/api/market-events` | Game Master |
| `/api/admin/**` | Acciones administrativas |
| `/api/game/auctions/**` | Subasta sellada activa y seleccion |
| `/api/game/relics/**` | Inventario, equipamiento y activacion |

Productos se refrescan cada 5 segundos y noticias cada 10 segundos.

## Ordenes

Contrato actual:

```http
POST /api/orders

{
  "assetId": 11,
  "side": "BUY",
  "quantity": 10
}
```

BUY y SELL estan implementados. El frontend estima el total, pero el backend
decide el precio de ejecucion.

`/api/sales` queda reservado para vistas heredadas y compatibilidad.

## Rutas

| Ruta | Funcion |
|---|---|
| `/` | Desktop canonico |
| `/products` | Vista heredada |
| `/board` | Vista heredada |

Las rutas heredadas no deben recibir nuevas funcionalidades survival. La
direccion recomendada es migrarlas o retirarlas.

## Identidad Visual

Lineamientos actuales:

- Paleta negra, marron, oro y bronce.
- Iconos diferenciados por aplicacion y activo.
- Marcos de ventana inspirados en una terminal real/fantasy.
- Tipografia y etiquetas coherentes con el reino mercante.
- Estados positivos, negativos, advertencia y criticos con color semantico.

`visualCatalog.tsx` es la fuente central de iconos visuales.

## Senales Del Market Board

BUY, WATCH y HOLD son calculadas en frontend como ayuda visual. No son:

- Una orden automatica.
- Una prediccion del backend.
- Una garantia de rendimiento.
- Una recomendacion financiera.

## Manejo De Errores

El Royal Ticket muestra errores de API, por ejemplo:

- Fondos insuficientes.
- Cantidad invalida.
- Activo deshabilitado.
- Holding insuficiente para vender.
- Compania no activa.

Los intentos rechazados pueden aparecer temporalmente en el ledger, pero no son
persistidos por el backend actual.

## Deuda Tecnica

- Retirar enlaces a vistas legacy.
- Agregar suite de tests frontend.
- Corregir cualquier texto heredado o mojibake restante.
- Evaluar SSE para reducir polling.
- Persistir preferencias/layout de ventanas si se desea continuidad.
- Ampliar el reinicio terminal con estadisticas comparativas entre partidas.
- Ampliar la suite frontend de Phase 6A a pruebas E2E con navegador real.

## Criterio De Fuente De Verdad

Ante diferencias con versiones antiguas de este REQ, prevalecen:

1. `desktopApps.ts`.
2. `TradingDesktop.tsx`.
3. Los servicios API.
4. La matriz de seguridad backend.
