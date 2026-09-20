import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGrabacionAudio } from "./use-grabacion-audio";

describe("useGrabacionAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:audio-mock-123");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("informa error comprensible si el navegador no admite getUserMedia o MediaRecorder", async () => {
    // @ts-expect-error Mocking browser APIs
    delete global.navigator.mediaDevices;
    // @ts-expect-error Mocking browser APIs
    delete global.MediaRecorder;

    const { result } = renderHook(() => useGrabacionAudio());

    let iniciado = false;
    await act(async () => {
      iniciado = await result.current.iniciarGrabacion();
    });

    expect(iniciado).toBe(false);
    expect(result.current.estado).toBe("error");
    expect(result.current.error).toContain("no admite la grabación de audio");
  });

  it("informa error cuando el usuario o navegador deniega el permiso de micrófono", async () => {
    const notAllowedErr = new Error("Permission denied");
    notAllowedErr.name = "NotAllowedError";

    const mockGetUserMedia = vi.fn().mockRejectedValue(notAllowedErr);
    // @ts-expect-error Mocking browser APIs
    global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia };
    // @ts-expect-error Mocking browser APIs
    global.MediaRecorder = class MockRecorder {};

    const { result } = renderHook(() => useGrabacionAudio());

    let iniciado = false;
    await act(async () => {
      iniciado = await result.current.iniciarGrabacion();
    });

    expect(iniciado).toBe(false);
    expect(result.current.estado).toBe("error");
    expect(result.current.error).toContain("Permiso de micrófono denegado");
  });

  it("inicia y detiene la grabación con éxito generando la referencia de audio temporal", async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    let onstopHandler: (() => void) | null = null;
    let ondataHandler: ((e: { data: Blob }) => void) | null = null;

    class MockMediaRecorder {
      state = "recording";
      mimeType = "audio/webm";
      start = vi.fn();
      stop = vi.fn(() => {
        this.state = "inactive";
        if (ondataHandler) {
          ondataHandler({ data: new Blob(["fake-audio"], { type: "audio/webm" }) });
        }
        if (onstopHandler) {
          onstopHandler();
        }
      });
      set ondataavailable(fn: (e: { data: Blob }) => void) {
        ondataHandler = fn;
      }
      set onstop(fn: () => void) {
        onstopHandler = fn;
      }
    }

    // @ts-expect-error Mocking browser APIs
    global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia };
    // @ts-expect-error Mocking browser APIs
    global.MediaRecorder = MockMediaRecorder;

    const { result } = renderHook(() => useGrabacionAudio());

    let iniciado = false;
    await act(async () => {
      iniciado = await result.current.iniciarGrabacion();
    });

    expect(iniciado).toBe(true);
    expect(result.current.estado).toBe("grabando");

    let urlResultado: string | null = null;
    await act(async () => {
      urlResultado = await result.current.detenerGrabacion();
    });

    expect(urlResultado).toBe("blob:audio-mock-123");
    expect(result.current.estado).toBe("listo");
    expect(result.current.audioUrl).toBe("blob:audio-mock-123");
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("cancela la grabación y libera recursos sin generar URL de audio", async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    class MockMediaRecorder {
      state = "recording";
      start = vi.fn();
      stop = vi.fn();
    }

    // @ts-expect-error Mocking browser APIs
    global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia };
    // @ts-expect-error Mocking browser APIs
    global.MediaRecorder = MockMediaRecorder;

    const { result } = renderHook(() => useGrabacionAudio());

    await act(async () => {
      await result.current.iniciarGrabacion();
    });
    expect(result.current.estado).toBe("grabando");

    act(() => {
      result.current.cancelarGrabacion();
    });

    expect(result.current.estado).toBe("inactivo");
    expect(result.current.audioUrl).toBeNull();
    expect(mockTrack.stop).toHaveBeenCalled();
  });
});
