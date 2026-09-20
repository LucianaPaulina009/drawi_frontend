"use client";

import { useEffect, useRef, useState } from "react";

import {
  crearScopeEditor,
  esScopeValido,
} from "../../domain/entities/operacion-editor.entity";
import { ColaEditorIndexedDbRepository } from "../../infrastructure/repositories/cola-editor-indexeddb.repository";
import { obtenerDiagramaAction } from "../actions/diagrama.action";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";

const cola = new ColaEditorIndexedDbRepository();

export interface UseHidratacionEditorArgs {
  usuarioId: string | null | undefined;
  proyectoId: string;
  diagramaId: string | null;
  alFallar?: (mensaje: string) => void;
}

/**
 * Carga autorizada una vez por entrada o cambio de UUID del diagrama + replay
 * determinístico de la cola IndexedDB.
 *
 * Invariantes:
 *  - Solicitudes tardías nunca reemplazan al diagrama vigente (token solicitudRef).
 *  - Reconstrucción: servidor + cola reconstruyen el dominio de trabajo.
 *  - Cambios ajenos (renders, queries, renames) no resetean ni duplican el GET.
 */
export function useHidratacionEditor({
  usuarioId,
  proyectoId,
  diagramaId,
  alFallar,
}: UseHidratacionEditorArgs) {
  const hidratar = useEditorDiagramaStore((estado) => estado.hidratar);
  const limpiar = useEditorDiagramaStore((estado) => estado.limpiar);
  const limpiarDominioVisible = useEditorDiagramaStore((estado) => estado.limpiarDominioVisible);
  const solicitudRef = useRef(0);
  const alFallarRef = useRef(alFallar);
  useEffect(() => {
    alFallarRef.current = alFallar;
  }, [alFallar]);

  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(Boolean(diagramaId));

  useEffect(() => {
    if (!diagramaId) {
      limpiar();
      // El estado refleja el fin de una hidratación inválida sin iniciar otra.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCargando(false);
      setError(null);
      return;
    }

    if (!usuarioId || usuarioId === "sesion") {
      setCargando(false);
      return;
    }

    const scopeKey = crearScopeEditor(usuarioId, diagramaId);
    if (!esScopeValido(scopeKey)) {
      setCargando(false);
      return;
    }

    // Aislar inmediatamente la nueva página: las operaciones de la cola
    // durable permanecen en IndexedDB y el coordinador sigue procesándolas,
    // pero el lienzo no puede mostrar temporalmente el dominio anterior.
    limpiarDominioVisible();

    let cancelada = false;
    const solicitud = ++solicitudRef.current;
    setCargando(true);
    setError(null);

    void Promise.all([
      obtenerDiagramaAction(proyectoId, diagramaId),
      cola.listar(scopeKey),
    ])
      .then(([respuesta, operaciones]) => {
        if (cancelada || solicitud !== solicitudRef.current) return;
        if (!respuesta.ok || respuesta.data.id !== diagramaId) {
          const errorMsg = respuesta.ok
            ? "El diagrama solicitado no coincide."
            : respuesta.errors[0] ?? "No se pudo cargar el diagrama.";
          setError(errorMsg);
          alFallarRef.current?.(errorMsg);
          return;
        }

        // Reconstrucción del dominio: detalle confirmado del servidor + replay de pendientes locales
        hidratar(scopeKey, respuesta.data, operaciones);
      })
      .catch(() => {
        if (!cancelada && solicitud === solicitudRef.current) {
          const errorMsg = "Error de conexión al cargar el diagrama.";
          setError(errorMsg);
          alFallarRef.current?.(errorMsg);
        }
      })
      .finally(() => {
        if (!cancelada && solicitud === solicitudRef.current) {
          setCargando(false);
        }
      });

    return () => {
      cancelada = true;
    };
  }, [diagramaId, hidratar, limpiar, limpiarDominioVisible, proyectoId, usuarioId]);

  return { cargando, error };
}
