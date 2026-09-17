"use client";

import { memo, useState, type KeyboardEvent } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Atributo } from "../../../domain/entities/atributo.entity";
import type { Clase } from "../../../domain/entities/clase.entity";
import { FilaAtributoUml } from "./fila-atributo-uml";

export interface NodoClaseUmlData {
  clase: Clase;
  puedeEditar: boolean;
  onSeleccionarClase?: (idClase: string) => void;
  onRedimensionarClaseStop?: (idClase: string, nuevoAncho: number) => void;
  onRenombrarClaseInline?: (idClase: string, nuevoNombre: string) => void;
  onAgregarAtributo?: (idClase: string) => void;
  onSeleccionarAtributo?: (atributo: Atributo) => void;
  onCopiarAtributo?: (atributo: Atributo) => void;
  onReordenarAtributo?: (
    idClase: string,
    idAtributo: string,
    nuevoOrden: number
  ) => void;
  [key: string]: unknown;
}

export const NodoClaseUml = memo(function NodoClaseUml({
  data,
  selected,
}: NodeProps) {
  const customData = data as NodoClaseUmlData;
  const { clase, puedeEditar } = customData;

  const [editandoInline, setEditandoInline] = useState(false);
  const [nombreInline, setNombreInline] = useState(clase?.nombre || "");

  if (!clase) return null;

  const atributos = clase.atributos || [];

  const handleConfirmarInline = () => {
    const clean = nombreInline.trim();
    if (clean && clean !== clase.nombre) {
      customData.onRenombrarClaseInline?.(clase.id, clean);
    } else {
      setNombreInline(clase.nombre);
    }
    setEditandoInline(false);
  };

  const handleKeyDownInline = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmarInline();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setNombreInline(clase.nombre);
      setEditandoInline(false);
    }
  };

  const anchoActual = clase.ancho && clase.ancho >= 180 ? clase.ancho : 220;

  return (
    <div
      style={{ width: `${anchoActual}px` }}
      className={cn(
        "group/node relative flex flex-col rounded-2xl border bg-white shadow-xs transition-colors select-none",
        selected
          ? "border-[#91bcfb] ring-2 ring-[#91bcfb]/50 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      )}
      data-purpose="uml-class-node"
      data-class-id={clase.id}
    >
      {/* Controles de resize interactivos visuales cuando la clase está seleccionada */}
      <NodeResizer
        isVisible={Boolean(selected && puedeEditar)}
        minWidth={180}
        minHeight={45}
        color="#91bcfb"
        lineClassName="border-[#91bcfb]"
        handleClassName="size-2 rounded-xs bg-white border border-[#003c70]"
        onResizeEnd={(_event, params) => {
          const newWidth = Math.max(180, Math.round(params.width));
          customData.onRedimensionarClaseStop?.(clase.id, newWidth);
        }}
      />

      {/* Cabecera del Nodo */}
      <div
        className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2 rounded-t-2xl cursor-pointer"
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (puedeEditar) {
            setNombreInline(clase.nombre);
            setEditandoInline(true);
          }
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="size-2 rounded-full bg-[#91bcfb] shrink-0"
            aria-hidden="true"
          />
          {editandoInline ? (
            <input
              type="text"
              autoFocus
              value={nombreInline}
              onChange={(e) => setNombreInline(e.target.value)}
              onKeyDown={handleKeyDownInline}
              onBlur={handleConfirmarInline}
              onClick={(e) => e.stopPropagation()}
              className="h-5.5 w-full rounded-md border border-[#91bcfb] bg-white px-1.5 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#91bcfb]"
              maxLength={50}
            />
          ) : (
            <h3
              className="truncate text-xs font-bold tracking-tight text-slate-900"
              title={`${clase.nombre} (Doble clic para renombrar)`}
            >
              {clase.nombre}
            </h3>
          )}
        </div>

        {/* Acción visual: + para añadir atributo (alineada con columna de acciones de filas) */}
        {puedeEditar && !editandoInline && (
          <div className="flex size-5 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/node:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                customData.onAgregarAtributo?.(clase.id);
              }}
              className="flex size-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 active:scale-95"
              title="Añadir atributo"
              aria-label="Añadir atributo a la clase"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lista de Atributos */}
      <div className="flex flex-col divide-y divide-slate-100 py-0.5">
        {atributos.length === 0 ? (
          <div className="px-3 py-2 text-center text-[10px] text-slate-400 italic">
            Sin atributos
          </div>
        ) : (
          atributos.map((atributo) => (
            <FilaAtributoUml
              key={atributo.id}
              atributo={atributo}
              puedeEditar={puedeEditar}
              onSeleccionar={(attr) =>
                customData.onSeleccionarAtributo?.(attr)
              }
              onCopiar={(attr) => customData.onCopiarAtributo?.(attr)}
            />
          ))
        )}
      </div>
    </div>
  );
});
