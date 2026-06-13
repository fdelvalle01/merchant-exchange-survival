# Gameplay De Merchant Exchange Survival

## 1. Fantasia Del Jugador

El jugador dirige una compania mercante dentro de un reino inestable. No busca
solamente acertar si un precio sube o baja: debe mantener liquidez, absorber
costos diarios, leer noticias, administrar posiciones y evitar que una mala
racha destruya la compania.

El mercado es compartido. La compania, sus holdings y su progreso pertenecen al
usuario autenticado.

## 2. Objetivo

Condicion de victoria:

```text
companyValue >= victoryTarget
```

Valor inicial del objetivo:

```text
1,000,000
```

Condiciones de quiebra:

- Valor de compania menor o igual a cero.
- Tres dias criticos consecutivos.
- Reputacion menor o igual a cero.

La reputacion ya participa en la regla, aunque todavia no existe un sistema
jugable completo que la modifique.

## 3. Recursos

### Cash

Liquidez usada para:

- Comprar activos.
- Pagar el gasto diario.
- Pagar interes de deuda cuando exista.

Cash inicial: `100,000`.

### Holdings

Activos que posee la compania. Cada holding conserva:

- Cantidad.
- Precio promedio de compra.
- Precio actual.
- Valor de mercado.
- P/L no realizado.

### Debt

Reduce el valor de compania y genera interes diario. El modelo existe, pero la
version actual no ofrece un flujo normal para pedir o amortizar prestamos.

### Reputation

Comienza en `50`. Puede provocar quiebra si cae a cero, pero sus causas de
cambio aun no estan implementadas como mecanica regular.

### Company Value

```text
cash + valor de mercado del portfolio - debt
```

### Daily Burn

Costo operativo descontado al finalizar cada jornada.

Valor inicial: `500`.

### Cash Runway

Numero estimado de dias que la compania puede sostener el gasto diario con la
caja actual.

## 4. Jornada

El juego no avanza automaticamente por calendario para cada compania. El jugador
con rol de trading decide cuando terminar el dia.

Al usar `End Day`:

1. El dia aumenta en uno.
2. Se descuenta el gasto diario.
3. Se aplica interes si hay deuda.
4. Puede ocurrir una noticia aleatoria.
5. Se recalculan valor, runway y riesgo.
6. Se actualizan dias criticos.
7. Se evalua quiebra o victoria.

Probabilidad actual de evento aleatorio por jornada: `35%`.

Un evento de mundo es global: puede cambiar el precio que observan todos los
usuarios, aunque haya sido provocado al cerrar el dia de una compania.

## 5. Trading

### Compra

Una compra:

- Usa el precio actual del backend.
- Requiere cash suficiente.
- Aumenta o crea un holding.
- Recalcula el precio promedio ponderado.
- Se registra en el ledger.

### Venta

Una venta:

- Requiere cantidad suficiente.
- Aumenta cash.
- Reduce o elimina el holding.
- Genera P/L realizado.

```text
P/L realizado = (precio de venta - costo promedio) * cantidad
```

### Ejecucion

Las ordenes son de mercado e inmediatas. No existen:

- Limites.
- Ordenes abiertas.
- Matching.
- Ejecuciones parciales.
- Venta en corto.

## 6. Movimiento Del Mercado

Los precios se mueven por dos familias de fuerzas.

### Presion De Ordenes

El motor observa compras y ventas recientes:

- Mas BUY tiende a subir el activo.
- Mas SELL tiende a bajarlo.
- Presion pequena puede no producir cambio.
- El impacto por tick esta limitado.
- El precio tiende lentamente a volver a su base.

El jugador no mueve el precio dentro de la misma transaccion. La presion se
procesa luego por el motor periodico.

### Eventos De Mundo

Los eventos cambian el precio inmediatamente y publican una noticia.

| Evento | Lectura jugable |
|---|---|
| Royal Contract | Un activo recibe demanda de la corona |
| Mining Accident | Mineria pierde capacidad |
| Port Blockade | Shipping sufre restricciones |
| Banking Crisis | La banca entra en crisis |
| Harvest Boom | Grain y Food reciben abundancia |
| Plague Outbreak | Todo el mercado recibe un shock negativo |
| War Rumors | Unos sectores suben y otros pierden |
| Magic Discovery | Arcane recibe un impulso |

Los porcentajes se generan dentro de rangos. El aviso de la UI presenta el
impacto que ocurrio, no una promesa fija previa.

## 7. Noticias Y Rumores

Guild Herald permite interpretar:

- Direccion positiva, negativa o mixta.
- Severidad.
- Activo o sector afectado.
- Porcentaje concreto.
- Relacion con los holdings del jugador.

Filtros:

- All.
- My Portfolio.
- Positive.
- Negative.
- Critical.

La utilidad estrategica consiste en comparar:

- Exposicion actual.
- Costo promedio.
- Cash disponible.
- Runway.
- Riesgo de una nueva jornada.

## 8. Riesgo

El riesgo no es una eleccion manual; se deriva del estado financiero.

| Nivel | Interpretacion |
|---|---|
| LOW | Liquidez y exposicion sanas |
| MEDIUM | Primeras senales de fragilidad |
| HIGH | Poco runway, deuda o perdidas relevantes |
| CRITICAL | Supervivencia inmediata comprometida |

Ejemplos de disparadores:

- Runway corto.
- Cash negativo.
- Deuda alta frente al valor.
- Perdida no realizada profunda.
- Valor de compania no positivo.

Permanecer critico durante tres jornadas puede terminar la partida.

## 9. Estrategia Basica

Una estrategia prudente puede:

1. Mantener cash para varias jornadas.
2. Evitar concentrar todo el capital en un sector.
3. Revisar Guild Herald antes de terminar el dia.
4. Vender posiciones cuya tesis cambio.
5. Diferenciar P/L realizado de P/L no realizado.
6. No interpretar BUY/WATCH/HOLD como garantia.

El sistema no pretende dar recomendaciones financieras reales. Las senales son
parte de una simulacion ficticia.

## 10. Roles Jugables

### VIEWER

Puede observar:

- Mercado.
- Noticias.
- Detalle.
- Compania.
- Portfolio.

No puede operar ni avanzar el dia.

### TRADER

Puede jugar el ciclo completo:

- Comprar.
- Vender.
- Consultar ledger.
- Terminar el dia.

### ADMIN_BAR

Incluye las acciones del trader y agrega Game Master:

- Alterar mercado.
- Restaurar precios.
- Disparar eventos.
- Consultar auditoria tecnica.

## 11. Estado Terminal

### BANKRUPT

La compania no puede seguir operando ni procesando jornadas.

### VICTORIOUS

La compania alcanzo el objetivo de valor y la partida se considera ganada.

La version actual no implementa reinicio individual de partida desde la UI. Los
resets administrativos deben tratarse como herramientas de desarrollo.

## 12. Sistemas Modelados Pero Incompletos

- Prestamos y amortizacion.
- Cambios de reputacion.
- Liquidacion forzada.
- Escenarios y dificultad.
- Rumor anticipado separado del evento confirmado.
- Costos variables.
- Objetivos secundarios.
- Competencia directa entre companias.

Estas areas son extensiones naturales, no comportamiento disponible hoy.
