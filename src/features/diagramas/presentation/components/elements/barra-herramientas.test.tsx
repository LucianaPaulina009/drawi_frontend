import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BarraHerramientas } from "./barra-herramientas";

describe("BarraHerramientas", () => {
  it("expone solamente las herramientas activas del editor", () => {
    render(<BarraHerramientas onCambiarHerramienta={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Seleccionar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mano / Pan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Herramienta Clase UML" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Herramienta Borrador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Relación / Conector" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dibujo / Lápiz" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nota Adhesiva" })).not.toBeInTheDocument();
  });

  it("no habilita Clase, Borrador ni Relación sin permiso de edición", () => {
    const onCambiarHerramienta = vi.fn();
    const { container } = render(<BarraHerramientas puedeEditar={false} onCambiarHerramienta={onCambiarHerramienta} />);

    const clase = within(container).getByRole("button", { name: "Herramienta Clase UML" });
    expect(clase).toBeDisabled();
    fireEvent.click(clase);
    expect(onCambiarHerramienta).not.toHaveBeenCalled();
  });
});
