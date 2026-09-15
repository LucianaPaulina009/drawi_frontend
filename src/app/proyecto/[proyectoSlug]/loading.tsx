import { Spinner } from "@/components/ui/spinner";

export default function ProyectoSlugLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-white">
      {/* Skeleton de Cabecera */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-5 w-40 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="h-8 w-20 rounded-full bg-gray-100 animate-pulse" />
      </header>

      {/* Skeleton del Lienzo */}
      <div className="flex flex-1 items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white px-5 py-2.5 shadow-sm">
          <Spinner className="h-4 w-4 text-slate-700" />
          <span className="text-xs font-semibold text-slate-700">
            Cargando proyecto...
          </span>
        </div>
      </div>
    </div>
  );
}
