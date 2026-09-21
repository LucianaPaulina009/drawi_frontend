import { describe, expect, it } from "vitest";

import {
  TAMANO_HITBOX_HANDLE,
  TAMANO_PUNTO_VISUAL_HANDLE,
} from "./nodo-clase-uml";

describe("puntos de conexión de NodoClaseUml", () => {
  it("mantiene un punto visual discreto dentro de un hitbox cómodo", () => {
    expect(TAMANO_PUNTO_VISUAL_HANDLE).toBe(6);
    expect(TAMANO_HITBOX_HANDLE).toBe(24);
    expect(TAMANO_HITBOX_HANDLE).toBeGreaterThan(TAMANO_PUNTO_VISUAL_HANDLE);
  });
});
