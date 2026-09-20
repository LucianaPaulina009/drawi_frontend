import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdjuntoImagenDrawi } from "./adjunto-imagen-drawi";

describe("AdjuntoImagenDrawi", () => {
  it("no renderiza nada si imagen es null", () => {
    const { container } = render(
      <AdjuntoImagenDrawi imagen={null} onRemover={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza el nombre del archivo, tamaño y botón para eliminar", () => {
    const onRemover = vi.fn();
    const imagenMock = {
      nombre: "esquema-db.png",
      tipo: "image/png",
      tamano: 2048 * 1024, // 2 MB
      vistaPrevia: "blob:mock-image-preview",
    };

    render(<AdjuntoImagenDrawi imagen={imagenMock} onRemover={onRemover} />);

    expect(screen.getByText("esquema-db.png")).toBeInTheDocument();
    expect(screen.getByText(/2.0 MB/)).toBeInTheDocument();

    const botonEliminar = screen.getByRole("button", {
      name: "Eliminar imagen adjunta",
    });
    expect(botonEliminar).toBeInTheDocument();

    fireEvent.click(botonEliminar);
    expect(onRemover).toHaveBeenCalledTimes(1);
  });
});
