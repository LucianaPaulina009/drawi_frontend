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
    cargandoMas: false,
    hayMas: false,
    enviando: false,
    error: null,
    enviarMensaje: vi.fn(async () => true),
    enviarAudio: vi.fn(async () => true),
    enviarImagen: vi.fn(async () => true),
    cargarHistorial: vi.fn(async () => {}),
    cargarMasInteracciones: vi.fn(async () => {}),
    agregarInteraccion: vi.fn(),
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

  it("renderiza una interacción de tipo GENERACION_BACKEND con la lista completa de errores en un solo mensaje", () => {
    const mockHistorial = createMockHistorial({
      interacciones: [
        {
          id: "int-backend-err",
          idDiagrama: "11111111-1111-1111-1111-111111111111",
          idUsuario: "user-1",
          tipo: "GENERACION_BACKEND",
          estado: "ERROR",
          entradaUsuario: "Generar Backend",
          respuestaIa:
            "No se pudo generar el backend porque el diagrama contiene los siguientes errores:\n\n• La clase Venta no tiene una clave primaria válida.\n• El atributo total tiene un tipo no soportado.\n• La relación Cliente - Venta tiene una FK inconsistente.",
          claveIdempotencia: "99999999-9999-9999-9999-999999999999",
          creadoEn: "2026-09-22T12:00:00Z",
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

    expect(screen.getByText("Generar Backend")).toBeInTheDocument();
    expect(
      screen.getByText(
        /No se pudo generar el backend porque el diagrama contiene los siguientes errores:/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/• La clase Venta no tiene una clave primaria válida\./)
    ).toBeInTheDocument();
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

  it("renderiza interacción GENERACION_BACKEND de error con viñetas y formato agente", () => {
    const mockHistorial = createMockHistorial({
      interacciones: [
        {
          id: "int-gen-err",
          idDiagrama: "diag-1",
          idUsuario: "user-1",
          tipo: "GENERACION_BACKEND",
          estado: "ERROR",
          entradaUsuario: "Generar Backend",
          respuestaIa:
            "No se pudo generar el backend porque el diagrama contiene los siguientes errores:\n\n• La clase 'Venta' no tiene una clave primaria (PK) definida.\n• El atributo 'precio' tiene un tipo no soportado.",
          claveIdempotencia: "key-err-1",
          creadoEn: "2026-09-22T10:00:00Z",
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

    expect(screen.getByText("Generar Backend")).toBeInTheDocument();
    expect(
      screen.getByText(/No se pudo generar el backend porque el diagrama contiene los siguientes errores/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/• La clase 'Venta' no tiene una clave primaria/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/• El atributo 'precio' tiene un tipo no soportado/)
    ).toBeInTheDocument();
  });

  it("renderiza interacción GENERACION_BACKEND de éxito como respuesta confirmatoria del agente", () => {
    const mockHistorial = createMockHistorial({
      interacciones: [
        {
          id: "int-gen-ok",
          idDiagrama: "diag-1",
          idUsuario: "user-1",
          tipo: "GENERACION_BACKEND",
          estado: "COMPLETADO",
          entradaUsuario: "Generar Backend",
          respuestaIa: "Backend generado correctamente.",
          claveIdempotencia: "key-ok-1",
          creadoEn: "2026-09-22T10:05:00Z",
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

    expect(screen.getByText("Generar Backend")).toBeInTheDocument();
    expect(screen.getByText("Backend generado correctamente.")).toBeInTheDocument();
  });

  it("renderiza el banner de error conciso cuando generacionBackend.estado es error", () => {
    const mockGeneracion = {
      estado: "error" as const,
      errorMensaje: "Se encontraron errores en el diagrama.",
      erroresDetalle: ["• Error 1"],
      nombreArchivoDescargado: null,
      estaGenerando: false,
      ultimoMensajeChat: null,
      ultimaInteraccionId: null,
      generarBackend: vi.fn(),
      reiniciar: vi.fn(),
    };

    render(
      <PanelChatDrawi
        abierto={true}
        onCerrar={vi.fn()}
        asistente={createMockAsistente()}
        grabacion={createMockGrabacion()}
        generacionBackend={mockGeneracion}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error al generar backend")).toBeInTheDocument();
    expect(screen.getByText("Se encontraron errores en el diagrama.")).toBeInTheDocument();
  });

  it("muestra el botón 'Cargar más' cuando hayMas es true y ejecuta cargarMasInteracciones al hacer clic", () => {
    const mockCargarMas = vi.fn(async () => {});
    const mockHistorial = createMockHistorial({
      hayMas: true,
      cargarMasInteracciones: mockCargarMas,
      interacciones: [
        {
          id: "int-1",
          idDiagrama: "diag-1",
          idUsuario: "yo",
          tipo: "CONVERSACION",
          estado: "COMPLETADO",
          entradaUsuario: "Hola DRAWI",
          respuestaIa: "Hola",
          claveIdempotencia: "c-1",
          creadoEn: "2026-09-20T10:00:00Z",
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

    const botonCargarMas = screen.getByRole("button", { name: "Cargar más mensajes anteriores" });
    expect(botonCargarMas).toBeInTheDocument();

    fireEvent.click(botonCargarMas);
    expect(mockCargarMas).toHaveBeenCalledTimes(1);
  });

  it("oculta el botón 'Cargar más' cuando hayMas es false", () => {
    const mockHistorial = createMockHistorial({
      hayMas: false,
      interacciones: [
        {
          id: "int-1",
          idDiagrama: "diag-1",
          idUsuario: "yo",
          tipo: "CONVERSACION",
          estado: "COMPLETADO",
          entradaUsuario: "Hola DRAWI",
          respuestaIa: "Hola",
          claveIdempotencia: "c-1",
          creadoEn: "2026-09-20T10:00:00Z",
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

    expect(screen.queryByRole("button", { name: "Cargar más mensajes anteriores" })).not.toBeInTheDocument();
  });
});


