import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGrabacionAudio } from "./use-grabacion-audio";

describe("useGrabacionAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("informa error si el navegador no admite getUserMedia o MediaRecorder", async () => {
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
    global.MediaRecorder = class MockRecorder {
      static isTypeSupported = vi.fn(() => true);
    };

    const { result } = renderHook(() => useGrabacionAudio());

    let iniciado = false;
    await act(async () => {
      iniciado = await result.current.iniciarGrabacion();
    });

    expect(iniciado).toBe(false);
    expect(result.current.estado).toBe("error");
    expect(result.current.error).toContain("Permiso de micrófono denegado");
  });

  it("inicia y detiene la grabación con éxito retornando los metadatos y Blob temporal", async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    let onstopHandler: (() => void) | null = null;
    let ondataHandler: ((e: { data: Blob }) => void) | null = null;

    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = "recording";
      mimeType = "audio/webm;codecs=opus";
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

    let metadataResultado: unknown = null;
    await act(async () => {
      metadataResultado = await result.current.detenerGrabacion();
    });

    expect(metadataResultado).toEqual({
      blob: expect.any(Blob),
      duracionSegundos: 0,
      mimeType: "audio/webm;codecs=opus",
    });
    expect(result.current.estado).toBe("inactivo");
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("descartarGrabacion cancela la grabación, limpia pistas y no entrega resultado", async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    let onstopHandler: (() => void) | null = null;

    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = "recording";
      start = vi.fn();
      stop = vi.fn(() => {
        this.state = "inactive";
        if (onstopHandler) onstopHandler();
      });
      set onstop(fn: () => void) {
        onstopHandler = fn;
      }
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
      result.current.descartarGrabacion();
    });

    expect(result.current.estado).toBe("inactivo");
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("ignora callbacks tardíos tras descarte de grabación", async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    let onstopHandler: (() => void) | null = null;
    let ondataHandler: ((e: { data: Blob }) => void) | null = null;

    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = "recording";
      mimeType = "audio/webm";
      start = vi.fn();
      stop = vi.fn();
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

    await act(async () => {
      await result.current.iniciarGrabacion();
    });

    // Descartar
    act(() => {
      result.current.descartarGrabacion();
    });

    // Simular evento tardío disparado después del descarte
    if (ondataHandler) {
      // @ts-expect-error Invoking late callback
      ondataHandler({ data: new Blob(["stale-audio"], { type: "audio/webm" }) });
    }
    if (onstopHandler) {
      // @ts-expect-error Invoking late callback
      onstopHandler();
    }

    expect(result.current.estado).toBe("inactivo");
  });
});
