"use client";

import { AlertCircle, Mic, Square, Trash2 } from "lucide-react";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";

export interface ControlAudioDrawiProps {
  grabacion: GrabacionAudioResult;
  onAudioListo?: (url: string | null) => void;
}

function formatearSegundos(segundos: number): string {
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ControlAudioDrawi({ grabacion, onAudioListo }: ControlAudioDrawiProps) {
  const {
    estado,
    audioUrl,
    error,
    duracionSegundos,
    iniciarGrabacion,
    detenerGrabacion,
    cancelarGrabacion,
    removerAudio,
  } = grabacion;

  const handleDetener = async () => {
    const url = await detenerGrabacion();
    if (url && onAudioListo) {
      onAudioListo(url);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Mensaje de error accesible si falló el permiso o navegador */}
      {error && (
        <div
          role="alert"
          className="flex items-start space-x-2 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-xs"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {/* Estado inactivo / botón de inicio */}
      {estado === "inactivo" && (
        <button
          type="button"
          onClick={iniciarGrabacion}
          aria-label="Iniciar grabación de audio"
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
        >
          <Mic className="h-3.5 w-3.5 text-sky-500" />
          <span>Grabar audio</span>
        </button>
      )}

      {/* Estado solicitando permiso */}
      {estado === "solicitando" && (
        <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
          <span className="h-2 w-2 animate-ping rounded-full bg-sky-500" />
          <span>Solicitando acceso al micrófono...</span>
        </div>
      )}

      {/* Estado grabando */}
      {estado === "grabando" && (
        <div
          className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-2.5 shadow-xs"
          data-testid="estado-grabando"
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
              onClick={handleDetener}
              aria-label="Detener y adjuntar grabación"
              title="Detener y guardar"
              className="inline-flex items-center space-x-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer transition-colors"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Detener</span>
            </button>
            <button
              type="button"
              onClick={cancelarGrabacion}
              aria-label="Cancelar grabación"
              title="Descartar"
              className="rounded-lg p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Estado audio listo con reproductor nativo accesible */}
      {estado === "listo" && audioUrl && (
        <div
          className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs"
          data-testid="audio-listo-preview"
        >
          <audio
            src={audioUrl}
            controls
            className="h-8 max-w-[200px] flex-1 text-xs"
            aria-label="Audio temporal grabado"
          />
          <button
            type="button"
            onClick={removerAudio}
            aria-label="Eliminar audio adjunto"
            title="Quitar audio"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
