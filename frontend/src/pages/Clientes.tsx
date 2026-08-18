import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Cliente, ClienteDetalle } from "../types";

type FormCliente = {
  nombre: string;
  telefono: string;
  region: string;
  notas: string;
};

const FORM_VACIO: FormCliente = { nombre: "", telefono: "", region: "", notas: "" };

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" });
}

// Arma el link de wa.me a partir del teléfono guardado.
// Si el número no trae código de país (8 dígitos, formato típico de Honduras),
// le antepone 504. Si ya viene con + o con más dígitos, se respeta tal cual.
function enlaceWhatsApp(telefono?: string | null): string | null {
  if (!telefono) return null;
  const soloDigitos = telefono.replace(/\D/g, "");
  if (!soloDigitos) return null;
  const numeroConCodigo = soloDigitos.length === 8 ? `504${soloDigitos}` : soloDigitos;
  return `https://wa.me/${numeroConCodigo}`;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormCliente>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  // Debounce simple de la busqueda para no golpear la API en cada tecla
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  async function cargar(texto?: string) {
    setCargando(true);
    setError(null);
    try {
      setClientes(await api.clientes.listar(texto));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setMostrarForm(true);
  }

  function abrirEdicion(c: Cliente) {
    setEditandoId(c.id);
    setForm({
      nombre: c.nombre,
      telefono: c.telefono || "",
      region: c.region || "",
      notas: c.notas || "",
    });
    setMostrarForm(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        region: form.region || undefined,
        notas: form.notas || undefined,
      };
      if (editandoId) {
        await api.clientes.actualizar(editandoId, payload);
      } else {
        await api.clientes.crear(payload as { nombre: string });
      }
      setMostrarForm(false);
      setForm(FORM_VACIO);
      setEditandoId(null);
      cargar(busqueda);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(c: Cliente) {
    if (!confirm(`¿Eliminar a "${c.nombre}"? Sus ventas anteriores quedarán sin cliente asociado.`)) return;
    try {
      await api.clientes.eliminar(c.id);
      cargar(busqueda);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verDetalle(c: Cliente) {
    setCargandoDetalle(true);
    setError(null);
    try {
      setDetalle(await api.clientes.obtener(c.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <main className="flex-1 pt-16 pb-24 md:pb-margin-desktop px-margin-mobile md:px-margin-desktop py-gutter max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Clientes
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Tus compradores frecuentes por WhatsApp y su historial de compras.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-sm w-full md:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="block w-full pl-10 pr-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-shadow font-body-md text-on-surface h-12"
            />
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-headline-md text-data-table font-bold px-6 py-2 rounded-DEFAULT hover:bg-inverse-primary transition-colors h-12 shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </div>

      {error && (
        <p className="text-error font-body-sm mb-sm bg-error-container/40 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-inverse-surface text-inverse-on-surface">
              <tr>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Cliente</th>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Teléfono</th>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Región</th>
                <th className="py-3 px-4 font-data-table text-data-table text-right whitespace-nowrap">Compras</th>
                <th className="py-3 px-4 font-data-table text-data-table text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {cargando && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-on-surface-variant font-body-md">
                    Cargando clientes…
                  </td>
                </tr>
              )}
              {!cargando && clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-on-surface-variant font-body-md">
                    No hay clientes que coincidan.
                  </td>
                </tr>
              )}
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => verDetalle(c)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <span className="font-body-md text-body-md font-medium text-on-surface hover:underline">
                        {c.nombre}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4 font-body-md text-body-md text-on-surface-variant">
                    {c.telefono ? (
                      <a
                        href={enlaceWhatsApp(c.telefono) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir chat de WhatsApp"
                        className="inline-flex items-center gap-1 hover:text-tertiary hover:underline transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] text-tertiary">
                          chat
                        </span>
                        {c.telefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 font-body-md text-body-md text-on-surface-variant">
                    {c.region || "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-label-caps text-on-surface">
                    {c.total_compras ?? 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => abrirEdicion(c)}
                        title="Editar"
                        className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => eliminar(c)}
                        title="Eliminar"
                        className="p-2 text-outline hover:text-error transition-colors rounded-full hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: nuevo / editar cliente */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <form
            onSubmit={guardar}
            className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-md shadow-lg flex flex-col gap-sm"
          >
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-xs">
              {editandoId ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <input
              required
              autoFocus
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <input
              placeholder="Teléfono / WhatsApp"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <input
              placeholder="Región / Zona"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <textarea
              placeholder="Notas (opcional)"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={2}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md resize-none"
            />
            <div className="flex justify-end gap-sm mt-sm">
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  setEditandoId(null);
                }}
                className="px-4 py-2 rounded-DEFAULT border border-outline-variant text-on-surface-variant font-body-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary font-body-md font-bold disabled:opacity-50"
              >
                {guardando ? "Guardando…" : editandoId ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: detalle de cliente con historial de compras */}
      {(detalle || cargandoDetalle) && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-lg shadow-lg flex flex-col gap-sm max-h-[80vh]">
            {cargandoDetalle && (
              <p className="text-on-surface-variant font-body-md py-6 text-center">Cargando…</p>
            )}
            {detalle && !cargandoDetalle && (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      {detalle.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {detalle.telefono || "Sin teléfono"} {detalle.region ? `· ${detalle.region}` : ""}
                      </p>
                      {detalle.telefono && (
                        <a
                          href={enlaceWhatsApp(detalle.telefono) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-tertiary-container text-on-tertiary-container font-label-caps text-label-caps hover:opacity-80 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          WhatsApp
                        </a>
                      )}
                    </div>
                    {detalle.notas && (
                      <p className="font-body-sm text-body-sm text-outline mt-1 italic">{detalle.notas}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDetalle(null)}
                    className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <h3 className="font-label-caps text-label-caps text-outline uppercase mt-sm">
                  Historial de compras
                </h3>
                <div className="overflow-y-auto divide-y divide-outline-variant/50 flex-1">
                  {detalle.compras.length === 0 && (
                    <p className="py-6 text-center text-on-surface-variant font-body-sm">
                      Este cliente todavía no tiene compras registradas.
                    </p>
                  )}
                  {detalle.compras.map((v) => (
                    <div key={v.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-body-md text-body-md text-on-surface">Venta #{v.id}</p>
                        <p className="font-label-caps text-label-caps text-outline">
                          {formatoFecha(v.creado_en)} · {v.metodo_pago === "efectivo" ? "Efectivo" : "Tarjeta"}
                        </p>
                      </div>
                      <span className="font-label-caps font-bold text-on-surface">
                        L{Number(v.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}