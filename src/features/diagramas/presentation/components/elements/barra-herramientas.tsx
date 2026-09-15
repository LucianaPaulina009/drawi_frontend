"use client";

import {
  GitFork,
  Grid3X3,
  Hand,
  MousePointer2,
  Pencil,
  Plus,
  Shapes,
  Stamp,
  StickyNote,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BarraHerramientasProps {
  className?: string;
}

export function BarraHerramientas({ className }: BarraHerramientasProps) {
  return (
    <nav
      aria-label="Barra de herramientas del editor"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 bottom-6 z-30 flex min-h-[56px] items-center space-x-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xl select-none",
        className
      )}
    >
      {/* Herramienta Selección (Activa por defecto) */}
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#91bcfb] text-white shadow-xs transition-all hover:scale-105 active:scale-95"
        title="Seleccionar (V)"
        aria-label="Seleccionar"
      >
        <MousePointer2 className="h-5 w-5 text-white" />
      </button>

      {/* Herramienta Mano / Desplazamiento */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Mano / Pan (H)"
        aria-label="Mano / Pan"
      >
        <Hand className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Herramienta Lápiz */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Dibujo / Lápiz (P)"
        aria-label="Dibujo / Lápiz"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Herramienta Nota adhesiva */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Nota Adhesiva (S)"
        aria-label="Nota Adhesiva"
      >
        <StickyNote className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Herramienta Texto */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Texto (T)"
        aria-label="Texto"
      >
        <Type className="h-4 w-4" />
      </button>

      {/* Herramienta Figuras */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Figuras / Formas (R)"
        aria-label="Figuras / Formas"
      >
        <Shapes className="h-4 w-4" />
      </button>

      {/* Herramienta Tabla / Cuadrícula */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Tabla o Cuadrícula"
        aria-label="Tabla o Cuadrícula"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>

      {/* Herramienta Sello / Stamp */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] transition-all hover:bg-slate-100 hover:scale-105 hover:text-slate-900 active:scale-95"
        title="Sello / Stamp"
        aria-label="Sello / Stamp"
      >
        <Stamp className="h-4 w-4" />
      </button>

      {/* Herramienta Conector / Relaciones */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#91bcfb] text-white shadow-xs ring-2 ring-[#91bcfb]/40 transition-all hover:scale-105 active:scale-95"
        title="Relación / Conector"
        aria-label="Relación / Conector"
      >
        <GitFork className="h-4 w-4 text-[#003c70]" />
      </button>

      {/* Botón Más herramientas */}
      <button
        type="button"
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:scale-105 active:scale-95"
        title="Más herramientas"
        aria-label="Más herramientas"
      >
        <Plus className="h-4 w-4" />
      </button>
    </nav>
  );
}
