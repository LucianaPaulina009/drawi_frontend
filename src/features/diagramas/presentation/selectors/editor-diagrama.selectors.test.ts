import { describe, expect, it } from "vitest";

import type { Clase } from "../../domain/entities/clase.entity";
import type { EstructuraRelacionNm } from "../../domain/entities/estructura-relacion-nm.entity";
import type { Relacion } from "../../domain/entities/relacion.entity";
import { proyectarEdgesRelacion } from "./editor-diagrama.selectors";

const diagramaId = "diagrama-nm";

function crearClase(id: string, posicionX: number, posicionY: number): Clase {
  return {
    id,
    idDiagrama: diagramaId,
    nombre: id,
    posicionX,
    posicionY,
    ancho: 220,
    atributos: [],
  };
}

function crearRelacion(id: string, origen: string, destino: string): Relacion {
  return {
    id,
    idDiagrama: diagramaId,
    idClaseOrigen: origen,
    idClaseDestino: destino,
    tipoRelacion: "asociacion",
    cardinalidadOrigen: "1",
    cardinalidadDestino: "0..*",
    conectorOrigen: "right",
    conectorDestino: "left",
    nombre: "Asociación",
    referenciasFk: [],
  };
}

describe("proyectarEdgesRelacion", () => {
  it("representa una estructura N:M con una sola arista visual compuesta", () => {
    const clases = [
      crearClase("clase-a", 0, 300),
      crearClase("clase-b", 700, 300),
      crearClase("clase-intermedia", 310, 40),
    ];
    const relaciones = [
      crearRelacion("relacion-a", "clase-a", "clase-intermedia"),
      crearRelacion("relacion-b", "clase-b", "clase-intermedia"),
    ];
    const estructura: EstructuraRelacionNm = {
      id: "estructura-nm",
      idDiagrama: diagramaId,
      idClaseOrigen: "clase-a",
      idClaseDestino: "clase-b",
      idClaseIntermedia: "clase-intermedia",
      idRelacionOrigen: "relacion-a",
      idRelacionDestino: "relacion-b",
    };

    const edges = proyectarEdgesRelacion(relaciones, "relacion-b", [estructura], clases);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: "estructura-nm:estructura-nm",
      type: "estructuraNmUml",
      source: "clase-a",
      target: "clase-b",
      selected: true,
    });
    expect(edges[0].data).toMatchObject({
      relacion: { id: "relacion-a" },
      estructuraNm: { id: "estructura-nm" },
      claseIntermedia: { id: "clase-intermedia" },
    });
  });

  it("conserva relaciones normales y una N:M recursiva sin ocultarlas", () => {
    const clase = crearClase("clase-a", 0, 0);
    const relacion = crearRelacion("relacion-recursiva", "clase-a", "clase-a");
    const estructura: EstructuraRelacionNm = {
      id: "estructura-recursiva",
      idDiagrama: diagramaId,
      idClaseOrigen: "clase-a",
      idClaseDestino: "clase-a",
      idClaseIntermedia: "clase-intermedia-ausente",
      idRelacionOrigen: "relacion-recursiva",
      idRelacionDestino: "relacion-secundaria",
    };

    const edges = proyectarEdgesRelacion([relacion], null, [estructura], [clase]);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ id: "relacion-recursiva", type: "relacionUml" });
  });
});
