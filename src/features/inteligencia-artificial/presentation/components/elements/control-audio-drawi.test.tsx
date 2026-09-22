import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";
import { ControlAudioDrawi } from "./control-audio-drawi";

describe("ControlAudioDrawi", () => {
  const createMockGrabacion = (
    overrides?: Partial<GrabacionAudioResult>
  ): GrabacionAudioResult => ({
    estado: "inactivo",
    error: null,
    duracionSegundos: 0,
    iniciarGrabacion: vi.fn(async () => true),
    detenerGrabacion: vi.fn(async () => null),
    descartarGrabacion: vi.fn(),
    cancelarGrabacion: vi.fn(),
    limpiarRecursos: vi.fn(),
    ...overrides,
  });

  it("renderiza el botón para iniciar grabación en estado idle", () => {
    const onAlternar = vi.fn();
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion()}
        estadoVoz="idle"
        onAlternarGrabacion={onAlternar}
      />
    );

    const boton = screen.getByRole("button", { name: "Iniciar grabación de audio" });
    expect(boton).toBeInTheDocument();
    expect(boton).not.toBeDisabled();

    fireEvent.click(boton);
    expect(onAlternar).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el botón de grabación cuando deshabilitado es true", () => {
    const onAlternar = vi.fn();
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion()}
        estadoVoz="idle"
        deshabilitado={true}
        onAlternarGrabacion={onAlternar}
      />
    );

    const boton = screen.getByRole("button", { name: "Iniciar grabación de audio" });
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(onAlternar).not.toHaveBeenCalled();
  });

  it("muestra estado de solicitando permiso", () => {
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion({ estado: "solicitando" })}
        estadoVoz="solicitando"
      />
    );

    expect(screen.getByText("Solicitando acceso al micrófono...")).toBeInTheDocument();
  });

  it("muestra interfaz de grabación activa con cronómetro, detener y descartar", () => {
    const onAlternar = vi.fn();
    const onDescartar = vi.fn();

    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion({ estado: "grabando", duracionSegundos: 15 })}
        estadoVoz="grabando"
        onAlternarGrabacion={onAlternar}
        onDescartarGrabacion={onDescartar}
      />
    );

    expect(screen.getByText("Grabando: 0:15")).toBeInTheDocument();

    const botonDetener = screen.getByRole("button", { name: "Detener y enviar grabación" });
    const botonDescartar = screen.getByRole("button", { name: "Descartar grabación" });

    expect(botonDetener).toBeInTheDocument();
    expect(botonDescartar).toBeInTheDocument();

    fireEvent.click(botonDetener);
    expect(onAlternar).toHaveBeenCalledTimes(1);

    fireEvent.click(botonDescartar);
    expect(onDescartar).toHaveBeenCalledTimes(1);
  });

  it("muestra estado transcribiendo", () => {
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion()}
        estadoVoz="transcribiendo"
      />
    );

    expect(screen.getByText("Transcribiendo audio...")).toBeInTheDocument();
  });

  it("muestra estado procesando", () => {
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion()}
        estadoVoz="procesando"
      />
    );

    expect(screen.getByText("DRAWI procesando solicitud...")).toBeInTheDocument();
  });

  it("muestra mensaje de error accesible en alerta cuando existe errorVoz o errorGrabacion", () => {
    render(
      <ControlAudioDrawi
        grabacion={createMockGrabacion()}
        estadoVoz="error"
        errorVoz="No se detectó voz en la grabación."
      />
    );

    const alerta = screen.getByRole("alert");
    expect(alerta).toBeInTheDocument();
    expect(screen.getByText("No se detectó voz en la grabación.")).toBeInTheDocument();
  });
});
