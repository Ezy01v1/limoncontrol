# 🍋 LimonControl

App para llevar el control de la venta de limones: reemplaza el flujo actual de
"WhatsApp + libreta" con un Punto de Venta (POS), Inventario, Clientes,
Dashboard y Reportes.

Este entregable trae **Punto de Venta (POS) e Inventario completamente
funcionales**, conectados a un backend real en Node/Express + MySQL. Los
módulos restantes (Dashboard, Clientes, Reportes) están listos para
construirse sobre la misma base — su navegación ya existe, solo falta la
pantalla.

## Estructura

```
limoncontrol/
├── backend/     API en Express + TypeScript + MySQL
└── frontend/    App en React + TypeScript + Vite + Tailwind
```

## 1. Preparar la base de datos

Necesitas tener MySQL corriendo localmente (o accesible por red).

```bash
cd backend
cp .env.example .env
# Edita .env con tu usuario/contraseña de MySQL
npm install
npm run db:init      # crea la base "limoncontrol" y sus tablas, con un producto inicial
```

## 2. Levantar la API

```bash
cd backend
npm run dev
# API disponible en http://localhost:4000/api
```

## 3. Levantar la app

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App disponible en http://localhost:5173
```

Abre `http://localhost:5173` — verás el módulo de **Venta Rápida (POS)**:
toca un producto para agregarlo al pedido, ajusta la cantidad con los
botones +/-, elige el método de pago y presiona **Cobrar**. Cada venta
descuenta el stock automáticamente en la base de datos.

## Endpoints del backend

| Método | Ruta                        | Uso                                              |
|--------|-----------------------------|---------------------------------------------------|
| GET    | `/api/productos`            | Lista de limones disponibles (para el grid del POS) |
| POST   | `/api/productos`            | Crear una nueva variedad/lote                     |
| POST   | `/api/productos/:id/stock`  | Registrar entrada de stock                        |
| POST   | `/api/ventas`                | Crear una venta (descuenta stock automáticamente) |
| GET    | `/api/ventas`                | Historial de ventas                               |
| GET    | `/api/ventas/:id`            | Detalle de una venta puntual                      |
| GET    | `/api/clientes`              | Lista/búsqueda de clientes                        |
| POST   | `/api/clientes`              | Crear cliente                                     |

## Siguientes pasos sugeridos

1. **Dashboard** — resumen de ventas del día/semana usando `GET /api/ventas`.
2. **Clientes** — directorio de clientes con historial de compras.
3. **Reportes** — ventas por rango de fechas, producto más vendido, etc.
4. Producción: cuando quieras usar la app desde tu teléfono en el campo,
   podemos desplegar el backend (por ejemplo en Railway/Render) y el
   frontend (Vercel/Netlify), y apuntar `VITE_API_URL` a esa URL.
