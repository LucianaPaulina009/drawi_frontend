import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Position } from "@xyflow/react";

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="edge-label-renderer">{children}</div>
    ),
    useInternalNode: vi.fn().mockReturnValue(null),
  };
});

import {
  debeMostrarCardinalidades,
  EstructuraNmUmlEdge,
  obtenerMarcadoresRelacion,
  obtenerNombreVisualTipo,
  obtenerPosicionCardinalidad,
  obtenerPosicionCardinalidadRecursiva,
  obtenerPosicionLabelRelacion,
  obtenerRutaOrtogonalConCarril,
  RelacionUmlEdge,
  resolverExtremoRamalNm,
} from "./relacion-uml-edge";
import type { Relacion } from "../../../domain/entities/relacion.entity";

describe("resolverExtremoRamalNm", () => {
  it("termina en el borde inferior medido cuando la intermedia está arriba", () => {
    expect(resolverExtremoRamalNm(40, 116, 300)).toEqual({
      estaArriba: true,
      y: 156,
    });
  });

  it("termina en el borde superior medido cuando la intermedia está abajo", () => {
    expect(resolverExtremoRamalNm(420, 116, 300)).toEqual({
      estaArriba: false,
      y: 420,
    });
  });
});

describe("proyección visual de relaciones UML", () => {
  it.each(["asociacion", "asociacion_dirigida", "agregacion", "composicion"] as const)(
    "%s muestra cardinalidades",
    (tipo) => {
      expect(debeMostrarCardinalidades(tipo)).toBe(true);
    }
  );

  it.each(["herencia", "realizacion", "dependencia"] as const)(
    "%s no muestra cardinalidades",
    (tipo) => {
      expect(debeMostrarCardinalidades(tipo)).toBe(false);
    }
  );

  it("mapea nombres legibles en español para cada tipo de relación UML", () => {
    expect(obtenerNombreVisualTipo("asociacion")).toBe("Asociación");
    expect(obtenerNombreVisualTipo("herencia")).toBe("Herencia");
    expect(obtenerNombreVisualTipo("composicion")).toBe("Composición");
    expect(obtenerNombreVisualTipo("agregacion")).toBe("Agregación");
    expect(obtenerNombreVisualTipo("dependencia")).toBe("Dependencia");
    expect(obtenerNombreVisualTipo("realizacion")).toBe("Realización");
    expect(obtenerNombreVisualTipo("asociacion_dirigida")).toBe("Asociación Dirigida");
  });

  it("traza una ruta ortogonal conectando origen y destino con precisión", () => {
    const [rutaH, labelX, labelY] = obtenerRutaOrtogonalConCarril(
      200,
      100,
      Position.Right,
      400,
      100,
      Position.Left,
      0
    );
    expect(rutaH).toContain("M200 100");
    expect(rutaH).toContain("400 100");
    expect(labelX).toBe(300);
    expect(labelY).toBe(100);

    const [rutaV, labelXV, labelYV] = obtenerRutaOrtogonalConCarril(
      200,
      100,
      Position.Bottom,
      200,
      400,
      Position.Top,
      0
    );
    expect(rutaV).toContain("M200 100");
    expect(rutaV).toContain("200 400");
    expect(labelXV).toBe(200);
    expect(labelYV).toBe(250);
  });

  it("mantiene segmentos exclusivamente ortogonales (horizontales o verticales) sin líneas diagonales", () => {
    const [ruta, labelX, labelY] = obtenerRutaOrtogonalConCarril(
      220,
      100,
      Position.Right,
      400,
      250,
      Position.Left
    );

    expect(labelX).toBeGreaterThanOrEqual(220);
    expect(labelX).toBeLessThanOrEqual(400);
    expect(labelY).toBeGreaterThanOrEqual(100);
    expect(labelY).toBeLessThanOrEqual(250);

    // Extrae todos los pares de coordenadas y comprueba que ningún segmento sea diagonal
    const coords = [...ruta.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)].map(
      ([, x, y]) => ({ x: Number(x), y: Number(y) })
    );

    for (let i = 1; i < coords.length; i += 1) {
      const prev = coords[i - 1];
      const curr = coords[i];
      // Cada segmento debe ser horizontal (mismo y) o vertical (mismo x)
      expect(prev.x === curr.x || prev.y === curr.y).toBe(true);
    }
  });

  it("posiciona el label y las cardinalidades directamente en la línea", () => {
    expect(obtenerPosicionLabelRelacion(300, 180)).toEqual({ x: 300, y: 180 });
    expect(obtenerPosicionLabelRelacion(300, 192)).toEqual({ x: 300, y: 192 });

    expect(
      obtenerPosicionCardinalidad(220, 100, Position.Right, 0, false)
    ).toEqual({ x: 246, y: 100 });
    expect(
      obtenerPosicionCardinalidad(220, 100, Position.Right, 12, false)
    ).toEqual({ x: 246, y: 112 });
  });

  it("distingue los diamantes de agregación y composición", () => {
    const ids = {
      flecha: "flecha",
      triangulo: "triangulo",
      diamanteVacio: "diamante-vacio",
      diamanteLleno: "diamante-lleno",
    };

    expect(obtenerMarcadoresRelacion("agregacion", ids).markerStart).toBe(
      "url(#diamante-vacio)"
    );
    expect(obtenerMarcadoresRelacion("composicion", ids).markerStart).toBe(
      "url(#diamante-lleno)"
    );
  });

  it("calcula ramal ortogonal de estructura N:M que conecta al centro de la línea principal", () => {
    // Línea principal horizontal de (100, 200) a (500, 200) -> centroX=300, centroY=200
    const [linea, centroX, centroY] = obtenerRutaOrtogonalConCarril(
      100,
      200,
      Position.Right,
      500,
      200,
      Position.Left
    );
    expect(centroX).toBe(300);
    expect(centroY).toBe(200);

    // Clase intermedia ubicada arriba en (250, 40) con ancho=100, alto=60 -> centroClaseX=300
    const extremo = resolverExtremoRamalNm(40, 60, centroY);
    expect(extremo.estaArriba).toBe(true);
    expect(extremo.y).toBe(100); // borde inferior de la clase intermedia
  });

  it("calcula posiciones diferenciadas y sin superposición para cardinalidades de relaciones recursivas", () => {
    // Caso estándar: source sale por la derecha (320, 160), target entra por arriba (210, 100)
    const sourcePos = obtenerPosicionCardinalidadRecursiva(
      320,
      160,
      Position.Right,
      true,
      0,
      false
    );
    const targetPos = obtenerPosicionCardinalidadRecursiva(
      210,
      100,
      Position.Top,
      false,
      0,
      false
    );

    // Source debe ubicarse hacia la derecha y ligeramente arriba de la línea de salida
    expect(sourcePos.x).toBe(342);
    expect(sourcePos.y).toBe(146);

    // Target debe ubicarse arriba del nodo (y < 100) y desplazado del conector
    expect(targetPos.x).toBe(196);
    expect(targetPos.y).toBe(78); // Claramente fuera del nodo (y=100) hacia arriba

    // Distancia Euclidiana entre ambas cardinalidades > 100px para garantizar cero superposición
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    expect(distancia).toBeGreaterThan(100);
  });

  it("mantiene posiciones de cardinalidad de relaciones no recursivas sin regresión", () => {
    const posOrigen = obtenerPosicionCardinalidad(100, 200, Position.Right, 0, false);
    const posDestino = obtenerPosicionCardinalidad(400, 200, Position.Left, 0, false);

    expect(posOrigen).toEqual({ x: 126, y: 200 });
    expect(posDestino).toEqual({ x: 374, y: 200 });
  });

  it("renderiza correctamente una relación recursiva 1:N con ambas cardinalidades visibles y nombre sin superponer", () => {
    const relacionRecursiva: Relacion = {
      id: "rel-recursiva-1",
      idDiagrama: "diag-1",
      idClaseOrigen: "clase-empleado",
      idClaseDestino: "clase-empleado",
      tipoRelacion: "asociacion",
      cardinalidadOrigen: "1",
      cardinalidadDestino: "0..*",
      conectorOrigen: "right",
      conectorDestino: "top",
      nombre: "Supervisa",
      referenciasFk: [],
    };

    render(
      <svg>
        <RelacionUmlEdge
          id="rel-recursiva-1"
          source="clase-empleado"
          target="clase-empleado"
          sourceX={320}
          sourceY={160}
          targetX={210}
          targetY={100}
          sourcePosition={Position.Right}
          targetPosition={Position.Top}
          data={{
            relacion: relacionRecursiva,
            seleccionada: false,
            puedeEditar: true,
          }}
        />
      </svg>
    );

    // Ambas cardinalidades deben estar presentes en el documento
    const cardOrigen = screen.getByTestId("cardinalidad-origen");
    const cardDestino = screen.getByTestId("cardinalidad-destino");

    expect(cardOrigen).toBeInTheDocument();
    expect(cardOrigen.textContent).toBe("1");

    expect(cardDestino).toBeInTheDocument();
    expect(cardDestino.textContent).toBe("0..*");

    // El nombre de la relación debe estar visible
    const botonNombre = screen.getByRole("button", { name: "Supervisa" });
    expect(botonNombre).toBeInTheDocument();
  });

  it("renderiza correctamente las cardinalidades de una relación N:M mostrando muchos a muchos en los extremos", () => {
    const relacionOrigen: Relacion = {
      id: "rel-a",
      idDiagrama: "diag-1",
      idClaseOrigen: "clase-tabla",
      idClaseDestino: "clase-intermedia",
      tipoRelacion: "asociacion",
      cardinalidadOrigen: "1",
      cardinalidadDestino: "0..*",
      conectorOrigen: "right",
      conectorDestino: "left",
      referenciasFk: [],
    };

    const relacionDestino: Relacion = {
      id: "rel-b",
      idDiagrama: "diag-1",
      idClaseOrigen: "clase-hola",
      idClaseDestino: "clase-intermedia",
      tipoRelacion: "asociacion",
      cardinalidadOrigen: "1",
      cardinalidadDestino: "0..*",
      conectorOrigen: "left",
      conectorDestino: "right",
      referenciasFk: [],
    };

    render(
      <svg>
        <EstructuraNmUmlEdge
          id="estructura-nm:nm-1"
          source="clase-tabla"
          target="clase-hola"
          sourceX={100}
          sourceY={200}
          targetX={500}
          targetY={200}
          sourcePosition={Position.Right}
          targetPosition={Position.Left}
          data={{
            relacion: relacionOrigen,
            relacionOrigen,
            relacionDestino,
            estructuraNm: {
              id: "nm-1",
              idDiagrama: "diag-1",
              idClaseOrigen: "clase-tabla",
              idClaseDestino: "clase-hola",
              idClaseIntermedia: "clase-intermedia",
              idRelacionOrigen: "rel-a",
              idRelacionDestino: "rel-b",
            },
            claseIntermedia: {
              id: "clase-intermedia",
              idDiagrama: "diag-1",
              nombre: "Tabla_Hola",
              posicionX: 300,
              posicionY: 50,
              ancho: 220,
              atributos: [],
            },
            seleccionada: false,
            puedeEditar: true,
          }}
        />
      </svg>
    );

    const cardOrigen = screen.getByTestId("cardinalidad-origen");
    const cardDestino = screen.getByTestId("cardinalidad-destino");

    expect(cardOrigen).toBeInTheDocument();
    expect(cardOrigen.textContent).toBe("0..*");

    expect(cardDestino).toBeInTheDocument();
    expect(cardDestino.textContent).toBe("0..*");
  });
});


