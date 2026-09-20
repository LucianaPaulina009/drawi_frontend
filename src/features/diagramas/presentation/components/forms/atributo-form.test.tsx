import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Atributo } from "../../../domain/entities/atributo.entity";
import { AtributoForm } from "./atributo-form";

const onGuardar = vi.fn().mockResolvedValue(null);

function atributo(parcial: Partial<Atributo>): Atributo {
  return {
    id: "atributo-1",
    idClase: "clase-1",
    nombre: "id",
    tipoDato: "integer",
    longitud: null,
    precision: null,
    escala: null,
    esLlavePrimaria: false,
    permiteNulo: false,
    esUnico: false,
    valorPorDefecto: null,
    ordenDePosicion: 1,
    procedencia: "manual",
    ...parcial,
  };
}

describe("AtributoForm", () => {
  it("empieza por Nombre del atributo sin banners ni ayuda redundante de PK", () => {
    const { container } = render(
      <AtributoForm
        atributoInicial={atributo({ esLlavePrimaria: true, procedencia: "sistema_clase" })}
        isPending={false}
        onCancelar={vi.fn()}
        onGuardar={onGuardar}
      />
    );

    expect(screen.getByLabelText("Nombre del atributo")).toBeInTheDocument();
    expect(container.textContent).not.toContain("Clave primaria canónica");
    expect(container.textContent).not.toContain("Cada clase cuenta");
    expect(screen.getByLabelText("Tipo de dato")).toBeDisabled();
  });

  it("mantiene bloqueados los campos estructurales de una FK", () => {
    const { container } = render(
      <AtributoForm
        atributoInicial={atributo({
          nombre: "cliente_id",
          procedencia: "sistema_fk",
        })}
        isPending={false}
        onCancelar={vi.fn()}
        onGuardar={onGuardar}
      />
    );

    expect(container.querySelector<HTMLInputElement>("#nombre-atributo")!).toBeEnabled();
    expect(container.querySelector<HTMLSelectElement>("#tipo-dato-select")!).toBeDisabled();
    expect(container.querySelector<HTMLInputElement>("#chk-null")!).toBeDisabled();
  });
});
