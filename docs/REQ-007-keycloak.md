# REQ-007 - Keycloak y roles

## Estado

Implementado para desarrollo local.

Stock Bar Exchange ahora usa Keycloak como proveedor de identidad:

- Frontend: login/logout, usuario actual, roles y token Bearer.
- Backend: Spring Security OAuth2 Resource Server validando JWT.
- Roles soportados: `ADMIN_BAR`, `TRADER`, `VIEWER`.

## Configuracion Local

Levantar Keycloak:

```bash
docker run --name stockbar-keycloak --rm -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.0 start-dev
```

Consola admin:

```text
http://localhost:8180
admin / admin
```

## Realm

Crear realm:

```text
stockbar
```

Crear roles de realm:

- `ADMIN_BAR`
- `TRADER`
- `VIEWER`

## Clientes

### Frontend

Crear client:

```text
clientId: stockbar-frontend
type: public
standard flow: enabled
direct access grants: optional
valid redirect URIs: http://localhost:5173/*, http://127.0.0.1:5173/*
valid post logout redirect URIs: http://localhost:5173/*, http://127.0.0.1:5173/*
web origins: http://localhost:5173, http://127.0.0.1:5173
```

### Backend / Resource

Crear client o resource lógico:

```text
clientId: stockbar-api
```

El backend soporta roles desde:

- `realm_access.roles`
- `resource_access.stockbar-api.roles`
- roles presentes en cualquier client dentro de `resource_access`

Para desarrollo simple, asignar los roles como roles de realm es suficiente.

## Usuarios De Prueba

Crear usuarios con password no temporal:

- `admin / admin` -> `ADMIN_BAR`
- `trader / trader` -> `TRADER`
- `viewer / viewer` -> `VIEWER`

## Backend

Variables opcionales:

```env
KEYCLOAK_ISSUER_URI=http://localhost:8180/realms/stockbar
KEYCLOAK_RESOURCE_CLIENT_ID=stockbar-api
```

Endpoints protegidos:

- `GET /api/products/**` -> `VIEWER`, `TRADER`, `ADMIN_BAR`
- `GET /api/price-history/**` -> `VIEWER`, `TRADER`, `ADMIN_BAR`
- `GET /api/market-events/**` -> `VIEWER`, `TRADER`, `ADMIN_BAR`
- `POST /api/sales` -> `TRADER`, `ADMIN_BAR`
- `POST /api/admin/**` -> `ADMIN_BAR`
- `DELETE /api/admin/**` -> `ADMIN_BAR`

Endpoint de sesion:

```http
GET /api/me
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "username": "trader",
  "roles": ["TRADER"]
}
```

## Frontend

Variables en `.env`:

```env
VITE_API_BASE_URL=
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=stockbar
VITE_KEYCLOAK_CLIENT_ID=stockbar-frontend
```

Reglas UI:

- `VIEWER`: Market, Detail y Ticker. No ve Ticket, Orders ni Admin.
- `TRADER`: Market, Detail, Ticket y Orders. No ve Admin.
- `ADMIN_BAR`: ve todo y puede ejecutar controles admin.

Todas las llamadas hechas por Axios incluyen:

```http
Authorization: Bearer <token>
```
