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
}

export interface ItemVentaInput {
  producto_id: number;
  cantidad: number;
}

export interface NuevaVentaInput {
  items: ItemVentaInput[];
  cliente_id?: number | null;
  metodo_pago: "efectivo" | "tarjeta";
  impuesto_porcentaje?: number; // ej. 10 para 10%. Por defecto 0.
}
