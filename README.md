# 🍺 Stock Bar

Sistema de simulación de precios dinámicos tipo "Bolsa de Valores" para productos de un bar, como cervezas.

## 🔧 Tecnologías
- Backend: Java + Spring Boot
- Frontend: React + TailwindCSS + Vite
- Base de datos: PostgreSQL
- Gráficos: Recharts
- APIs REST con actualización en tiempo real cada 30s

## 📈 Lógica del sistema
- El precio base sube si hay compras recientes (últimos 2 minutos).
- Si no hay actividad, el precio comienza a degradarse lentamente.
- Se registra el precio máximo alcanzado (`maxPrice`).
- Las variaciones se muestran en tiempo real en el dashboard.

## 🚀 Simulaciones
Puedes usar los botones:
- 💥 `Simular Crash`: degrada todos los precios artificialmente.
- 🚀 `Simular Boom`: aumenta todos los precios para probar picos.

## 📦 Instalación local

```bash
# Backend
cd stock-bar-backend
./mvnw spring-boot:run

# Frontend
cd ../stock-bar-frontend
npm install
npm run dev

```

## Docker Compose demo

Levantar toda la demo local desde la raiz del repo:

```bash
docker compose up -d --build
```

URLs:

- Frontend: `http://localhost:5173`
- Backend Swagger: `http://localhost:8080/swagger-ui/index.html`
- Keycloak Admin: `http://localhost:8081`

Usuarios de prueba:

- `admin / admin` -> `ADMIN_BAR`
- `trader / trader` -> `TRADER`
- `viewer / viewer` -> `VIEWER`

Detalle completo: `docs/REQ-008-docker-compose.md`
