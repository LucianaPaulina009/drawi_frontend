import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiagramaDetalle } from "../../domain/entities/diagrama.entity";
import * as diagramaActions from "../actions/diagrama.action";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";
import { useHidratacionEditor } from "./use-hidratacion-editor";

vi.mock("../actions/diagrama.action", () => ({
  obtenerDiagramaAction: vi.fn(),
}));

const mockDetalleA: DiagramaDetalle = {
  id: "diag-A",
  idProyecto: "proy-1",
  nombre: "Diagrama A",
  numero: 1,
  clases: [],
  relaciones: [],
  estructurasNm: [],
};

const mockDetalleB: DiagramaDetalle = {
  id: "diag-B",
  idProyecto: "proy-1",
  nombre: "Diagrama B",
  numero: 2,
  clases: [
    {
      id: "clase-b1",
      idDiagrama: "diag-B",
      nombre: "ClaseB",
      posicionX: 100,
      posicionY: 100,
      ancho: 200,
      atributos: [],
    },
  ],
  relaciones: [],
  estructurasNm: [],
};

describe("useHidratacionEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorDiagramaStore.getState().limpiar();
  });

  it("carga detalle autorizado y reconstruye el dominio en el store", async () => {
    vi.mocked(diagramaActions.obtenerDiagramaAction).mockResolvedValueOnce({
      ok: true,
      data: mockDetalleA,
    });

    const { result } = renderHook(() =>
      useHidratacionEditor({
        usuarioId: "user-1",
        proyectoId: "proy-1",
        diagramaId: "diag-A",
      })
    );

    expect(result.current.cargando).toBe(true);

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    const estado = useEditorDiagramaStore.getState();
    expect(estado.scopeKey).toBe("user-1:diag-A");
    expect(estado.detalleConfirmado?.id).toBe("diag-A");
  });

  it("descarta respuestas tardías de diagramas anteriores (token de solicitud)", async () => {
    let resolverA: (val: any) => void;
    const promesaA = new Promise((resolve) => {
      resolverA = resolve;
    });

    vi.mocked(diagramaActions.obtenerDiagramaAction).mockImplementation((_pId, dId) => {
      if (dId === "diag-A") {
        return promesaA as any;
      }
      return Promise.resolve({ ok: true, data: mockDetalleB });
    });

    const { rerender, result } = renderHook(
      ({ diagramaId }) =>
        useHidratacionEditor({
          usuarioId: "user-1",
          proyectoId: "proy-1",
          diagramaId,
        }),
      { initialProps: { diagramaId: "diag-A" } }
    );

    // Cambiar rápidamente a diag-B antes de que diag-A responda
    rerender({ diagramaId: "diag-B" });

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    // Ahora diag-B está en el store
    expect(useEditorDiagramaStore.getState().scopeKey).toBe("user-1:diag-B");
    expect(useEditorDiagramaStore.getState().detalleConfirmado?.id).toBe("diag-B");

    // Llega la respuesta tardía de diag-A
    resolverA!({ ok: true, data: mockDetalleA });

    // Esperar un ciclo y verificar que no pisó diag-B
    await new Promise((r) => setTimeout(r, 10));
    expect(useEditorDiagramaStore.getState().scopeKey).toBe("user-1:diag-B");
    expect(useEditorDiagramaStore.getState().detalleConfirmado?.id).toBe("diag-B");
  });

  it("limpia el dominio visible inmediatamente al cambiar de diagrama", async () => {
    useEditorDiagramaStore.getState().hidratar("user-1:diag-A", {
      ...mockDetalleA,
      clases: [{
        id: "clase-a1",
        idDiagrama: "diag-A",
        nombre: "ClaseA",
        posicionX: 0,
        posicionY: 0,
        ancho: 200,
        atributos: [],
      }],
    });

    let resolverB: (value: any) => void;
    const promesaB = new Promise((resolve) => {
      resolverB = resolve;
    });
    vi.mocked(diagramaActions.obtenerDiagramaAction).mockReturnValue(promesaB as any);

    const { rerender } = renderHook(
      ({ diagramaId }) =>
        useHidratacionEditor({
          usuarioId: "user-1",
          proyectoId: "proy-1",
          diagramaId,
        }),
      { initialProps: { diagramaId: "diag-A" } }
    );

    rerender({ diagramaId: "diag-B" });
    expect(useEditorDiagramaStore.getState().clases).toHaveLength(0);

    resolverB!({ ok: true, data: mockDetalleB });
    await waitFor(() => {
      expect(useEditorDiagramaStore.getState().detalleConfirmado?.id).toBe("diag-B");
    });
    expect(useEditorDiagramaStore.getState().clases[0].id).toBe("clase-b1");
  });

  it("no ejecuta petición si diagramaId es null y limpia el dominio visible", async () => {
    useEditorDiagramaStore.getState().seleccionarClase("clase-anterior");

    const { result } = renderHook(() =>
      useHidratacionEditor({
        usuarioId: "user-1",
        proyectoId: "proy-1",
        diagramaId: null,
      })
    );

    expect(result.current.cargando).toBe(false);
    expect(diagramaActions.obtenerDiagramaAction).not.toHaveBeenCalled();
    expect(useEditorDiagramaStore.getState().claseSeleccionadaId).toBeNull();
  });
});
