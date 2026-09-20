"use client";

import { create } from "zustand";
import type {
  BloqueoClase,
  CursorRemoto,
  DragPreviewClase,
  ParticipanteColaborador,
  SalaUnidaData,
} from "../../domain/entities/colaboracion.entity";

export interface EstadoColaboracionStore {
  diagramaId: string | null;
  estadoConexion: "desconectado" | "conectando" | "conectado" | "error";
  miUsuarioId: string | null;
  miRol: string | null;
  puedeEditar: boolean;
  participantes: Record<string, ParticipanteColaborador>;
  cursoresRemotos: Record<string, CursorRemoto>;
  bloqueosClases: Record<string, BloqueoClase>;
  dragPreviews: Record<string, DragPreviewClase>;
  misBloqueos: Set<string>;

  setEstadoConexion: (
    estado: "desconectado" | "conectando" | "conectado" | "error"
  ) => void;
  setSalaUnida: (data: SalaUnidaData) => void;
  actualizarCursorRemoto: (cursor: CursorRemoto) => void;
  removerCursorRemoto: (idUsuario: string) => void;
  actualizarDragPreview: (preview: DragPreviewClase) => void;
  limpiarDragPreview: (idClase: string) => void;
  concederBloqueo: (bloqueo: BloqueoClase) => void;
  liberarBloqueo: (idClase: string) => void;
  removerParticipante: (idUsuario: string) => void;
  resetear: () => void;
}

export const useColaboracionStore = create<EstadoColaboracionStore>((set) => ({
  diagramaId: null,
  estadoConexion: "desconectado",
  miUsuarioId: null,
  miRol: null,
  puedeEditar: true,
  participantes: {},
  cursoresRemotos: {},
  bloqueosClases: {},
  dragPreviews: {},
  misBloqueos: new Set<string>(),

  setEstadoConexion: (estadoConexion) => set({ estadoConexion }),

  setSalaUnida: (data) =>
    set(() => {
      const participantesMap: Record<string, ParticipanteColaborador> = {};
      for (const p of data.participantes) {
        participantesMap[p.idUsuario] = p;
      }

      const bloqueosMap: Record<string, BloqueoClase> = {};
      const misBloqueos = new Set<string>();
      for (const b of data.bloqueos) {
        bloqueosMap[b.idClase] = b;
        if (b.idUsuario === data.miUsuarioId) {
          misBloqueos.add(b.idClase);
        }
      }

      return {
        diagramaId: data.diagramaId,
        miUsuarioId: data.miUsuarioId,
        miRol: data.miRol,
        puedeEditar: data.puedeEditar,
        participantes: participantesMap,
        bloqueosClases: bloqueosMap,
        misBloqueos,
        // Limpiar cursores y previews de sesiones anteriores
        cursoresRemotos: {},
        dragPreviews: {},
        estadoConexion: "conectado",
      };
    }),

  actualizarCursorRemoto: (cursor) =>
    set((state) => {
      if (cursor.idUsuario === state.miUsuarioId) {
        return state;
      }
      return {
        cursoresRemotos: {
          ...state.cursoresRemotos,
          [cursor.idUsuario]: cursor,
        },
      };
    }),

  removerCursorRemoto: (idUsuario) =>
    set((state) => {
      const restantes = { ...state.cursoresRemotos };
      delete restantes[idUsuario];
      return { cursoresRemotos: restantes };
    }),

  actualizarDragPreview: (preview) =>
    set((state) => {
      if (preview.idUsuario === state.miUsuarioId) {
        return state;
      }
      if (
        !Number.isFinite(preview.posicionX) ||
        !Number.isFinite(preview.posicionY)
      ) {
        return state;
      }
      return {
        dragPreviews: {
          ...state.dragPreviews,
          [preview.idClase]: preview,
        },
      };
    }),

  limpiarDragPreview: (idClase) =>
    set((state) => {
      if (!state.dragPreviews[idClase]) {
        return state;
      }
      const restantes = { ...state.dragPreviews };
      delete restantes[idClase];
      return { dragPreviews: restantes };
    }),

  concederBloqueo: (bloqueo) =>
    set((state) => {
      const bloqueosClases = {
        ...state.bloqueosClases,
        [bloqueo.idClase]: bloqueo,
      };
      const misBloqueos = new Set(state.misBloqueos);
      if (bloqueo.idUsuario === state.miUsuarioId) {
        misBloqueos.add(bloqueo.idClase);
      } else {
        misBloqueos.delete(bloqueo.idClase);
      }
      return { bloqueosClases, misBloqueos };
    }),

  liberarBloqueo: (idClase) =>
    set((state) => {
      const bloqueosClases = { ...state.bloqueosClases };
      delete bloqueosClases[idClase];
      const misBloqueos = new Set(state.misBloqueos);
      misBloqueos.delete(idClase);
      return { bloqueosClases, misBloqueos };
    }),

  removerParticipante: (idUsuario) =>
    set((state) => {
      const participantes = { ...state.participantes };
      delete participantes[idUsuario];

      const cursoresRemotos = { ...state.cursoresRemotos };
      delete cursoresRemotos[idUsuario];

      const bloqueosClases = { ...state.bloqueosClases };
      for (const [idClase, b] of Object.entries(bloqueosClases)) {
        if (b.idUsuario === idUsuario) {
          delete bloqueosClases[idClase];
        }
      }

      const dragPreviews = { ...state.dragPreviews };
      for (const [idClase, dp] of Object.entries(dragPreviews)) {
        if (dp.idUsuario === idUsuario) {
          delete dragPreviews[idClase];
        }
      }

      return {
        participantes,
        cursoresRemotos,
        bloqueosClases,
        dragPreviews,
      };
    }),

  resetear: () =>
    set({
      diagramaId: null,
      estadoConexion: "desconectado",
      miUsuarioId: null,
      miRol: null,
      puedeEditar: true,
      participantes: {},
      cursoresRemotos: {},
      bloqueosClases: {},
      dragPreviews: {},
      misBloqueos: new Set<string>(),
    }),
}));
