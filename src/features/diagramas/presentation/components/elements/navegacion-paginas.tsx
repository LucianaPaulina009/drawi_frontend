"use client";

import { useMemo } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import { MenuPagina } from "./menu-pagina";

export interface NavegacionPaginasProps {
  diagramas: Diagrama[];
  diagramaActivoId: string | null;
  creandoPagina: boolean;
  onSeleccionarDiagrama: (id: string) => void;
  onCrearPagina: () => void;
  onRenombrarPagina: (diagrama: Diagrama) => void;
  onEliminarPagina: (diagrama: Diagrama) => void;
  className?: string;
}

export function NavegacionPaginas({
  diagramas,
  diagramaActivoId,
  creandoPagina,
  onSeleccionarDiagrama,
  onCrearPagina,
  onRenombrarPagina,
  onEliminarPagina,
  className,
}: NavegacionPaginasProps) {
  // Ordenar las páginas exclusivamente por su número asignado por el backend
  const diagramasOrdenados = useMemo(() => {
    return [...diagramas].sort((a, b) => a.numero - b.numero);
  }, [diagramas]);

  return (
    <div
      className={cn(
        "flex w-60 flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl select-none font-sans",
        className
      )}
      role="region"
      aria-label="Gestor de páginas del proyecto"
    >
      {/* Cabecera del Gestor de Páginas */}
      <div className="flex items-center justify-between px-2 pt-1 pb-1">
        <span className="text-[14px] font-semibold tracking-tight text-slate-800">
          Páginas
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onCrearPagina}
          disabled={creandoPagina}
          className="h-6 w-6 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
          title="Añadir página"
          aria-label="Añadir página"
        >
          {creandoPagina ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Lista de páginas ordenadas */}
      <div
        className="flex max-h-64 flex-col gap-1 overflow-y-auto"
        role="tablist"
        aria-label="Páginas del proyecto"
      >
        {diagramasOrdenados.map((diagrama) => {
          const esActivo = diagrama.id === diagramaActivoId;

          return (
            <div
              key={diagrama.id}
              className={cn(
                "group relative flex items-center justify-between rounded-xl px-3 py-2 transition-colors cursor-pointer",
                esActivo
                  ? "bg-[#f3e8ff] hover:bg-[#ede0fa] text-slate-900"
                  : "bg-transparent hover:bg-slate-50 text-slate-700"
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={esActivo}
                onClick={() => onSeleccionarDiagrama(diagrama.id)}
                className="flex flex-1 items-center gap-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-app-primary"
              >
                <FileText
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    esActivo ? "text-purple-600" : "text-slate-400"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "max-w-[130px] truncate text-[13px]",
                    esActivo
                      ? "font-bold text-slate-900"
                      : "font-medium text-slate-700"
                  )}
                >
                  {diagrama.nombre}
                </span>
              </button>

              <MenuPagina
                diagrama={diagrama}
                onRenombrar={onRenombrarPagina}
                onEliminar={onEliminarPagina}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
