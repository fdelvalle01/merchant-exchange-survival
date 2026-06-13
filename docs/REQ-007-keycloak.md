# REQ-007 - Keycloak, Roles Y Seguridad

## Estado

Implementado para desarrollo local con Keycloak 26 y Spring Security OAuth2
Resource Server.

## Identificadores

| Elemento | Valor |
|---|---|
| Realm | `stockbar` |
| Frontend client | `stockbar-frontend` |
| API resource client | `stockbar-api` |
| Theme | `merchant-exchange` |
| Keycloak local | `http://localhost:8081` |

Los identificadores `stockbar` se mantienen por compatibilidad. El branding
visible es Merchant Exchange Survival.

## Flujo Frontend

El cliente frontend es publico y usa:

- Standard Flow.
- Authorization Code.
- PKCE S256.
- Redirects de `localhost:5173` y `127.0.0.1:5173`.
- Renovacion automatica de token.

Keycloak tambien tiene Direct Access Grants habilitado en el realm local para
facilitar desarrollo, aunque el navegador usa el flujo con PKCE.

## Validacion Backend

El backend valida:

- Issuer.
- Firma mediante JWK.
- Token Bearer.

Roles aceptados desde:

- `realm_access.roles`.
- `resource_access.stockbar-api.roles`.
- roles encontrados en otros clientes de `resource_access`.

Los roles se convierten a authorities Spring con prefijo `ROLE_`.

## Roles

| Rol | Proposito |
|---|---|
| `VIEWER` | Observacion del mercado y estado propio |
| `TRADER` | Juego completo y trading |
| `ADMIN_BAR` | Trading mas Game Master |

## Usuarios Demo

| Usuario | Password | Rol |
|---|---|---|
| `viewer` | `viewer` | `VIEWER` |
| `trader` | `trader` | `TRADER` |
| `admin` | `admin` | `ADMIN_BAR` |

Son credenciales locales, no aptas para un entorno publicado.

## Matriz Backend

| Endpoint | VIEWER | TRADER | ADMIN_BAR |
|---|---:|---:|---:|
| `GET /api/me` | Si | Si | Si |
| `GET /api/products/**` | Si | Si | Si |
| `GET /api/price-history/**` | Si | Si | Si |
| `GET /api/market-events/**` | Si | Si | Si |
| `GET /api/news/**` | Si | Si | Si |
| `GET /api/company/me` | Si | Si | Si |
| `GET /api/portfolio` | Si | Si | Si |
| `GET /api/game/state` | No | Si | Si |
| `POST /api/game/end-day` | No | Si | Si |
| `GET/POST /api/orders/**` | No | Si | Si |
| `GET/POST /api/sales/**` | No | Si | Si |
| `POST /api/products/**` | No | No | Si |
| `/api/admin/**` | No | No | Si |

Swagger y OpenAPI son publicos en la configuracion local.

## Matriz Frontend

| Aplicacion | VIEWER | TRADER | ADMIN_BAR |
|---|---:|---:|---:|
| Company Keep | Si | Si | Si |
| Market Board | Si | Si | Si |
| Royal Ticket | No | Si | Si |
| Vault | Si | Si | Si |
| Trade Ledger | No | Si | Si |
| Guild Herald | Si | Si | Si |
| Asset Chronicle | Si | Si | Si |
| Game Master | No | No | Si |

Ocultar una aplicacion en frontend no reemplaza la seguridad del backend.

## Endpoint De Sesion

```http
GET /api/me
Authorization: Bearer <token>
```

Respuesta conceptual:

```json
{
  "username": "trader",
  "roles": ["TRADER"]
}
```

## Variables

Frontend:

```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=stockbar
VITE_KEYCLOAK_CLIENT_ID=stockbar-frontend
```

Backend:

```env
KEYCLOAK_ISSUER_URI=http://localhost:8081/realms/stockbar
KEYCLOAK_JWK_SET_URI=http://keycloak:8080/realms/stockbar/protocol/openid-connect/certs
KEYCLOAK_RESOURCE_CLIENT_ID=stockbar-api
```

La diferencia entre issuer publico y JWK interno es intencional:

- El navegador recibe tokens con issuer `localhost:8081`.
- El backend en Docker consulta claves por el servicio `keycloak`.

El fallback heredado de `application.yml` usa `localhost:8180`. Si el backend se
ejecuta fuera de Docker contra el Keycloak del Compose, se deben definir
explicitamente `KEYCLOAK_ISSUER_URI` y `KEYCLOAK_JWK_SET_URI` con puerto `8081`.

## Theme De Login

Archivos:

```text
docker/keycloak/themes/merchant-exchange/login/login.ftl
docker/keycloak/themes/merchant-exchange/login/resources/css/login.css
```

`keycloak-config` aplica `loginTheme=merchant-exchange` incluso cuando el realm
ya existe en el volumen.

## Consideraciones Para Produccion

- Reemplazar credenciales demo.
- Usar HTTPS.
- Restringir redirect URIs y web origins.
- No publicar la consola admin.
- Guardar secretos fuera del compose.
- Revisar si Swagger debe seguir publico.
- Deshabilitar Direct Access Grants si no son necesarios.
- Definir expiracion, refresh y politicas de sesion.
