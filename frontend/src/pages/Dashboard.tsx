import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Producto, VentaResumen } from "../types";

const ESTADO_LABEL: Record<Producto["estado"], { texto: string; clase: string }> = {
  fresco: { texto: "Fresco", clase: "bg-tertiary text-on-tertiary" },
  madurando: { texto: "Madurando", clase: "bg-secondary text-on-secondary" },
  bajo_stock: { texto: "Poco stock", clase: "bg-secondary-container text-on-secondary-container" },
  agotado: { texto: "Agotado", clase: "bg-outline-variant text-on-surface-variant" },
};

function inicioDeHoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-HN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  onIrAPOS: () => void;
  onIrAInventario: () => void;
}

export default function Dashboard({ onIrAPOS, onIrAInventario }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventasHoy, setVentasHoy] = useState<VentaResumen[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<VentaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const hoy = inicioDeHoy();
      const desde = hoy.toISOString().slice(0, 19).replace("T", " ");
      const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
      const hasta = manana.toISOString().slice(0, 19).replace("T", " ");

      const [prods, delDia, ultimas] = await Promise.all([
        api.productos.listar(),
        api.ventas.listar(desde, hasta),
        api.ventas.listar(),
      ]);

      setProductos(prods);
      setVentasHoy(delDia);
      setVentasRecientes(ultimas.slice(0, 8));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  const kpis = useMemo(() => {
    const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);
    const cantidadHoy = ventasHoy.length;
    const efectivoHoy = ventasHoy
      .filter((v) => v.metodo_pago === "efectivo")
      .reduce((acc, v) => acc + Number(v.total), 0);
    const tarjetaHoy = ventasHoy
      .filter((v) => v.metodo_pago === "tarjeta")
      .reduce((acc, v) => acc + Number(v.total), 0);
    return { totalHoy, cantidadHoy, efectivoHoy, tarjetaHoy };
  }, [ventasHoy]);

  const alertasStock = useMemo(
    () =>
      productos
        .filter((p) => p.estado === "bajo_stock" || p.estado === "agotado")
        .sort((a, b) => Number(a.stock_disponible) - Number(b.stock_disponible)),
    [productos]
  );

  return (
    <main className="flex-1 pt-16 pb-24 md:pb-margin-desktop px-margin-mobile md:px-margin-desktop py-gutter max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Dashboard
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumen de tu negocio hoy, {new Date().toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" })}.
          </p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={cargar}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
            title="Actualizar"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button
            onClick={onIrAPOS}
            className="flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-headline-md text-data-table font-bold px-5 py-2 rounded-DEFAULT hover:bg-inverse-primary transition-colors h-12 shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined">point_of_sale</span>
            Nueva Venta
          </button>
        </div>
      </div>

      {error && (
        <p className="text-error font-body-sm mb-sm bg-error-container/40 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* KPIs del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm mb-gutter">
        <div className="bg-surface border-l-4 border-l-primary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Ventas Hoy</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            L{kpis.totalHoy.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface border-l-4 border-l-tertiary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Tickets Hoy</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            {kpis.cantidadHoy}
          </p>
        </div>
        <div className="bg-surface border border-outline-variant p-sm rounded-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Efectivo</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            L{kpis.efectivoHoy.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface border border-outline-variant p-sm rounded-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Tarjeta</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            L{kpis.tarjetaHoy.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Últimas ventas */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Últimas Ventas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inverse-surface text-inverse-on-surface">
                <tr>
                  <th className="py-2 px-4 font-data-table text-data-table whitespace-nowrap">#</th>
                  <th className="py-2 px-4 font-data-table text-data-table whitespace-nowrap">Cliente</th>
                  <th className="py-2 px-4 font-data-table text-data-table whitespace-nowrap">Fecha</th>
                  <th className="py-2 px-4 font-data-table text-data-table whitespace-nowrap">Pago</th>
                  <th className="py-2 px-4 font-data-table text-data-table text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {cargando && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-on-surface-variant font-body-md">
                      Cargando ventas…
                    </td>
                  </tr>
                )}
                {!cargando && ventasRecientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-on-surface-variant font-body-md">
                      Todavía no hay ventas registradas.
                    </td>
                  </tr>
                )}
                {ventasRecientes.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-2 px-4 font-body-md text-body-md text-on-surface">#{v.id}</td>
                    <td className="py-2 px-4 font-body-md text-body-md text-on-surface">
                      {v.cliente_nombre || "Público general"}
                    </td>
                    <td className="py-2 px-4 font-label-caps text-label-caps text-outline">
                      {formatoFechaHora(v.creado_en)}
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-label-caps text-label-caps bg-secondary-container text-on-secondary-container">
                        {v.metodo_pago === "efectivo" ? "Efectivo" : "Tarjeta"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-label-caps font-bold text-on-surface">
                      L{Number(v.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de inventario */}
        <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Alertas de Stock
            </h2>
            <button
              onClick={onIrAInventario}
              className="font-label-caps text-label-caps text-primary hover:underline"
            >
              Ver todo
            </button>
          </div>
          <div className="flex-1 divide-y divide-outline-variant/50 overflow-y-auto max-h-[420px]">
            {!cargando && alertasStock.length === 0 && (
              <p className="p-4 text-center text-on-surface-variant font-body-sm">
                Todo tu inventario está en buen nivel. 🍋
              </p>
            )}
            {alertasStock.map((p) => {
              const info = ESTADO_LABEL[p.estado];
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">{p.nombre}</p>
                    <p className="font-label-caps text-label-caps text-outline">
                      {Number(p.stock_disponible).toFixed(0)} {p.unidad_venta} disponibles
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full font-label-caps text-label-caps ${info.clase}`}>
                    {info.texto}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}