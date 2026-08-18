import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Reporte } from "../types";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function hace30DiasISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function formatoFechaCorta(fecha: string) {
  // fecha viene como YYYY-MM-DD desde MySQL DATE()
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-HN", { day: "2-digit", month: "short" });
}

const ATAJOS = [
  { label: "Últimos 7 días", dias: 7 },
  { label: "Últimos 30 días", dias: 30 },
  { label: "Últimos 90 días", dias: 90 },
];

export default function Reportes() {
  const [desde, setDesde] = useState(hace30DiasISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar(d = desde, h = hasta) {
    setCargando(true);
    setError(null);
    try {
      const data = await api.reportes.obtener(d, `${h} 23:59:59`);
      setReporte(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function aplicarAtajo(dias: number) {
    const nuevaDesde = new Date();
    nuevaDesde.setDate(nuevaDesde.getDate() - dias);
    const d = nuevaDesde.toISOString().slice(0, 10);
    const h = hoyISO();
    setDesde(d);
    setHasta(h);
    cargar(d, h);
  }

  const maxVentaDia = useMemo(
    () => Math.max(1, ...(reporte?.ventasPorDia.map((v) => Number(v.total)) || [1])),
    [reporte]
  );

  const maxTopProducto = useMemo(
    () => Math.max(1, ...(reporte?.topProductos.map((p) => Number(p.total_vendido)) || [1])),
    [reporte]
  );

  return (
    <main className="flex-1 pt-16 pb-24 md:pb-margin-desktop px-margin-mobile md:px-margin-desktop py-gutter max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Reportes
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Analiza tus ventas por período, producto y cliente.
          </p>
        </div>
      </div>

      {/* Filtro de rango */}
      <div className="bg-surface border border-outline-variant rounded-lg p-sm mb-gutter flex flex-col md:flex-row gap-sm md:items-center">
        <div className="flex gap-sm items-center">
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md text-on-surface"
          />
          <span className="font-body-md text-on-surface-variant">a</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={hoyISO()}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md text-on-surface"
          />
          <button
            onClick={() => cargar()}
            className="flex items-center gap-2 bg-primary-container text-on-primary-container font-body-md font-bold px-4 py-2 rounded-DEFAULT hover:bg-inverse-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
            Aplicar
          </button>
        </div>
        <div className="flex gap-1 md:ml-auto">
          {ATAJOS.map((a) => (
            <button
              key={a.dias}
              onClick={() => aplicarAtajo(a.dias)}
              className="px-3 py-2 rounded-DEFAULT font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-error font-body-sm mb-sm bg-error-container/40 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {cargando && (
        <p className="text-on-surface-variant font-body-md text-center py-lg">Generando reporte…</p>
      )}

      {!cargando && reporte && (
        <>
          {/* KPIs del período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm mb-gutter">
            <div className="bg-surface border-l-4 border-l-primary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
              <p className="font-label-caps text-label-caps text-outline uppercase">Ventas Totales</p>
              <p className="font-headline-md text-headline-md text-on-surface mt-1">
                L{Number(reporte.totales.total).toFixed(2)}
              </p>
            </div>
            <div className="bg-surface border-l-4 border-l-tertiary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
              <p className="font-label-caps text-label-caps text-outline uppercase">Tickets</p>
              <p className="font-headline-md text-headline-md text-on-surface mt-1">
                {reporte.totales.cantidad_ventas}
              </p>
            </div>
            <div className="bg-surface border border-outline-variant p-sm rounded-lg">
              <p className="font-label-caps text-label-caps text-outline uppercase">Ticket Promedio</p>
              <p className="font-headline-md text-headline-md text-on-surface mt-1">
                L
                {reporte.totales.cantidad_ventas > 0
                  ? (Number(reporte.totales.total) / reporte.totales.cantidad_ventas).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <div className="bg-surface border border-outline-variant p-sm rounded-lg">
              <p className="font-label-caps text-label-caps text-outline uppercase">Impuestos</p>
              <p className="font-headline-md text-headline-md text-on-surface mt-1">
                L{Number(reporte.totales.impuesto).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-gutter">
            {/* Ventas por día */}
            <div className="bg-surface border border-outline-variant rounded-lg p-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-sm">
                Ventas por Día
              </h2>
              {reporte.ventasPorDia.length === 0 ? (
                <p className="text-on-surface-variant font-body-sm py-md text-center">
                  Sin ventas en este período.
                </p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {reporte.ventasPorDia.map((v) => (
                    <div key={v.fecha} className="flex flex-col items-center justify-end h-full min-w-[32px] flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-primary-container to-primary rounded-t"
                        style={{ height: `${(Number(v.total) / maxVentaDia) * 100}%`, minHeight: 4 }}
                        title={`L${Number(v.total).toFixed(2)}`}
                      />
                      <span className="font-label-caps text-[9px] text-outline mt-1 whitespace-nowrap">
                        {formatoFechaCorta(v.fecha)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metodo de pago */}
            <div className="bg-surface border border-outline-variant rounded-lg p-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-sm">
                Métodos de Pago
              </h2>
              {reporte.porMetodoPago.length === 0 ? (
                <p className="text-on-surface-variant font-body-sm py-md text-center">
                  Sin ventas en este período.
                </p>
              ) : (
                <div className="flex flex-col gap-sm justify-center h-40">
                  {reporte.porMetodoPago.map((m) => {
                    const porcentaje =
                      (Number(m.total) / Number(reporte.totales.total || 1)) * 100;
                    return (
                      <div key={m.metodo_pago}>
                        <div className="flex justify-between mb-1">
                          <span className="font-body-md text-body-md text-on-surface capitalize">
                            {m.metodo_pago}
                          </span>
                          <span className="font-label-caps text-label-caps text-on-surface-variant">
                            L{Number(m.total).toFixed(2)} ({m.cantidad})
                          </span>
                        </div>
                        <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-secondary-container to-secondary h-2 rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Top productos */}
            <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Productos Más Vendidos
                </h2>
              </div>
              <div className="divide-y divide-outline-variant/50">
                {reporte.topProductos.length === 0 && (
                  <p className="p-4 text-center text-on-surface-variant font-body-sm">
                    Sin datos en este período.
                  </p>
                )}
                {reporte.topProductos.map((p, i) => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-body-md text-body-md text-on-surface">
                        {i + 1}. {p.nombre}
                      </span>
                      <span className="font-label-caps font-bold text-on-surface">
                        L{Number(p.total_vendido).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-tertiary-container to-tertiary h-2 rounded-full"
                        style={{ width: `${(Number(p.total_vendido) / maxTopProducto) * 100}%` }}
                      />
                    </div>
                    <p className="font-label-caps text-[10px] text-outline mt-1">
                      {Number(p.cantidad_vendida).toFixed(0)} {p.unidad_venta} vendidos
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top clientes */}
            <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Mejores Clientes
                </h2>
              </div>
              <div className="divide-y divide-outline-variant/50">
                {reporte.topClientes.length === 0 && (
                  <p className="p-4 text-center text-on-surface-variant font-body-sm">
                    Sin compras identificadas con cliente en este período.
                  </p>
                )}
                {reporte.topClientes.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center px-4 py-3">
                    <div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {i + 1}. {c.nombre}
                      </p>
                      <p className="font-label-caps text-label-caps text-outline">
                        {c.cantidad_compras} compra{c.cantidad_compras !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="font-label-caps font-bold text-on-surface">
                      L{Number(c.total_gastado).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}