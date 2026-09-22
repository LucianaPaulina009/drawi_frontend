import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { useAsistenteIa } from "../../hooks/use-asistente-ia";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";
import type { useHistorialInteraccionesIa } from "../../hooks/use-historial-interacciones-ia";
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
    error: null,
    duracionSegundos: 0,
    iniciarGrabacion: vi.fn(async () => true),
    detenerGrabacion: vi.fn(async () => null),
    descartarGrabacion: vi.fn(),
    cancelarGrabacion: vi.fn(),
    limpiarRecursos: vi.fn(),
    ...overrides,
  });

  const createMockHistorial = (
    overrides?: Partial<ReturnType<typeof useHistorialInteraccionesIa>>
  ): ReturnType<typeof useHistorialInteraccionesIa> => ({
    interacciones: [],
    cargando: false,
    enviando: false,
    error: null,
    enviarMensaje: vi.fn(async () => true),
    enviarAudio: vi.fn(async () => true),
    enviarImagen: vi.fn(async () => true),
    cargarHistorial: vi.fn(async () => {}),
    limpiarError: vi.fn(),
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

  it("renderiza el panel con banner informativo de contexto e historial persistido", () => {
    const mockHistorial = createMockHistorial({
      interacciones: [
        {
          id: "int-1",
          idDiagrama: "11111111-1111-1111-1111-111111111111",
          idUsuario: "user-1",
          tipo: "CONVERSACION",
          estado: "COMPLETADO",
          entradaUsuario: "Hola DRAWI",
          respuestaIa: "¡Hola! Estoy listo para modelar.",
          claveIdempotencia: "88888888-8888-8888-8888-888888888888",
          creadoEn: "2026-09-20T12:00:00Z",
        },
      ],
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion()}
        historialIa={mockHistorial}
      />
    );

    expect(screen.getByText("DRAWI - Asistente IA")).toBeInTheDocument();
    expect(
      screen.getByText(/Historial persistente y compartido para esta página del diagrama/)
    ).toBeInTheDocument();
    expect(screen.getByText("Hola DRAWI")).toBeInTheDocument();
    expect(screen.getByText("¡Hola! Estoy listo para modelar.")).toBeInTheDocument();
  });

  it("permite escribir y enviar consultas al hook de historial persistido", () => {
    const mockEnviar = vi.fn(async () => true);
    const mockSetTexto = vi.fn();
    const asistente = createMockAsistente({
      textoEdicion: "¿Cómo añado una clave foránea?",
      setTextoEdicion: mockSetTexto,
    });
    const mockHistorial = createMockHistorial({
      enviarMensaje: mockEnviar,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
        historialIa={mockHistorial}
      />
    );

    const botonEnviar = screen.getByRole("button", { name: "Enviar consulta" });
    expect(botonEnviar).not.toBeDisabled();

    fireEvent.click(botonEnviar);
    expect(mockEnviar).toHaveBeenCalledWith("¿Cómo añado una clave foránea?");
  });

  it("escribir 'Hola DRAWI' y hacer click en el botón azul ejecuta exactamente una llamada al callback de submit", () => {
    const mockOnEnviarMensaje = vi.fn(async () => true);
    const mockSetTexto = vi.fn();
    const asistente = createMockAsistente({
      textoEdicion: "Hola DRAWI",
      setTextoEdicion: mockSetTexto,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
        onEnviarMensaje={mockOnEnviarMensaje}
      />
    );

    const botonEnviar = screen.getByRole("button", { name: "Enviar consulta" });
    expect(botonEnviar).not.toBeDisabled();
    expect(botonEnviar).toHaveAttribute("type", "submit");

    fireEvent.click(botonEnviar);

    expect(mockOnEnviarMensaje).toHaveBeenCalledTimes(1);
    expect(mockOnEnviarMensaje).toHaveBeenCalledWith("Hola DRAWI");
    expect(mockSetTexto).toHaveBeenCalledWith("");
  });

  it("escribir 'Hola DRAWI' y presionar Enter ejecuta exactamente una llamada al callback de submit", () => {
    const mockOnEnviarMensaje = vi.fn(async () => true);
    const mockSetTexto = vi.fn();
    const asistente = createMockAsistente({
      textoEdicion: "Hola DRAWI",
      setTextoEdicion: mockSetTexto,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
        onEnviarMensaje={mockOnEnviarMensaje}
      />
    );

    const input = screen.getByRole("textbox", { name: "Consulta para el asistente IA" });
    fireEvent.submit(input.closest("form")!);

    expect(mockOnEnviarMensaje).toHaveBeenCalledTimes(1);
    expect(mockOnEnviarMensaje).toHaveBeenCalledWith("Hola DRAWI");
    expect(mockSetTexto).toHaveBeenCalledWith("");
  });

  it("no envía mensaje si el texto está vacío o contiene solo espacios", () => {
    const mockOnEnviarMensaje = vi.fn(async () => true);
    const asistente = createMockAsistente({
      textoEdicion: "   ",
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
        onEnviarMensaje={mockOnEnviarMensaje}
      />
    );

    const botonEnviar = screen.getByRole("button", { name: "Enviar consulta" });
    expect(botonEnviar).toBeDisabled();

    fireEvent.click(botonEnviar);
    expect(mockOnEnviarMensaje).not.toHaveBeenCalled();
  });

  it("bloquea el submit y deshabilita controles mientras enviando es true", () => {
    const mockOnEnviarMensaje = vi.fn(async () => true);
    const asistente = createMockAsistente({
      textoEdicion: "Consulta en progreso",
    });
    const mockHistorial = createMockHistorial({
      enviando: true,
      enviarMensaje: mockOnEnviarMensaje,
    });

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={asistente}
        grabacion={createMockGrabacion()}
        historialIa={mockHistorial}
        onEnviarMensaje={mockOnEnviarMensaje}
      />
    );

    const input = screen.getByRole("textbox", { name: "Consulta para el asistente IA" });
    const botonEnviar = screen.getByRole("button", { name: "Enviar consulta" });

    expect(input).toBeDisabled();
    expect(botonEnviar).toBeDisabled();

    fireEvent.click(botonEnviar);
    expect(mockOnEnviarMensaje).not.toHaveBeenCalled();
  });

  it("muestra el botón Descartar junto al micrófono exclusivamente durante grabación activa", () => {
    const mockOnDescartar = vi.fn();
    const mockOnAlternar = vi.fn();

    const { rerender } = render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion({ estado: "inactivo" })}
        estadoVoz="idle"
        onAlternarGrabacion={mockOnAlternar}
        onDescartarGrabacion={mockOnDescartar}
      />
    );

    // En idle: el botón Descartar NO debe existir
    expect(screen.queryByRole("button", { name: "Descartar grabación" })).not.toBeInTheDocument();

    // Cambiar a estado grabando
    rerender(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion({ estado: "grabando" })}
        estadoVoz="grabando"
        onAlternarGrabacion={mockOnAlternar}
        onDescartarGrabacion={mockOnDescartar}
      />
    );

    // En grabación activa: el botón Descartar DEBE aparecer junto al micrófono
    const botonDescartar = screen.getByRole("button", { name: "Descartar grabación" });
    expect(botonDescartar).toBeInTheDocument();
    expect(botonDescartar).toHaveTextContent("Descartar");

    // Al hacer clic en Descartar, se ejecuta onDescartarGrabacion
    fireEvent.click(botonDescartar);
    expect(mockOnDescartar).toHaveBeenCalledTimes(1);

    // El botón del micrófono tiene estado de detener/enviar en grabación activa
    const botonMic = screen.getByRole("button", { name: "Detener y enviar grabación" });
    expect(botonMic).toBeInTheDocument();
    fireEvent.click(botonMic);
    expect(mockOnAlternar).toHaveBeenCalledTimes(1);

    // En estado transcribiendo: el botón Descartar NO debe aparecer
    rerender(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion({ estado: "inactivo" })}
        estadoVoz="transcribiendo"
        onAlternarGrabacion={mockOnAlternar}
        onDescartarGrabacion={mockOnDescartar}
      />
    );
    expect(screen.queryByRole("button", { name: "Descartar grabación" })).not.toBeInTheDocument();

    // En estado procesando: el botón Descartar NO debe aparecer
    rerender(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion({ estado: "inactivo" })}
        estadoVoz="procesando"
        onAlternarGrabacion={mockOnAlternar}
        onDescartarGrabacion={mockOnDescartar}
      />
    );
    expect(screen.queryByRole("button", { name: "Descartar grabación" })).not.toBeInTheDocument();
  });
});

