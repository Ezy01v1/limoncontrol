export type Pagina = "dashboard" | "inventario" | "pos" | "clientes" | "reportes";

const ITEMS: { id: Pagina; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "inventario", label: "Inventario", icon: "inventory_2" },
  { id: "pos", label: "POS", icon: "point_of_sale" },
  { id: "reportes", label: "Reportes", icon: "analytics" },
  { id: "clientes", label: "Clientes", icon: "group" },
];

interface Props {
  paginaActiva: Pagina;
  onCambiar: (pagina: Pagina) => void;
}

export default function Nav({ paginaActiva, onCambiar }: Props) {
  return (
    <>
      {/* TopAppBar - desktop */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-surface border-b border-outline-variant shadow-sm justify-between items-center px-margin-desktop h-16">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined icon-fill text-primary text-[28px]">
            potted_plant
          </span>
          <span className="font-headline-md text-headline-md font-extrabold text-primary">
            LimonControl
          </span>
        </div>
        <nav className="flex items-center gap-md">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onCambiar(item.id)}
              className={`flex items-center gap-xs px-4 py-2 rounded-full font-data-table text-data-table transition-colors ${
                paginaActiva === item.id
                  ? "bg-primary-container text-on-primary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  paginaActiva === item.id ? "icon-fill" : ""
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      {/* BottomNavBar - mobile */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl bg-surface shadow-[0_-4px_16px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 pb-safe px-base border-t border-surface-container-high">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onCambiar(item.id)}
            className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-transform active:scale-90 duration-200 ${
              paginaActiva === item.id
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant"
            }`}
          >
            <span
              className={`material-symbols-outlined mb-1 ${
                paginaActiva === item.id ? "icon-fill" : ""
              }`}
            >
              {item.icon}
            </span>
            <span className="font-label-caps text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
