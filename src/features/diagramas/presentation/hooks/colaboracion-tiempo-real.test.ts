import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColaboracionStore } from "../stores/colaboracion.store";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";
import { useColaboracionTiempoReal } from "./use-colaboracion-tiempo-real";
import { colaboracionSocketService } from "../../infrastructure/websocket/colaboracion-socket.service";
import type { FrameServidorWS } from "../../infrastructure/schemas/colaboracion.schemas";

describe("colaboracion.store & useColaboracionTiempoReal", () => {
  let mensajeHandler: ((frame: FrameServidorWS) => void) | null = null;

  beforeEach(() => {
    useColaboracionStore.getState().resetear();
    useEditorDiagramaStore.getState().limpiar();

    mensajeHandler = null;
    vi.spyOn(colaboracionSocketService, "conectar").mockImplementation(() => {});
    vi.spyOn(colaboracionSocketService, "desconectar").mockImplementation(() => {});
    vi.spyOn(colaboracionSocketService, "suscribirMensaje").mockImplementation((callback) => {
      mensajeHandler = callback;
      return () => {
        mensajeHandler = null;
      };
    });
  });

  it("procesa frame SALA_UNIDA y actualiza el store de colaboración sin error", () => {
    const { unmount } = renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    expect(colaboracionSocketService.conectar).toHaveBeenCalledWith("diag-123");
    expect(mensajeHandler).toBeDefined();

    // Simular recepción de frame SALA_UNIDA
    act(() => {
      mensajeHandler?.({
        tipo: "SALA_UNIDA",
        payload: {
          diagramaId: "diag-123",
          miUsuarioId: "usr-1",
          miRol: "editor",
          puedeEditar: true,
          participantes: [
            {
              idUsuario: "usr-1",
              nombreUsuario: "Usuario 1",
              color: "#3B82F6",
              rol: "editor",
              puedeEditar: true,
            },
            {
              idUsuario: "usr-2",
              nombreUsuario: "Usuario 2",
              color: "#EF4444",
              rol: "editor",
              puedeEditar: true,
            },
          ],
          bloqueos: [
            {
              idClase: "clase-a",
              idUsuario: "usr-2",
              nombreUsuario: "Usuario 2",
              expiraEn: Date.now() + 30000,
            },
          ],
        },
      });
    });

    const state = useColaboracionStore.getState();
    expect(state.diagramaId).toBe("diag-123");
    expect(state.miUsuarioId).toBe("usr-1");
    expect(state.miRol).toBe("editor");
    expect(state.puedeEditar).toBe(true);
    expect(state.estadoConexion).toBe("conectado");
    expect(Object.keys(state.participantes)).toHaveLength(2);
    expect(state.bloqueosClases["clase-a"]).toBeDefined();
    expect(state.bloqueosClases["clase-a"]?.nombreUsuario).toBe("Usuario 2");

    unmount();
    expect(colaboracionSocketService.desconectar).toHaveBeenCalled();
    expect(useColaboracionStore.getState().diagramaId).toBeNull();
  });

  it("procesa frame CURSOR_ACTUALIZADO para usuarios remotos", () => {
    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    act(() => {
      mensajeHandler?.({
        tipo: "SALA_UNIDA",
        payload: {
          diagramaId: "diag-123",
          miUsuarioId: "usr-1",
          miRol: "editor",
          puedeEditar: true,
          participantes: [],
          bloqueos: [],
        },
      });
    });

    // Cursor de otro usuario
    act(() => {
      mensajeHandler?.({
        tipo: "CURSOR_ACTUALIZADO",
        payload: {
          idUsuario: "usr-2",
          nombreUsuario: "Usuario 2",
          color: "#EF4444",
          x: 250,
          y: 400,
          actualizadoEn: Date.now(),
        },
      });
    });

    const cursores = useColaboracionStore.getState().cursoresRemotos;
    expect(cursores["usr-2"]).toBeDefined();
    expect(cursores["usr-2"]?.x).toBe(250);
    expect(cursores["usr-2"]?.y).toBe(400);

    // Cursor propio no se agrega a cursoresRemotos
    act(() => {
      mensajeHandler?.({
        tipo: "CURSOR_ACTUALIZADO",
        payload: {
          idUsuario: "usr-1",
          nombreUsuario: "Usuario 1",
          color: "#3B82F6",
          x: 100,
          y: 100,
          actualizadoEn: Date.now(),
        },
      });
    });

    expect(useColaboracionStore.getState().cursoresRemotos["usr-1"]).toBeUndefined();
  });

  it("procesa frames de bloqueo y liberación de clases", () => {
    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    act(() => {
      mensajeHandler?.({
        tipo: "BLOQUEO_CLASE_CONCEDIDO",
        payload: {
          idClase: "clase-x",
          idUsuario: "usr-2",
          nombreUsuario: "Usuario 2",
          expiraEn: Date.now() + 30000,
        },
      });
    });

    expect(useColaboracionStore.getState().bloqueosClases["clase-x"]).toBeDefined();
    expect(useColaboracionStore.getState().bloqueosClases["clase-x"]?.nombreUsuario).toBe("Usuario 2");

    act(() => {
      mensajeHandler?.({
        tipo: "BLOQUEO_CLASE_LIBERADO",
        payload: {
          idClase: "clase-x",
        },
      });
    });

    expect(useColaboracionStore.getState().bloqueosClases["clase-x"]).toBeUndefined();
  });

  it("procesa frame MUTACION_CONFIRMADA y actualiza editor-diagrama.store", () => {
    // Hidratar store del editor
    useEditorDiagramaStore.getState().hidratar("usr-1:diag-123", {
      id: "diag-123",
      idProyecto: "proy-1",
      nombre: "Diagrama 1",
      numero: 1,
      clases: [],
      relaciones: [],
      estructurasNm: [],
    });

    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    act(() => {
      mensajeHandler?.({
        tipo: "MUTACION_CONFIRMADA",
        payload: {
          diagramaId: "diag-123",
          actionId: "act-remoto-1",
          tipoOperacion: "CREAR_CLASE",
          emisorId: "usr-2",
          efectos: {
            clasesActualizadas: [
              {
                id: "clase-nueva-1",
                idDiagrama: "diag-123",
                nombre: "Cliente",
                posicionX: 100,
                posicionY: 150,
                ancho: 200,
                colorCabecera: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                atributos: [],
              },
            ],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        },
      });
    });

    const clases = useEditorDiagramaStore.getState().clases;
    expect(clases).toHaveLength(1);
    expect(clases[0]?.nombre).toBe("Cliente");
  });

  it("normaliza payload de backend con campos snake_case (FastAPI REST & WebSocket)", () => {
    useEditorDiagramaStore.getState().hidratar("usr-1:diag-123", {
      id: "diag-123",
      idProyecto: "proy-1",
      nombre: "Diagrama 1",
      numero: 1,
      clases: [],
      relaciones: [],
      estructurasNm: [],
    });

    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    act(() => {
      mensajeHandler?.({
        tipo: "MUTACION_CONFIRMADA",
        payload: {
          diagramaId: "diag-123",
          actionId: "act-snake-case",
          tipoOperacion: "CREAR_CLASE",
          emisorId: "usr-2",
          efectos: {
            clases_actualizadas: [
              {
                id: "c-snake",
                id_diagrama: "diag-123",
                nombre: "Pedido",
                posicion_x: 220,
                posicion_y: 330,
                ancho: 280,
                atributos: [
                  {
                    id: "a-1",
                    id_clase: "c-snake",
                    nombre: "id",
                    tipo_dato: "integer",
                    es_llave_primaria: true,
                    permite_nulo: false,
                    orden_de_posicion: 1,
                    procedencia: "sistema_clase",
                  },
                ],
              },
            ],
            clases_eliminadas: [],
            relaciones_actualizadas: [],
            relaciones_eliminadas: [],
            estructuras_nm_actualizadas: [],
            estructuras_nm_eliminadas: [],
          },
        },
      });
    });

    const clases = useEditorDiagramaStore.getState().clases;
    expect(clases).toHaveLength(1);
    const c = clases[0]!;
    expect(c.nombre).toBe("Pedido");
    expect(c.posicionX).toBe(220);
    expect(c.posicionY).toBe(330);
    expect(c.atributos).toHaveLength(1);
    expect(c.atributos[0]?.tipoDato).toBe("integer");
    expect(c.atributos[0]?.esLlavePrimaria).toBe(true);
  });

  it("actualiza relaciones y estructuras N:M recibidas en frame remoto", () => {
    useEditorDiagramaStore.getState().hidratar("usr-1:diag-123", {
      id: "diag-123",
      idProyecto: "proy-1",
      nombre: "Diagrama 1",
      numero: 1,
      clases: [
        {
          id: "c-1",
          idDiagrama: "diag-123",
          nombre: "Usuario",
          posicionX: 100,
          posicionY: 100,
          ancho: 280,
          atributos: [],
        },
        {
          id: "c-2",
          idDiagrama: "diag-123",
          nombre: "Rol",
          posicionX: 500,
          posicionY: 100,
          ancho: 280,
          atributos: [],
        },
      ],
      relaciones: [],
      estructurasNm: [],
    });

    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    act(() => {
      mensajeHandler?.({
        tipo: "MUTACION_CONFIRMADA",
        payload: {
          diagramaId: "diag-123",
          actionId: "act-rel-nm",
          tipoOperacion: "CREAR_ESTRUCTURA_NM",
          emisorId: "usr-2",
          efectos: {
            clases_actualizadas: [
              {
                id: "c-inter",
                id_diagrama: "diag-123",
                nombre: "UsuarioRol",
                posicion_x: 300,
                posicion_y: 250,
                ancho: 280,
                atributos: [],
              },
            ],
            clases_eliminadas: [],
            relaciones_actualizadas: [
              {
                id: "rel-1",
                id_diagrama: "diag-123",
                id_clase_origen: "c-1",
                id_clase_destino: "c-inter",
                tipo_relacion: "asociacion",
                cardinalidad_origen: "1",
                cardinalidad_destino: "0..*",
                conector_origen: "right",
                conector_destino: "left",
                nombre: "Asociación",
                referencias_fk: [],
              },
              {
                id: "rel-2",
                id_diagrama: "diag-123",
                id_clase_origen: "c-2",
                id_clase_destino: "c-inter",
                tipo_relacion: "asociacion",
                cardinalidad_origen: "1",
                cardinalidad_destino: "0..*",
                conector_origen: "right",
                conector_destino: "left",
                nombre: "Asociación",
                referencias_fk: [],
              },
            ],
            relaciones_eliminadas: [],
            estructuras_nm_actualizadas: [
              {
                id: "nm-1",
                id_diagrama: "diag-123",
                id_clase_origen: "c-1",
                id_clase_destino: "c-2",
                id_clase_intermedia: "c-inter",
                id_relacion_origen: "rel-1",
                id_relacion_destino: "rel-2",
              },
            ],
            estructuras_nm_eliminadas: [],
          },
        },
      });
    });

    const store = useEditorDiagramaStore.getState();
    expect(store.clases).toHaveLength(3);
    expect(store.relaciones).toHaveLength(2);
    expect(store.estructurasNm).toHaveLength(1);
    expect(store.estructurasNm[0]?.idClaseIntermedia).toBe("c-inter");
  });

  it("limpia drag preview efímero cuando llega la confirmación persistida de la clase", () => {
    useEditorDiagramaStore.getState().hidratar("usr-1:diag-123", {
      id: "diag-123",
      idProyecto: "proy-1",
      nombre: "Diagrama 1",
      numero: 1,
      clases: [
        {
          id: "c-drag",
          idDiagrama: "diag-123",
          nombre: "Arrastrable",
          posicionX: 100,
          posicionY: 100,
          ancho: 280,
          atributos: [],
        },
      ],
      relaciones: [],
      estructurasNm: [],
    });

    renderHook(() =>
      useColaboracionTiempoReal({ diagramaId: "diag-123", habilitado: true })
    );

    // Simular drag preview provisional
    act(() => {
      useColaboracionStore.getState().actualizarDragPreview({
        idClase: "c-drag",
        idUsuario: "usr-2",
        posicionX: 450,
        posicionY: 550,
      });
    });
    expect(useColaboracionStore.getState().dragPreviews["c-drag"]).toBeDefined();

    // Llega confirmación persistida final
    act(() => {
      mensajeHandler?.({
        tipo: "MUTACION_CONFIRMADA",
        payload: {
          diagramaId: "diag-123",
          actionId: "act-move-done",
          tipoOperacion: "ACTUALIZAR_CLASE",
          emisorId: "usr-2",
          efectos: {
            clases_actualizadas: [
              {
                id: "c-drag",
                id_diagrama: "diag-123",
                nombre: "Arrastrable",
                posicion_x: 450,
                posicion_y: 550,
                ancho: 280,
                atributos: [],
              },
            ],
          },
        },
      });
    });

    // El preview efímero debe haberse limpiado
    expect(useColaboracionStore.getState().dragPreviews["c-drag"]).toBeUndefined();
    // La posición definitiva debe estar en el store de dominio
    expect(useEditorDiagramaStore.getState().clases[0]?.posicionX).toBe(450);
  });
});
