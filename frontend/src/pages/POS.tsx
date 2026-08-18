import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Cliente, ItemCarrito, Producto } from "../types";

const ESTADO_LABEL: Record<Producto["estado"], { texto: string; clase: string }> = {
  fresco: { texto: "Fresco", clase: "bg-tertiary text-on-tertiary" },
  madurando: { texto: "Madurando", clase: "bg-secondary text-on-secondary" },
  bajo_stock: { texto: "Poco stock", clase: "bg-secondary-container text-on-secondary-container" },
  agotado: { texto: "Agotado", clase: "bg-outline-variant text-on-surface-variant" },
};

export default function POS() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta">("efectivo");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaVenta, setUltimaVenta] = useState<number | null>(null);

  // --- Selector de cliente ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  // Busca clientes cada vez que se abre el selector o cambia el texto (con debounce)
  useEffect(() => {
    if (!mostrarSelectorCliente) return;
    const t = setTimeout(() => buscarClientes(busquedaCliente), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaCliente, mostrarSelectorCliente]);

  async function buscarClientes(texto: string) {
    setCargandoClientes(true);
    try {
      setClientes(await api.clientes.listar(texto || undefined));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargandoClientes(false);
    }
  }

  async function cargarProductos() {
    setCargando(true);
    setError(null);
    try {
      const data = await api.productos.listar();
      setProductos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function agregarAlCarrito(producto: Producto) {
    if (producto.stock_disponible <= 0) return;
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock_disponible) return prev;
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== productoId) return i;
          const nuevaCantidad = i.cantidad + delta;
          const tope = Math.min(nuevaCantidad, i.producto.stock_disponible);
          return { ...i, cantidad: Math.max(tope, 0) };
        })
        .filter((i) => i.cantidad > 0)
    );
  }

  // Permite escribir la cantidad directamente (ej. 150 limones sin dar 150 clics)
  function fijarCantidad(productoId: number, valor: string) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.producto.id !== productoId) return i;
        if (valor === "") return { ...i, cantidad: 0 };
        const numero = Number(valor);
        if (Number.isNaN(numero)) return i;
        const tope = Math.min(Math.max(numero, 0), i.producto.stock_disponible);
        return { ...i, cantidad: tope };
      })
    );
  }

  // Al salir del campo, si quedó en 0 o vacío se quita del carrito
  function confirmarCantidad(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.cantidad > 0));
  }

  const subtotal = useMemo(
    () => carrito.reduce((acc, i) => acc + i.producto.precio_unitario * i.cantidad, 0),
    [carrito]
  );

  async function cobrar() {
    if (carrito.length === 0) return;
    setProcesando(true);
    setError(null);
    try {
      const venta = await api.ventas.crear({
        items: carrito.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
        metodo_pago: metodoPago,
        cliente_id: clienteSeleccionado?.id ?? null,
      });
      setUltimaVenta(venta.id);
      setCarrito([]);
      setClienteSeleccionado(null);
      cargarProductos(); // refresca el stock mostrado en el grid
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="flex-1 pt-16 md:pt-16 pb-24 md:pb-0 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Grid de productos */}
      <section className="flex-1 flex flex-col p-margin-mobile md:p-gutter bg-surface-container-lowest overflow-y-auto">
        <div className="flex justify-between items-center mb-gutter">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold">
            Venta Rápida
          </h1>
          <button
            onClick={cargarProductos}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
            title="Actualizar"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {cargando && <p className="text-on-surface-variant font-body-md">Cargando productos…</p>}
        {error && (
          <p className="text-error font-body-sm mb-sm bg-error-container/40 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-sm md:gap-gutter">
          {productos.map((producto) => {
            const estado = ESTADO_LABEL[producto.estado];
            const sinStock = producto.stock_disponible <= 0;
            return (
              <button
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                disabled={sinStock}
                className="flex flex-col bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md hover:border-primary-container transition-all active:scale-95 duration-150 text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="h-24 w-full bg-surface-container-high flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    nutrition
                  </span>
                  <div
                    className={`absolute top-2 right-2 font-label-caps text-[10px] px-2 py-1 rounded-md ${estado.clase}`}
                  >
                    {estado.texto.toUpperCase()}
                  </div>
                </div>
                <div className="p-sm flex flex-col gap-xs">
                  <span className="font-data-table text-data-table text-on-surface font-semibold truncate">
                    {producto.nombre}
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      L{producto.precio_unitario.toFixed(2)}/{producto.unidad_venta}
                    </span>
                    <span className="font-label-caps text-[10px] text-outline">
                      {producto.stock_disponible} disp.
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Panel de cobro */}
      <section className="w-full md:w-[400px] lg:w-[450px] bg-surface flex flex-col border-t md:border-t-0 md:border-l border-outline-variant flex-shrink-0">
        <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Pedido Actual
          </h2>
          {ultimaVenta && (
            <p className="font-body-sm text-body-sm text-tertiary mt-1">
              ✓ Venta #{ultimaVenta} registrada
            </p>
          )}
        </div>

        {/* Selector de cliente */}
        <div className="px-md pt-md">
          <button
            onClick={() => {
              setMostrarSelectorCliente(true);
              setBusquedaCliente("");
              buscarClientes("");
            }}
            className="w-full flex items-center justify-between gap-2 border border-outline-variant rounded-lg px-3 py-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="flex items-center gap-2 text-left">
              <span className="material-symbols-outlined text-outline">
                {clienteSeleccionado ? "person" : "person_outline"}
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {clienteSeleccionado ? clienteSeleccionado.nombre : "Público general"}
              </span>
            </span>
            <span className="font-label-caps text-label-caps text-primary">
              {clienteSeleccionado ? "Cambiar" : "Seleccionar"}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-md bg-surface-container-lowest">
          {carrito.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-lg">
              Toca un producto para agregarlo al pedido
            </p>
          ) : (
            <div className="flex flex-col gap-sm">
              {carrito.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex flex-col p-sm bg-surface rounded-lg border border-outline-variant relative"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary-container rounded-l-lg" />
                  <div className="flex justify-between items-start pl-2 mb-2">
                    <span className="font-data-table text-data-table font-semibold text-on-surface">
                      {item.producto.nombre}
                    </span>
                    <span className="font-label-caps text-label-caps font-bold text-on-surface">
                      L{(item.producto.precio_unitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-2 bg-surface-container-lowest p-2 rounded border border-outline-variant">
                    <button
                      onClick={() => cambiarCantidad(item.producto.id, -1)}
                      className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center hover:bg-outline-variant transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={0}
                        max={item.producto.stock_disponible}
                        value={item.cantidad}
                        onChange={(e) => fijarCantidad(item.producto.id, e.target.value)}
                        onBlur={() => confirmarCantidad(item.producto.id)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 text-center font-headline-md text-headline-md font-bold text-primary bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-container rounded"
                      />
                      <span className="font-label-caps text-label-caps text-on-surface-variant">
                        {item.producto.unidad_venta}
                      </span>
                    </div>
                    <button
                      onClick={() => cambiarCantidad(item.producto.id, 1)}
                      className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center hover:bg-outline-variant transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  {item.cantidad >= item.producto.stock_disponible && (
                    <p className="font-label-caps text-[10px] text-secondary mt-1 pl-2">
                      Máximo disponible: {item.producto.stock_disponible}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-md bg-surface-container-lowest border-t border-outline-variant">
          <div className="flex justify-between items-center mb-md pt-2 border-t border-outline-variant">
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              Total
            </span>
            <span className="font-headline-md text-headline-md font-bold text-primary">
              L{subtotal.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-sm mb-sm">
            <button
              onClick={() => setMetodoPago("efectivo")}
              className={`py-3 rounded-lg border-2 font-body-md font-bold flex justify-center items-center gap-2 transition-colors ${
                metodoPago === "efectivo"
                  ? "bg-primary-container border-primary-container text-on-primary-container"
                  : "border-secondary-container text-on-surface hover:bg-secondary-container/10"
              }`}
            >
              <span className="material-symbols-outlined">payments</span>
              Efectivo
            </button>
            <button
              onClick={() => setMetodoPago("tarjeta")}
              className={`py-3 rounded-lg border-2 font-body-md font-bold flex justify-center items-center gap-2 transition-colors ${
                metodoPago === "tarjeta"
                  ? "bg-primary-container border-primary-container text-on-primary-container"
                  : "border-secondary-container text-on-surface hover:bg-secondary-container/10"
              }`}
            >
              <span className="material-symbols-outlined">credit_card</span>
              Tarjeta
            </button>
          </div>

          <button
            onClick={cobrar}
            disabled={carrito.length === 0 || procesando}
            className="w-full py-3 rounded-lg bg-primary text-on-primary font-body-md font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {procesando ? "Registrando…" : "Cobrar"}
          </button>
        </div>
      </section>

      {/* Modal: selector de cliente */}
      {mostrarSelectorCliente && (
        <div className="fixed inset-0 bg-inverse-surface/40 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface rounded-xl border border-outline-variant p-md w-full max-w-sm shadow-lg flex flex-col gap-sm max-h-[75vh]">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Seleccionar cliente
              </h2>
              <button
                onClick={() => setMostrarSelectorCliente(false)}
                className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                autoFocus
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar por nombre o teléfono…"
                className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-DEFAULT font-body-md"
              />
            </div>

            <button
              onClick={() => {
                setClienteSeleccionado(null);
                setMostrarSelectorCliente(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-left"
            >
              <span className="material-symbols-outlined text-outline">groups</span>
              <span className="font-body-md text-body-md text-on-surface">Público general</span>
            </button>

            <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/50 border-t border-outline-variant">
              {cargandoClientes && (
                <p className="py-4 text-center text-on-surface-variant font-body-sm">Buscando…</p>
              )}
              {!cargandoClientes && clientes.length === 0 && (
                <p className="py-4 text-center text-on-surface-variant font-body-sm">
                  No se encontraron clientes.
                </p>
              )}
              {clientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClienteSeleccionado(c);
                    setMostrarSelectorCliente(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-container-high transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface">{c.nombre}</p>
                    <p className="font-label-caps text-label-caps text-outline">
                      {c.telefono || "Sin teléfono"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}