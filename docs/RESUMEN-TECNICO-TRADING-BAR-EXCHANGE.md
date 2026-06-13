# Nota Historica - Trading Bar Exchange

Este repositorio se origino como **Trading Bar Exchange / Stock Bar Exchange**.
Ese sistema aporto el catalogo, el primer flujo de compra, el panel de mercado,
la autenticacion, Docker y la base visual del trading desktop.

El producto actual es **Merchant Exchange Survival** y su dominio principal
incluye companias, portfolio, BUY/SELL, P/L, dias, riesgo, eventos de mundo,
quiebra y victoria.

La documentacion vigente se encuentra en:

- [README](../README.md)
- [Arquitectura de Merchant Exchange Survival](ARQUITECTURA-MERCHANT-EXCHANGE-SURVIVAL.md)
- [Gameplay](GAMEPLAY.md)
- [Trading Desktop](REQ-001-trading-desktop.md)
- [Keycloak y seguridad](REQ-007-keycloak.md)
- [Docker Compose](REQ-008-docker-compose.md)

Elementos heredados que siguen presentes por compatibilidad:

- Nombre de base de datos y realm `stockbar`.
- Paquete Java `com.francisco.stockbar`.
- Carpetas `stock-bar-backend` y `stock-bar-frontend`.
- Endpoint `/api/sales`.
- Rutas frontend `/products` y `/board`.

Esta nota no es una especificacion funcional. Ante cualquier diferencia,
prevalecen el codigo actual y la documentacion de Merchant Exchange Survival.
