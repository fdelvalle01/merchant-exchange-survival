# REQ-008 - Docker Compose Stock Bar Exchange

## Estado

Implementado docker compose local para levantar:

- PostgreSQL
- Keycloak
- Backend Spring Boot
- Frontend React/Vite

## Comando Principal

Desde la raiz del repo:

```bash
docker compose up -d --build
```

Para ver logs:

```bash
docker compose logs -f
```

Para detener:

```bash
docker compose down
```

Para reiniciar desde cero, eliminando datos:

```bash
docker compose down -v
docker compose up -d --build
```

## URLs

- Frontend: `http://localhost:5173`
- Backend Swagger: `http://localhost:8080/swagger-ui/index.html`
- Keycloak Admin: `http://localhost:8081`

## Servicios

### PostgreSQL

- Host interno: `postgres`
- Puerto local: `5432`
- Database: `stockbar`
- Username: `stockbar`
- Password: `stockbar`

### Keycloak

- Imagen: `quay.io/keycloak/keycloak:26.0`
- Puerto local: `8081`
- Admin: `admin / admin`
- Realm importado: `stockbar`
- Archivo import: `docker/keycloak/stockbar-realm.json`

### Backend

- Puerto local: `8080`
- DB URL interna: `jdbc:postgresql://postgres:5432/stockbar`
- Issuer esperado en tokens: `http://localhost:8081/realms/stockbar`
- JWK interno para validar firma: `http://keycloak:8080/realms/stockbar/protocol/openid-connect/certs`

Esta separacion es intencional:

- El navegador usa Keycloak por `localhost:8081`.
- El backend, dentro de Docker, consulta las llaves por el nombre de servicio `keycloak`.

### Frontend

- Puerto local: `5173`
- Keycloak URL: `http://localhost:8081`
- Realm: `stockbar`
- Client: `stockbar-frontend`
- Proxy Vite `/api` hacia `http://backend:8080`

## Usuarios De Prueba

- `admin / admin` -> `ADMIN_BAR`
- `trader / trader` -> `TRADER`
- `viewer / viewer` -> `VIEWER`

## Validacion Manual

1. Abrir `http://localhost:5173`.
2. Iniciar sesion con `viewer / viewer`.
3. Confirmar que no se ve Ticket, Orders ni Admin.
4. Cerrar sesion.
5. Iniciar sesion con `trader / trader`.
6. Confirmar que Ticket permite enviar orden.
7. Cerrar sesion.
8. Iniciar sesion con `admin / admin`.
9. Confirmar que Admin Market Controls permite crash, boom, reset y cambios por producto.

## Notas

El backend inicializa productos demo cuando corre en Docker Compose usando:

```env
SPRING_SQL_INIT_MODE=always
SPRING_JPA_DEFER_DATASOURCE_INITIALIZATION=true
```

Si el realm ya existe en el volumen de Keycloak, los cambios al JSON de import no se reaplican automaticamente. Para forzar import limpio:

```bash
docker compose down -v
docker compose up -d --build
```
