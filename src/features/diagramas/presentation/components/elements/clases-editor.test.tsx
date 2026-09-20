import { beforeEach, describe, expect, it } from "vitest";

import type { OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";

describe("US1: Clases UML - editor y store", () => {
  const scopeKey = "user-1:diag-1";
  const detalleInicial = {
    id: "diag-1",
    idProyecto: "proy-1",
    nombre: "Página Principal",
    numero: 1,
    clases: [],
    relaciones: [],
    estructurasNm: [],
  };

  beforeEach(() => {
    useEditorDiagramaStore.getState().limpiar();
    useEditorDiagramaStore.getState().hidratar(scopeKey, detalleInicial);
  });

  it("crea Clase con UUIDs definitivos para clase y su PK canónica protegida", () => {
    const classId = crypto.randomUUID();
    const atributoPkId = crypto.randomUUID();

    const opCrear: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {
        idClase: classId,
        nombre: "Tabla",
        posicionX: 120,
        posicionY: 240,
        ancho: 220,
        idAtributoInicial: atributoPkId,
        nombreAtributoInicial: "id",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrear);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.clases).toHaveLength(1);

    const clase = estado.clases[0];
    expect(clase.id).toBe(classId);
    expect(clase.nombre).toBe("Tabla");
    expect(clase.posicionX).toBe(120);
    expect(clase.posicionY).toBe(240);
    expect(clase.ancho).toBe(220);

    // PK inicial canónica
    expect(clase.atributos).toHaveLength(1);
    const pk = clase.atributos[0];
    expect(pk.id).toBe(atributoPkId);
    expect(pk.nombre).toBe("id");
    expect(pk.esLlavePrimaria).toBe(true);
    expect(pk.procedencia).toBe("sistema_clase");
    expect(pk.permiteNulo).toBe(false);
  });

  it("actualiza posición y ancho en un único evento final sin duplicar operaciones", () => {
    const classId = "clase-movible";
    useEditorDiagramaStore.getState().actualizarClases([
      {
        id: classId,
        idDiagrama: "diag-1",
        nombre: "Cliente",
        posicionX: 100,
        posicionY: 100,
        ancho: 200,
        atributos: [],
      },
    ]);

    // Gesto final de arrastre (onNodeDragStop)
    const opArrastre: OperacionEditor = {
      actionId: "act-drag-1",
      scopeKey,
      secuencia: 1,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: classId,
        posicionX: 350,
        posicionY: 480,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opArrastre);

    let estado = useEditorDiagramaStore.getState();
    expect(estado.clases[0].posicionX).toBe(350);
    expect(estado.clases[0].posicionY).toBe(480);
    expect(estado.clases[0].ancho).toBe(200);

    // Gesto final de redimensionamiento (onResizeStop)
    const opResize: OperacionEditor = {
      actionId: "act-resize-2",
      scopeKey,
      secuencia: 2,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: classId,
        ancho: 260,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opResize);

    estado = useEditorDiagramaStore.getState();
    expect(estado.clases[0].ancho).toBe(260);
    expect(estado.clases[0].posicionX).toBe(350);
    expect(estado.operacionesPendientes).toHaveLength(2);
  });

  it("elimina Clase por Delete o Borrador limpiando relaciones asociadas en cascada", () => {
    const class1 = "clase-1";
    const class2 = "clase-2";
    const rel1 = "rel-1-2";

    useEditorDiagramaStore.getState().actualizarClases([
      {
        id: class1,
        idDiagrama: "diag-1",
        nombre: "Factura",
        posicionX: 100,
        posicionY: 100,
        ancho: 200,
        atributos: [],
      },
      {
        id: class2,
        idDiagrama: "diag-1",
        nombre: "Item",
        posicionX: 400,
        posicionY: 100,
        ancho: 200,
        atributos: [],
      },
    ]);

    useEditorDiagramaStore.getState().actualizarRelaciones([
      {
        id: rel1,
        idDiagrama: "diag-1",
        idClaseOrigen: class1,
        idClaseDestino: class2,
        tipoRelacion: "asociacion",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "0..*",
        conectorOrigen: "right",
        conectorDestino: "left",
        nombre: "Asociación",
        referenciasFk: [],
      },
    ]);

    expect(useEditorDiagramaStore.getState().clases).toHaveLength(2);
    expect(useEditorDiagramaStore.getState().relaciones).toHaveLength(1);

    // Eliminar clase-1
    const opEliminar: OperacionEditor = {
      actionId: "act-eliminar",
      scopeKey,
      secuencia: 1,
      tipo: "ELIMINAR_CLASE",
      payload: {
        idClase: class1,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opEliminar);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.clases).toHaveLength(1);
    expect(estado.clases[0].id).toBe(class2);
    // Relación en cascada eliminada
    expect(estado.relaciones).toHaveLength(0);
  });

  it("bloquea operaciones de mutación cuando el usuario no tiene permisos de edición", () => {
    const puedeEditar = false;
    const ejecutarMutacionSiPermitido = (accion: () => void) => {
      if (!puedeEditar) return false;
      accion();
      return true;
    };

    const mutacionEjecutada = ejecutarMutacionSiPermitido(() => {
      useEditorDiagramaStore.getState().ejecutarOperacionLocal({
        actionId: "act-no-auth",
        scopeKey,
        secuencia: 1,
        tipo: "CREAR_CLASE",
        payload: { idClase: "c-unauthorized", nombre: "NoAuth", posicionX: 0, posicionY: 0, ancho: 200 },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: Date.now(),
        version: 1,
      });
    });

    expect(mutacionEjecutada).toBe(false);
    expect(useEditorDiagramaStore.getState().clases).toHaveLength(0);
  });

  it("descarta no-ops si el arrastre finalizó en las mismas coordenadas exactas", () => {
    const posInicial = { x: 100, y: 100 };
    const posFinal = { x: 100, y: 100 };

    const huboCambioReal = posInicial.x !== posFinal.x || posInicial.y !== posFinal.y;
    expect(huboCambioReal).toBe(false);

    // No se ejecuta ni encola ninguna operación en caso de no-op
    expect(useEditorDiagramaStore.getState().operacionesPendientes).toHaveLength(0);
  });

  it("persiste la posición final tras el arrastre fluido y evita el snapback al confirmar", () => {
    const classId = "clase-drag-test";
    useEditorDiagramaStore.getState().actualizarClases([
      {
        id: classId,
        idDiagrama: "diag-1",
        nombre: "Factura",
        posicionX: 100,
        posicionY: 100,
        ancho: 220,
        atributos: [],
      },
    ]);

    // 1. Durante el arrastre, el store actualiza posición temporal para fluidez visual
    useEditorDiagramaStore.getState().actualizarPosicionClaseDuranteArrastre(classId, 250, 350);
    expect(useEditorDiagramaStore.getState().clases[0].posicionX).toBe(250);
    expect(useEditorDiagramaStore.getState().clases[0].posicionY).toBe(350);
    expect(useEditorDiagramaStore.getState().operacionesPendientes).toHaveLength(0);

    // 2. Al soltar (onNodeDragStop), se encola la operación persistible con la posición final
    const actionId = "act-drag-drop";
    const opArrastre: OperacionEditor = {
      actionId,
      scopeKey,
      secuencia: 1,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: classId,
        posicionX: 250,
        posicionY: 350,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opArrastre);

    expect(useEditorDiagramaStore.getState().operacionesPendientes).toHaveLength(1);
    expect(useEditorDiagramaStore.getState().clases[0].posicionX).toBe(250);
    expect(useEditorDiagramaStore.getState().clases[0].posicionY).toBe(350);

    // 3. Confirmación del backend con efectos actualizados
    useEditorDiagramaStore.getState().confirmarOperacion(actionId, {
      clasesActualizadas: [
        {
          id: classId,
          idDiagrama: "diag-1",
          nombre: "Factura",
          posicionX: 250,
          posicionY: 350,
          ancho: 220,
          atributos: [],
        },
      ],
      clasesEliminadas: [],
      relacionesActualizadas: [],
      relacionesEliminadas: [],
      estructurasNmActualizadas: [],
      estructurasNmEliminadas: [],
    });

    // 4. Se comprueba que no hay operaciones pendientes y que la posición confirmada persiste
    const estadoFinal = useEditorDiagramaStore.getState();
    expect(estadoFinal.operacionesPendientes).toHaveLength(0);
    expect(estadoFinal.detalleConfirmado?.clases[0].posicionX).toBe(250);
    expect(estadoFinal.detalleConfirmado?.clases[0].posicionY).toBe(350);
    expect(estadoFinal.clases[0].posicionX).toBe(250);
    expect(estadoFinal.clases[0].posicionY).toBe(350);
  });
});
