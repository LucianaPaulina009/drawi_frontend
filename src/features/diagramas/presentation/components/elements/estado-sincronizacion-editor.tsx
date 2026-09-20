"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import { coordinadorColaEditor } from "../../services/coordinador-cola-editor";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";

export type EstadoSincronizacion =
  | "sincronizado"
  | "enviando"
  | "pendiente"
  | "rechazado"
  | "bloqueado";

export interface EstadoSincronizacionEditorProps {
  className?: string;
  scopeKey?: string | null;
}

export function EstadoSincronizacionEditor({
  className = "",
  scopeKey: scopeProp,
}: EstadoSincronizacionEditorProps) {
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const storeScope = useEditorDiagramaStore((s) => s.scopeKey);
  const operacionesPendientes = useEditorDiagramaStore((s) => s.operacionesPendientes);

  const scopeKey = scopeProp ?? storeScope;

  const { estadoSync, operacionAfectada, totalPendientes } = useMemo(() => {
    const pendientes = scopeKey
      ? operacionesPendientes.filter((op) => op.scopeKey === scopeKey)
      : operacionesPendientes;

    const rechazada = pendientes.find((op) => op.estado === "rechazada");
    if (rechazada) {
      return {
        estadoSync: "rechazado" as EstadoSincronizacion,
        operacionAfectada: rechazada,
        totalPendientes: pendientes.length,
      };
    }

    const bloqueada = pendientes.find((op) => op.estado === "bloqueada");
    if (bloqueada) {
      return {
        estadoSync: "bloqueado" as EstadoSincronizacion,
        operacionAfectada: bloqueada,
        totalPendientes: pendientes.length,
      };
    }

    const enviando = pendientes.some((op) => op.estado === "enviando");
    if (enviando) {
      return {
        estadoSync: "enviando" as EstadoSincronizacion,
        operacionAfectada: null,
        totalPendientes: pendientes.length,
      };
    }

    if (pendientes.length > 0) {
      return {
        estadoSync: "pendiente" as EstadoSincronizacion,
        operacionAfectada: null,
        totalPendientes: pendientes.length,
      };
    }

    return {
      estadoSync: "sincronizado" as EstadoSincronizacion,
      operacionAfectada: null,
      totalPendientes: 0,
    };
  }, [operacionesPendientes, scopeKey]);

  const handleReanudar = async (op: OperacionEditor) => {
    await coordinadorColaEditor.reanudarOperacion(op.actionId);
    setPopoverAbierto(false);
  };

  const handleDescartar = async (op: OperacionEditor) => {
    await coordinadorColaEditor.descartarOperacion(op.actionId);
    useEditorDiagramaStore.getState().retirarOperacion(op.actionId);
    setPopoverAbierto(false);
  };

  const esError = estadoSync === "rechazado" || estadoSync === "bloqueado";
  const tituloEstado =
    estadoSync === "sincronizado"
      ? "Todo está sincronizado"
      : estadoSync === "enviando"
        ? "Sincronización en curso"
        : estadoSync === "pendiente"
          ? "Cambios pendientes"
          : estadoSync === "rechazado"
            ? "Operación rechazada"
            : "Pausa en sincronización";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex shrink-0 items-center ${className}`}
    >
      <Popover open={popoverAbierto} onOpenChange={setPopoverAbierto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex size-6 items-center justify-center rounded-full border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 ${
              estadoSync === "sincronizado"
                ? "border-emerald-200/70 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-400"
                : estadoSync === "enviando"
                  ? "border-sky-200/70 bg-sky-50 text-sky-700 hover:bg-sky-100 focus:ring-sky-400"
                  : estadoSync === "pendiente"
                    ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400"
                    : estadoSync === "rechazado"
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-400"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-400"
            }`}
            title="Ver estado de sincronización"
            aria-label={`Estado de sincronización: ${tituloEstado}`}
          >
            {estadoSync === "sincronizado" && (
              <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
            )}
            {estadoSync === "enviando" && (
              <Loader2 className="size-3 animate-spin shrink-0 text-sky-600" />
            )}
            {estadoSync === "pendiente" && (
              <Cloud className="size-3 shrink-0 text-slate-500" />
            )}
            {estadoSync === "rechazado" && (
              <AlertCircle className="size-3 shrink-0 text-red-600" />
            )}
            {estadoSync === "bloqueado" && (
              <AlertTriangle className="size-3 shrink-0 text-amber-600" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={8}
          className="w-80 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl"
        >
          {esError && operacionAfectada ? (
            <>
              <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                {estadoSync === "rechazado" ? (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {estadoSync === "rechazado"
                    ? "Operación rechazada"
                    : "Pausa en sincronización"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPopoverAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                aria-label="Cerrar detalles de sincronización"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              </div>

              <p className="text-[11px] text-slate-600 mb-3 break-words bg-slate-50 p-2 rounded-lg border border-slate-100">
                {operacionAfectada.ultimoError ||
                  (estadoSync === "rechazado"
                    ? "El servidor rechazó la operación de forma definitiva."
                    : "Se alcanzó el límite de reintentos o la predecesora está en pausa.")}
              </p>

              <div className="text-[10px] text-slate-500 mb-3 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-700">Comando:</span>{" "}
                  {operacionAfectada.tipo}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Reintentos:</span>{" "}
                  {operacionAfectada.intentos ?? 0} de 5
                </div>
                <div>
                  <span className="font-semibold text-slate-700">En cola:</span>{" "}
                  {totalPendientes} operación(es) conservada(s)
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDescartar(operacionAfectada)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors cursor-pointer"
                title="Descartar esta operación de la cola"
              >
                <Trash2 className="h-3 w-3" />
                <span>Descartar</span>
              </button>
              <button
                type="button"
                onClick={() => handleReanudar(operacionAfectada)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                title="Reintentar con la misma identidad y payload"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reanudar</span>
              </button>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2">
              {estadoSync === "sincronizado" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : estadoSync === "enviando" ? (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-sky-600" />
              ) : (
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-slate-900">{tituloEstado}</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {estadoSync === "sincronizado"
                    ? "Todos los cambios del diagrama ya están confirmados en el servidor."
                    : `${totalPendientes} operación(es) permanece(n) en la cola local${
                        estadoSync === "enviando" ? " mientras se sincronizan." : "."
                      }`}
                </p>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
