import { Cliente, ClienteDetalle, Producto, Reporte, RespuestaVenta, VentaResumen } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function manejarRespuesta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  productos: {
    listar: (): Promise<Producto[]> =>
      fetch(`${BASE_URL}/productos`).then((res) => manejarRespuesta<Producto[]>(res)),
    crear: (producto: {
      nombre: string;
      categoria: string;
      unidad_venta: "unidad" | "kg";
      precio_unitario: number;
      stock_disponible: number;
      estado: Producto["estado"];
    }) =>
      fetch(`${BASE_URL}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      }).then((res) => manejarRespuesta<{ id: number }>(res)),
    actualizar: (id: number, cambios: Partial<Producto>) =>
      fetch(`${BASE_URL}/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      }).then((res) => manejarRespuesta<{ ok: true }>(res)),
    desactivar: (id: number) =>
      fetch(`${BASE_URL}/productos/${id}`, { method: "DELETE" }).then((res) =>
        manejarRespuesta<{ ok: true }>(res)
      ),
    agregarStock: (id: number, cantidad: number, costo_unitario?: number) =>
      fetch(`${BASE_URL}/productos/${id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad, costo_unitario }),
      }).then((res) => manejarRespuesta<{ ok: true }>(res)),
  },
  ventas: {
    crear: (payload: {
      items: { producto_id: number; cantidad: number }[];
      metodo_pago: "efectivo" | "tarjeta";
      cliente_id?: number | null;
      impuesto_porcentaje?: number;
    }): Promise<RespuestaVenta> =>
      fetch(`${BASE_URL}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) => manejarRespuesta<RespuestaVenta>(res)),
    // GET /api/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    listar: (desde?: string, hasta?: string): Promise<VentaResumen[]> => {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const qs = params.toString();
      return fetch(`${BASE_URL}/ventas${qs ? `?${qs}` : ""}`).then((res) =>
        manejarRespuesta<VentaResumen[]>(res)
      );
    },
  },
  clientes: {
    // GET /api/clientes?buscar=texto
    listar: (buscar?: string): Promise<Cliente[]> => {
      const qs = buscar ? `?buscar=${encodeURIComponent(buscar)}` : "";
      return fetch(`${BASE_URL}/clientes${qs}`).then((res) => manejarRespuesta<Cliente[]>(res));
    },
    obtener: (id: number): Promise<ClienteDetalle> =>
      fetch(`${BASE_URL}/clientes/${id}`).then((res) => manejarRespuesta<ClienteDetalle>(res)),
    crear: (cliente: { nombre: string; telefono?: string; region?: string; notas?: string }) =>
      fetch(`${BASE_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      }).then((res) => manejarRespuesta<{ id: number }>(res)),
    actualizar: (id: number, cambios: Partial<Cliente>) =>
      fetch(`${BASE_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      }).then((res) => manejarRespuesta<{ ok: true }>(res)),
    eliminar: (id: number) =>
      fetch(`${BASE_URL}/clientes/${id}`, { method: "DELETE" }).then((res) =>
        manejarRespuesta<{ ok: true }>(res)
      ),
  },
  reportes: {
    // GET /api/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    obtener: (desde?: string, hasta?: string): Promise<Reporte> => {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const qs = params.toString();
      return fetch(`${BASE_URL}/reportes${qs ? `?${qs}` : ""}`).then((res) =>
        manejarRespuesta<Reporte>(res)
      );
    },
  },
};