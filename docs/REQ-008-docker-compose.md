# REQ-008 - Docker Compose Merchant Exchange Survival

## Estado

Implementado como entorno local integrado.

## Servicios

| Servicio | Imagen/build | Puerto |
|---|---|---:|
| `postgres` | `postgres:16-alpine` | 5432 |
| `keycloak` | `quay.io/keycloak/keycloak:26.0` | 8081 |
| `keycloak-config` | Keycloak CLI temporal | - |
| `backend` | `stock-bar-backend/Dockerfile` | 8080 |
| `frontend` | `stock-bar-frontend/Dockerfile` | 5173 |

## Inicio

```bash
docker compose up -d --build
```

Logs:

```bash
docker compose logs -f
```

Detener conservando datos:

```bash
docker compose down
```

Eliminar datos y reconstruir:

```bash
docker compose down -v
docker compose up -d --build
```

## Dependencias De Arranque

```text
postgres healthy ----\
                      -> backend healthy -> frontend
keycloak healthy ----/
        |
        -> keycloak-config aplica theme
```

El backend expone `/v3/api-docs` como healthcheck. El frontend espera a que el
backend este healthy.

## PostgreSQL

Configuracion local:

```text
database: stockbar
username: stockbar
password: stockbar
host interno: postgres
puerto: 5432
```

Volumen:

```text
merchant-exchange-postgres-data
```

## Keycloak

Configuracion:

```text
admin: admin
password: admin
realm: stockbar
host: http://localhost:8081
```

Montajes:

- Realm importado desde `docker/keycloak/stockbar-realm.json`.
- Themes desde `docker/keycloak/themes`.
- Datos persistentes en `merchant-exchange-keycloak-data`.

El import del realm se realiza al crear el estado inicial. Los cambios posteriores
al JSON no se aplican automaticamente sobre un realm ya persistido.

`keycloak-config` inicia despues de Keycloak y aplica:

```text
loginTheme=merchant-exchange
```

## Backend

Build multi-stage:

1. Maven 3.9.9 + Temurin 17 compila con tests omitidos.
2. Temurin 17 JRE Alpine ejecuta el JAR.

Variables principales:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/stockbar
SPRING_DATASOURCE_USERNAME=stockbar
SPRING_DATASOURCE_PASSWORD=stockbar
SPRING_SQL_INIT_MODE=always
SPRING_JPA_DEFER_DATASOURCE_INITIALIZATION=true
KEYCLOAK_ISSUER_URI=http://localhost:8081/realms/stockbar
KEYCLOAK_JWK_SET_URI=http://keycloak:8080/realms/stockbar/protocol/openid-connect/certs
KEYCLOAK_RESOURCE_CLIENT_ID=stockbar-api
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Frontend

El contenedor usa Node 20 Alpine y ejecuta Vite en modo desarrollo:

```text
npm run dev -- --host 0.0.0.0
```

Variables:

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://backend:8080
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=stockbar
VITE_KEYCLOAK_CLIENT_ID=stockbar-frontend
```

El navegador usa Keycloak por el puerto host, mientras Vite envia `/api` al
backend mediante la red interna de Compose.

## URLs

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| Swagger | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI | `http://localhost:8080/v3/api-docs` |
| Keycloak | `http://localhost:8081` |
| Keycloak Admin | `http://localhost:8081/admin` |

## Persistencia Y Reinicios

### Volumen PostgreSQL

Conserva:

- Companias.
- Holdings.
- Ordenes.
- Noticias.
- Eventos.
- Historial.
- Productos.

### Advertencia Sobre `data.sql`

El backend ejecuta `data.sql` en cada arranque Docker porque:

```env
SPRING_SQL_INIT_MODE=always
```

El upsert actual no solo crea activos faltantes; tambien actualiza campos como:

- `current_price`
- `max_price`
- `last_purchased_at`
- datos de catalogo

Por eso reiniciar solo el backend puede devolver los precios demo a su estado de
seed mientras el resto de la partida sigue persistido.

Para una demo esto entrega un mercado conocido. Para continuidad real es una
inconsistencia y debe migrarse a:

1. Migraciones versionadas.
2. Seed solo para registros inexistentes.
3. Estado de mercado nunca sobrescrito por bootstrap.

### Volumen Keycloak

Conserva realm, usuarios y configuracion. Para forzar un import totalmente
limpio:

```bash
docker compose down -v
docker compose up -d --build
```

Esto tambien elimina la base de datos del juego.

## Salud Y Diagnostico

Comandos utiles:

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs keycloak
docker compose logs postgres
```

Puertos esperados:

```text
5173 frontend
8080 backend
8081 keycloak
5432 postgres
```

## Limites Del Entorno

- Frontend corre con servidor Vite, no con build estatico de produccion.
- Keycloak usa `start-dev`.
- Passwords estan en texto claro.
- No hay reverse proxy ni TLS.
- No hay observabilidad centralizada.
- No hay estrategia de backup.
- No hay perfiles separados por ambiente.

El Compose actual es para desarrollo y demostracion local.
