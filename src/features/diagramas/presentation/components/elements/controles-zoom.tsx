"use client";

import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface ControlesZoomProps {
  className?: string;
}

export function ControlesZoom({ className }: ControlesZoomProps) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();

  const handleZoomIn = () => {
    zoomIn({ duration: 150 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 150 });
  };

  const porcentajeZoom = Math.round((zoom ?? 1) * 100);

  return (
    <div
      aria-label="Controles de zoom y navegación"
      className={cn(
        "fixed left-6 bottom-6 z-30 flex items-center space-x-2.5 pointer-events-auto select-none",
        className
      )}
    >
      <div className="flex h-14 items-center space-x-1.5 rounded-2xl border border-slate-200 bg-white px-3 shadow-md">
        {/* Reducir Zoom */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Reducir zoom"
          aria-label="Reducir zoom"
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Nivel de Zoom Actual */}
        <span className="min-w-[38px] px-1 text-center text-xs font-bold text-slate-700 select-none">
          {porcentajeZoom}%
        </span>

        {/* Aumentar Zoom */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

        {/* Deshacer */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          title="Deshacer (Ctrl+Z)"
          aria-label="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Rehacer */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          title="Rehacer (Ctrl+Y)"
          aria-label="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
