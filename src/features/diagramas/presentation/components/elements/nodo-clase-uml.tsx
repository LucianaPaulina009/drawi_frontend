"use client";

import { memo, useRef, useState, type KeyboardEvent } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Atributo } from "../../../domain/entities/atributo.entity";
import type { Clase } from "../../../domain/entities/clase.entity";
import { FilaAtributoUml } from "./fila-atributo-uml";

export interface NodoClaseUmlData {
  clase: Clase;
  puedeEditar: boolean;
  bloqueoInfo?: {
    estaBloqueada: boolean;
    bloqueadaPorOtro: boolean;
    bloqueadaPorMi?: boolean;
    nombreUsuarioBloqueo?: string;
  };
  onSeleccionarClase?: (idClase: string) => void;
  onAbrirPropiedadesClase?: (idClase: string) => void;
  onRedimensionarClaseStop?: (idClase: string, nuevoAncho: number) => void;
  onRenombrarClaseInline?: (idClase: string, nuevoNombre: string) => void;
  onAgregarAtributo?: (idClase: string) => void;
  onSeleccionarAtributo?: (atributo: Atributo) => void;
  onAbrirPropiedadesAtributo?: (atributo: Atributo) => void;
  onCopiarAtributo?: (atributo: Atributo) => void;
  onReordenarAtributo?: (
    idClase: string,
    idAtributo: string,
    nuevoOrden: number
  ) => void;
  modoRelacion?: boolean;
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
  const yaConfirmadoRef = useRef(false);

  if (!clase) return null;

  const bloqueo = customData.bloqueoInfo;
  const bloqueadaPorOtro = Boolean(bloqueo?.bloqueadaPorOtro);
  const nombreBloqueador = bloqueo?.nombreUsuarioBloqueo || "Otro usuario";

  const atributos = [...(clase.atributos || [])].sort(
    (izquierdo, derecho) =>
      izquierdo.ordenDePosicion - derecho.ordenDePosicion ||
      izquierdo.id.localeCompare(derecho.id)
  );

  const handleConfirmarInline = () => {
    if (bloqueadaPorOtro) {
      setEditandoInline(false);
      return;
    }
    if (yaConfirmadoRef.current) return;
    yaConfirmadoRef.current = true;
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
      yaConfirmadoRef.current = true;
      setNombreInline(clase.nombre);
      setEditandoInline(false);
    }
  };

  const anchoActual = clase.ancho && clase.ancho >= 180 ? clase.ancho : 220;

  return (
    <div
      style={{ width: `${anchoActual}px` }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (bloqueadaPorOtro) return;
        customData.onAbrirPropiedadesClase?.(clase.id);
      }}
      className={cn(
        "group/node relative flex flex-col rounded-2xl border bg-white shadow-xs transition-colors select-none",
        bloqueadaPorOtro
          ? "border-amber-400 ring-2 ring-amber-400/50 shadow-sm cursor-not-allowed"
          : selected
          ? "border-[#91bcfb] ring-2 ring-[#91bcfb]/50 shadow-md cursor-pointer"
          : "border-slate-200 hover:border-slate-300 cursor-pointer"
      )}
      data-purpose="uml-class-node"
      data-class-id={clase.id}
    >
      {/* Badge visual de bloqueo remoto */}
      {bloqueadaPorOtro && (
        <div className="absolute -top-6 left-2 flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs pointer-events-none z-20">
          <Lock className="size-2.5" />
          <span>Editando: {nombreBloqueador}</span>
        </div>
      )}

      <Handle
        id="top"
        type="source"
        position={Position.Top}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableEnd={false}
        className={cn(
          "!size-2.5 !border-0 !bg-[#91bcfb] !z-10",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableEnd={false}
        className={cn(
          "!size-2.5 !border-0 !bg-[#91bcfb] !z-10",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableEnd={false}
        className={cn(
          "!size-2.5 !border-0 !bg-[#91bcfb] !z-10",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableEnd={false}
        className={cn(
          "!size-2.5 !border-0 !bg-[#91bcfb] !z-10",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={false}
        isConnectableEnd={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        className={cn(
          "!size-2.5 !border-0 !bg-transparent !z-0",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={false}
        isConnectableEnd={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        className={cn(
          "!size-2.5 !border-0 !bg-transparent !z-0",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={false}
        isConnectableEnd={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        className={cn(
          "!size-2.5 !border-0 !bg-transparent !z-0",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        isConnectable={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        isConnectableStart={false}
        isConnectableEnd={puedeEditar && !bloqueadaPorOtro && Boolean(customData.modoRelacion)}
        className={cn(
          "!size-2.5 !border-0 !bg-transparent !z-0",
          !customData.modoRelacion && "!opacity-0 pointer-events-none"
        )}
      />

      {/* Controles de resize interactivos visuales cuando la clase está seleccionada */}
      <NodeResizer
        isVisible={Boolean(selected && puedeEditar && !bloqueadaPorOtro)}
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
          if (bloqueadaPorOtro) return;
          customData.onAbrirPropiedadesClase?.(clase.id);
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
              title={`${clase.nombre} (Doble clic para propiedades)`}
            >
              {clase.nombre}
            </h3>
          )}
        </div>

        {/* Acción visual: + para añadir atributo */}
        {puedeEditar && !bloqueadaPorOtro && !editandoInline && (
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
              puedeEditar={puedeEditar && !bloqueadaPorOtro}
              onSeleccionar={(attr) =>
                customData.onSeleccionarAtributo?.(attr)
              }
              onAbrirPropiedades={(attr) =>
                customData.onAbrirPropiedadesAtributo?.(attr)
              }
              onCopiar={(attr) => customData.onCopiarAtributo?.(attr)}
            />
          ))
        )}
      </div>
    </div>
  );
});
