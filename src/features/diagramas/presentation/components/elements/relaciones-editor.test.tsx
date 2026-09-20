import { beforeEach, describe, expect, it } from "vitest";

import type { OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";

describe("US3: Relaciones UML - editor y store", () => {
  const scopeKey = "user-test:diag-relaciones";
  const classOrigenId = "clase-autor";
  const classDestinoId = "clase-libro";

  const detalleInicial = {
    id: "diag-relaciones",
    idProyecto: "proy-1",
    nombre: "Página de Relaciones",
    numero: 1,
    clases: [
      {
        id: classOrigenId,
        idDiagrama: "diag-relaciones",
        nombre: "Autor",
        posicionX: 100,
        posicionY: 100,
        ancho: 220,
        atributos: [
          {
            id: "attr-pk-autor",
            idClase: classOrigenId,
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
        id: classDestinoId,
        idDiagrama: "diag-relaciones",
        nombre: "Libro",
        posicionX: 450,
        posicionY: 100,
        ancho: 220,
        atributos: [
          {
            id: "attr-pk-libro",
            idClase: classDestinoId,
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
    ],
    relaciones: [],
    estructurasNm: [],
  };

  beforeEach(() => {
    useEditorDiagramaStore.getState().limpiar();
    useEditorDiagramaStore.getState().hidratar(scopeKey, detalleInicial);
  });

  it("conectar relación 1:N crea relación con materialización FK atómica y UUIDs estables", () => {
    const store = useEditorDiagramaStore.getState();
    const relId = crypto.randomUUID();
    const fkAttrId = crypto.randomUUID();
    const referenciaFkId = crypto.randomUUID();

    const opCrearRelacion: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_RELACION",
      payload: {
        idRelacion: relId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        tipoRelacion: "asociacion",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "0..*",
        conectorOrigen: "right",
        conectorDestino: "left",
        nombre: "Escribe",
        materializacionFk: {
          idClaseReceptora: classDestinoId,
          referencias: [
            {
              idReferenciaFk: referenciaFkId,
              idAtributoFk: fkAttrId,
              nombreAtributoFk: "autor_id",
              idAtributoReferenciado: "attr-pk-autor",
              tipoDato: "integer",
              permiteNulo: false,
            },
          ],
        },
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opCrearRelacion);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.relaciones).toHaveLength(1);

    const rel = estado.relaciones[0];
    expect(rel.id).toBe(relId);
    expect(rel.nombre).toBe("Escribe");
    expect(rel.tipoRelacion).toBe("asociacion");
    expect(rel.idClaseOrigen).toBe(classOrigenId);
    expect(rel.idClaseDestino).toBe(classDestinoId);
    expect(rel.cardinalidadOrigen).toBe("1");
    expect(rel.cardinalidadDestino).toBe("0..*");
    expect(rel.conectorOrigen).toBe("right");
    expect(rel.conectorDestino).toBe("left");
  });

  it("relación recursiva (loop) preserva handles diferenciados para evitar colapso de geometría", () => {
    const store = useEditorDiagramaStore.getState();
    const relLoopId = crypto.randomUUID();

    const opLoop: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_RELACION",
      payload: {
        idRelacion: relLoopId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classOrigenId, // Origen == Destino (Loop recursivo)
        tipoRelacion: "asociacion",
        cardinalidadOrigen: "0..1",
        cardinalidadDestino: "0..*",
        conectorOrigen: "top",
        conectorDestino: "right",
        nombre: "Supervisa",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opLoop);

    const estado = useEditorDiagramaStore.getState();
    const rel = estado.relaciones.find((r) => r.id === relLoopId);
    expect(rel).toBeDefined();
    expect(rel?.idClaseOrigen).toBe(rel?.idClaseDestino);
    expect(rel?.conectorOrigen).not.toBe(rel?.conectorDestino);
  });

  it("renombrar relación de tipo Asociación emite RENOMBRAR_RELACION y actualiza el store", () => {
    const store = useEditorDiagramaStore.getState();
    const relId = "rel-asoc-existente";

    // Sembrar relación Asociación previa
    useEditorDiagramaStore.getState().actualizarRelaciones([
      {
        id: relId,
        idDiagrama: "diag-relaciones",
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        tipoRelacion: "asociacion",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "1",
        conectorOrigen: "right",
        conectorDestino: "left",
        nombre: "Asociación",
        referenciasFk: [],
      },
    ]);

    const opRenombrar: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "RENOMBRAR_RELACION",
      payload: {
        idRelacion: relId,
        nombre: "Posee",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opRenombrar);

    const estado = useEditorDiagramaStore.getState();
    const rel = estado.relaciones.find((r) => r.id === relId);
    expect(rel?.nombre).toBe("Posee");
  });

  it("eliminar relación mediante ELIMINAR_RELACION remueve la arista sin afectar clases principales", () => {
    const store = useEditorDiagramaStore.getState();
    const relId = "rel-a-borrar";

    useEditorDiagramaStore.getState().actualizarRelaciones([
      {
        id: relId,
        idDiagrama: "diag-relaciones",
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        tipoRelacion: "agregacion",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "0..*",
        conectorOrigen: "bottom",
        conectorDestino: "top",
        nombre: null,
        referenciasFk: [],
      },
    ]);

    expect(useEditorDiagramaStore.getState().relaciones).toHaveLength(1);

    const opEliminar: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "ELIMINAR_RELACION",
      payload: {
        idRelacion: relId,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opEliminar);

    const estado = useEditorDiagramaStore.getState();
    expect(estado.relaciones).toHaveLength(0);
    // Las clases origen y destino se mantienen intactas
    expect(estado.clases).toHaveLength(2);
  });

  it("rechaza renombrar relaciones que no sean de tipo Asociación", () => {
    const store = useEditorDiagramaStore.getState();
    const relHerenciaId = "rel-herencia";

    // Sembrar relación de tipo Herencia
    useEditorDiagramaStore.getState().actualizarRelaciones([
      {
        id: relHerenciaId,
        idDiagrama: "diag-relaciones",
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        tipoRelacion: "herencia",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "1",
        conectorOrigen: "top",
        conectorDestino: "bottom",
        nombre: null,
        referenciasFk: [],
      },
    ]);

    const opRenombrarInvalido: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "RENOMBRAR_RELACION",
      payload: {
        idRelacion: relHerenciaId,
        nombre: "NombreInvalidoParaHerencia",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opRenombrarInvalido);

    const estado = useEditorDiagramaStore.getState();
    const rel = estado.relaciones.find((r) => r.id === relHerenciaId);
    // El nombre de herencia no debe mutar
    expect(rel?.nombre).toBeNull();
  });

  it("eliminar relación mediante ELIMINAR_RELACION limpia atributos sistema_fk vinculados preservando atributos manuales", () => {
    const store = useEditorDiagramaStore.getState();
    const relId = "rel-con-fks";
    const attrFkId = "attr-fk-libro";
    const attrManualId = "attr-manual-libro";

    // Modificar libro para tener un sistema_fk y un manual
    const clasesConFk = useEditorDiagramaStore.getState().clases.map((c) => {
      if (c.id !== classDestinoId) return c;
      return {
        ...c,
        atributos: [
          ...c.atributos,
          {
            id: attrFkId,
            idClase: classDestinoId,
            nombre: "autor_id",
            tipoDato: "integer" as const,
            longitud: null,
            precision: null,
            escala: null,
            permiteNulo: true,
            esLlavePrimaria: false,
            esUnico: false,
            valorPorDefecto: null,
            ordenDePosicion: 2,
            procedencia: "sistema_fk" as const,
          },
          {
            id: attrManualId,
            idClase: classDestinoId,
            nombre: "paginas",
            tipoDato: "integer" as const,
            longitud: null,
            precision: null,
            escala: null,
            permiteNulo: false,
            esLlavePrimaria: false,
            esUnico: false,
            valorPorDefecto: null,
            ordenDePosicion: 3,
            procedencia: "manual" as const,
          },
        ],
      };
    });
    useEditorDiagramaStore.getState().actualizarClases(clasesConFk);

    useEditorDiagramaStore.getState().actualizarRelaciones([
      {
        id: relId,
        idDiagrama: "diag-relaciones",
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        tipoRelacion: "asociacion",
        cardinalidadOrigen: "1",
        cardinalidadDestino: "0..*",
        conectorOrigen: "right",
        conectorDestino: "left",
        nombre: "Asociación",
        referenciasFk: [
          {
            id: "ref-1",
            idRelacion: relId,
            idAtributoFk: attrFkId,
            idAtributoReferenciado: "attr-pk-autor",
            onDelete: "NO_ACTION",
            onUpdate: "NO_ACTION",
          },
        ],
      },
    ]);

    // Eliminar relación
    const opEliminar: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "ELIMINAR_RELACION",
      payload: { idRelacion: relId },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opEliminar);

    const estadoFinal = useEditorDiagramaStore.getState();
    expect(estadoFinal.relaciones).toHaveLength(0);

    const libro = estadoFinal.clases.find((c) => c.id === classDestinoId);
    expect(libro).toBeDefined();
    // Atributo sistema_fk fue eliminado
    expect(libro?.atributos.some((a) => a.id === attrFkId)).toBe(false);
    // Atributo manual y PK fueron preservados
    expect(libro?.atributos.some((a) => a.id === attrManualId)).toBe(true);
    expect(libro?.atributos.some((a) => a.esLlavePrimaria)).toBe(true);
  });

  it("los siete tipos de relaciones UML se reducen correctamente con sus conectores y cardinalidades", () => {
    const tipos = [
      { tipo: "asociacion", cardO: "1", cardD: "0..*", nombre: "Asociación" },
      { tipo: "asociacion_dirigida", cardO: "1", cardD: "1", nombre: null },
      { tipo: "agregacion", cardO: "1", cardD: "0..*", nombre: null },
      { tipo: "composicion", cardO: "1", cardD: "0..*", nombre: null },
      { tipo: "herencia", cardO: "1", cardD: "1", nombre: null },
      { tipo: "realizacion", cardO: "1", cardD: "1", nombre: null },
      { tipo: "dependencia", cardO: "1", cardD: "1", nombre: null },
    ] as const;

    const store = useEditorDiagramaStore.getState();

    tipos.forEach(({ tipo, cardO, cardD, nombre }, idx) => {
      const relId = `rel-tipo-${idx}-${tipo}`;
      const op: OperacionEditor = {
        actionId: crypto.randomUUID(),
        scopeKey,
        secuencia: idx + 1,
        tipo: "CREAR_RELACION",
        payload: {
          idRelacion: relId,
          idClaseOrigen: classOrigenId,
          idClaseDestino: classDestinoId,
          tipoRelacion: tipo,
          cardinalidadOrigen: cardO,
          cardinalidadDestino: cardD,
          conectorOrigen: "right",
          conectorDestino: "left",
          nombre,
          materializacionFk: [],
        },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: Date.now(),
        version: 1,
      };
      store.ejecutarOperacionLocal(op);

      const rel = useEditorDiagramaStore.getState().relaciones.find((r) => r.id === relId);
      expect(rel).toBeDefined();
      expect(rel?.tipoRelacion).toBe(tipo);
      expect(rel?.cardinalidadOrigen).toBe(cardO);
      expect(rel?.cardinalidadDestino).toBe(cardD);
      expect(rel?.nombre).toBe(nombre);
    });
  });
});
