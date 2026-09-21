"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InteraccionIa } from "../../domain/entities/interaccion-ia.entity";
import {
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
    async (texto: string): Promise<boolean> => {
      const textoLimpio = texto.trim();
      if (!textoLimpio || !diagramaId || enviando) {
        return false;
      }

      const currentDiagramId = diagramaId;
      const claveIdempotencia = crypto.randomUUID();
      const tempId = crypto.randomUUID();

      const optimista: InteraccionIa = {
        id: tempId,
        idDiagrama: currentDiagramId,
        idUsuario: "yo",
        tipo: "CONVERSACION",
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

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    interacciones,
    cargando,
    enviando,
    error,
    enviarMensaje,
    cargarHistorial,
    limpiarError,
  };
}
