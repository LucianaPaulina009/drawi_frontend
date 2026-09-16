import { Spinner } from "@/components/ui/spinner";

export default function ProyectoSlugLoading() {
  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f5f5f5] select-none font-sans"
      style={{
        backgroundImage:
          "radial-gradient(circle, #c5c5c5 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Skeleton de Cabecera Flotante */}
      <header className="absolute top-4 inset-x-5 z-40 flex items-center justify-between pointer-events-none">
        <div className="flex h-14 items-center space-x-2.5 rounded-2xl border border-slate-200 bg-white px-4 shadow-md">
          <div className="h-4 w-4 rounded-xs bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 rounded-md bg-slate-200 animate-pulse" />
          <div className="h-5 w-px bg-slate-200" />
          <div className="h-7 w-7 rounded-full bg-slate-100 animate-pulse" />
        </div>

        <div className="flex h-14 items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-md">
          <div className="h-8 w-8 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-8 w-8 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-5 w-px bg-slate-200" />
          <div className="h-9 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </header>

      {/* Indicador Central de Carga */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-5 py-2.5 shadow-md backdrop-blur-xs">
          <Spinner className="h-4 w-4 text-slate-700" />
          <span className="text-xs font-semibold text-slate-700">
            Cargando proyecto...
          </span>
        </div>
      </div>
    </div>
  );
}
