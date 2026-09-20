import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import type { Clase } from "../../../domain/entities/clase.entity";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";
import { PropuestaEstructuraNmForm } from "../forms/propuesta-estructura-nm-form";

describe("US5: Estructuras N:M - editor, propuesta y store", () => {
  const scopeKey = "user-test:diag-nm";
  const classOrigenId = "clase-estudiante";
  const classDestinoId = "clase-curso";

  const claseOrigen: Clase = {
    id: classOrigenId,
    idDiagrama: "diag-nm",
    nombre: "Estudiante",
    posicionX: 100,
    posicionY: 100,
    ancho: 220,
    atributos: [
      {
        id: "attr-pk-estudiante",
        idClase: classOrigenId,
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
        procedencia: "sistema_clase",
      },
    ],
  };

  const claseDestino: Clase = {
    id: classDestinoId,
    idDiagrama: "diag-nm",
    nombre: "Curso",
    posicionX: 500,
    posicionY: 100,
    ancho: 220,
    atributos: [
      {
        id: "attr-pk-curso",
        idClase: classDestinoId,
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
        procedencia: "sistema_clase",
      },
    ],
  };

  const detalleInicial = {
    id: "diag-nm",
    idProyecto: "proy-nm",
    nombre: "Diagrama N:M",
    numero: 1,
    clases: [claseOrigen, claseDestino],
    relaciones: [],
    estructurasNm: [],
  };

  beforeEach(() => {
    useEditorDiagramaStore.getState().limpiar();
    useEditorDiagramaStore.getState().hidratar(scopeKey, detalleInicial);
  });

  it("cancelar la propuesta N:M en el formulario no encola operaciones ni modifica el store", () => {
    const onOpenChange = vi.fn();
    const onConfirmar = vi.fn();

    render(
      <PropuestaEstructuraNmForm
        open={true}
        origen={claseOrigen}
        destino={claseDestino}
        atributoOrigenId="attr-pk-estudiante"
        atributoDestinoId="attr-pk-curso"
        onOpenChange={onOpenChange}
        onConfirmar={onConfirmar}
      />
    );

    // Verificar que el diálogo propone el nombre sugerido
    expect(screen.getByText("Crear tabla intermedia")).toBeInTheDocument();
    const inputNombre = screen.getByLabelText("Nombre de la tabla intermedia");
    expect(inputNombre).toHaveValue("Estudiante_Curso");

    // Click en Cancelar
    const btnCancelar = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(btnCancelar);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirmar).not.toHaveBeenCalled();

    // El store permanece con exactamente las dos clases iniciales y sin relaciones ni estructuras N:M
    const store = useEditorDiagramaStore.getState();
    expect(store.clases).toHaveLength(2);
    expect(store.relaciones).toHaveLength(0);
    expect(store.estructurasNm).toHaveLength(0);
    expect(store.operacionesPendientes).toHaveLength(0);
  });

  it("confirmar propuesta genera una única entrada compuesta CREAR_ESTRUCTURA_NM con UUIDs estables", () => {
    const onOpenChange = vi.fn();
    const onConfirmar = vi.fn();

    render(
      <PropuestaEstructuraNmForm
        open={true}
        origen={claseOrigen}
        destino={claseDestino}
        atributoOrigenId="attr-pk-estudiante"
        atributoDestinoId="attr-pk-curso"
        onOpenChange={onOpenChange}
        onConfirmar={onConfirmar}
      />
    );

    const btnConfirmar = screen.getByRole("button", { name: "Confirmar estructura" });
    fireEvent.click(btnConfirmar);

    expect(onConfirmar).toHaveBeenCalledWith("Estudiante_Curso");

    // Ahora simular el dispatch en el store
    const store = useEditorDiagramaStore.getState();
    const actionId = crypto.randomUUID();
    const structId = crypto.randomUUID();
    const intermediaId = crypto.randomUUID();
    const pkIntermediaId = crypto.randomUUID();
    const fkOrigenId = crypto.randomUUID();
    const fkDestinoId = crypto.randomUUID();
    const relOrigenId = crypto.randomUUID();
    const relDestinoId = crypto.randomUUID();
    const refOrigenId = crypto.randomUUID();
    const refDestinoId = crypto.randomUUID();

    const opCrearNm: OperacionEditor = {
      actionId,
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: structId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        claseIntermedia: {
          idClase: intermediaId,
          nombre: "Inscripcion",
          posicionX: 300,
          posicionY: 100,
          ancho: 280,
          idAtributoPk: pkIntermediaId,
          nombreAtributoPk: "id",
        },
        relacionOrigen: {
          idRelacion: relOrigenId,
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "right",
          conectorDestino: "left",
          nombre: "Asociación",
        },
        relacionDestino: {
          idRelacion: relDestinoId,
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "right",
          conectorDestino: "left",
          nombre: "Asociación",
        },
        referenciaFkOrigen: {
          idReferenciaFk: refOrigenId,
          idAtributoFk: fkOrigenId,
          idAtributoReferenciado: "attr-pk-estudiante",
          nombreAtributoFk: "estudiante_id",
          onDelete: "NO_ACTION",
          onUpdate: "NO_ACTION",
        },
        referenciaFkDestino: {
          idReferenciaFk: refDestinoId,
          idAtributoFk: fkDestinoId,
          idAtributoReferenciado: "attr-pk-curso",
          nombreAtributoFk: "curso_id",
          onDelete: "NO_ACTION",
          onUpdate: "NO_ACTION",
        },
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opCrearNm);

    // Verificar proyección inmediata en el store
    const estadoActual = useEditorDiagramaStore.getState();
    expect(estadoActual.clases).toHaveLength(3);
    const intermedia = estadoActual.clases.find((c) => c.id === intermediaId);
    expect(intermedia).toBeDefined();
    expect(intermedia?.nombre).toBe("Inscripcion");

    // Verificar que tiene su PK y sus 2 FKs de sistema
    expect(intermedia?.atributos).toHaveLength(3);
    const pk = intermedia?.atributos.find((a) => a.esLlavePrimaria);
    expect(pk?.id).toBe(pkIntermediaId);
    expect(pk?.procedencia).toBe("sistema_clase");

    const fks = intermedia?.atributos.filter((a) => !a.esLlavePrimaria);
    expect(fks).toHaveLength(2);
    expect(fks?.map((f) => f.id)).toContain(fkOrigenId);
    expect(fks?.map((f) => f.id)).toContain(fkDestinoId);
    fks?.forEach((fk) => expect(fk.procedencia).toBe("sistema_fk"));

    // Verificar las 2 relaciones creadas (1:N hacia intermedia)
    expect(estadoActual.relaciones).toHaveLength(2);
    const rOrig = estadoActual.relaciones.find((r) => r.id === relOrigenId);
    const rDest = estadoActual.relaciones.find((r) => r.id === relDestinoId);
    expect(rOrig).toBeDefined();
    expect(rOrig?.idClaseOrigen).toBe(classOrigenId);
    expect(rOrig?.idClaseDestino).toBe(intermediaId);
    expect(rOrig?.cardinalidadOrigen).toBe("1");
    expect(rOrig?.cardinalidadDestino).toBe("0..*");

    expect(rDest).toBeDefined();
    expect(rDest?.idClaseOrigen).toBe(classDestinoId);
    expect(rDest?.idClaseDestino).toBe(intermediaId);

    // Verificar la estructura N:M registrada
    expect(estadoActual.estructurasNm).toHaveLength(1);
    expect(estadoActual.estructurasNm[0].id).toBe(structId);
  });

  it("mismos IDs tras error temporal y recuperación por reintento y confirmación de recibo", () => {
    const store = useEditorDiagramaStore.getState();
    const actionId = crypto.randomUUID();
    const structId = crypto.randomUUID();
    const intermediaId = crypto.randomUUID();
    const pkIntermediaId = crypto.randomUUID();
    const fkOrigenId = crypto.randomUUID();
    const fkDestinoId = crypto.randomUUID();
    const relOrigenId = crypto.randomUUID();
    const relDestinoId = crypto.randomUUID();
    const refOrigenId = crypto.randomUUID();
    const refDestinoId = crypto.randomUUID();

    const opCrearNm: OperacionEditor = {
      actionId,
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: structId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        claseIntermedia: {
          idClase: intermediaId,
          nombre: "Matricula",
          posicionX: 300,
          posicionY: 100,
          ancho: 280,
          idAtributoPk: pkIntermediaId,
        },
        relacionOrigen: {
          idRelacion: relOrigenId,
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
        },
        relacionDestino: {
          idRelacion: relDestinoId,
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
        },
        referenciaFkOrigen: {
          idReferenciaFk: refOrigenId,
          idAtributoFk: fkOrigenId,
          idAtributoReferenciado: "attr-pk-estudiante",
        },
        referenciaFkDestino: {
          idReferenciaFk: refDestinoId,
          idAtributoFk: fkDestinoId,
          idAtributoReferenciado: "attr-pk-curso",
        },
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    // 1. Encolar y reducir
    store.ejecutarOperacionLocal(opCrearNm);
    expect(useEditorDiagramaStore.getState().clases).toHaveLength(3);

    // 2. Simular fallo transitorio de red (no rollback de la entidad local)
    store.actualizarOperacionPendiente(actionId, {
      ...opCrearNm,
      intentos: 1,
      proximoIntento: Date.now() + 2000,
      estado: "pendiente",
    });

    const trasFallo = useEditorDiagramaStore.getState();
    expect(trasFallo.clases).toHaveLength(3);
    expect(trasFallo.clases.find((c) => c.id === intermediaId)).toBeDefined();

    // 3. Confirmación canónica con recibo del servidor
    store.confirmarOperacion(actionId, {
      clasesActualizadas: [
        {
          id: intermediaId,
          idDiagrama: "diag-nm",
          nombre: "Matricula",
          posicionX: 300,
          posicionY: 100,
          ancho: 280,
          atributos: [
            {
              id: pkIntermediaId,
              idClase: intermediaId,
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
              procedencia: "sistema_clase",
            },
            {
              id: fkOrigenId,
              idClase: intermediaId,
              nombre: "estudiante_id",
              tipoDato: "integer",
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: false,
              esLlavePrimaria: false,
              esUnico: false,
              valorPorDefecto: null,
              ordenDePosicion: 2,
              procedencia: "sistema_fk",
            },
            {
              id: fkDestinoId,
              idClase: intermediaId,
              nombre: "curso_id",
              tipoDato: "integer",
              longitud: null,
              precision: null,
              escala: null,
              permiteNulo: false,
              esLlavePrimaria: false,
              esUnico: false,
              valorPorDefecto: null,
              ordenDePosicion: 3,
              procedencia: "sistema_fk",
            },
          ],
        },
      ],
      clasesEliminadas: [],
      relacionesActualizadas: [
        {
          id: relOrigenId,
          idDiagrama: "diag-nm",
          idClaseOrigen: classOrigenId,
          idClaseDestino: intermediaId,
          tipoRelacion: "asociacion",
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "right",
          conectorDestino: "left",
          nombre: "Asociación",
          referenciasFk: [
            {
              id: refOrigenId,
              idRelacion: relOrigenId,
              idAtributoFk: fkOrigenId,
              idAtributoReferenciado: "attr-pk-estudiante",
              onDelete: "NO_ACTION",
              onUpdate: "NO_ACTION",
            },
          ],
        },
        {
          id: relDestinoId,
          idDiagrama: "diag-nm",
          idClaseOrigen: classDestinoId,
          idClaseDestino: intermediaId,
          tipoRelacion: "asociacion",
          cardinalidadOrigen: "1",
          cardinalidadDestino: "0..*",
          conectorOrigen: "right",
          conectorDestino: "left",
          nombre: "Asociación",
          referenciasFk: [
            {
              id: refDestinoId,
              idRelacion: relDestinoId,
              idAtributoFk: fkDestinoId,
              idAtributoReferenciado: "attr-pk-curso",
              onDelete: "NO_ACTION",
              onUpdate: "NO_ACTION",
            },
          ],
        },
      ],
      relacionesEliminadas: [],
      estructurasNmActualizadas: [
        {
          id: structId,
          idDiagrama: "diag-nm",
          idClaseOrigen: classOrigenId,
          idClaseDestino: classDestinoId,
          idClaseIntermedia: intermediaId,
          idRelacionOrigen: relOrigenId,
          idRelacionDestino: relDestinoId,
        },
      ],
      estructurasNmEliminadas: [],
    });

    const confirmado = useEditorDiagramaStore.getState();
    expect(confirmado.operacionesPendientes).toHaveLength(0);
    expect(confirmado.clases).toHaveLength(3);
    expect(confirmado.relaciones).toHaveLength(2);
    expect(confirmado.estructurasNm).toHaveLength(1);
    expect(confirmado.estructurasNm[0].id).toBe(structId);
  });

  it("edición normal de la clase intermedia (renombrar y agregar atributo manual propio) preserva la estructura", () => {
    const store = useEditorDiagramaStore.getState();
    const structId = "struct-1";
    const intermediaId = "clase-inter";
    const pkIntermediaId = "pk-inter";
    const fkOrigenId = "fk-orig";
    const fkDestinoId = "fk-dest";
    const relOrigenId = "rel-orig";
    const relDestinoId = "rel-dest";

    // 1. Crear estructura
    store.ejecutarOperacionLocal({
      actionId: "action-nm-1",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: structId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        claseIntermedia: {
          idClase: intermediaId,
          nombre: "Inscripcion",
          posicionX: 300,
          posicionY: 100,
          ancho: 280,
          idAtributoPk: pkIntermediaId,
        },
        relacionOrigen: { idRelacion: relOrigenId },
        relacionDestino: { idRelacion: relDestinoId },
        referenciaFkOrigen: { idReferenciaFk: "ref-1", idAtributoFk: fkOrigenId },
        referenciaFkDestino: { idReferenciaFk: "ref-2", idAtributoFk: fkDestinoId },
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    });

    // 2. Renombrar clase intermedia
    store.ejecutarOperacionLocal({
      actionId: "action-upd-1",
      scopeKey,
      secuencia: 2,
      tipo: "ACTUALIZAR_CLASE",
      payload: {
        idClase: intermediaId,
        nombre: "InscripcionFinal",
      },
      dependsOn: ["action-nm-1"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    });

    // 3. Agregar atributo manual a la clase intermedia (e.g. fecha_inscripcion)
    const attrManualId = "attr-fecha-inscripcion";
    store.ejecutarOperacionLocal({
      actionId: "action-attr-1",
      scopeKey,
      secuencia: 3,
      tipo: "CREAR_ATRIBUTO",
      payload: {
        idAtributo: attrManualId,
        idClase: intermediaId,
        nombre: "fecha_inscripcion",
        tipoDato: "varchar",
        ordenDePosicion: 4,
      },
      dependsOn: ["action-upd-1"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    });

    const actual = useEditorDiagramaStore.getState();
    const intermedia = actual.clases.find((c) => c.id === intermediaId);
    expect(intermedia?.nombre).toBe("InscripcionFinal");
    expect(intermedia?.atributos).toHaveLength(4);
    expect(intermedia?.atributos.find((a) => a.id === attrManualId)?.procedencia).toBe("manual");

    // Estructura N:M sigue activa
    expect(actual.estructurasNm).toHaveLength(1);
    expect(actual.estructurasNm[0].id).toBe(structId);
  });

  it("eliminación en cascada limpia de la estructura N:M no deja huérfanos ni afecta clases originales", () => {
    const store = useEditorDiagramaStore.getState();
    const structId = "struct-cascade";
    const intermediaId = "clase-inter-casc";
    const relOrigenId = "rel-orig-casc";
    const relDestinoId = "rel-dest-casc";

    // 1. Crear estructura
    store.ejecutarOperacionLocal({
      actionId: "action-nm-casc",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: structId,
        idClaseOrigen: classOrigenId,
        idClaseDestino: classDestinoId,
        claseIntermedia: {
          idClase: intermediaId,
          nombre: "IntermediaAEliminar",
          posicionX: 300,
          posicionY: 100,
          ancho: 280,
          idAtributoPk: "pk-casc",
        },
        relacionOrigen: { idRelacion: relOrigenId },
        relacionDestino: { idRelacion: relDestinoId },
        referenciaFkOrigen: { idReferenciaFk: "ref-1", idAtributoFk: "fk-1" },
        referenciaFkDestino: { idReferenciaFk: "ref-2", idAtributoFk: "fk-2" },
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    });

    expect(useEditorDiagramaStore.getState().clases).toHaveLength(3);
    expect(useEditorDiagramaStore.getState().relaciones).toHaveLength(2);
    expect(useEditorDiagramaStore.getState().estructurasNm).toHaveLength(1);

    // 2. Ejecutar ELIMINAR_ESTRUCTURA_NM
    store.ejecutarOperacionLocal({
      actionId: "action-del-nm",
      scopeKey,
      secuencia: 2,
      tipo: "ELIMINAR_ESTRUCTURA_NM",
      payload: {
        idEstructuraNm: structId,
      },
      dependsOn: ["action-nm-casc"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    });

    const estadoFinal = useEditorDiagramaStore.getState();
    // La intermedia y sus relaciones se eliminaron
    expect(estadoFinal.clases).toHaveLength(2);
    expect(estadoFinal.clases.find((c) => c.id === intermediaId)).toBeUndefined();
    expect(estadoFinal.relaciones).toHaveLength(0);
    expect(estadoFinal.estructurasNm).toHaveLength(0);

    // Las clases originales siguen intactas con su PK
    const orig = estadoFinal.clases.find((c) => c.id === classOrigenId);
    const dest = estadoFinal.clases.find((c) => c.id === classDestinoId);
    expect(orig).toBeDefined();
    expect(dest).toBeDefined();
    expect(orig?.atributos.some((a) => a.esLlavePrimaria)).toBe(true);
    expect(dest?.atributos.some((a) => a.esLlavePrimaria)).toBe(true);
  });
});
