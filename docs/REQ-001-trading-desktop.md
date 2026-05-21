# REQ-001 - Stock Bar Exchange Trading Desktop

## Estado

Implementado como primera version funcional del nuevo frontend principal de Stock Bar Exchange.

La pantalla principal del frontend ahora abre un desktop de trading en `/`, con estetica oscura medieval/nordica sobria y conexion real al backend para productos y compras.

## Objetivo Original

Crear un layout principal oscuro llamado **Stock Bar Trading Desktop**, con estructura de plataforma bursatil:

- TopBar superior con logo/nombre.
- Ticker horizontal de precios en vivo.
- Sidebar izquierdo con menu de aplicaciones.
- Workspace central.
- StatusBar inferior.
- Componentes separados para cada zona del layout.
- Mantener las vistas existentes sin eliminarlas.
- Usar React + TypeScript para la nueva estructura.

## Alcance Final Implementado

Durante la implementacion el requerimiento evoluciono hacia una version mas enfocada:

- Nombre visual: **Stock Bar Exchange**.
- Estetica: trading desktop moderno con inspiracion medieval/nordica/fantasy market.
- Modulos visibles iniciales: solo **MarketBoard** y **OrderTicket**.
- Backend conectado con productos reales.
- Compra real conectada al endpoint existente.
- Ticker animado conectado a productos reales.
- Fallback mock removido del desktop principal para evitar confusiones.

## Componentes Creados

Los componentes nuevos viven en:

`stock-bar-frontend/src/trading-desktop/`

Componentes principales:

- `TradingDesktop.tsx`
- `TopBar.tsx`
- `TickerTape.tsx`
- `Sidebar.tsx`
- `Workspace.tsx`
- `MarketBoardPanel.tsx`
- `OrderTicketPanel.tsx`
- `StatusBar.tsx`

Soporte:

- `types.ts`
- `marketUtils.ts`
- `mockData.ts` queda disponible como referencia, pero ya no es usado por el desktop principal.

## Rutas

La ruta principal fue reorganizada asi:

- `/` abre el nuevo Trading Desktop.
- `/products` mantiene la vista anterior de productos/compra.
- `/board` mantiene el market board clasico.

Esto cumple la condicion de no eliminar las vistas actuales.

## Integracion Backend

Se conecto el desktop contra los endpoints reales documentados en `api-docs.json`.

### Productos

Endpoint usado:

```http
GET /api/products
```

Uso actual:

- Alimenta el `MarketBoardPanel`.
- Alimenta el selector de producto del `OrderTicketPanel`.
- Alimenta el `TickerTape`.
- Refresca cada 5 segundos desde `TradingDesktop`.

Campos usados:

- `id`
- `name`
- `basePrice`
- `currentPrice`
- `imageUrl`
- `enabled`
- `createdAt`
- `lastPurchasedAt`
- `maxPrice`

### Compras

Endpoint usado:

```http
POST /api/sales
```

Payload enviado:

```json
{
  "productId": 12,
  "quantity": 1
}
```

Decision importante:

El frontend no envia precio. El precio se muestra solo como informacion, porque el backend define `currentPrice` y el motor de precios lo sube o baja.

## Proxy de Desarrollo

Se agrego proxy de Vite:

```js
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true
    }
  }
}
```

Motivo:

Evitar problemas de CORS y origen entre `localhost` y `127.0.0.1`.

El frontend usa rutas relativas:

- `/api/products`
- `/api/sales`
- `/api/products/detailed`
- `/api/products/board`

## Comportamiento Implementado

### MarketBoard

Muestra productos reales del backend:

- Instrument / Product Name.
- Last Price.
- Change.
- Change %.
- Peak.
- Signal.

Permite seleccionar un producto haciendo click en una fila.

### OrderTicket

Muestra:

- Producto seleccionado.
- Accion BUY activa.
- SELL visible pero deshabilitado conceptualmente, porque el backend actual solo permite comprar.
- Quantity.
- Precio actual del backend como solo lectura.
- Base price.
- Imagen del producto si existe.
- Boton `Comprar`.

Al comprar:

- Ejecuta `POST /api/sales`.
- Envia solo `productId` y `quantity`.
- Refresca productos luego de una compra.

### TickerTape

Se dejo como barra animada tipo bolsa:

- Muestra todos los productos reales.
- Muestra imagen, nombre, precio y variacion porcentual.
- Se mueve horizontalmente.
- Repite los productos para mantener loop continuo.
- Se pausa al pasar el mouse.

## Cambios Extra Sobre REQ-001 Original

Ademas del layout base pedido, se agrego:

- Estetica medieval/nordica/fantasy market sobria.
- Conexion real con `/api/products`.
- Conexion real de compra con `/api/sales`.
- Proxy Vite para backend.
- TypeScript incremental para nuevos componentes.
- Seleccion compartida entre MarketBoard y OrderTicket.
- Remocion del fallback mock en el desktop principal.
- Ticker animado con productos reales.
- Rutas legacy preservadas.

## Decisiones de Diseno

- Se priorizo una interfaz usable antes que una UI fantasy recargada.
- Se dejaron solo dos apps visibles: MarketBoard y OrderTicket.
- No se agregaron Portfolio, Product Detail, Admin Panel ni charts complejos todavia.
- Se mantuvo Tailwind como sistema de estilos.
- Se uso TypeScript solo en la nueva arquitectura para migracion gradual.

## Validaciones Realizadas

Comandos ejecutados:

```bash
npx tsc --noEmit
npm run build
```

Resultado:

- TypeScript OK.
- Build Vite OK.
- `/api/products` responde con productos reales.

Warnings existentes no abordados en este REQ:

- Browserslist desactualizado.
- Bundle grande.
- Vulnerabilidades reportadas por `npm audit`.

## Estado Actual de Arquitectura Frontend

El nuevo desktop ya tiene una base clara:

```text
TradingDesktop
  TopBar
  TickerTape
  Sidebar
  Workspace
    MarketBoardPanel
    OrderTicketPanel
  StatusBar
```

La seleccion de producto vive en `TradingDesktop` y se pasa hacia `Workspace`, `MarketBoardPanel` y `OrderTicketPanel`.

## Puente a REQ-002

REQ-002 busca convertir vistas actuales en aplicaciones internas del desktop.

La base actual permite hacerlo, pero hoy el sidebar solo expone:

- Market
- Ticket

Para REQ-002 se recomienda:

1. Crear una carpeta `src/trading-desktop/apps/`.
2. Mover o adaptar cada modulo a un componente app:
   - `MarketBoardApp`
   - `ProductCatalogApp`
   - `ProductDetailApp`
   - `OrderTicketApp`
   - `PortfolioApp`
   - `AdminMarketControlsApp`
3. Cambiar `DesktopAppId` para soportar esas apps.
4. Hacer que `Sidebar` renderice el menu completo.
5. Hacer que `Workspace` muestre una app activa a la vez.
6. Reutilizar los componentes ya creados como base para `MarketBoardApp` y `OrderTicketApp`.

## Pendientes Tecnicos

- Definir si `ProductCatalogApp` reutilizara la vista antigua `App.jsx` o se reescribira dentro del estilo desktop.
- Definir backend para acciones SELL, Portfolio y Admin Controls.
- Crear un servicio frontend centralizado para API (`productsApi`, `salesApi`) en vez de usar `axios` directo en componentes.
- Agregar estados de loading/error mas finos.
- Decidir si `mockData.ts` se elimina o queda para desarrollo offline.
