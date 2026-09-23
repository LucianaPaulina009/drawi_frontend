import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../infrastructure/repositories/generacion-backend.repository";
import { useGeneracionBackend } from "../presentation/hooks/use-generacion-backend";

vi.mock("../infrastructure/repositories/generacion-backend.repository");

describe("useGeneracionBackend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-zip-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("inicializa en estado idle sin errores", () => {
    const { result } = renderHook(() => useGeneracionBackend());

    expect(result.current.estado).toBe("idle");
    expect(result.current.estaGenerando).toBe(false);
    expect(result.current.errorMensaje).toBeNull();
    expect(result.current.nombreArchivoDescargado).toBeNull();
  });

  it("descarga el ZIP exitosamente y transiciona a completado", async () => {
    const mockBlob = new Blob(["PK fake zip content"], { type: "application/zip" });
    vi.mocked(repo.solicitarGeneracionBackend).mockResolvedValue({
      ok: true,
      data: {
        fileName: "drawi-backend-tienda.zip",
        contentType: "application/zip",
        blob: mockBlob,
      },
    });

    const { result } = renderHook(() => useGeneracionBackend());

    let exito = false;
    await act(async () => {
      exito = await result.current.generarBackend("diagrama-123");
    });

    expect(exito).toBe(true);
    expect(result.current.estado).toBe("completado");
    expect(result.current.nombreArchivoDescargado).toBe("drawi-backend-tienda.zip");
    expect(result.current.errorMensaje).toBeNull();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-zip-url");
  });

  it("maneja errores de validación de la API y transiciona a error", async () => {
    vi.mocked(repo.solicitarGeneracionBackend).mockResolvedValue({
      ok: false,
      statusCode: 422,
      code: "DIAGRAMA_NO_GENERABLE",
      errors: [
        "El diagrama contiene errores que deben corregirse",
        "• La clase Venta no tiene una clave primaria válida.",
        "• El atributo total tiene un tipo no soportado.",
      ],
    });

    const { result } = renderHook(() => useGeneracionBackend());

    let exito = true;
    await act(async () => {
      exito = await result.current.generarBackend("diagrama-invalido");
    });

    expect(exito).toBe(false);
    expect(result.current.estado).toBe("error");
    expect(result.current.errorMensaje).toBe(
      "Se encontraron errores en el diagrama."
    );
    expect(result.current.erroresDetalle).toHaveLength(3);
    expect(result.current.nombreArchivoDescargado).toBeNull();
  });

  it("permite reiniciar el estado a idle con reiniciar()", async () => {
    vi.mocked(repo.solicitarGeneracionBackend).mockResolvedValue({
      ok: false,
      statusCode: 500,
      errors: ["Error de servidor"],
    });

    const { result } = renderHook(() => useGeneracionBackend());

    await act(async () => {
      await result.current.generarBackend("diag-err");
    });

    expect(result.current.estado).toBe("error");

    act(() => {
      result.current.reiniciar();
    });

    expect(result.current.estado).toBe("idle");
    expect(result.current.errorMensaje).toBeNull();
    expect(result.current.nombreArchivoDescargado).toBeNull();
  });
});
