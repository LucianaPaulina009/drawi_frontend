"use client";

import {
  Eraser,
  GitFork,
  Grid3X3,
  Hand,
  MousePointer2,
  Pencil,
  Plus,
  Shapes,
  StickyNote,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HerramientaLienzo = "seleccion" | "mano" | "clase" | "borrador";

export interface BarraHerramientasProps {
  herramientaActiva?: HerramientaLienzo;
  puedeEditar?: boolean;
  onCambiarHerramienta?: (herramienta: HerramientaLienzo) => void;
  className?: string;
}

export function BarraHerramientas({
  herramientaActiva = "seleccion",
  puedeEditar = true,
  onCambiarHerramienta,
  className,
}: BarraHerramientasProps) {
  const esSeleccion = herramientaActiva === "seleccion";
  const esMano = herramientaActiva === "mano";
  const esClase = herramientaActiva === "clase";
  const esBorrador = herramientaActiva === "borrador";

  return (
    <nav
      aria-label="Barra de herramientas del editor"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 bottom-6 z-30 flex min-h-[56px] items-center space-x-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xl select-none",
        className
      )}
    >
      {/* Herramienta Selección */}
      <button
        type="button"
        onClick={() => onCambiarHerramienta?.("seleccion")}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer",
          esSeleccion
            ? "bg-[#91bcfb] text-white shadow-xs"
            : "text-[#475569] hover:bg-slate-100 hover:text-slate-900"
        )}
        title="Seleccionar (V)"
        aria-label="Seleccionar"
        aria-pressed={esSeleccion}
      >
        <MousePointer2 className="h-5 w-5" />
      </button>

      {/* Herramienta Mano / Desplazamiento */}
      <button
        type="button"
        onClick={() => onCambiarHerramienta?.("mano")}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer",
          esMano
            ? "bg-[#91bcfb] text-white shadow-xs"
            : "text-[#475569] hover:bg-slate-100 hover:text-slate-900"
        )}
        title="Mano / Pan (H)"
        aria-label="Mano / Pan"
        aria-pressed={esMano}
      >
        <Hand className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Herramienta Lápiz (Placeholder visual) */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
        title="Dibujo / Lápiz (P)"
        aria-label="Dibujo / Lápiz"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Herramienta Nota adhesiva (Placeholder visual) */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
        title="Nota Adhesiva (S)"
        aria-label="Nota Adhesiva"
      >
        <StickyNote className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Herramienta Texto (Placeholder visual) */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
        title="Texto (T)"
        aria-label="Texto"
      >
        <Type className="h-4 w-4" />
      </button>

      {/* Herramienta Figuras (Placeholder visual) */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
        title="Figuras / Formas (R)"
        aria-label="Figuras / Formas"
      >
        <Shapes className="h-4 w-4" />
      </button>

      {/* Herramienta Clase UML */}
      <button
        type="button"
        onClick={() => {
          if (puedeEditar) onCambiarHerramienta?.("clase");
        }}
        disabled={!puedeEditar}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          puedeEditar
            ? "hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
            : "cursor-not-allowed opacity-40 text-slate-400",
          esClase
            ? "bg-[#91bcfb] text-white shadow-xs hover:bg-[#7ab1f9]"
            : "text-[#475569]"
        )}
        title={puedeEditar ? "Clase UML (C) - Clic en el lienzo para crear" : "Solo lectura"}
        aria-label="Herramienta Clase UML"
        aria-pressed={esClase}
      >
        <Grid3X3 className="h-4 w-4" />
      </button>

      {/* Herramienta Borrador */}
      <button
        type="button"
        onClick={() => {
          if (puedeEditar) onCambiarHerramienta?.("borrador");
        }}
        disabled={!puedeEditar}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          puedeEditar
            ? "hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95 cursor-pointer"
            : "cursor-not-allowed opacity-40 text-slate-400",
          esBorrador
            ? "bg-[#91bcfb] text-white shadow-xs hover:bg-[#7ab1f9]"
            : "text-[#475569]"
        )}
        title={puedeEditar ? "Borrador (E) - Clic en una clase para eliminar" : "Solo lectura"}
        aria-label="Herramienta Borrador"
        aria-pressed={esBorrador}
      >
        <Eraser className="h-4 w-4" />
      </button>

      {/* Herramienta Conector / Relaciones (Placeholder visual) */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#91bcfb] text-white shadow-xs ring-2 ring-[#91bcfb]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Relación / Conector"
        aria-label="Relación / Conector"
      >
        <GitFork className="h-4 w-4 text-[#003c70]" />
      </button>

      {/* Botón Más herramientas (Placeholder visual) */}
      <button
        type="button"
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:scale-105 active:scale-95 cursor-pointer"
        title="Más herramientas"
        aria-label="Más herramientas"
      >
        <Plus className="h-4 w-4" />
      </button>
    </nav>
  );
}
