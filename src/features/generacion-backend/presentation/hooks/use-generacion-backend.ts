import { useCallback, useState } from "react";
import { EstadoGeneracionFrontend } from "../../domain/generacion-backend.types";
import { generarBackendAction } from "../actions/generar-backend.action";

export interface ResultadoGeneracionBackend {
  ok: boolean;
  mensajeChat?: string;
  interaccionId?: string;
}

export interface UseGeneracionBackendOptions {
  onResultado?: (resultado: ResultadoGeneracionBackend) => void;
}

export interface UseGeneracionBackendReturn {
  estado: EstadoGeneracionFrontend;
  errorMensaje: string | null;
  erroresDetalle: string[];
  nombreArchivoDescargado: string | null;
  estaGenerando: boolean;
  ultimoMensajeChat: string | null;
  ultimaInteraccionId: string | null;
  generarBackend: (diagramaId: string) => Promise<boolean>;
  reiniciar: () => void;
}

export function useGeneracionBackend(
  options?: UseGeneracionBackendOptions
): UseGeneracionBackendReturn {
  const [estado, setEstado] = useState<EstadoGeneracionFrontend>("idle");
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([]);
  const [nombreArchivoDescargado, setNombreArchivoDescargado] = useState<string | null>(null);
  const [ultimoMensajeChat, setUltimoMensajeChat] = useState<string | null>(null);
  const [ultimaInteraccionId, setUltimaInteraccionId] = useState<string | null>(null);

  const reiniciar = useCallback(() => {
    setEstado("idle");
    setErrorMensaje(null);
    setErroresDetalle([]);
    setNombreArchivoDescargado(null);
    setUltimoMensajeChat(null);
    setUltimaInteraccionId(null);
  }, []);

  const generarBackend = useCallback(
    async (diagramaId: string): Promise<boolean> => {
      if (estado === "generando") {
        return false;
      }

      setEstado("generando");
      setErrorMensaje(null);
      setErroresDetalle([]);
      setNombreArchivoDescargado(null);

      try {
        const resultado = await generarBackendAction(diagramaId);

        if (resultado.ok) {
          setEstado("completado");
          setNombreArchivoDescargado(resultado.fileName);
          setUltimoMensajeChat(resultado.mensajeChat ?? null);
          setUltimaInteraccionId(resultado.interaccionId ?? null);
          setErroresDetalle([]);
          options?.onResultado?.({
            ok: true,
            mensajeChat: resultado.mensajeChat,
            interaccionId: resultado.interaccionId,
          });
          return true;
        } else {
          setEstado("error");
          const errores = resultado.error.errors || [];
          setErroresDetalle(errores);
          setErrorMensaje("Se encontraron errores en el diagrama.");
          setUltimoMensajeChat(resultado.mensajeChat ?? null);
          setUltimaInteraccionId(resultado.interaccionId ?? null);
          options?.onResultado?.({
            ok: false,
            mensajeChat: resultado.mensajeChat,
            interaccionId: resultado.interaccionId,
          });
          return false;
        }
      } catch (err) {
        setEstado("error");
        const msg =
          err instanceof Error
            ? err.message
            : "Error inesperado al solicitar la generación de backend.";
        setErrorMensaje(msg);
        setErroresDetalle([msg]);
        return false;
      }
    },
    [estado, options]
  );

  return {
    estado,
    errorMensaje,
    erroresDetalle,
    nombreArchivoDescargado,
    estaGenerando: estado === "generando",
    ultimoMensajeChat,
    ultimaInteraccionId,
    generarBackend,
    reiniciar,
  };
}
