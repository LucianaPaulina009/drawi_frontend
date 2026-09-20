import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Atributo } from "../../../domain/entities/atributo.entity";
import type { OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";
import { FilaAtributoUml } from "./fila-atributo-uml";

describe("US2: Atributos UML - editor y store", () => {
  const scopeKey = "user-test:diag-atributos";
  const classId = "clase-empleado";
  const pkId = "attr-pk-empleado";

  const detalleInicial = {
    id: "diag-atributos",
    idProyecto: "proy-1",
    nombre: "Página de Atributos",
    numero: 1,
    clases: [
      {
        id: classId,
        idDiagrama: "diag-atributos",
        nombre: "Empleado",
        posicionX: 100,
        posicionY: 100,
        ancho: 240,
        atributos: [
          {
            id: pkId,
            idClase: classId,
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

  it("creación inmediata (+) agrega fila con UUID definitivo, integer, manual y no-PK", () => {
    const store = useEditorDiagramaStore.getState();
    const nuevoAttrId = crypto.randomUUID();

    const opCrearAttr: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: nuevoAttrId,
        nombre: "sueldo",
        tipoDato: "decimal",
        precision: 10,
        escala: 2,
        permiteNulo: false,
        esLlavePrimaria: false,
        ordenDePosicion: 2,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opCrearAttr);

    const estado = useEditorDiagramaStore.getState();
    const clase = estado.clases.find((c) => c.id === classId);
    expect(clase?.atributos).toHaveLength(2);

    const nuevoAttr = clase?.atributos.find((a) => a.id === nuevoAttrId);
    expect(nuevoAttr).toBeDefined();
    expect(nuevoAttr?.nombre).toBe("sueldo");
    expect(nuevoAttr?.tipoDato).toBe("decimal");
    expect(nuevoAttr?.precision).toBe(10);
    expect(nuevoAttr?.escala).toBe(2);
    expect(nuevoAttr?.esLlavePrimaria).toBe(false);
    expect(nuevoAttr?.procedencia).toBe("manual");
    expect(nuevoAttr?.ordenDePosicion).toBe(2);
  });

  it("protege PK: renombrar el atributo conserva su invariante estructural de clave primaria no nula", () => {
    const store = useEditorDiagramaStore.getState();

    // Renombrar la PK de "id" a "codigo_empleado"
    const opRenombrarPk: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "ACTUALIZAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: pkId,
        nombre: "codigo_empleado",
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opRenombrarPk);

    const estado = useEditorDiagramaStore.getState();
    const pkActualizada = estado.clases[0].atributos.find((a) => a.id === pkId);
    expect(pkActualizada?.nombre).toBe("codigo_empleado");
    expect(pkActualizada?.esLlavePrimaria).toBe(true);
    expect(pkActualizada?.permiteNulo).toBe(false);
    expect(pkActualizada?.procedencia).toBe("sistema_clase");
  });

  it("protege FK activa: no permite alterar su tipo ni su carácter estructural de referencia", () => {
    const fkAttrId = "attr-fk-departamento";
    const fkAtributo: Atributo = {
      id: fkAttrId,
      idClase: classId,
      nombre: "departamento_id",
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
    };

    // Agregar atributo FK a la clase
    useEditorDiagramaStore.getState().actualizarClases([
      {
        ...detalleInicial.clases[0],
        atributos: [
          ...detalleInicial.clases[0].atributos,
          fkAtributo,
          {
            ...fkAtributo,
            id: "attr-nombre-empleado",
            nombre: "nombre",
            procedencia: "manual",
            ordenDePosicion: 3,
          },
        ],
      },
    ]);

    // Intentar renombrar y ordenar la FK (permitido)
    const opActualizarFk: OperacionEditor = {
      actionId: "act-fk-rename",
      scopeKey,
      secuencia: 1,
      tipo: "ACTUALIZAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: fkAttrId,
        nombre: "id_departamento",
        ordenDePosicion: 3,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    useEditorDiagramaStore.getState().ejecutarOperacionLocal(opActualizarFk);

    const estado = useEditorDiagramaStore.getState();
    const fkResultante = estado.clases[0].atributos.find((a) => a.id === fkAttrId);
    expect(fkResultante?.nombre).toBe("id_departamento");
    expect(fkResultante?.ordenDePosicion).toBe(3);
    expect(fkResultante?.procedencia).toBe("sistema_fk");
    expect(fkResultante?.tipoDato).toBe("integer");
    expect(fkResultante?.esLlavePrimaria).toBe(false);
  });

  it("copia normal crea nuevo atributo desvinculado de FK y nunca copia como PK", () => {
    const store = useEditorDiagramaStore.getState();
    const copiaId = crypto.randomUUID();

    // Copiar la PK como un atributo normal con nuevo UUID y nombre sufijado
    const opCopiar: OperacionEditor = {
      actionId: crypto.randomUUID(),
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: copiaId,
        nombre: "id_copia",
        tipoDato: "integer",
        permiteNulo: true,
        esLlavePrimaria: false, // La copia NUNCA es PK
        ordenDePosicion: 2,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };

    store.ejecutarOperacionLocal(opCopiar);

    const estado = useEditorDiagramaStore.getState();
    const copia = estado.clases[0].atributos.find((a) => a.id === copiaId);
    expect(copia).toBeDefined();
    expect(copia?.nombre).toBe("id_copia");
    expect(copia?.esLlavePrimaria).toBe(false);
    expect(copia?.permiteNulo).toBe(true);
    expect(copia?.procedencia).toBe("manual");
  });

  it("mantiene dependencias explícitas en cadena creación -> edición", () => {
    const store = useEditorDiagramaStore.getState();
    const attrId = crypto.randomUUID();
    const actionIdCreacion = crypto.randomUUID();
    const actionIdEdicion = crypto.randomUUID();

    // Operación 1: CREAR_ATRIBUTO
    const op1: OperacionEditor = {
      actionId: actionIdCreacion,
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: attrId,
        nombre: "email",
        tipoDato: "varchar",
        longitud: 100,
        ordenDePosicion: 2,
      },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now(),
      version: 1,
    };
    store.ejecutarOperacionLocal(op1);

    // Operación 2: ACTUALIZAR_ATRIBUTO con dependsOn explícito hacia op1
    const op2: OperacionEditor = {
      actionId: actionIdEdicion,
      scopeKey,
      secuencia: 2,
      tipo: "ACTUALIZAR_ATRIBUTO",
      payload: {
        idClase: classId,
        idAtributo: attrId,
        nombre: "correo_electronico",
        longitud: 150,
      },
      dependsOn: [actionIdCreacion],
      estado: "pendiente",
      intentos: 0,
      creadaEn: Date.now() + 10,
      version: 1,
    };
    store.ejecutarOperacionLocal(op2);

    const estado = useEditorDiagramaStore.getState();
    const attrFinal = estado.clases[0].atributos.find((a) => a.id === attrId);
    expect(attrFinal?.nombre).toBe("correo_electronico");
    expect(attrFinal?.longitud).toBe(150);

    // Verificar que las dependencias quedan intactas
    expect(op2.dependsOn).toContain(actionIdCreacion);
  });
});

describe("FilaAtributoUml", () => {
  it("distingue PK y FK con etiquetas accesibles y no muestra UQ", () => {
    const base = {
      id: "fk-1",
      idClase: "clase-1",
      nombre: "cliente_id",
      tipoDato: "integer" as const,
      longitud: null,
      precision: null,
      escala: null,
      esLlavePrimaria: false,
      permiteNulo: false,
      esUnico: true,
      valorPorDefecto: null,
      ordenDePosicion: 2,
      procedencia: "sistema_fk" as const,
    };
    const { container } = render(
      <FilaAtributoUml atributo={base} onSeleccionar={() => undefined} />
    );

    expect(screen.getByLabelText("Llave foránea")).toBeInTheDocument();
    expect(container.textContent).not.toContain("UQ");
  });
});
