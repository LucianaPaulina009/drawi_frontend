import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiagramaDetalle } from "../../domain/entities/diagrama.entity";
import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import * as diagramaActions from "../actions/diagrama.action";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";
import { useHidratacionEditor } from "./use-hidratacion-editor";
import { useSalidaEditorPendiente } from "./use-salida-editor-pendiente";

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

describe("Hidratación y Salida Segura del Editor (T046)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorDiagramaStore.getState().limpiar();
  });

  it("garantiza exactamente un GET por entrada/cambio real y cero GET por mutación local o confirmación", async () => {
    vi.mocked(diagramaActions.obtenerDiagramaAction).mockResolvedValueOnce({
      ok: true,
      data: mockDetalleA,
    });

    // 1. Entrada inicial: un solo GET para cargar el diagrama
    const { result } = renderHook(() =>
      useHidratacionEditor({
        usuarioId: "user-1",
        proyectoId: "proy-1",
        diagramaId: "diag-A",
      })
    );

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(diagramaActions.obtenerDiagramaAction).toHaveBeenCalledTimes(1);

    // 2. Ejecutar mutación local: CREAR_CLASE
    const opCrear: OperacionEditor = {
      actionId: "op-sin-get-1",
      scopeKey: "user-1:diag-A",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-1", nombre: "Articulo", posicionX: 50, posicionY: 50, ancho: 200 },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrear);

    // Cero GETs adicionales ejecutados
    expect(diagramaActions.obtenerDiagramaAction).toHaveBeenCalledTimes(1);

    // 3. Confirmación recibida del servidor: aplicar recibo vía rebase
    const recibo: ConfirmacionOperacionDiagrama = {
      actionId: "op-sin-get-1",
      idDiagrama: "diag-A",
      tipo: "CREAR_CLASE",
      efectos: {
        clasesActualizadas: [
          { id: "c-1", idDiagrama: "diag-A", nombre: "Articulo", posicionX: 50, posicionY: 50, ancho: 200, atributos: [] },
        ],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: [],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    useEditorDiagramaStore.getState().aplicarRecibo(recibo);

    // Todavía exactamente 1 GET: cero GETs por mutación
    expect(diagramaActions.obtenerDiagramaAction).toHaveBeenCalledTimes(1);
    expect(useEditorDiagramaStore.getState().clases.length).toBe(1);
    expect(useEditorDiagramaStore.getState().clases[0].id).toBe("c-1");
  });

  it("gestiona navegación A -> B -> A descartando respuestas tardías y preservando cola sin colisiones", async () => {
    let resolverA1: (val: any) => void;
    const promesaA1 = new Promise((resolve) => {
      resolverA1 = resolve;
    });

    vi.mocked(diagramaActions.obtenerDiagramaAction).mockImplementation((_pId, dId) => {
      if (dId === "diag-A") {
        return promesaA1 as any;
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

    // Transición rápida A -> B antes de que A responda
    rerender({ diagramaId: "diag-B" });

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(useEditorDiagramaStore.getState().scopeKey).toBe("user-1:diag-B");
    expect(useEditorDiagramaStore.getState().clases[0].nombre).toBe("ClaseB");

    // Llega respuesta tardía de la primera carga de A
    resolverA1!({ ok: true, data: mockDetalleA });
    await new Promise((r) => setTimeout(r, 10));

    // El store sigue mostrando B
    expect(useEditorDiagramaStore.getState().scopeKey).toBe("user-1:diag-B");

    // Transición B -> A
    vi.mocked(diagramaActions.obtenerDiagramaAction).mockResolvedValueOnce({
      ok: true,
      data: mockDetalleA,
    });

    rerender({ diagramaId: "diag-A" });

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(useEditorDiagramaStore.getState().scopeKey).toBe("user-1:diag-A");
    expect(useEditorDiagramaStore.getState().detalleConfirmado?.id).toBe("diag-A");
  });

  it("recupera respuesta perdida mediante reintento idempotente sin duplicar entidades", async () => {
    useEditorDiagramaStore.getState().hidratar("user-1:diag-A", mockDetalleA);

    const op: OperacionEditor = {
      actionId: "op-perdida-1",
      scopeKey: "user-1:diag-A",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-idemp", nombre: "Unica", posicionX: 0, posicionY: 0, ancho: 200 },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    };

    useEditorDiagramaStore.getState().ejecutarOperacionLocal(op);

    // Servidor devuelve el recibo previamente guardado (replay idempotente)
    const reciboReplay: ConfirmacionOperacionDiagrama = {
      actionId: "op-perdida-1",
      idDiagrama: "diag-A",
      tipo: "CREAR_CLASE",
      efectos: {
        clasesActualizadas: [
          { id: "c-idemp", idDiagrama: "diag-A", nombre: "Unica", posicionX: 0, posicionY: 0, ancho: 200, atributos: [] },
        ],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: [],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    // Aplicar recibo por rebase
    useEditorDiagramaStore.getState().aplicarRecibo(reciboReplay);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.clases.length).toBe(1);
    expect(estado.clases[0].id).toBe("c-idemp");
    expect(estado.operacionesPendientes.length).toBe(0);

    // Si se reintenta aplicar el mismo recibo (replay duplicado), no duplica clases
    useEditorDiagramaStore.getState().aplicarRecibo(reciboReplay);
    expect(useEditorDiagramaStore.getState().clases.length).toBe(1);
  });

  it("useSalidaEditorPendiente protege contra navegación interna accidental y beforeunload", () => {
    useEditorDiagramaStore.getState().limpiar();

    const { result, rerender } = renderHook(() => useSalidaEditorPendiente());

    // 1. Sin pendientes: salida directa
    let navegacionEjecutada = false;
    act(() => {
      result.current.solicitarSalida(() => {
        navegacionEjecutada = true;
      });
    });
    expect(navegacionEjecutada).toBe(true);
    expect(result.current.modalSalidaAbierto).toBe(false);

    // 2. Con pendientes: bloquea y abre diálogo
    useEditorDiagramaStore.getState().ejecutarOperacionLocal({
      actionId: "op-salida",
      scopeKey: "user-1:diag-A",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-1", nombre: "Clase" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    rerender();
    expect(result.current.hayOperacionesPendientes).toBe(true);
    expect(result.current.totalPendientes).toBe(1);

    let navegacionInterna = false;
    act(() => {
      result.current.solicitarSalida(() => {
        navegacionInterna = true;
      });
    });

    // No navega inmediatamente; abre modal
    expect(navegacionInterna).toBe(false);
    expect(result.current.modalSalidaAbierto).toBe(true);

    // Cancelar salida: el usuario permanece en el editor
    act(() => {
      result.current.cancelarSalida();
    });
    expect(result.current.modalSalidaAbierto).toBe(false);
    expect(navegacionInterna).toBe(false);

    // Volver a solicitar y confirmar salida
    act(() => {
      result.current.solicitarSalida(() => {
        navegacionInterna = true;
      });
    });
    expect(result.current.modalSalidaAbierto).toBe(true);

    act(() => {
      result.current.confirmarSalida();
    });
    expect(result.current.modalSalidaAbierto).toBe(false);
    expect(navegacionInterna).toBe(true);
  });
});
