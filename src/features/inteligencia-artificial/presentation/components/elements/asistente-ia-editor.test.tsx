import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AsistenteIaEditor } from "./asistente-ia-editor";

describe("AsistenteIaEditor", () => {
  it("renderiza el launcher de DRAWI y el panel cuando abierto es true", () => {
    const onAbrir = vi.fn();
    const onCerrar = vi.fn();

    const { rerender } = render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={false}
        onAbrir={onAbrir}
        onCerrar={onCerrar}
      />
    );

    expect(
      screen.getByRole("button", { name: "Abrir asistente de IA DRAWI" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("panel-chat-drawi")).not.toBeInTheDocument();

    rerender(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={onAbrir}
        onCerrar={onCerrar}
      />
    );

    expect(screen.getByTestId("panel-chat-drawi")).toBeInTheDocument();
  });

  it("cierra el panel al pulsar la tecla Escape", () => {
    const onCerrar = vi.fn();

    render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={onCerrar}
      />
    );

    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
