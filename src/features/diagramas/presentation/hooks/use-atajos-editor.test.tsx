import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAtajosEditor } from "./use-atajos-editor";

describe("useAtajosEditor", () => {
  it("activa eliminación y Escape fuera de controles editables", () => {
    const onEliminarSeleccion = vi.fn();
    const onCancelarInteraccion = vi.fn();
    renderHook(() => useAtajosEditor({ onEliminarSeleccion, onCancelarInteraccion }));

    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" })));
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));

    expect(onEliminarSeleccion).toHaveBeenCalledOnce();
    expect(onCancelarInteraccion).toHaveBeenCalledOnce();
  });

  it("no intercepta Delete al editar un input", () => {
    const onEliminarSeleccion = vi.fn();
    renderHook(() => useAtajosEditor({ onEliminarSeleccion }));
    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true })));
    expect(onEliminarSeleccion).not.toHaveBeenCalled();
    input.remove();
  });
});
