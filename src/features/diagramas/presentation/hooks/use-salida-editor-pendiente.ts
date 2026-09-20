"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";
import { coordinadorColaEditor } from "../services/coordinador-cola-editor";

export interface UseSalidaEditorPendienteReturn {
  hayOperacionesPendientes: boolean;
  totalPendientes: number;
  modalSalidaAbierto: boolean;
  setModalSalidaAbierto: (abierto: boolean) => void;
  solicitarSalida: (accionSalida: () => void) => void;
  confirmarSalida: () => void;
  cancelarSalida: () => void;
}

/**
 * Hook central de protección contra salida accidental cuando existen operaciones
 * pendientes de confirmación con el servidor.
 *
 * Satisface los criterios:
 * - Registra `beforeunload` nativo SOLO cuando hay operaciones pendientes o en curso.
 * - Provee confirmación modal controlada mediante AppAlertDialog para navegación interna y logout.
 * - Permanecer en el editor permite que el coordinador continúe procesando la cola.
 * - Salir conserva todas las operaciones de forma durable en IndexedDB.
 * - Cambiar de página o diagrama dentro del proyecto NO solicita confirmación ni detiene el worker.
 */
export function useSalidaEditorPendiente(usuarioId?: string | null): UseSalidaEditorPendienteReturn {
  const operacionesPendientes = useEditorDiagramaStore((s) => s.operacionesPendientes);
  const [pendientesDurables, setPendientesDurables] = useState(0);
  const [revisionDurable, setRevisionDurable] = useState(0);

  const usuarioActual = usuarioId ?? coordinadorColaEditor.obtenerUsuario();

  // Las confirmaciones/rechazos de cualquier ámbito vuelven a consultar
  // IndexedDB, incluso si el usuario está viendo otro diagrama.
  useEffect(() => {
    const desuscribir = coordinadorColaEditor.suscribir(
      () => setRevisionDurable((revision) => revision + 1),
      () => setRevisionDurable((revision) => revision + 1),
      () => setRevisionDurable((revision) => revision + 1)
    );
    return desuscribir;
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (!usuarioActual || usuarioActual === "sesion") {
      return () => {
        cancelado = true;
      };
    }

    void coordinadorColaEditor
      .contarPendientesUsuario(usuarioActual)
      .then((total) => {
        if (!cancelado) setPendientesDurables(total);
      })
      .catch(() => {
        // El estado local visible sigue protegiendo la salida si IndexedDB
        // no está disponible momentáneamente.
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioActual, revisionDurable]);

  const totalPendientes = Math.max(
    operacionesPendientes.length,
    usuarioActual && usuarioActual !== "sesion" ? pendientesDurables : 0
  );
  const hayOperacionesPendientes = totalPendientes > 0;

  const [modalSalidaAbierto, setModalSalidaAbierto] = useState(false);
  const accionPendienteRef = useRef<(() => void) | null>(null);

  // Protección nativa contra recarga de pestaña o cierre de ventana
  useEffect(() => {
    if (!hayOperacionesPendientes) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // En navegadores modernos se requiere asignar un string no vacío a returnValue
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hayOperacionesPendientes]);

  const solicitarSalida = useCallback(
    (accionSalida: () => void) => {
      if (!hayOperacionesPendientes) {
        accionSalida();
        return;
      }
      accionPendienteRef.current = accionSalida;
      setModalSalidaAbierto(true);
    },
    [hayOperacionesPendientes]
  );

  const confirmarSalida = useCallback(() => {
    setModalSalidaAbierto(false);
    const accion = accionPendienteRef.current;
    accionPendienteRef.current = null;
    if (accion) {
      accion();
    }
  }, []);

  const cancelarSalida = useCallback(() => {
    setModalSalidaAbierto(false);
    accionPendienteRef.current = null;
  }, []);

  return {
    hayOperacionesPendientes,
    totalPendientes,
    modalSalidaAbierto,
    setModalSalidaAbierto,
    solicitarSalida,
    confirmarSalida,
    cancelarSalida,
  };
}
