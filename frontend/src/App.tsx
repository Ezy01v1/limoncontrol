import { useState } from "react";
import Nav, { Pagina } from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventario from "./pages/Inventario";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";

export default function App() {
  const [pagina, setPagina] = useState<Pagina>("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Nav paginaActiva={pagina} onCambiar={setPagina} />
      {pagina === "dashboard" && (
        <Dashboard onIrAPOS={() => setPagina("pos")} onIrAInventario={() => setPagina("inventario")} />
      )}
      {pagina === "pos" && <POS />}
      {pagina === "inventario" && <Inventario />}
      {pagina === "clientes" && <Clientes />}
      {pagina === "reportes" && <Reportes />}
    </div>
  );
}