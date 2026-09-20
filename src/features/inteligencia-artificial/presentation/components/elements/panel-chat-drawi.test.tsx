import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { useAsistenteIa } from "../../hooks/use-asistente-ia";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";
import { PanelChatDrawi } from "./panel-chat-drawi";

describe("PanelChatDrawi", () => {
  const createMockAsistente = (
    overrides?: Partial<ReturnType<typeof useAsistenteIa>>
  ): ReturnType<typeof useAsistenteIa> => ({
    accionActiva: "chat",
    setAccionActiva: vi.fn(),
    mensajes: [],
    textoEdicion: "",
    setTextoEdicion: vi.fn(),
    imagenTemporal: null,
    audioTemporal: null,
    errorLocal: null,
    avisoIndisponibilidad: null,
    enviarMensaje: vi.fn(() => true),
    adjuntarImagen: vi.fn(() => true),
    removerImagen: vi.fn(),
    fijarAudioTemporal: vi.fn(),
    removerAudio: vi.fn(),
    activarGenerarBackend: vi.fn(),
    limpiarAvisoIndisponibilidad: vi.fn(),
    limpiarErrorLocal: vi.fn(),
    limpiarSesion: vi.fn(),
    ...overrides,
  });

  const createMockGrabacion = (
    overrides?: Partial<GrabacionAudioResult>
  ): GrabacionAudioResult => ({
    estado: "inactivo",
    audioUrl: null,
    error: null,
    duracionSegundos: 0,
    iniciarGrabacion: vi.fn(async () => true),
    detenerGrabacion: vi.fn(async () => null),
    cancelarGrabacion: vi.fn(),
    removerAudio: vi.fn(),
    limpiarRecursos: vi.fn(),
    ...overrides,
  });

  it("no renderiza nada cuando abierto es false", () => {
    const { container } = render(
      <PanelChatDrawi
        abierto={false}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza el panel con banner informativo de indisponibilidad y estado vacío", () => {
    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion()}
      />
    );

    expect(screen.getByText("DRAWI - Asistente IA")).toBeInTheDocument();
    expect(
      screen.getByText(/Las consultas y adjuntos son temporales para esta sesión/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay consultas en esta sesión")
    ).toBeInTheDocument();
  });

  it("permite escribir y enviar consultas al historial local", () => {
    const mockEnviar = vi.fn(() => true);
    const mockSetTexto = vi.fn();
    const asistente = createMockAsistente({
      textoEdicion: "¿Cómo añado una clave foránea?",
      enviarMensaje: mockEnviar,
      setTextoEdicion: mockSetTexto,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
      />
    );

    const botonEnviar = screen.getByRole("button", { name: "Enviar consulta" });
    expect(botonEnviar).not.toBeDisabled();

    fireEvent.click(botonEnviar);
    expect(mockEnviar).toHaveBeenCalledTimes(1);
  });

  it("muestra el historial de mensajes registrados cronológicamente", () => {
    const mensajesMock = [
      {
        id: "msg-1",
        contenido: "Primera consulta de prueba",
        creadoEn: Date.now() - 1000,
      },
      {
        id: "msg-2",
        contenido: "Segunda consulta de prueba",
        creadoEn: Date.now(),
      },
    ];

    const asistente = createMockAsistente({
      mensajes: mensajesMock,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
      />
    );

    expect(screen.getByText("Primera consulta de prueba")).toBeInTheDocument();
    expect(screen.getByText("Segunda consulta de prueba")).toBeInTheDocument();
  });
});
