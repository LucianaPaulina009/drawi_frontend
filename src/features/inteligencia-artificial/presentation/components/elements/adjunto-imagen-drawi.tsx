"use client";

import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import type { AdjuntoImagenTemporal } from "../../hooks/use-asistente-ia";

export interface AdjuntoImagenDrawiProps {
  imagen: AdjuntoImagenTemporal | null;
  onRemover: () => void;
}

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdjuntoImagenDrawi({ imagen, onRemover }: AdjuntoImagenDrawiProps) {
  if (!imagen) return null;

  return (
    <div
      className="relative flex items-center space-x-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs"
      data-testid="adjunto-imagen-preview"
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        {imagen.vistaPrevia ? (
          <Image
            src={imagen.vistaPrevia}
            alt={imagen.nombre}
            fill
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sky-500">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800" title={imagen.nombre}>
          {imagen.nombre}
        </p>
        <p className="text-[11px] text-slate-400">
          {formatearTamano(imagen.tamano)} • Contexto temporal
        </p>
      </div>

      <button
        type="button"
        onClick={onRemover}
        aria-label="Eliminar imagen adjunta"
        title="Quitar imagen"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
