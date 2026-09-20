"use client";

import { useEffect, useRef } from "react";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import {
  esScopeValido,
  parsearScopeEditor,
  type OperacionEditor,
} from "../../domain/entities/operacion-editor.entity";
import type { ColaEditorRepository } from "../../domain/repositories/cola-editor.repository";
import {
  coordinadorColaEditor,
  type CoordinadorColaEditor,
} from "../services/coordinador-cola-editor";
import type { DespachadorOperacionEditor } from "../services/ejecutor-operacion-editor";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";

export interface UseProcesadorColaEditorArgs {
  scopeKey: string | null;
  repository?: ColaEditorRepository;
  despachar?: DespachadorOperacionEditor;
  obtenerDetalleConfirmado?: () => unknown;
  alRechazar?: (operacion: OperacionEditor, mensaje: string) => void;
  revision?: number;
  coordinador?: CoordinadorColaEditor;
}

/**
 * Hook de integración con el Coordinador único por usuario.
 * Registra el ámbito visible, escucha confirmaciones y rechazos, y despierta
 * el procesamiento cuando cambia la revisión o se reconecta.
 *
 * Invariante central: desmontar este hook (cambio de página o diagrama) NO detiene
 * ni cancela el worker del coordinador; solo desuscribe los listeners locales.
 */
export function useProcesadorColaEditor({
  scopeKey,
  alRechazar,
  revision = 0,
  coordinador = coordinadorColaEditor,
}: UseProcesadorColaEditorArgs) {
  const alRechazarRef = useRef(alRechazar);
  useEffect(() => {
    alRechazarRef.current = alRechazar;
  }, [alRechazar]);

  useEffect(() => {
    if (!scopeKey || !esScopeValido(scopeKey)) return;

    const { usuarioId } = parsearScopeEditor(scopeKey);
    if (usuarioId && usuarioId !== "sesion") {
      coordinador.establecerUsuario(usuarioId);
    }

    coordinador.registrarScope(scopeKey);

    const desuscribir = coordinador.suscribir(
      (operacion: OperacionEditor, recibo?: ConfirmacionOperacionDiagrama) => {
        // Si pertenece al ámbito visible, aplicar recibo con rebase/reproyección o retirar
        if (operacion.scopeKey === scopeKey) {
          if (recibo && typeof recibo === "object" && "efectos" in recibo && (recibo as any).efectos) {
            useEditorDiagramaStore.getState().aplicarRecibo(recibo);
          } else {
            useEditorDiagramaStore.getState().retirarOperacion(operacion.actionId);
          }
        }
      },
      (operacion: OperacionEditor, mensaje: string) => {
        if (operacion.scopeKey === scopeKey) {
          useEditorDiagramaStore.getState().actualizarOperacionPendiente(operacion.actionId, {
            ...operacion,
            ultimoError: mensaje,
          });
          alRechazarRef.current?.(operacion, mensaje);
        }
      },
      (operacion: OperacionEditor) => {
        if (operacion.scopeKey === scopeKey) {
          useEditorDiagramaStore.getState().actualizarOperacionPendiente(operacion.actionId, operacion);
        }
      }
    );

    coordinador.despertar();

    // Al desmontar por cambio de página, solo liberamos listeners sin detener el worker
    return () => {
      desuscribir();
    };
  }, [coordinador, scopeKey]);

  useEffect(() => {
    if (scopeKey && esScopeValido(scopeKey)) {
      coordinador.despertar();
    }
  }, [coordinador, revision, scopeKey]);
}
