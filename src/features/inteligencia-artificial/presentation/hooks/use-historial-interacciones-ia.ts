"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InteraccionIa } from "../../domain/entities/interaccion-ia.entity";
import {
  enviarAudioIaAction,
  enviarImagenIaAction,
  enviarMensajeIaAction,
  listarInteraccionesIaAction,
} from "../actions/interaccion-ia.action";

export function useHistorialInteraccionesIa(diagramaId: string | null) {
  const [interacciones, setInteracciones] = useState<InteraccionIa[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagramaActualRef = useRef<string | null>(diagramaId);

  useEffect(() => {
    diagramaActualRef.current = diagramaId;
  }, [diagramaId]);

  // Cargar historial al cambiar o fijar el diagrama
  const cargarHistorial = useCallback(async () => {
    if (!diagramaId) {
      setInteracciones([]);
      setError(null);
      return;
    }

    const currentDiagramId = diagramaId;
    setCargando(true);
    setError(null);

    try {
      const res = await listarInteraccionesIaAction(currentDiagramId);
      // Descartar respuestas tardías si el diagrama cambió mientras cargaba
      if (diagramaActualRef.current !== currentDiagramId) {
        return;
      }

      if (res.ok) {
        setInteracciones(res.data.items);
      } else {
        setError(res.errors?.[0] || "No se pudo cargar el historial del chat.");
      }
    } catch {
      if (diagramaActualRef.current === currentDiagramId) {
        setError("Error de red al consultar las interacciones del asistente.");
      }
    } finally {
      if (diagramaActualRef.current === currentDiagramId) {
        setCargando(false);
      }
    }
  }, [diagramaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarHistorial();
  }, [cargarHistorial]);

  // Enviar mensaje con estado optimista e idempotencia
  const enviarMensaje = useCallback(
    async (
      texto: string,
      opciones?: {
        claveIdempotencia?: string;
        tipoInteraccion?: "texto" | "audio";
      }
    ): Promise<boolean> => {
      const textoLimpio = texto.trim();
      if (!textoLimpio || !diagramaId || enviando) {
        return false;
      }

      const currentDiagramId = diagramaId;
      const claveIdempotencia =
        opciones?.claveIdempotencia || crypto.randomUUID();
      const tempId = crypto.randomUUID();
      const tipoInteraccion = opciones?.tipoInteraccion || "texto";

      const optimista: InteraccionIa = {
        id: tempId,
        idDiagrama: currentDiagramId,
        idUsuario: "yo",
        tipo: tipoInteraccion === "audio" ? "VOZ_AUDIO" : "CONVERSACION",
        estado: "PROCESANDO",
        entradaUsuario: textoLimpio,
        respuestaIa: null,
        claveIdempotencia,
        creadoEn: new Date().toISOString(),
      };

      setInteracciones((prev) => [...prev, optimista]);
      setEnviando(true);
      setError(null);

      try {
        const res = await enviarMensajeIaAction(currentDiagramId, {
          texto: textoLimpio,
          claveIdempotencia,
          tipoInteraccion,
        });

        // Descartar respuesta si el usuario cambió de diagrama mientras se procesaba
        if (diagramaActualRef.current !== currentDiagramId) {
          return false;
        }

        if (res.ok) {
          setInteracciones((prev) =>
            prev.map((item) => (item.id === tempId ? res.data : item))
          );
          return true;
        } else {
          const mensajeError =
            res.errors?.[0] || "Error al comunicarse con el asistente DRAWI.";
          setError(mensajeError);
          setInteracciones((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    estado: "ERROR",
                    respuestaIa: "No se pudo procesar la solicitud.",
                  }
                : item
            )
          );
          return false;
        }
      } catch {
        if (diagramaActualRef.current === currentDiagramId) {
          setError("Error de red al procesar el mensaje con el asistente.");
          setInteracciones((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    estado: "ERROR",
                    respuestaIa: "Error de conexión con el servicio.",
                  }
                : item
            )
          );
        }
        return false;
      } finally {
        if (diagramaActualRef.current === currentDiagramId) {
          setEnviando(false);
        }
      }
    },
    [diagramaId, enviando]
  );

  // Enviar audio temporal en una sola interacción de voz sin burbujas optimistas intermedias
  const enviarAudio = useCallback(
    async (
      audioBlob: Blob,
      opciones?: {
        claveIdempotencia?: string;
        duracionSegundos?: number;
        mimeType?: string;
      }
    ): Promise<boolean> => {
      if (!audioBlob || audioBlob.size === 0 || !diagramaId || enviando) {
        return false;
      }

      const currentDiagramId = diagramaId;
      const claveIdempotencia =
        opciones?.claveIdempotencia || crypto.randomUUID();

      setEnviando(true);
      setError(null);

      try {
        const formData = new FormData();
        const type = opciones?.mimeType || audioBlob.type || "audio/webm";
        const extension = type.includes("ogg")
          ? "ogg"
          : type.includes("wav")
          ? "wav"
          : type.includes("mp4") || type.includes("m4a")
          ? "m4a"
          : type.includes("mp3") || type.includes("mpeg")
          ? "mp3"
          : "webm";
        formData.append("audio", audioBlob, `grabacion.${extension}`);
        formData.append("clave_idempotencia", claveIdempotencia);
        if (
          opciones?.duracionSegundos !== undefined &&
          opciones.duracionSegundos > 0
        ) {
          formData.append(
            "duracion_segundos",
            opciones.duracionSegundos.toString()
          );
        }

        const res = await enviarAudioIaAction(currentDiagramId, formData);

        // Descartar si el diagrama cambió durante el procesamiento
        if (diagramaActualRef.current !== currentDiagramId) {
          return false;
        }

        if (res.ok) {
          setInteracciones((prev) => [...prev, res.data]);
          return true;
        } else {
          const mensajeError =
            res.errors?.[0] || "Error al procesar el audio con el asistente DRAWI.";
          setError(mensajeError);
          return false;
        }
      } catch {
        if (diagramaActualRef.current === currentDiagramId) {
          setError("Error de red al procesar el audio con el asistente.");
        }
        return false;
      } finally {
        if (diagramaActualRef.current === currentDiagramId) {
          setEnviando(false);
        }
      }
    },
    [diagramaId, enviando]
  );

  // Enviar imagen de diagrama UML en una sola interacción
  const enviarImagen = useCallback(
    async (
      imagenBlob: Blob,
      opciones?: {
        claveIdempotencia?: string;
        nombreArchivo?: string;
      }
    ): Promise<boolean> => {
      if (!imagenBlob || imagenBlob.size === 0 || !diagramaId || enviando) {
        return false;
      }

      const currentDiagramId = diagramaId;
      const claveIdempotencia =
        opciones?.claveIdempotencia || crypto.randomUUID();
      const nombreArchivo =
        opciones?.nombreArchivo ||
        (imagenBlob instanceof File ? imagenBlob.name : "diagrama.png");

      setEnviando(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("imagen", imagenBlob, nombreArchivo);
        formData.append("clave_idempotencia", claveIdempotencia);
        formData.append("nombre_archivo", nombreArchivo);

        const res = await enviarImagenIaAction(currentDiagramId, formData);

        // Descartar si el diagrama cambió durante el procesamiento
        if (diagramaActualRef.current !== currentDiagramId) {
          return false;
        }

        if (res.ok) {
          setInteracciones((prev) => [...prev, res.data]);
          return true;
        } else {
          const mensajeError =
            res.errors?.[0] ||
            "DRAWI no pudo procesar la imagen porque el servicio de IA está temporalmente ocupado. Intenta nuevamente.";
          setError(mensajeError);
          return false;
        }
      } catch {
        if (diagramaActualRef.current === currentDiagramId) {
          setError(
            "DRAWI no pudo procesar la imagen porque el servicio de IA está temporalmente ocupado. Intenta nuevamente."
          );
        }
        return false;
      } finally {
        if (diagramaActualRef.current === currentDiagramId) {
          setEnviando(false);
        }
      }
    },
    [diagramaId, enviando]
  );

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    interacciones,
    cargando,
    enviando,
    error,
    enviarMensaje,
    enviarAudio,
    enviarImagen,
    cargarHistorial,
    limpiarError,
  };
}
