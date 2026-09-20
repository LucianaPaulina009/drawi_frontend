"use client";

import { useCallback, useEffect, useRef } from "react";
import { colaboracionSocketService } from "../../infrastructure/websocket/colaboracion-socket.service";
import { useColaboracionStore } from "../stores/colaboracion.store";

export interface InfoBloqueoClase {
  estaBloqueada: boolean;
  bloqueadaPorOtro: boolean;
  bloqueadaPorMi: boolean;
  nombreUsuarioBloqueo?: string;
  idUsuarioBloqueo?: string;
}

/**
 * Hook para gestionar el bloqueo exclusivo temporal de una o varias clases UML.
 * Mantiene la renovación periódica (heartbeat cada 10s) mientras el usuario tenga un lock activo,
 * y provee helpers para consultar el estado de bloqueo ante interacciones del editor.
 */
export function useBloqueoClase(idClaseActiva?: string | null) {
  const miUsuarioId = useColaboracionStore((s) => s.miUsuarioId);
  const puedeEditar = useColaboracionStore((s) => s.puedeEditar);
  const bloqueosClases = useColaboracionStore((s) => s.bloqueosClases);

  const lockActivoRef = useRef<string | null>(idClaseActiva ?? null);

  useEffect(() => {
    lockActivoRef.current = idClaseActiva ?? null;
  }, [idClaseActiva]);

  // Renovación periódica simple cada 10 segundos mientras tengamos un lock activo
  // Y liberación automática cuando la clase activa cambia, se deselecciona o se desmonta
  useEffect(() => {
    if (!idClaseActiva || !puedeEditar) return;

    const idClase = idClaseActiva;

    // Solo renovar si efectivamente tenemos el lock concedido
    const intervalo = setInterval(() => {
      const lock = useColaboracionStore.getState().bloqueosClases[idClase];
      if (lock && lock.idUsuario === useColaboracionStore.getState().miUsuarioId) {
        colaboracionSocketService.renovarBloqueoClase(idClase);
      }
    }, 10_000);

    return () => {
      clearInterval(intervalo);
      const lock = useColaboracionStore.getState().bloqueosClases[idClase];
      const miId = useColaboracionStore.getState().miUsuarioId;
      if (lock && miId && lock.idUsuario === miId) {
        colaboracionSocketService.liberarBloqueoClase(idClase);
      }
    };
  }, [idClaseActiva, puedeEditar]);

  const solicitarBloqueo = useCallback(
    (idClase: string): boolean => {
      if (!puedeEditar) return false;
      const lock = useColaboracionStore.getState().bloqueosClases[idClase];
      const miId = useColaboracionStore.getState().miUsuarioId;
      const ahora = Date.now();

      // Si ya está bloqueada por otro usuario y el lock no ha expirado, denegar localmente de inmediato
      if (lock && miId && lock.idUsuario !== miId && (!lock.expiraEn || lock.expiraEn > ahora)) {
        return false;
      }

      colaboracionSocketService.solicitarBloqueoClase(idClase);
      return true;
    },
    [puedeEditar]
  );

  const renovarBloqueo = useCallback((idClase: string) => {
    colaboracionSocketService.renovarBloqueoClase(idClase);
  }, []);

  const liberarBloqueo = useCallback((idClase: string) => {
    colaboracionSocketService.liberarBloqueoClase(idClase);
  }, []);

  const obtenerInfoBloqueo = useCallback(
    (idClase: string): InfoBloqueoClase => {
      const lock = bloqueosClases[idClase];
      const ahora = Date.now();
      if (!lock || (lock.expiraEn && lock.expiraEn <= ahora)) {
        return {
          estaBloqueada: false,
          bloqueadaPorOtro: false,
          bloqueadaPorMi: false,
        };
      }

      const esMio = Boolean(miUsuarioId && lock.idUsuario === miUsuarioId);
      return {
        estaBloqueada: true,
        bloqueadaPorOtro: !esMio,
        bloqueadaPorMi: esMio,
        nombreUsuarioBloqueo: lock.nombreUsuario,
        idUsuarioBloqueo: lock.idUsuario,
      };
    },
    [bloqueosClases, miUsuarioId]
  );

  const infoClaseActiva = idClaseActiva
    ? obtenerInfoBloqueo(idClaseActiva)
    : {
        estaBloqueada: false,
        bloqueadaPorOtro: false,
        bloqueadaPorMi: false,
      };

  return {
    miUsuarioId,
    puedeEditar,
    bloqueosClases,
    infoClaseActiva,
    solicitarBloqueo,
    renovarBloqueo,
    liberarBloqueo,
    obtenerInfoBloqueo,
  };
}
