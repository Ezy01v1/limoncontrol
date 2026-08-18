export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  unidad_venta: "unidad" | "kg";
  precio_unitario: number;
  stock_disponible: number;
  estado: "fresco" | "madurando" | "bajo_stock" | "agotado";
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  region?: string;
  notas?: string;
  total_compras?: number;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface ItemVenta {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Respuesta del POST /api/ventas
export interface RespuestaVenta {
  id: number;
  subtotal: number;
  impuesto: number;
  total: number;
  metodo_pago: "efectivo" | "tarjeta";
  items: ItemVenta[];
}

// Fila del GET /api/ventas (historial, usado en Dashboard y Reportes)
export interface VentaResumen {
  id: number;
  subtotal: number;
  impuesto: number;
  total: number;
  metodo_pago: "efectivo" | "tarjeta";
  creado_en: string;
  cliente_nombre: string | null;
}

// GET /api/clientes/:id - detalle con historial de compras
export interface ClienteDetalle extends Cliente {
  compras: VentaResumen[];
}

// GET /api/reportes
export interface VentaPorDia {
  fecha: string;
  cantidad: number;
  total: number;
}

export interface VentaPorMetodoPago {
  metodo_pago: "efectivo" | "tarjeta";
  cantidad: number;
  total: number;
}

export interface ProductoVendido {
  id: number;
  nombre: string;
  unidad_venta: "unidad" | "kg";
  cantidad_vendida: number;
  total_vendido: number;
}

export interface ClienteTop {
  id: number;
  nombre: string;
  cantidad_compras: number;
  total_gastado: number;
}

export interface Reporte {
  rango: { desde: string; hasta: string };
  totales: {
    cantidad_ventas: number;
    subtotal: number;
    impuesto: number;
    total: number;
  };
  ventasPorDia: VentaPorDia[];
  porMetodoPago: VentaPorMetodoPago[];
  topProductos: ProductoVendido[];
  topClientes: ClienteTop[];
}