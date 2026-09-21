import { describe, expect, it } from "vitest";

import {
  debeMostrarCardinalidades,
  obtenerMarcadoresRelacion,
  obtenerNombreVisualTipo,
  obtenerPosicionCardinalidad,
  obtenerPosicionLabelRelacion,
  obtenerRutaOrtogonalConCarril,
  resolverExtremoRamalNm,
} from "./relacion-uml-edge";
import { Position } from "@xyflow/react";

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
});
