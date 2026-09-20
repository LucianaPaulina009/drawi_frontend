import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAsistenteIa } from "./use-asistente-ia";

describe("useAsistenteIa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url-123");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("inicializa con estado local vacío y limpio", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    expect(result.current.accionActiva).toBe("chat");
    expect(result.current.mensajes).toEqual([]);
    expect(result.current.textoEdicion).toBe("");
    expect(result.current.imagenTemporal).toBeNull();
    expect(result.current.audioTemporal).toBeNull();
    expect(result.current.errorLocal).toBeNull();
    expect(result.current.avisoIndisponibilidad).toBeNull();
  });

  it("agrega mensaje local con texto válido y limpia el campo de edición", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    act(() => {
      result.current.setTextoEdicion("Hola DRAWI, ¿cómo organizo esta tabla?");
    });

    let enviado = false;
    act(() => {
      enviado = result.current.enviarMensaje();
    });

    expect(enviado).toBe(true);
    expect(result.current.mensajes).toHaveLength(1);
    expect(result.current.mensajes[0].contenido).toBe("Hola DRAWI, ¿cómo organizo esta tabla?");
    expect(result.current.textoEdicion).toBe("");
  });

  it("rechaza mensajes vacíos o con solo espacios sin agregarlos al historial", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    act(() => {
      result.current.setTextoEdicion("    ");
    });

    let enviado = false;
    act(() => {
      enviado = result.current.enviarMensaje();
    });

    expect(enviado).toBe(false);
    expect(result.current.mensajes).toHaveLength(0);
  });

  it("adjunta imágenes válidas (JPEG, PNG, WebP) hasta 10 MiB y rechaza formatos no admitidos", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    // Archivo válido PNG
    const filePng = new File(["fake-png"], "diagrama.png", { type: "image/png" });
    act(() => {
      const res = result.current.adjuntarImagen(filePng);
      expect(res).toBe(true);
    });

    expect(result.current.imagenTemporal).toMatchObject({
      nombre: "diagrama.png",
      tipo: "image/png",
      vistaPrevia: "blob:mock-url-123",
    });
    expect(result.current.errorLocal).toBeNull();

    // Archivo no admitido PDF
    const filePdf = new File(["fake-pdf"], "documento.pdf", { type: "application/pdf" });
    act(() => {
      const res = result.current.adjuntarImagen(filePdf);
      expect(res).toBe(false);
    });

    expect(result.current.errorLocal).toBe("Formato de imagen no compatible. Usa JPEG, PNG o WebP.");
  });

  it("rechaza imágenes que superen los 10 MiB", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    const bigFile = new File([""], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });

    act(() => {
      const res = result.current.adjuntarImagen(bigFile);
      expect(res).toBe(false);
    });

    expect(result.current.errorLocal).toBe("La imagen no puede superar los 10 MiB.");
  });

  it("ejecuta reset determinista al cambiar de diagramaId sin depender de remount", () => {
    let diagramaId = "diagrama-1";
    const { result, rerender } = renderHook(() => useAsistenteIa(diagramaId));

    act(() => {
      result.current.enviarMensaje("Consulta previa");
    });
    expect(result.current.mensajes).toHaveLength(1);

    // Cambiar diagramaId
    diagramaId = "diagrama-2";
    rerender();

    expect(result.current.mensajes).toHaveLength(0);
    expect(result.current.textoEdicion).toBe("");
    expect(result.current.imagenTemporal).toBeNull();
    expect(result.current.audioTemporal).toBeNull();
    expect(result.current.errorLocal).toBeNull();
  });

  it("activa y limpia el aviso de indisponibilidad para la acción futura Generar backend", () => {
    const { result } = renderHook(() => useAsistenteIa("diagrama-1"));

    act(() => {
      result.current.activarGenerarBackend();
    });
    expect(result.current.avisoIndisponibilidad).toContain("disponible en próximas fases");

    act(() => {
      result.current.limpiarAvisoIndisponibilidad();
    });
    expect(result.current.avisoIndisponibilidad).toBeNull();
  });
});
