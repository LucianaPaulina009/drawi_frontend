import { describe, expect, it } from "vitest";

import { resolverExtremoRamalNm } from "./relacion-uml-edge";

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
