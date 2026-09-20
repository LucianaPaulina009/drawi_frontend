import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";
import { useEncolarOperacionEditor } from "./use-encolar-operacion-editor";

describe("useEncolarOperacionEditor", () => {
  beforeEach(() => {
    useEditorDiagramaStore.getState().limpiar();
  });

  it("encola correctamente operaciones válidas con valores numéricos finitos", async () => {
    const { result } = renderHook(() => useEncolarOperacionEditor("usr-1:diag-1"));

    let operacion: any;
    await act(async () => {
      operacion = await result.current("ACTUALIZAR_CLASE", {
        idClase: "c-1",
        posicionX: 150,
        posicionY: 250,
      });
    });

    expect(operacion).toBeDefined();
    expect(operacion.tipo).toBe("ACTUALIZAR_CLASE");
    expect(operacion.payload.posicionX).toBe(150);
    expect(operacion.payload.posicionY).toBe(250);
  });

  it("rechaza de forma inmediata cualquier payload que contenga NaN en campos numéricos", async () => {
    const { result } = renderHook(() => useEncolarOperacionEditor("usr-1:diag-1"));

    await expect(
      act(async () => {
        await result.current("ACTUALIZAR_CLASE", {
          idClase: "c-1",
          posicionX: NaN,
          posicionY: 250,
        });
      })
    ).rejects.toThrow(/no es un número finito/);

    const store = useEditorDiagramaStore.getState();
    expect(store.operacionesPendientes).toHaveLength(0);
  });

  it("rechaza de forma inmediata cualquier payload con subcampos anidados que contengan NaN", async () => {
    const { result } = renderHook(() => useEncolarOperacionEditor("usr-1:diag-1"));

    await expect(
      act(async () => {
        await result.current("CREAR_ESTRUCTURA_NM", {
          idEstructuraNm: "nm-1",
          claseIntermedia: {
            idClase: "c-inter",
            posicionX: NaN,
            posicionY: 100,
          },
        });
      })
    ).rejects.toThrow(/no es un número finito/);

    const store = useEditorDiagramaStore.getState();
    expect(store.operacionesPendientes).toHaveLength(0);
  });
});
