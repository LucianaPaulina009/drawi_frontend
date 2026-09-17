"use client";

import { memo } from "react";
import { Copy, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Atributo } from "../../../domain/entities/atributo.entity";

export interface FilaAtributoUmlProps {
  atributo: Atributo;
  puedeEditar?: boolean;
  onSeleccionar: (atributo: Atributo) => void;
  onCopiar?: (atributo: Atributo) => void;
}

export const FilaAtributoUml = memo(function FilaAtributoUml({
  atributo,
  puedeEditar = true,
  onSeleccionar,
  onCopiar,
}: FilaAtributoUmlProps) {
  // Formatear tipo de dato de forma compacta
  const renderTipo = () => {
    if (atributo.tipoDato === "varchar" && atributo.longitud) {
      return `varchar(${atributo.longitud})`;
    }
    if (
      atributo.tipoDato === "decimal" &&
      atributo.precision !== null &&
      atributo.precision !== undefined
    ) {
      return `decimal(${atributo.precision}${
        atributo.escala !== null && atributo.escala !== undefined
          ? `, ${atributo.escala}`
          : ""
      })`;
    }
    return atributo.tipoDato;
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSeleccionar(atributo);
      }}
      className={cn(
        "group/row relative flex items-center justify-between gap-1 px-3 py-1 text-xs transition-colors hover:bg-slate-50 cursor-pointer",
        atributo.esLlavePrimaria && "bg-blue-50/30"
      )}
      title="Clic para ver o editar propiedades"
    >
      {/* Zona Izquierda/Central: Indicador + Nombre + Tipo + Badges (layout compacto sin espacios excesivos) */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {atributo.esLlavePrimaria ? (
          <span title="Llave primaria" aria-label="Llave primaria">
            <KeyRound className="size-3 shrink-0 text-[#003c70]" />
          </span>
        ) : (
          <div className="size-1 rounded-full bg-slate-300 shrink-0" aria-hidden="true" />
        )}

        <span
          className={cn(
            "truncate font-medium text-slate-800",
            atributo.esLlavePrimaria && "font-bold text-slate-900"
          )}
          title={atributo.nombre}
        >
          {atributo.nombre}
        </span>

        <span className="shrink-0 text-slate-300">:</span>

        <span className="shrink-0 font-mono text-[10px] text-slate-500">
          {renderTipo()}
        </span>

        {/* Modificadores / Badges ajustados al contenido */}
        <div className="flex shrink-0 items-center gap-0.5 pl-0.5">
          {atributo.esLlavePrimaria && (
            <span
              className="inline-flex items-center rounded bg-[#e0f2fe] px-1 py-0 text-[8.5px] font-bold text-[#003c70]"
              title="Llave primaria"
            >
              PK
            </span>
          )}
          {!atributo.permiteNulo && !atributo.esLlavePrimaria && (
            <span
              className="inline-flex items-center rounded bg-slate-100 px-1 py-0 text-[8.5px] font-medium text-slate-600"
              title="No permite nulos"
            >
              NN
            </span>
          )}
          {atributo.esUnico && (
            <span
              className="inline-flex items-center rounded bg-[#f3e8ff] px-1 py-0 text-[8.5px] font-bold text-[#6b21a8]"
              title="Único"
            >
              UQ
            </span>
          )}
        </div>
      </div>

      {/* Columna Derecha Estrecha: Acción de Duplicar alineada con el botón + de la cabecera */}
      {puedeEditar && onCopiar && (
        <div
          className="flex size-5 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onCopiar(atributo)}
            className="flex size-4.5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-800 active:scale-95 transition-colors"
            title="Duplicar atributo"
            aria-label={`Duplicar atributo ${atributo.nombre}`}
          >
            <Copy className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
});
