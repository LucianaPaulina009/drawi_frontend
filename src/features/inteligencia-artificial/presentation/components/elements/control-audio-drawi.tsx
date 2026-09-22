"use client";

import { AlertCircle, Loader2, Mic, Square, Trash2 } from "lucide-react";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";

export type EstadoVoz =
  | "idle"
  | "solicitando"
  | "grabando"
  | "transcribiendo"
  | "procesando"
  | "error";

export interface ControlAudioDrawiProps {
  grabacion: GrabacionAudioResult;
  estadoVoz?: EstadoVoz;
  deshabilitado?: boolean;
  onAlternarGrabacion?: () => void;
  onDescartarGrabacion?: () => void;
  errorVoz?: string | null;
}

function formatearSegundos(segundos: number): string {
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ControlAudioDrawi({
  grabacion,
  estadoVoz = "idle",
  deshabilitado = false,
  onAlternarGrabacion,
  onDescartarGrabacion,
  errorVoz,
}: ControlAudioDrawiProps) {
  const { duracionSegundos, error: errorGrabacion } = grabacion;

  const errorVisible = errorVoz || errorGrabacion;
  const estaGrabando = estadoVoz === "grabando" || grabacion.estado === "grabando";
  const estaSolicitando = estadoVoz === "solicitando" || grabacion.estado === "solicitando";
  const estaTranscribiendo = estadoVoz === "transcribiendo";
  const estaProcesando = estadoVoz === "procesando";

  const handleToggle = () => {
    if (deshabilitado && !estaGrabando) return;
    if (onAlternarGrabacion) {
      onAlternarGrabacion();
    } else if (estaGrabando) {
      grabacion.detenerGrabacion();
    } else {
      grabacion.iniciarGrabacion();
    }
  };

  const handleDescartar = () => {
    if (onDescartarGrabacion) {
      onDescartarGrabacion();
    } else {
      grabacion.descartarGrabacion();
    }
  };

  return (
    <div className="flex flex-col space-y-2" data-testid="control-audio-drawi">
      {/* Mensaje de error accesible si falló el permiso, transcriptor o micrófono */}
      {errorVisible && (
        <div
          role="alert"
          className="flex items-start space-x-2 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-xs"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="flex-1">{errorVisible}</p>
        </div>
      )}

      {/* Estado inactivo / botón de inicio */}
      {!estaGrabando && !estaSolicitando && !estaTranscribiendo && !estaProcesando && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={deshabilitado}
          aria-label="Iniciar grabación de audio"
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="h-3.5 w-3.5 text-sky-500" />
          <span>Grabar audio</span>
        </button>
      )}

      {/* Estado solicitando acceso al micrófono */}
      {estaSolicitando && (
        <div
          className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
          role="status"
          aria-live="polite"
        >
          <span className="h-2 w-2 animate-ping rounded-full bg-sky-500" />
          <span>Solicitando acceso al micrófono...</span>
        </div>
      )}

      {/* Estado transcribiendo */}
      {estaTranscribiendo && (
        <div
          className="flex items-center space-x-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-800"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
          <span>Transcribiendo audio...</span>
        </div>
      )}

      {/* Estado procesando con DRAWI */}
      {estaProcesando && (
        <div
          className="flex items-center space-x-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-800"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
          <span>DRAWI procesando solicitud...</span>
        </div>
      )}

      {/* Estado grabando con toggle para detener y botón descartar */}
      {estaGrabando && (
        <div
          className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-2.5 shadow-xs"
          data-testid="estado-grabando"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-800">
              Grabando: {formatearSegundos(duracionSegundos)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleToggle}
              aria-label="Detener y enviar grabación"
              title="Detener y enviar"
              className="inline-flex items-center space-x-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer transition-colors"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Detener</span>
            </button>
            <button
              type="button"
              onClick={handleDescartar}
              aria-label="Descartar grabación"
              title="Descartar grabación"
              className="inline-flex items-center space-x-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-2xs hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
