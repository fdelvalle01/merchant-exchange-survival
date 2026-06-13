# Merchant Exchange Survival

**Merchant Exchange Survival** es un juego full-stack de estrategia economica y
supervivencia. El jugador dirige una compania mercante dentro de un mercado
fantastico: compra activos, administra liquidez, interpreta noticias y rumores,
y trata de sobrevivir hasta alcanzar el objetivo de valor de compania.

El proyecto nacio a partir de Trading Bar Exchange, pero su dominio actual ya no
es una demo generica de bolsa. La bolsa es ahora el tablero principal de una
simulacion con dias, gastos operativos, riesgo, quiebra, victoria y eventos de
mundo.

## Estado Actual

Implementado:

- Desktop de trading con ventanas movibles, minimizables y redimensionables.
- Compania persistente por usuario autenticado.
- Compra y venta real de activos.
- Portfolio con costo promedio y P/L no realizado.
- Ledger con P/L realizado.
- Motor de precios por presion neta y reversion al valor base.
- Noticias y rumores que alteran activos o sectores.
- Reloj de juego por dias, gasto operativo, riesgo, quiebra y victoria.
- Controles de Game Master para administradores.
- Autenticacion y roles con Keycloak.
- Entorno local completo con Docker Compose.

Limites importantes:

- No existe un libro de ordenes ni matching entre jugadores.
- Las ordenes se ejecutan inmediatamente al precio actual del backend.
- Deuda y reputacion forman parte del modelo de supervivencia, pero todavia no
  tienen un circuito jugable completo para modificarlas.
- La liquidacion forzada esta preparada como configuracion, pero no implementada.
- El frontend conserva `/products` y `/board` como vistas heredadas.
- La inicializacion SQL de Docker puede restaurar los precios demo al reiniciar
  el backend. Ver [despliegue local](docs/REQ-008-docker-compose.md).

## Documentacion

- [Gameplay y reglas](docs/GAMEPLAY.md)
- [Arquitectura y analisis tecnico](docs/ARQUITECTURA-MERCHANT-EXCHANGE-SURVIVAL.md)
- [Trading Desktop](docs/REQ-001-trading-desktop.md)
- [Keycloak, roles y seguridad](docs/REQ-007-keycloak.md)
- [Docker Compose y operacion local](docs/REQ-008-docker-compose.md)
- [Memoria tecnica para futuras sesiones](docs/CODEX_PROJECT_MEMORY.md)
- [Nota historica de Trading Bar Exchange](docs/RESUMEN-TECNICO-TRADING-BAR-EXCHANGE.md)

## Bucle De Juego

1. El usuario entra con Keycloak.
2. El backend recupera o crea su compania.
3. El jugador observa mercado, portfolio y noticias.
4. Compra o vende activos con su efectivo disponible.
5. Las ordenes recientes generan presion sobre los precios.
6. Las noticias pueden mover activos o sectores inmediatamente.
7. El jugador termina el dia cuando decide avanzar.
8. Se descuentan gastos, se aplica interes de deuda si corresponde y puede
   ocurrir un evento aleatorio.
9. Se recalculan valor, runway, riesgo y condiciones terminales.
10. La partida continua hasta la quiebra o la victoria.

Las noticias no prometen un porcentaje fijo. Cada tipo de evento utiliza un
rango y el backend registra el impacto concreto ocurrido. El Guild Herald
muestra ese impacto y destaca si afecta activos que el jugador posee.

## Aplicaciones Del Desktop

| Aplicacion | Funcion |
|---|---|
| Company Keep | Estado financiero, runway, riesgo, dia y avance de jornada |
| Market Board | Activos, precios, variacion y acceso a compra/venta |
| Royal Ticket | Ordenes BUY y SELL |
| Vault | Holdings, costo promedio, valor y asignacion |
| Trade Ledger | Historial de ordenes y P/L realizado |
| Guild Herald | Noticias, rumores y alertas sobre el portfolio |
| Asset Chronicle | Detalle e historial de un activo |
| Game Master | Precios, eventos y controles administrativos |

## Roles

| Capacidad | VIEWER | TRADER | ADMIN_BAR |
|---|---:|---:|---:|
| Ver mercado, noticias y detalle | Si | Si | Si |
| Ver compania y portfolio propios | Si | Si | Si |
| Comprar y vender | No | Si | Si |
| Avanzar el dia | No | Si | Si |
| Consultar ordenes | No | Si | Si |
| Ejecutar controles administrativos | No | No | Si |

Usuarios demo:

| Usuario | Password | Rol |
|---|---|---|
| `viewer` | `viewer` | `VIEWER` |
| `trader` | `trader` | `TRADER` |
| `admin` | `admin` | `ADMIN_BAR` |

Estas credenciales son solo para desarrollo local.

## Arquitectura Resumida

```text
Browser
  React + TypeScript + Vite
       |
       | OAuth2 Authorization Code + PKCE
       v
Keycloak 26
       |
       | Bearer JWT
       v
Spring Boot 3 / Java 17
  Controllers -> Services -> JPA Repositories
       |
       v
PostgreSQL 16
```

El frontend consulta datos mediante polling:

- Productos: cada 5 segundos.
- Noticias: cada 10 segundos.

No hay WebSocket ni Server-Sent Events en el estado actual.

## Tecnologias

Frontend:

- React 18
- TypeScript
- Vite 5
- Axios
- Keycloak JS
- React RND
- React Icons
- Recharts y Lightweight Charts disponibles

Backend:

- Java 17
- Spring Boot 3.2.5
- Spring Web
- Spring Data JPA
- Spring Security OAuth2 Resource Server
- Springdoc OpenAPI
- PostgreSQL

Infraestructura:

- Docker Compose
- PostgreSQL 16
- Keycloak 26

## Inicio Rapido

Requisitos:

- Docker Desktop o Docker Engine con Compose.
- Puertos `5173`, `8080`, `8081` y `5432` disponibles.

Desde la raiz:

```bash
docker compose up -d --build
```

URLs:

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| Swagger | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI | `http://localhost:8080/v3/api-docs` |
| Keycloak | `http://localhost:8081` |
| Keycloak Admin | `http://localhost:8081/admin` |

Detener sin borrar datos:

```bash
docker compose down
```

Recrear todo, incluidos los volumenes:

```bash
docker compose down -v
docker compose up -d --build
```

## Desarrollo Local

Backend:

```bash
cd stock-bar-backend
mvn spring-boot:run
```

Si se usa el Keycloak del Compose, el backend local debe recibir:

```env
KEYCLOAK_ISSUER_URI=http://localhost:8081/realms/stockbar
KEYCLOAK_JWK_SET_URI=http://localhost:8081/realms/stockbar/protocol/openid-connect/certs
```

El fallback heredado de `application.yml` todavia apunta al puerto `8180`.

Frontend:

```bash
cd stock-bar-frontend
npm install
npm run dev
```

Variables frontend principales:

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=stockbar
VITE_KEYCLOAK_CLIENT_ID=stockbar-frontend
```

## Endpoints Principales

| Metodo | Endpoint | Proposito |
|---|---|---|
| GET | `/api/me` | Usuario y roles |
| GET | `/api/products` | Mercado actual |
| GET | `/api/company/me` | Compania del usuario |
| GET | `/api/portfolio` | Holdings y P/L no realizado |
| GET/POST | `/api/orders` | Historial y ejecucion BUY/SELL |
| GET | `/api/news` | Noticias de mundo |
| GET | `/api/game/state` | Estado de la partida |
| POST | `/api/game/end-day` | Avanzar una jornada |
| GET | `/api/price-history` | Historial de precios |
| GET | `/api/market-events` | Auditoria tecnica del mercado |
| POST/DELETE | `/api/admin/**` | Acciones de Game Master |

`/api/sales` sigue disponible como adaptador de compatibilidad para compras
antiguas. El contrato principal nuevo es `/api/orders`.

## Activos Demo

| Activo | Sector | Precio base |
|---|---|---:|
| Ironhill Mines | MINING | 5,100 |
| Black Harbor Shipping | SHIPPING | 5,500 |
| Old Dragon Brewery | FOOD | 4,800 |
| Silvercrown Bank | BANKING | 7,200 |
| Northwind Logistics | LOGISTICS | 3,900 |
| Arcane Research Guild | ARCANE | 8,600 |
| Royal Grain Company | GRAIN | 4,300 |

## Convenciones Heredadas

Se conservan nombres internos como:

- Paquete Java `com.francisco.stockbar`.
- Base de datos `stockbar`.
- Realm Keycloak `stockbar`.
- Clientes `stockbar-frontend` y `stockbar-api`.
- Carpetas `stock-bar-backend` y `stock-bar-frontend`.

Son identificadores de compatibilidad. El nombre visible y el dominio funcional
del producto son **Merchant Exchange Survival**.
