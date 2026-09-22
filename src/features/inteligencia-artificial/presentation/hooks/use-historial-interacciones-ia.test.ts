import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions/interaccion-ia.action";
import { useHistorialInteraccionesIa } from "./use-historial-interacciones-ia";

vi.mock("../actions/interaccion-ia.action", () => ({
  listarInteraccionesIaAction: vi.fn(),
  enviarMensajeIaAction: vi.fn(),
  enviarAudioIaAction: vi.fn(),
}));

describe("useHistorialInteraccionesIa", () => {
  const diagramaId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga el historial automáticamente al montar con un diagramaId válido", async () => {
    vi.mocked(actions.listarInteraccionesIaAction).mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "77777777-7777-7777-7777-777777777777",
            idDiagrama: diagramaId,
            idUsuario: "user-1",
            tipo: "CONVERSACION",
            estado: "COMPLETADO",
            entradaUsuario: "Mensaje existente",
            respuestaIa: "Respuesta persistida",
            claveIdempotencia: "88888888-8888-8888-8888-888888888888",
            creadoEn: "2026-09-20T10:00:00Z",
          },
        ],
        proximoCursor: null,
        total: 1,
      },
    });

    const { result } = renderHook(() =>
      useHistorialInteraccionesIa(diagramaId)
    );

    expect(result.current.cargando).toBe(true);

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.interacciones).toHaveLength(1);
    expect(result.current.interacciones[0].entradaUsuario).toBe(
      "Mensaje existente"
    );
    expect(result.current.interacciones[0].respuestaIa).toBe(
      "Respuesta persistida"
    );
  });

  it("resetea el historial cuando diagramaId cambia a null u otro id", async () => {
    vi.mocked(actions.listarInteraccionesIaAction).mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "77777777-7777-7777-7777-777777777777",
            idDiagrama: diagramaId,
            idUsuario: "user-1",
            tipo: "CONVERSACION",
            estado: "COMPLETADO",
            entradaUsuario: "Mensaje diagrama 1",
            respuestaIa: "Respuesta 1",
            claveIdempotencia: "88888888-8888-8888-8888-888888888888",
            creadoEn: "2026-09-20T10:00:00Z",
          },
        ],
      },
    });

    const { result, rerender } = renderHook(
      ({ id }) => useHistorialInteraccionesIa(id),
      { initialProps: { id: diagramaId as string | null } }
    );

    await waitFor(() => {
      expect(result.current.interacciones).toHaveLength(1);
    });

    // Cambiar a null
    rerender({ id: null });
    expect(result.current.interacciones).toEqual([]);
  });

  it("envía mensaje optimista y luego actualiza con la respuesta confirmada", async () => {
    vi.mocked(actions.listarInteraccionesIaAction).mockResolvedValue({
      ok: true,
      data: { items: [] },
    });

    vi.mocked(actions.enviarMensajeIaAction).mockResolvedValue({
      ok: true,
      data: {
        id: "confirmed-id",
        idDiagrama: diagramaId,
        idUsuario: "user-1",
        tipo: "CONVERSACION",
        estado: "COMPLETADO",
        entradaUsuario: "Hola DRAWI",
        respuestaIa: "Hola usuario!",
        claveIdempotencia: "99999999-9999-9999-9999-999999999999",
        creadoEn: "2026-09-20T12:00:00Z",
      },
    });

    const { result } = renderHook(() =>
      useHistorialInteraccionesIa(diagramaId)
    );

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    let envioPromesa: Promise<boolean>;
    act(() => {
      envioPromesa = result.current.enviarMensaje("Hola DRAWI");
    });

    // Inmediatamente hay un mensaje optimista en estado PROCESANDO
    expect(result.current.interacciones).toHaveLength(1);
    expect(result.current.interacciones[0].estado).toBe("PROCESANDO");
    expect(result.current.interacciones[0].entradaUsuario).toBe("Hola DRAWI");

    await act(async () => {
      const exitoso = await envioPromesa;
      expect(exitoso).toBe(true);
    });

    // Ahora la interacción fue confirmada
    expect(result.current.interacciones[0].id).toBe("confirmed-id");
    expect(result.current.interacciones[0].estado).toBe("COMPLETADO");
    expect(result.current.interacciones[0].respuestaIa).toBe("Hola usuario!");
  });

  it("envía audio en una sola interacción sin burbujas optimistas intermedias", async () => {
    vi.mocked(actions.listarInteraccionesIaAction).mockResolvedValue({
      ok: true,
      data: { items: [] },
    });

    const voiceKey = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    vi.mocked(actions.enviarAudioIaAction).mockResolvedValue({
      ok: true,
      data: {
        id: "confirmed-voice-id",
        idDiagrama: diagramaId,
        idUsuario: "user-1",
        tipo: "VOZ_AUDIO",
        estado: "COMPLETADO",
        entradaUsuario: "Crea una clase Producto",
        respuestaIa: "Clase Producto creada exitosamente",
        claveIdempotencia: voiceKey,
        creadoEn: "2026-09-20T12:00:00Z",
      },
    });

    const { result } = renderHook(() =>
      useHistorialInteraccionesIa(diagramaId)
    );

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    const fakeBlob = new Blob(["audio-bytes"], { type: "audio/webm" });

    let envioPromesa: Promise<boolean>;
    act(() => {
      envioPromesa = result.current.enviarAudio(fakeBlob, {
        claveIdempotencia: voiceKey,
        duracionSegundos: 4,
      });
    });

    // Durante el envío de audio, NO se añade burbuja provisional al historial
    expect(result.current.interacciones).toHaveLength(0);
    expect(result.current.enviando).toBe(true);

    await act(async () => {
      const exitoso = await envioPromesa;
      expect(exitoso).toBe(true);
    });

    expect(actions.enviarAudioIaAction).toHaveBeenCalledWith(
      diagramaId,
      expect.any(FormData)
    );
    expect(result.current.interacciones).toHaveLength(1);
    expect(result.current.interacciones[0].id).toBe("confirmed-voice-id");
    expect(result.current.interacciones[0].tipo).toBe("VOZ_AUDIO");
    expect(result.current.interacciones[0].entradaUsuario).toBe("Crea una clase Producto");
    expect(result.current.interacciones[0].respuestaIa).toBe("Clase Producto creada exitosamente");
    expect(result.current.enviando).toBe(false);
  });
});
