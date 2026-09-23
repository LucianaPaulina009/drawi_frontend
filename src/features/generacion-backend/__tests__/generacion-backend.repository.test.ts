import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/features/shared/infrastructure/http/api-client";
import { solicitarGeneracionBackend } from "../infrastructure/repositories/generacion-backend.repository";

vi.mock("@/features/shared/infrastructure/http/api-client");

describe("generacionBackendRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("construye una URL absoluta hacia el backend FastAPI y no una ruta relativa de Next.js", async () => {
    const mockBlob = new Blob(["fake zip"], { type: "application/zip" });
    vi.mocked(apiClient.apiRequestFile).mockResolvedValue({
      ok: true,
      data: {
        fileName: "drawi-backend-test.zip",
        contentType: "application/zip",
        blob: mockBlob,
      },
    });

    const resultado = await solicitarGeneracionBackend("diag-456");

    expect(apiClient.apiRequestFile).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(apiClient.apiRequestFile).mock.calls[0][0];

    // La URL debe ser absoluta y contener el endpoint de FastAPI
    expect(callArgs.url).toMatch(/^https?:\/\/.+\/api\/diagramas\/diag-456\/generaciones-backend$/);
    expect(callArgs.url).not.toBe("/api/diagramas/diag-456/generaciones-backend");
    expect(callArgs.method).toBe("POST");
    expect(callArgs.defaultContentType).toBe("application/zip");
    expect(callArgs.defaultFileName).toBe("drawi-backend-diag-456.zip");
    expect(resultado.ok).toBe(true);
  });
});
