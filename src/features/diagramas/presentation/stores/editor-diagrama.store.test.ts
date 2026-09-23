import { beforeEach, describe, expect, it } from "vitest";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import { reducirOperacion, useEditorDiagramaStore } from "./editor-diagrama.store";

const detalle = {
  id: "a0000000-0000-4000-8000-000000000001",
  idProyecto: "p",
  nombre: "Página 1",
  numero: 1,
  clases: [],
  relaciones: [],
  estructurasNm: [],
};

describe("editor-diagrama.store", () => {
  beforeEach(() => useEditorDiagramaStore.getState().limpiar());

  it("aísla el detalle confirmado y la selección por ámbito", () => {
    useEditorDiagramaStore.getState().hidratar("usuario:a", detalle);
    useEditorDiagramaStore.getState().seleccionarClase("clase-a");
    expect(useEditorDiagramaStore.getState().scopeKey).toBe("usuario:a");
    expect(useEditorDiagramaStore.getState().claseSeleccionadaId).toBe("clase-a");

    useEditorDiagramaStore
      .getState()
      .hidratar("usuario:b", { ...detalle, id: "b0000000-0000-4000-8000-000000000001" });
    expect(useEditorDiagramaStore.getState().scopeKey).toBe("usuario:b");
    expect(useEditorDiagramaStore.getState().claseSeleccionadaId).toBeNull();
  });

  it("aplica reducciones locales de forma inmediata a clases, atributos y relaciones", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", detalle);

    // 1. Crear Clase con PK canónica
    const opCrearClase: OperacionEditor = {
      actionId: "act-crear-1",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {
        idClase: "c-1",
        nombre: "Factura",
        posicionX: 50,
        posicionY: 60,
        ancho: 200,
        idAtributoInicial: "attr-pk",
        nombreAtributoInicial: "id",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrearClase);

    let estado = useEditorDiagramaStore.getState();
    expect(estado.clases.length).toBe(1);
    expect(estado.clases[0].id).toBe("c-1");
    expect(estado.clases[0].nombre).toBe("Factura");
    expect(estado.clases[0].atributos.length).toBe(1);
    expect(estado.clases[0].atributos[0].id).toBe("attr-pk");
    expect(estado.clases[0].atributos[0].esLlavePrimaria).toBe(true);
    expect(estado.clases[0].atributos[0].procedencia).toBe("sistema_clase");

    // 2. Crear Atributo normal
    const opCrearAttr: OperacionEditor = {
      actionId: "act-attr-2",
      scopeKey: "user:diag",
      secuencia: 2,
      tipo: "CREAR_ATRIBUTO",
      payload: {
        idClase: "c-1",
        idAtributo: "attr-total",
        nombre: "total",
        tipoDato: "decimal",
        precision: 10,
        escala: 2,
      },
      dependsOn: ["act-crear-1"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrearAttr);

    estado = useEditorDiagramaStore.getState();
    expect(estado.clases[0].atributos.length).toBe(2);
    expect(estado.clases[0].atributos[1].id).toBe("attr-total");
    expect(estado.clases[0].atributos[1].nombre).toBe("total");

    // 3. Actualizar Clase (mover)
    const opMover: OperacionEditor = {
      actionId: "act-mover-3",
      scopeKey: "user:diag",
      secuencia: 3,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: "c-1",
        posicionX: 300,
        posicionY: 400,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 3000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opMover);

    estado = useEditorDiagramaStore.getState();
    expect(estado.clases[0].posicionX).toBe(300);
    expect(estado.clases[0].posicionY).toBe(400);
    expect(estado.operacionesPendientes.length).toBe(3);
  });

  it("al recibir recibo de confirmación, aplica rebase a base confirmada y reproduce pendientes sin pisar ediciones posteriores", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", detalle);

    // Op 1: Crear Clase (enviada con posicion inicial 50, 60)
    const opCrear: OperacionEditor = {
      actionId: "act-crear",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {
        idClase: "c-1",
        nombre: "Factura",
        posicionX: 50,
        posicionY: 60,
        ancho: 200,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrear);

    // Op 2: Mover Clase localmente a (500, 600) mientras la creación está en vuelo
    const opMover: OperacionEditor = {
      actionId: "act-mover",
      scopeKey: "user:diag",
      secuencia: 2,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: "c-1",
        posicionX: 500,
        posicionY: 600,
      },
      dependsOn: ["act-crear"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrear);
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opMover);

    // Servidor confirma la creación con sus coordenadas originales (50, 60)
    const reciboCreacion: ConfirmacionOperacionDiagrama = {
      actionId: "act-crear",
      idDiagrama: detalle.id,
      tipo: "CREAR_CLASE",
      efectos: {
        clasesActualizadas: [
          {
            id: "c-1",
            idDiagrama: detalle.id,
            nombre: "Factura",
            posicionX: 50,
            posicionY: 60,
            ancho: 200,
            atributos: [],
          },
        ],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: [],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    useEditorDiagramaStore.getState().aplicarRecibo(reciboCreacion);

    const estado = useEditorDiagramaStore.getState();
    // La base confirmada tiene las coordenadas confirmadas por el servidor
    expect(estado.detalleConfirmado?.clases[0].posicionX).toBe(50);
    expect(estado.detalleConfirmado?.clases[0].posicionY).toBe(60);

    // Pero el dominio proyectado visible reprodujo la edición local pendiente posterior (500, 600)
    expect(estado.clases[0].posicionX).toBe(500);
    expect(estado.clases[0].posicionY).toBe(600);
    expect(estado.operacionesPendientes.map((o) => o.actionId)).toEqual(["act-mover"]);
  });

  it("actualiza la posición del dominio durante el arrastre sin crear operaciones persistibles", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", {
      ...detalle,
      clases: [{
        id: "clase-1",
        idDiagrama: detalle.id,
        nombre: "Tabla",
        posicionX: 10,
        posicionY: 20,
        ancho: 200,
        atributos: [],
      }],
    });

    useEditorDiagramaStore.getState().actualizarPosicionClaseDuranteArrastre("clase-1", 90, 120);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.clases[0].posicionX).toBe(90);
    expect(estado.clases[0].posicionY).toBe(120);
    expect(estado.operacionesPendientes).toHaveLength(0);
  });

  it("cierra localmente una estructura N:M completa al eliminar una clase extrema", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", {
      ...detalle,
      clases: [
        { id: "clase-a", idDiagrama: detalle.id, nombre: "A", posicionX: 0, posicionY: 0, ancho: 220, atributos: [] },
        { id: "clase-b", idDiagrama: detalle.id, nombre: "B", posicionX: 600, posicionY: 0, ancho: 220, atributos: [] },
        { id: "clase-inter", idDiagrama: detalle.id, nombre: "A_B", posicionX: 300, posicionY: 0, ancho: 280, atributos: [] },
      ],
      relaciones: [
        { id: "rel-a", idDiagrama: detalle.id, idClaseOrigen: "clase-a", idClaseDestino: "clase-inter", tipoRelacion: "asociacion", cardinalidadOrigen: "1", cardinalidadDestino: "0..*", conectorOrigen: "right", conectorDestino: "left", referenciasFk: [] },
        { id: "rel-b", idDiagrama: detalle.id, idClaseOrigen: "clase-b", idClaseDestino: "clase-inter", tipoRelacion: "asociacion", cardinalidadOrigen: "1", cardinalidadDestino: "0..*", conectorOrigen: "left", conectorDestino: "right", referenciasFk: [] },
      ],
      estructurasNm: [{ id: "nm-1", idDiagrama: detalle.id, idClaseOrigen: "clase-a", idClaseDestino: "clase-b", idClaseIntermedia: "clase-inter", idRelacionOrigen: "rel-a", idRelacionDestino: "rel-b" }],
    });

    useEditorDiagramaStore.getState().ejecutarOperacionLocal({
      actionId: "eliminar-clase-a",
      scopeKey: "user:diag",
      tipo: "ELIMINAR_CLASE",
      payload: { idClase: "clase-a" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1,
      version: 1,
    });

    const estado = useEditorDiagramaStore.getState();
    expect(estado.clases.map((clase) => clase.id)).toEqual(["clase-b"]);
    expect(estado.relaciones).toEqual([]);
    expect(estado.estructurasNm).toEqual([]);
  });

  it("no inventa identidades al reproyectar una operación incompleta", () => {
    const dominio = reducirOperacion(
      { clases: [], relaciones: [], estructurasNm: [] },
      {
        actionId: "op-incompleta",
        scopeKey: "user:diag",
        tipo: "CREAR_CLASE",
        payload: { nombre: "Sin UUID" },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: 1,
      }
    );

    expect(dominio.clases).toHaveLength(0);
  });

  it("al hidratar con operaciones existentes en la cola, las reproyecta inmediatamente sobre el detalle", () => {
    const opPendiente: OperacionEditor = {
      actionId: "act-offline",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {
        idClase: "c-offline",
        nombre: "OfflineClass",
        posicionX: 10,
        posicionY: 20,
        ancho: 180,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 500,
      version: 1,
    };

    useEditorDiagramaStore.getState().hidratar("user:diag", detalle, [opPendiente]);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.detalleConfirmado?.clases.length).toBe(0);
    expect(estado.clases.length).toBe(1);
    expect(estado.clases[0].id).toBe("c-offline");
    expect(estado.clases[0].nombre).toBe("OfflineClass");
    expect(estado.operacionesPendientes.length).toBe(1);
  });

  it("cadena de ediciones posteriores (mover, renombrar, agregar atributo) no son pisadas al recibir recibo de creación", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", detalle);

    // 1. En vuelo: CREAR_CLASE
    const opCrear: OperacionEditor = {
      actionId: "op-create-flight",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-cliente", nombre: "Cliente", posicionX: 10, posicionY: 10, ancho: 200 },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opCrear);

    // 2. Local posterior 1: renombrar a "ClienteEmpresa"
    const opRenombrar: OperacionEditor = {
      actionId: "op-rename-local",
      scopeKey: "user:diag",
      secuencia: 2,
      tipo: "ACTUALIZAR_CLASE",
      payload: { idClase: "c-cliente", nombre: "ClienteEmpresa" },
      dependsOn: ["op-create-flight"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opRenombrar);

    // 3. Local posterior 2: agregar atributo "razon_social"
    const opAtributo: OperacionEditor = {
      actionId: "op-attr-local",
      scopeKey: "user:diag",
      secuencia: 3,
      tipo: "CREAR_ATRIBUTO",
      payload: { idClase: "c-cliente", idAtributo: "attr-rs", nombre: "razon_social", tipoDato: "varchar" },
      dependsOn: ["op-create-flight"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 3000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opAtributo);

    // El store muestra las 3 operaciones acumuladas
    expect(useEditorDiagramaStore.getState().clases[0].nombre).toBe("ClienteEmpresa");
    expect(useEditorDiagramaStore.getState().clases[0].atributos.some((a) => a.nombre === "razon_social")).toBe(true);

    // Servidor confirma la creación original con nombre "Cliente"
    const reciboCreacion: ConfirmacionOperacionDiagrama = {
      actionId: "op-create-flight",
      idDiagrama: detalle.id,
      tipo: "CREAR_CLASE",
      efectos: {
        clasesActualizadas: [
          { id: "c-cliente", idDiagrama: detalle.id, nombre: "Cliente", posicionX: 10, posicionY: 10, ancho: 200, atributos: [] },
        ],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: [],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    useEditorDiagramaStore.getState().aplicarRecibo(reciboCreacion);

    const postRecibo = useEditorDiagramaStore.getState();
    // La base confirmada tiene el nombre original confirmado
    expect(postRecibo.detalleConfirmado?.clases[0].nombre).toBe("Cliente");
    // El dominio visible reproyectó las ediciones posteriores sin pisarlas
    expect(postRecibo.clases[0].nombre).toBe("ClienteEmpresa");
    expect(postRecibo.clases[0].atributos.some((a) => a.nombre === "razon_social")).toBe(true);
    // Solo quedan pendientes las 2 operaciones posteriores
    expect(postRecibo.operacionesPendientes.map((o) => o.actionId)).toEqual(["op-rename-local", "op-attr-local"]);
  });

  it("ignora recibos inválidos o malformados sin alterar el estado del store", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag", detalle);
    const op = {
      actionId: "op-segura",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "CREAR_CLASE" as const,
      payload: { idClase: "c-s", nombre: "Segura" },
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(op);

    // Aplicar recibo nulo / inválido
    useEditorDiagramaStore.getState().aplicarRecibo(null as any);
    useEditorDiagramaStore.getState().aplicarRecibo({ actionId: "" } as any);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.operacionesPendientes.length).toBe(1);
    expect(estado.clases.length).toBe(1);
  });

  it("elimina atributos sistema_fk al eliminar relación pero preserva atributos manuales y reordena posiciones", () => {
    const detalleConRelacion = {
      ...detalle,
      clases: [
        {
          id: "c-origen",
          idDiagrama: detalle.id,
          nombre: "Usuario",
          posicionX: 0,
          posicionY: 0,
          ancho: 200,
          atributos: [
            {
              id: "attr-pk-orig",
              idClase: "c-origen",
              nombre: "id",
              tipoDato: "integer" as const,
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: false,
              esLlavePrimaria: true,
              esUnico: true,
              valorPorDefecto: null,
              ordenDePosicion: 1,
              procedencia: "sistema_clase" as const,
            },
          ],
        },
        {
          id: "c-destino",
          idDiagrama: detalle.id,
          nombre: "Perfil",
          posicionX: 300,
          posicionY: 0,
          ancho: 200,
          atributos: [
            {
              id: "attr-pk-dest",
              idClase: "c-destino",
              nombre: "id",
              tipoDato: "integer" as const,
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: false,
              esLlavePrimaria: true,
              esUnico: true,
              valorPorDefecto: null,
              ordenDePosicion: 1,
              procedencia: "sistema_clase" as const,
            },
            {
              id: "attr-manual-dest",
              idClase: "c-destino",
              nombre: "usuario_id_manual",
              tipoDato: "integer" as const,
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: true,
              esLlavePrimaria: false,
              esUnico: false,
              valorPorDefecto: null,
              ordenDePosicion: 2,
              procedencia: "manual" as const,
            },
            {
              id: "attr-fk-dest",
              idClase: "c-destino",
              nombre: "usuario_id",
              tipoDato: "integer" as const,
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: true,
              esLlavePrimaria: false,
              esUnico: false,
              valorPorDefecto: null,
              ordenDePosicion: 3,
              procedencia: "sistema_fk" as const,
            },
          ],
        },
      ],
      relaciones: [
        {
          id: "rel-1",
          idDiagrama: detalle.id,
          idClaseOrigen: "c-origen",
          idClaseDestino: "c-destino",
          tipoRelacion: "asociacion" as const,
          cardinalidadOrigen: "1" as const,
          cardinalidadDestino: "0..*" as const,
          conectorOrigen: "right" as const,
          conectorDestino: "left" as const,
          nombre: "Tiene",
          referenciasFk: [
            {
              id: "ref-1",
              idRelacion: "rel-1",
              idAtributoFk: "attr-fk-dest",
              idAtributoReferenciado: "attr-pk-orig",
              onDelete: "NO_ACTION" as const,
              onUpdate: "NO_ACTION" as const,
            },
          ],
        },
      ],
      estructurasNm: [],
    };

    useEditorDiagramaStore.getState().hidratar("user:diag", detalleConRelacion);

    // 1. Ejecutar operación local ELIMINAR_RELACION
    const opEliminar: OperacionEditor = {
      actionId: "op-del-rel-1",
      scopeKey: "user:diag",
      secuencia: 1,
      tipo: "ELIMINAR_RELACION",
      payload: { idRelacion: "rel-1" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    };
    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opEliminar);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.relaciones.length).toBe(0);
    const dest = estado.clases.find((c) => c.id === "c-destino");
    expect(dest).toBeDefined();
    expect(dest?.atributos.length).toBe(2);
    expect(dest?.atributos.some((a) => a.id === "attr-fk-dest")).toBe(false);
    expect(dest?.atributos.some((a) => a.id === "attr-manual-dest")).toBe(true);
    expect(dest?.atributos[0].ordenDePosicion).toBe(1);
    expect(dest?.atributos[1].ordenDePosicion).toBe(2);

    // 2. Servidor confirma la eliminación con efectos autoritativos
    const reciboEliminacion: ConfirmacionOperacionDiagrama = {
      actionId: "op-del-rel-1",
      idDiagrama: detalle.id,
      tipo: "ELIMINAR_RELACION",
      efectos: {
        clasesActualizadas: [
          {
            id: "c-destino",
            idDiagrama: detalle.id,
            nombre: "Perfil",
            posicionX: 300,
            posicionY: 0,
            ancho: 200,
            atributos: [
              {
                id: "attr-pk-dest",
                idClase: "c-destino",
                nombre: "id",
                tipoDato: "integer",
                longitud: null,
                precision: null,
                escala: null,
                permiteNulo: false,
                esLlavePrimaria: true,
                esUnico: true,
                valorPorDefecto: null,
                ordenDePosicion: 1,
                procedencia: "sistema_clase" as const,
              },
              {
                id: "attr-manual-dest",
                idClase: "c-destino",
                nombre: "usuario_id_manual",
                tipoDato: "integer",
                longitud: null,
                precision: null,
                escala: null,
                permiteNulo: true,
                esLlavePrimaria: false,
                esUnico: false,
                valorPorDefecto: null,
                ordenDePosicion: 2,
                procedencia: "manual" as const,
              },
            ],
          },
        ],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: ["rel-1"],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    useEditorDiagramaStore.getState().aplicarRecibo(reciboEliminacion);

    const postConfirmacion = useEditorDiagramaStore.getState();
    expect(postConfirmacion.operacionesPendientes.length).toBe(0);
    expect(postConfirmacion.relaciones.length).toBe(0);
    const destConfirmado = postConfirmacion.clases.find((c) => c.id === "c-destino");
    expect(destConfirmado?.atributos.length).toBe(2);
    expect(destConfirmado?.atributos.some((a) => a.id === "attr-fk-dest")).toBe(false);
  });

  it("diferencia los nombres de atributos FK en estructuras N:M recursivas (misma clase)", () => {
    useEditorDiagramaStore.getState().hidratar("user:diag-rec", {
      ...detalle,
      clases: [
        {
          id: "cat-1",
          idDiagrama: detalle.id,
          nombre: "Categoria",
          posicionX: 100,
          posicionY: 100,
          ancho: 200,
          atributos: [
            {
              id: "pk-cat-1",
              idClase: "cat-1",
              nombre: "id",
              tipoDato: "integer",
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: false,
              esLlavePrimaria: true,
              esUnico: true,
              valorPorDefecto: null,
              ordenDePosicion: 1,
              procedencia: "sistema_clase" as const,
            },
          ],
        },
      ],
    });

    const opNmRecursiva: OperacionEditor = {
      actionId: "act-nm-rec",
      scopeKey: "user:diag-rec",
      secuencia: 1,
      tipo: "CREAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: "nm-rec-1",
        idClaseOrigen: "cat-1",
        idClaseDestino: "cat-1",
        claseIntermedia: {
          idClase: "c-inter-rec",
          nombre: "Categoria_Subcategoria",
          posicionX: 200,
          posicionY: 250,
          ancho: 280,
          idAtributoPk: "pk-inter-1",
          nombreAtributoPk: "id",
        },
        relacionOrigen: {
          idRelacion: "rel-orig-rec",
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "top",
          conectorDestino: "left",
        },
        relacionDestino: {
          idRelacion: "rel-dest-rec",
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "right",
          conectorDestino: "right",
        },
        referenciaFkOrigen: {
          idReferenciaFk: "ref-orig-rec",
          idAtributoFk: "fk-orig-rec",
          idAtributoReferenciado: "pk-cat-1",
          nombreAtributoFk: "categoria_id",
        },
        referenciaFkDestino: {
          idReferenciaFk: "ref-dest-rec",
          idAtributoFk: "fk-dest-rec",
          idAtributoReferenciado: "pk-cat-1",
          nombreAtributoFk: "categoria_id",
        },
      },
    };

    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opNmRecursiva);

    const inter = useEditorDiagramaStore.getState().clases.find((c) => c.id === "c-inter-rec");
    expect(inter).toBeDefined();
    expect(inter?.atributos.length).toBe(3);

    const nombresAtributos = inter?.atributos.map((a) => a.nombre);
    expect(nombresAtributos).toContain("id");
    expect(nombresAtributos).toContain("categoria_origen_id");
    expect(nombresAtributos).toContain("categoria_destino_id");
  });
});

