import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Producto } from "../types";

const ESTADOS: Producto["estado"][] = ["fresco", "madurando", "bajo_stock", "agotado"];

const ESTADO_INFO: Record<Producto["estado"], { texto: string; clase: string; barra: string; ancho: string }> = {
  fresco: { texto: "Fresco", clase: "bg-tertiary text-on-tertiary", barra: "from-tertiary-container to-tertiary", ancho: "90%" },
  madurando: { texto: "Madurando", clase: "bg-secondary text-on-secondary", barra: "from-secondary-container to-secondary", ancho: "55%" },
  bajo_stock: { texto: "Poco stock", clase: "bg-secondary-container text-on-secondary-container", barra: "from-secondary-container to-secondary", ancho: "20%" },
  agotado: { texto: "Agotado", clase: "bg-outline-variant text-on-surface-variant", barra: "from-outline-variant to-outline", ancho: "4%" },
};

type FormNuevoProducto = {
  nombre: string;
  categoria: string;
  unidad_venta: "unidad" | "kg";
  precio_unitario: string;
  stock_disponible: string;
  estado: Producto["estado"];
};

const FORM_VACIO: FormNuevoProducto = {
  nombre: "",
  categoria: "General",
  unidad_venta: "unidad",
  precio_unitario: "",
  stock_disponible: "",
  estado: "fresco",
};

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState<FormNuevoProducto>(FORM_VACIO);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const [productoStock, setProductoStock] = useState<Producto | null>(null);
  const [cantidadStock, setCantidadStock] = useState("");
  const [costoStock, setCostoStock] = useState("");
  const [guardandoStock, setGuardandoStock] = useState(false);

  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [precioEdit, setPrecioEdit] = useState("");
  const [estadoEdit, setEstadoEdit] = useState<Producto["estado"]>("fresco");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setProductos(await api.productos.listar());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  const productosFiltrados = useMemo(
    () => productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [productos, busqueda]
  );

  const kpis = useMemo(() => {
    const totalStock = productos.reduce((acc, p) => acc + Number(p.stock_disponible), 0);
    const madurando = productos
      .filter((p) => p.estado === "madurando")
      .reduce((acc, p) => acc + Number(p.stock_disponible), 0);
    const avgPrecio =
      productos.length > 0
        ? productos.reduce((acc, p) => acc + Number(p.precio_unitario), 0) / productos.length
        : 0;
    return { totalStock, madurando, avgPrecio };
  }, [productos]);

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoNuevo(true);
    setError(null);
    try {
      await api.productos.crear({
        nombre: formNuevo.nombre,
        categoria: formNuevo.categoria,
        unidad_venta: formNuevo.unidad_venta,
        precio_unitario: Number(formNuevo.precio_unitario),
        stock_disponible: Number(formNuevo.stock_disponible || 0),
        estado: formNuevo.estado,
      });
      setFormNuevo(FORM_VACIO);
      setMostrarNuevo(false);
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardandoNuevo(false);
    }
  }

  async function guardarStock(e: React.FormEvent) {
    e.preventDefault();
    if (!productoStock) return;
    setGuardandoStock(true);
    setError(null);
    try {
      await api.productos.agregarStock(
        productoStock.id,
        Number(cantidadStock),
        costoStock ? Number(costoStock) : undefined
      );
      setProductoStock(null);
      setCantidadStock("");
      setCostoStock("");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardandoStock(false);
    }
  }

  function abrirEdicion(p: Producto) {
    setProductoEditando(p);
    setPrecioEdit(String(p.precio_unitario));
    setEstadoEdit(p.estado);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!productoEditando) return;
    setError(null);
    try {
      await api.productos.actualizar(productoEditando.id, {
        precio_unitario: Number(precioEdit),
        estado: estadoEdit,
      });
      setProductoEditando(null);
      cargar();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function desactivar(p: Producto) {
    if (!confirm(`¿Quitar "${p.nombre}" del inventario activo?`)) return;
    try {
      await api.productos.desactivar(p.id);
      cargar();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main className="flex-1 pt-16 pb-24 md:pb-margin-desktop px-margin-mobile md:px-margin-desktop py-gutter max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Inventario
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Administra tus variedades de limón y su stock.
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
              placeholder="Buscar en inventario…"
              className="block w-full pl-10 pr-3 py-2 border border-outline-variant rounded-DEFAULT bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-shadow font-body-md text-on-surface h-12"
            />
          </div>
          <button
            onClick={() => setMostrarNuevo(true)}
            className="flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-headline-md text-data-table font-bold px-6 py-2 rounded-DEFAULT hover:bg-inverse-primary transition-colors h-12 shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Producto
          </button>
        </div>
      </div>

      {error && (
        <p className="text-error font-body-sm mb-sm bg-error-container/40 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm mb-gutter">
        <div className="bg-surface border-l-4 border-l-primary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Stock Total</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            {kpis.totalStock.toFixed(0)}
          </p>
        </div>
        <div className="bg-surface border-l-4 border-l-secondary-container border-y border-r border-outline-variant p-sm rounded-r-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Madurando</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            {kpis.madurando.toFixed(0)}
          </p>
        </div>
        <div className="bg-surface border border-outline-variant p-sm rounded-lg">
          <p className="font-label-caps text-label-caps text-outline uppercase">Precio Promedio</p>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">
            L{kpis.avgPrecio.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-inverse-surface text-inverse-on-surface">
              <tr>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Producto</th>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Estado</th>
                <th className="py-3 px-4 font-data-table text-data-table text-right whitespace-nowrap">Disponible</th>
                <th className="py-3 px-4 font-data-table text-data-table text-right whitespace-nowrap">Precio</th>
                <th className="py-3 px-4 font-data-table text-data-table whitespace-nowrap">Frescura</th>
                <th className="py-3 px-4 font-data-table text-data-table text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {cargando && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-on-surface-variant font-body-md">
                    Cargando inventario…
                  </td>
                </tr>
              )}
              {!cargando && productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-on-surface-variant font-body-md">
                    No hay productos que coincidan.
                  </td>
                </tr>
              )}
              {productosFiltrados.map((p) => {
                const info = ESTADO_INFO[p.estado];
                return (
                  <tr key={p.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary-container">
                          <span className="material-symbols-outlined">nutrition</span>
                        </div>
                        <div>
                          <p className="font-body-md text-body-md font-medium text-on-surface">{p.nombre}</p>
                          <p className="font-label-caps text-label-caps text-outline">{p.categoria}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-label-caps text-label-caps ${info.clase}`}>
                        {info.texto}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-label-caps text-on-surface">
                      {Number(p.stock_disponible).toFixed(0)} {p.unidad_venta}
                    </td>
                    <td className="py-3 px-4 text-right font-label-caps text-on-surface">
                      L{Number(p.precio_unitario).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 w-40">
                      <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                        <div className={`bg-gradient-to-r ${info.barra} h-2 rounded-full`} style={{ width: info.ancho }} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setProductoStock(p)}
                          title="Agregar stock"
                          className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[20px]">add_box</span>
                        </button>
                        <button
                          onClick={() => abrirEdicion(p)}
                          title="Editar"
                          className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => desactivar(p)}
                          title="Quitar del inventario activo"
                          className="p-2 text-outline hover:text-error transition-colors rounded-full hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarNuevo && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <form
            onSubmit={crearProducto}
            className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-md shadow-lg flex flex-col gap-sm"
          >
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-xs">
              Nuevo producto
            </h2>
            <input
              required
              placeholder="Nombre (ej. Limón Persa)"
              value={formNuevo.nombre}
              onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <input
              placeholder="Categoría (ej. Premium)"
              value={formNuevo.categoria}
              onChange={(e) => setFormNuevo({ ...formNuevo, categoria: e.target.value })}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <div className="grid grid-cols-2 gap-sm">
              <select
                value={formNuevo.unidad_venta}
                onChange={(e) => setFormNuevo({ ...formNuevo, unidad_venta: e.target.value as "unidad" | "kg" })}
                className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
              >
                <option value="unidad">Por unidad</option>
                <option value="kg">Por kg</option>
              </select>
              <select
                value={formNuevo.estado}
                onChange={(e) => setFormNuevo({ ...formNuevo, estado: e.target.value as Producto["estado"] })}
                className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_INFO[e].texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio (L)"
                value={formNuevo.precio_unitario}
                onChange={(e) => setFormNuevo({ ...formNuevo, precio_unitario: e.target.value })}
                className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Stock inicial"
                value={formNuevo.stock_disponible}
                onChange={(e) => setFormNuevo({ ...formNuevo, stock_disponible: e.target.value })}
                className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                type="button"
                onClick={() => setMostrarNuevo(false)}
                className="px-4 py-2 rounded-DEFAULT border border-outline-variant text-on-surface-variant font-body-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoNuevo}
                className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary font-body-md font-bold disabled:opacity-50"
              >
                {guardandoNuevo ? "Guardando…" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {productoStock && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <form
            onSubmit={guardarStock}
            className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-sm shadow-lg flex flex-col gap-sm"
          >
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-xs">
              Agregar stock — {productoStock.nombre}
            </h2>
            <input
              required
              autoFocus
              type="number"
              step="0.01"
              min="0"
              placeholder={`Cantidad (${productoStock.unidad_venta})`}
              value={cantidadStock}
              onChange={(e) => setCantidadStock(e.target.value)}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Costo unitario (opcional)"
              value={costoStock}
              onChange={(e) => setCostoStock(e.target.value)}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <div className="flex justify-end gap-sm mt-sm">
              <button
                type="button"
                onClick={() => setProductoStock(null)}
                className="px-4 py-2 rounded-DEFAULT border border-outline-variant text-on-surface-variant font-body-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoStock}
                className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary font-body-md font-bold disabled:opacity-50"
              >
                {guardandoStock ? "Guardando…" : "Agregar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {productoEditando && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <form
            onSubmit={guardarEdicion}
            className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-sm shadow-lg flex flex-col gap-sm"
          >
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-xs">
              Editar — {productoEditando.nombre}
            </h2>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="Precio (L)"
              value={precioEdit}
              onChange={(e) => setPrecioEdit(e.target.value)}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            />
            <select
              value={estadoEdit}
              onChange={(e) => setEstadoEdit(e.target.value as Producto["estado"])}
              className="border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-md"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_INFO[e].texto}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                type="button"
                onClick={() => setProductoEditando(null)}
                className="px-4 py-2 rounded-DEFAULT border border-outline-variant text-on-surface-variant font-body-md"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary font-body-md font-bold">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
