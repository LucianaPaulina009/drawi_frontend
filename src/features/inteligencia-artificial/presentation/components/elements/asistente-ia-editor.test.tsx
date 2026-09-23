import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsistenteIaEditor } from "./asistente-ia-editor";

const mockIniciarGrabacion = vi.fn();
const mockDetenerGrabacion = vi.fn();
const mockDescartarGrabacion = vi.fn();
const mockLimpiarRecursos = vi.fn();
let mockGrabacionEstado = "inactivo";
let mockGrabacionError: string | null = null;
let mockGrabacionDuracion = 0;

vi.mock("../../hooks/use-grabacion-audio", () => ({
  useGrabacionAudio: () => ({
    estado: mockGrabacionEstado,
    error: mockGrabacionError,
    duracionSegundos: mockGrabacionDuracion,
    iniciarGrabacion: mockIniciarGrabacion,
    detenerGrabacion: mockDetenerGrabacion,
    descartarGrabacion: mockDescartarGrabacion,
    cancelarGrabacion: mockDescartarGrabacion,
    limpiarRecursos: mockLimpiarRecursos,
  }),
}));

const mockEnviarMensaje = vi.fn();
const mockEnviarAudio = vi.fn();
const mockEnviarImagen = vi.fn();
const mockCargarHistorial = vi.fn();
const mockAgregarInteraccion = vi.fn();
let mockHistorialEnviando = false;
let mockHistorialError: string | null = null;

vi.mock("../../hooks/use-historial-interacciones-ia", () => ({
  useHistorialInteraccionesIa: () => ({
    interacciones: [],
    cargando: false,
    enviando: mockHistorialEnviando,
    error: mockHistorialError,
    enviarMensaje: mockEnviarMensaje,
    enviarAudio: mockEnviarAudio,
    enviarImagen: mockEnviarImagen,
    agregarInteraccion: mockAgregarInteraccion,
    cargarHistorial: mockCargarHistorial,
    limpiarError: vi.fn(),
  }),
}));

const mockGenerarBackend = vi.fn().mockResolvedValue(true);

vi.mock("@/features/generacion-backend/presentation/hooks/use-generacion-backend", () => ({
  useGeneracionBackend: (options?: {
    onResultado?: (res: {
      ok: boolean;
      mensajeChat?: string;
      interaccionId?: string;
    }) => void;
  }) => {
    return {
      estado: "idle",
      errorMensaje: null,
      erroresDetalle: [],
      nombreArchivoDescargado: null,
      estaGenerando: false,
      ultimoMensajeChat: null,
      ultimaInteraccionId: null,
      generarBackend: vi.fn(async (diagramaId: string) => {
        const ok = await mockGenerarBackend(diagramaId);
        if (ok) {
          options?.onResultado?.({
            ok: true,
            mensajeChat: "Backend generado correctamente.",
            interaccionId: "int-gen-ok",
          });
        }
        return ok;
      }),
      reiniciar: vi.fn(),
    };
  },
}));

describe("AsistenteIaEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGrabacionEstado = "inactivo";
    mockGrabacionError = null;
    mockGrabacionDuracion = 0;
    mockHistorialEnviando = false;
    mockHistorialError = null;
    mockIniciarGrabacion.mockResolvedValue(true);
    mockDetenerGrabacion.mockResolvedValue({
      blob: new Blob(["audio-data"], { type: "audio/webm" }),
      duracionSegundos: 5,
      mimeType: "audio/webm",
    });
    mockEnviarMensaje.mockResolvedValue(true);
    mockEnviarAudio.mockResolvedValue(true);
  });

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

  it("ejecuta el flujo completo de voz: grabar -> detener -> enviarAudio en una sola interacción", async () => {
    const onInteraccionChange = vi.fn();

    const { rerender } = render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
        onInteraccionIaEnCursoChange={onInteraccionChange}
      />
    );

    // 1. Clic para iniciar grabación
    const botonGrabar = screen.getByRole("button", { name: "Grabar audio" });
    fireEvent.click(botonGrabar);

    await waitFor(() => {
      expect(mockIniciarGrabacion).toHaveBeenCalledTimes(1);
    });

    // Simular que el hook de grabación pasa a grabando
    mockGrabacionEstado = "grabando";
    rerender(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
        onInteraccionIaEnCursoChange={onInteraccionChange}
      />
    );

    // 2. Segundo clic para detener y enviar automáticamente en 1 solo paso
    const botonDetener = screen.getByRole("button", { name: "Detener y enviar grabación" });
    fireEvent.click(botonDetener);

    await waitFor(() => {
      expect(mockDetenerGrabacion).toHaveBeenCalledTimes(1);
      expect(mockEnviarAudio).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({
          claveIdempotencia: expect.any(String),
          duracionSegundos: 5,
          mimeType: "audio/webm",
        })
      );
    });
  });

  it("permite descartar la grabación durante el estado activo sin enviar audio ni crear interacciones", async () => {
    mockGrabacionEstado = "grabando";

    render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
      />
    );

    const botonDescartar = screen.getByRole("button", { name: "Descartar grabación" });
    fireEvent.click(botonDescartar);

    expect(mockDescartarGrabacion).toHaveBeenCalledTimes(1);
    expect(mockEnviarAudio).not.toHaveBeenCalled();
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it("muestra error cuando el procesamiento de voz falla", async () => {
    mockGrabacionEstado = "grabando";
    mockHistorialError = "No se pudo procesar el audio.";
    mockEnviarAudio.mockResolvedValue(false);

    render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
      />
    );

    const botonDetener = screen.getByRole("button", { name: "Detener y enviar grabación" });
    fireEvent.click(botonDetener);

    await waitFor(() => {
      expect(mockEnviarAudio).toHaveBeenCalledTimes(1);
    });
  });

  it("limpia recursos y estado al cambiar de diagrama", () => {
    const { rerender } = render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
      />
    );

    rerender(
      <AsistenteIaEditor
        diagramaId="diag-2"
        abierto={true}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
      />
    );

    expect(mockLimpiarRecursos).toHaveBeenCalled();
  });

  it("al solicitar generar backend abre el chat e incrusta sigilosamente el mensaje en el historial sin revalidar", async () => {
    const onAbrir = vi.fn();
    mockGenerarBackend.mockResolvedValue(true);

    render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={false}
        onAbrir={onAbrir}
        onCerrar={vi.fn()}
      />
    );

    // Abrir menú de la mascota y presionar Generar Backend
    const botonMascota = screen.getByRole("button", { name: "Abrir asistente de IA DRAWI" });
    fireEvent.click(botonMascota);

    const botonGenerar = screen.getByRole("menuitem", { name: "Generar backend" });
    fireEvent.click(botonGenerar);

    await waitFor(() => {
      expect(onAbrir).toHaveBeenCalled();
      expect(mockGenerarBackend).toHaveBeenCalledWith("diag-1");
      expect(mockAgregarInteraccion).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "GENERACION_BACKEND",
          estado: "COMPLETADO",
          entradaUsuario: "",
          respuestaIa: "Backend generado correctamente.",
        })
      );
      expect(mockCargarHistorial).not.toHaveBeenCalled();
    });
  });

  it("agrega interacción de error seguro si ocurre una excepción de red al generar backend", async () => {
    const onAbrir = vi.fn();
    mockGenerarBackend.mockRejectedValue(new Error("Network Error"));

    render(
      <AsistenteIaEditor
        diagramaId="diag-1"
        abierto={false}
        onAbrir={onAbrir}
        onCerrar={vi.fn()}
      />
    );

    const botonMascota = screen.getByRole("button", { name: "Abrir asistente de IA DRAWI" });
    fireEvent.click(botonMascota);

    const botonGenerar = screen.getByRole("menuitem", { name: "Generar backend" });
    fireEvent.click(botonGenerar);

    await waitFor(() => {
      expect(mockAgregarInteraccion).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "GENERACION_BACKEND",
          estado: "ERROR",
          entradaUsuario: "",
          respuestaIa:
            "No se pudo generar el backend por un error técnico. Inténtalo nuevamente.",
        })
      );
    });
  });
});
