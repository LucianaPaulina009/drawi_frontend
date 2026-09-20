"use client";

import { useCallback } from "react";

import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import { ColaEditorIndexedDbRepository } from "../../infrastructure/repositories/cola-editor-indexeddb.repository";
import { coordinadorColaEditor } from "../services/coordinador-cola-editor";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";

const repository = new ColaEditorIndexedDbRepository();

function esIdEntidadDelPayload(
  actionId: string,
  payload: Record<string, unknown>
): boolean {
  return [
    payload.idClase,
    payload.idAtributo,
    payload.idRelacion,
    payload.idEstructuraNm,
  ].some((id) => id === actionId);
}

export function useEncolarOperacionEditor(scopeKey: string | null) {
  return useCallback(
    async (
      tipo: string,
      payload: Record<string, unknown>,
      opciones?: { actionId?: string; dependsOn?: string[]; grupoAtomico?: string }
    ) => {
      if (!scopeKey) throw new Error("No hay un diagrama activo para encolar la operación.");

      const actionId = opciones?.actionId ?? crypto.randomUUID();
      if (esIdEntidadDelPayload(actionId, payload)) {
        throw new Error(
          "actionId debe identificar la operación y no puede reutilizar el UUID de la entidad."
        );
      }
      const store = useEditorDiagramaStore.getState();

      // Validación defensiva estricta contra valores NaN en mutaciones encoladas
      for (const [clave, valor] of Object.entries(payload)) {
        if (typeof valor === "number" && !Number.isFinite(valor)) {
          console.error(
            `[ColaEditor] Intento de encolar NaN en tipo=${tipo}, campo=${clave}, payload=`,
            payload
          );
          throw new Error(
            `Operación inválida: el campo "${clave}" en la operación ${tipo} no es un número finito (${valor}).`
          );
        }
        if (typeof valor === "object" && valor !== null) {
          for (const [subClave, subValor] of Object.entries(valor)) {
            if (typeof subValor === "number" && !Number.isFinite(subValor)) {
              console.error(
                `[ColaEditor] Intento de encolar NaN en tipo=${tipo}, subcampo=${clave}.${subClave}, payload=`,
                payload
              );
              throw new Error(
                `Operación inválida: el campo "${clave}.${subClave}" en la operación ${tipo} no es un número finito (${subValor}).`
              );
            }
          }
        }
      }

      console.debug(
        `[ColaEditor] Encolando operación: tipo=${tipo}, actionId=${actionId}, scopeKey=${scopeKey}, payload=`,
        payload
      );

      const operacion: OperacionEditor = {
        actionId,
        scopeKey,
        tipo,
        payload,
        dependsOn: opciones?.dependsOn ?? [],
        dependencias: opciones?.dependsOn ?? [],
        grupoAtomico: opciones?.grupoAtomico,
        estado: "pendiente",
        intentos: 0,
        creadaEn: Date.now(),
        version: 1,
      };

      // 1. Reducción inmediata en Zustand sin esperar red ni IndexedDB
      store.ejecutarOperacionLocal(operacion);

      // 2. Escritura durable en IndexedDB
      try {
        await repository.guardar(operacion);
        store.fijarTrabajoNoProtegido(false);

        // Despertar coordinador para procesar
        coordinadorColaEditor.registrarScope(scopeKey);
        coordinadorColaEditor.despertar();
      } catch (error) {
        // Criterio spec: fallo disco muestra trabajo no protegido y no afirma guardado
        store.fijarTrabajoNoProtegido(true);
        console.error("Fallo al persistir operación durable en IndexedDB:", error);
      }

      return operacion;
    },
    [scopeKey]
  );
}

export { repository as colaEditorRepository };
