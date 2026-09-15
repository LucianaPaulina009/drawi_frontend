"use client";

import { Folder, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type VistaSelectorProyectos = "mis-proyectos" | "compartidos-conmigo";

interface SelectorProyectosProps {
  vistaActiva: VistaSelectorProyectos;
  onCambioVista: (vista: VistaSelectorProyectos) => void;
}

export function SelectorProyectos({
  vistaActiva,
  onCambioVista,
}: SelectorProyectosProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white p-1 text-xs font-medium shadow-sm">
      <button
        type="button"
        onClick={() => onCambioVista("mis-proyectos")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition",
          vistaActiva === "mis-proyectos"
            ? "border border-lime-200/80 bg-[#d9f99d] font-semibold text-slate-900 shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-slate-900"
        )}
      >
        <Folder className="h-3.5 w-3.5 fill-current" />
        <span>Mis proyectos</span>
      </button>

      <button
        type="button"
        onClick={() => onCambioVista("compartidos-conmigo")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition",
          vistaActiva === "compartidos-conmigo"
            ? "border border-lime-200/80 bg-[#d9f99d] font-semibold text-slate-900 shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-slate-900"
        )}
      >
        <Users className="h-3.5 w-3.5" />
        <span>Compartidos conmigo</span>
      </button>
    </div>
  );
}
