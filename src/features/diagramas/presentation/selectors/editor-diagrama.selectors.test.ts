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

  it("conserva el handle de origen fijo en una relación N:M al mover la clase destino", () => {
    const clases = [
      crearClase("clase-a", 0, 300),
      crearClase("clase-b", 700, 300),
      crearClase("clase-intermedia", 310, 40),
    ];
    const relaciones = [
      crearRelacion("relacion-a", "clase-a", "clase-intermedia"),
      {
        ...crearRelacion("relacion-b", "clase-b", "clase-intermedia"),
        conectorOrigen: "left" as const,
      },
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

    const [inicial] = proyectarEdgesRelacion(relaciones, null, [estructura], clases);
    const [movidaArriba] = proyectarEdgesRelacion(
      relaciones,
      null,
      [estructura],
      [clases[0], { ...clases[1], posicionY: 0 }, clases[2]]
    );
    const [movidaAbajo] = proyectarEdgesRelacion(
      relaciones,
      null,
      [estructura],
      [clases[0], { ...clases[1], posicionY: 600 }, clases[2]]
    );

    expect(inicial.sourceHandle).toBe("right-center");
    expect(movidaArriba.sourceHandle).toBe("right-center");
    expect(movidaAbajo.sourceHandle).toBe("right-center");
    expect(inicial.targetHandle).toBe("left-center-target");
    expect(movidaArriba.targetHandle).toBe("left-center-target");
    expect(movidaAbajo.targetHandle).toBe("left-center-target");
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

  it("asigna un sub-handle apropiado a una clase con una relación hacia la derecha", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 400, 100);
    const rel = crearRelacion("rel-1", "clase-1", "clase-2");

    const edges = proyectarEdgesRelacion([rel], null, [], [c1, c2]);

    expect(edges).toHaveLength(1);
    expect(edges[0].sourceHandle).toBe("right-center");
    expect(edges[0].targetHandle).toBe("left-center-target");
  });

  it("mantiene el sub-handle persistido exacto sin redistribuirlo", () => {
    const origen = crearClase("clase-origen", 0, 100);
    const destino = crearClase("clase-destino", 400, 100);
    const relacion: Relacion = {
      ...crearRelacion("relacion", origen.id, destino.id),
      conectorOrigen: "right-top",
      conectorDestino: "left-bottom",
    };

    const [inicial] = proyectarEdgesRelacion([relacion], null, [], [origen, destino]);
    const [movida] = proyectarEdgesRelacion(
      [relacion],
      null,
      [],
      [origen, { ...destino, posicionY: 500 }]
    );

    expect(inicial.sourceHandle).toBe("right-top");
    expect(inicial.targetHandle).toBe("left-bottom-target");
    expect(movida.sourceHandle).toBe("right-top");
    expect(movida.targetHandle).toBe("left-bottom-target");
  });

  it("conserva el handle elegido al mover el destino hacia arriba", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 400, 100);
    const relacion = crearRelacion("rel-1", c1.id, c2.id);

    const [inicial] = proyectarEdgesRelacion([relacion], null, [], [c1, c2]);
    const [destinoArriba] = proyectarEdgesRelacion(
      [relacion],
      null,
      [],
      [c1, { ...c2, posicionY: -200 }]
    );

    expect(inicial.sourceHandle).toBe("right-center");
    expect(destinoArriba.sourceHandle).toBe("right-center");
    expect(inicial.targetHandle).toBe("left-center-target");
    expect(destinoArriba.targetHandle).toBe("left-center-target");
  });

  it("conserva los handles elegidos al mover el destino hacia abajo", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 400, 100);
    const relacion = crearRelacion("rel-1", c1.id, c2.id);

    const [destinoAbajo] = proyectarEdgesRelacion(
      [relacion],
      null,
      [],
      [c1, { ...c2, posicionY: 420 }]
    );

    expect(destinoAbajo.sourceHandle).toBe("right-center");
    expect(destinoAbajo.targetHandle).toBe("left-center-target");
  });

  it("conserva los handles elegidos cuando el destino cambia al lado opuesto", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 400, 100);
    const relacion = crearRelacion("rel-1", c1.id, c2.id);

    const [destinoAlOtroLado] = proyectarEdgesRelacion(
      [relacion],
      null,
      [],
      [c1, { ...c2, posicionX: -500 }]
    );

    expect(destinoAlOtroLado.sourceHandle).toBe("right-center");
    expect(destinoAlOtroLado.targetHandle).toBe("left-center-target");
  });

  it("conserva los handles al proyectar relaciones entre clases intermedias", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 600, 100);
    const obstaculo = crearClase("clase-obstaculo", 300, 100);
    const relacion = crearRelacion("rel-1", c1.id, c2.id);

    const [edge] = proyectarEdgesRelacion([relacion], null, [], [c1, c2, obstaculo]);

    expect(edge.sourceHandle).toBe("right-center");
    expect(edge.targetHandle).toBe("left-center-target");
  });

  it("mantiene estabilidad determinista en renders y recargas sin saltar arbitrariamente", () => {
    const c1 = crearClase("clase-1", 0, 100);
    const c2 = crearClase("clase-2", 400, 0);
    const c3 = crearClase("clase-3", 400, 200);
    const rel1 = crearRelacion("rel-1", "clase-1", "clase-2");
    const rel2 = crearRelacion("rel-2", "clase-1", "clase-3");

    const render1 = proyectarEdgesRelacion([rel1, rel2], null, [], [c1, c2, c3]);
    const render2 = proyectarEdgesRelacion([rel1, rel2], null, [], [c1, c2, c3]);
    const render3 = proyectarEdgesRelacion([rel2, rel1], null, [], [c1, c2, c3]); // distinto orden de array

    expect(render1.map((e) => e.sourceHandle)).toEqual(render2.map((e) => e.sourceHandle));
    expect(render1.map((e) => e.sourceHandle)).toEqual(render3.map((e) => e.sourceHandle));
    expect(render1.map((e) => e.targetHandle)).toEqual(render2.map((e) => e.targetHandle));
  });

  it("no cambia los handles ante un cambio remoto no relacionado", () => {
    const origen = crearClase("clase-origen", 0, 100);
    const destino = crearClase("clase-destino", 420, 100);
    const ajena = crearClase("clase-ajena", 1000, 800);
    const relacion = crearRelacion("relacion", origen.id, destino.id);

    const [antes] = proyectarEdgesRelacion([relacion], null, [], [origen, destino]);
    const [despues] = proyectarEdgesRelacion(
      [relacion],
      null,
      [],
      [origen, destino, ajena]
    );

    expect(despues.sourceHandle).toBe(antes.sourceHandle);
    expect(despues.targetHandle).toBe(antes.targetHandle);
  });

  it("conserva los handles de relaciones cercanas sin reasignarlos", () => {
    const origen = crearClase("clase-origen", 0, 100);
    const destinoA = crearClase("clase-destino-a", 420, 70);
    const destinoB = crearClase("clase-destino-b", 420, 150);
    const relacionA = crearRelacion("relacion-a", origen.id, destinoA.id);
    const relacionB = crearRelacion("relacion-b", origen.id, destinoB.id);

    const edges = proyectarEdgesRelacion(
      [relacionA, relacionB],
      null,
      [],
      [origen, destinoA, destinoB]
    );

    expect(edges.map((edge) => edge.sourceHandle)).toEqual(
      expect.arrayContaining(["right-center", "right-center"])
    );
    expect(edges.map((edge) => edge.targetHandle)).toEqual(
      expect.arrayContaining(["left-center-target", "left-center-target"])
    );
  });

  it("proyecta relaciones que se cruzan conservando sus handles respectivos", () => {
    const superiorIzquierda = crearClase("superior-izquierda", 0, 100);
    const inferiorIzquierda = crearClase("inferior-izquierda", 0, 300);
    const superiorDerecha = crearClase("superior-derecha", 500, 100);
    const inferiorDerecha = crearClase("inferior-derecha", 500, 300);

    const diagonalDerecha = crearRelacion(
      "relacion-diagonal-derecha",
      superiorIzquierda.id,
      inferiorDerecha.id
    );
    const diagonalIzquierda = crearRelacion(
      "relacion-diagonal-izquierda",
      superiorDerecha.id,
      inferiorIzquierda.id
    );

    const edges = proyectarEdgesRelacion(
      [diagonalDerecha, diagonalIzquierda],
      null,
      [],
      [superiorIzquierda, inferiorIzquierda, superiorDerecha, inferiorDerecha]
    );

    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.sourceHandle)).toEqual(
      expect.arrayContaining(["right-center", "right-center"])
    );
    expect(edges.map((e) => e.targetHandle)).toEqual(
      expect.arrayContaining(["left-center-target", "left-center-target"])
    );
  });

  it("mantiene compatibilidad visual con conectores legacy top/right/bottom/left", () => {
    const origen = crearClase("clase-origen", 0, 300);
    const destino = crearClase("clase-destino", 0, 0);
    const relacion = {
      ...crearRelacion("relacion-legacy", origen.id, destino.id),
      conectorOrigen: "top" as const,
      conectorDestino: "bottom" as const,
    };

    const [edge] = proyectarEdgesRelacion([relacion], null, [], [origen, destino]);
    expect(edge.sourceHandle).toBe("top-center");
    expect(edge.targetHandle).toBe("bottom-center-target");
  });

  it("proyecta los mismos handles y carriles para clientes conectados con el mismo estado", () => {
    const origen = crearClase("clase-origen", 0, 100);
    const destinoA = crearClase("clase-destino-a", 420, 70);
    const destinoB = crearClase("clase-destino-b", 420, 150);
    const relaciones = [
      crearRelacion("relacion-a", origen.id, destinoA.id),
      crearRelacion("relacion-b", origen.id, destinoB.id),
    ];

    const proyeccionUsuarioA = proyectarEdgesRelacion(
      relaciones,
      null,
      [],
      [origen, destinoA, destinoB]
    );
    const proyeccionUsuarioB = proyectarEdgesRelacion(
      [...relaciones].reverse(),
      null,
      [],
      [origen, destinoA, destinoB]
    );

    const simplificar = (edges: typeof proyeccionUsuarioA) =>
      edges
        .map((edge) => ({
          id: edge.id,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          carril: (edge.data as { desplazamientoCarril?: number }).desplazamientoCarril,
        }))
        .sort((izquierdo, derecho) => izquierdo.id.localeCompare(derecho.id));

    expect(simplificar(proyeccionUsuarioA)).toEqual(simplificar(proyeccionUsuarioB));
  });
});
