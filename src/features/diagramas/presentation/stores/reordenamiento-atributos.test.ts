import { describe, expect, it } from "vitest";

import type { Atributo } from "../../domain/entities/atributo.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import {
  reducirOperacion,
  reordenarAtributosEnSecuencia,
} from "./editor-diagrama.store";

function atributo(
  id: string,
  ordenDePosicion: number,
  procedencia: Atributo["procedencia"] = "manual"
): Atributo {
  return {
    id,
    idClase: "clase-1",
    nombre: id,
    tipoDato: "integer",
    longitud: null,
    precision: null,
    escala: null,
    permiteNulo: !id.startsWith("id"),
    esLlavePrimaria: id === "id",
    esUnico: id === "id",
    valorPorDefecto: null,
    ordenDePosicion,
    procedencia,
  };
}

const atributosBase = [
  atributo("id", 1, "sistema_clase"),
  atributo("nombre", 2),
  atributo("correo", 3),
  atributo("edad", 4),
];

function idsYOrdenes(atributos: Atributo[]) {
  return atributos.map(({ id, ordenDePosicion }) => ({ id, ordenDePosicion }));
}

describe("reordenamiento de atributos", () => {
  it("mueve el último atributo a la segunda posición sin duplicados ni huecos", () => {
    expect(idsYOrdenes(reordenarAtributosEnSecuencia(atributosBase, "edad", 2))).toEqual([
      { id: "id", ordenDePosicion: 1 },
      { id: "edad", ordenDePosicion: 2 },
      { id: "nombre", ordenDePosicion: 3 },
      { id: "correo", ordenDePosicion: 4 },
    ]);
  });

  it("mueve el segundo atributo al final", () => {
    expect(idsYOrdenes(reordenarAtributosEnSecuencia(atributosBase, "nombre", 4))).toEqual([
      { id: "id", ordenDePosicion: 1 },
      { id: "correo", ordenDePosicion: 2 },
      { id: "edad", ordenDePosicion: 3 },
      { id: "nombre", ordenDePosicion: 4 },
    ]);
  });

  it("conserva la PK en la secuencia al reordenar alrededor de ella", () => {
    const resultado = reordenarAtributosEnSecuencia(atributosBase, "correo", 2);

    expect(resultado[0]).toMatchObject({ id: "id", esLlavePrimaria: true, ordenDePosicion: 1 });
    expect(idsYOrdenes(resultado)).toEqual([
      { id: "id", ordenDePosicion: 1 },
      { id: "correo", ordenDePosicion: 2 },
      { id: "nombre", ordenDePosicion: 3 },
      { id: "edad", ordenDePosicion: 4 },
    ]);
  });

  it("incluye una FK protegida dentro de la misma secuencia activa", () => {
    const conFk = [
      atributo("id", 1, "sistema_clase"),
      atributo("cliente_id", 999, "sistema_fk"),
      atributo("correo", 2),
    ];

    expect(idsYOrdenes(reordenarAtributosEnSecuencia(conFk, "correo", 2))).toEqual([
      { id: "id", ordenDePosicion: 1 },
      { id: "correo", ordenDePosicion: 2 },
      { id: "cliente_id", ordenDePosicion: 3 },
    ]);
  });

  it("proyecta una sola operación de actualización como el reordenamiento local completo", () => {
    const operacion: OperacionEditor = {
      actionId: "accion-reordenar",
      scopeKey: "usuario:diagrama",
      tipo: "ACTUALIZAR_ATRIBUTO",
      payload: { idClase: "clase-1", idAtributo: "edad", ordenDePosicion: 2 },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1,
      version: 1,
    };

    const resultado = reducirOperacion(
      {
        clases: [{
          id: "clase-1",
          idDiagrama: "diagrama-1",
          nombre: "Persona",
          posicionX: 0,
          posicionY: 0,
          ancho: 220,
          atributos: atributosBase,
        }],
        relaciones: [],
        estructurasNm: [],
      },
      operacion
    );

    expect(idsYOrdenes(resultado.clases[0].atributos)).toEqual([
      { id: "id", ordenDePosicion: 1 },
      { id: "edad", ordenDePosicion: 2 },
      { id: "nombre", ordenDePosicion: 3 },
      { id: "correo", ordenDePosicion: 4 },
    ]);
  });
});
