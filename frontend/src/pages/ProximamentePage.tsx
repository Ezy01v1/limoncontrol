interface Props {
  titulo: string;
  icono: string;
}

export default function ProximamentePage({ titulo, icono }: Props) {
  return (
    <main className="flex-1 pt-16 pb-24 md:pb-0 flex items-center justify-center h-screen">
      <div className="text-center px-margin-mobile">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-md">
          {icono}
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">{titulo}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Este módulo se construye después del Punto de Venta.
        </p>
      </div>
    </main>
  );
}
