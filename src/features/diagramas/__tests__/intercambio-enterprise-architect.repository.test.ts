import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/features/shared/infrastructure/http/api-client";
import {
  exportarDiagramaEa,
  importarDiagramaEa,
} from "../infrastructure/repositories/intercambio-enterprise-architect.repository";

vi.mock("@/features/shared/infrastructure/http/api-client");

describe("intercambioEnterpriseArchitectRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportarDiagramaEa", () => {
    it("llama a apiRequestFile con la URL correcta y parámetros de consulta", async () => {
      const mockBlob = new Blob(["<xml></xml>"], { type: "application/xml" });
      vi.mocked(apiClient.apiRequestFile).mockResolvedValue({
        ok: true,
        data: {
          fileName: "modelo_ea.xml",
          contentType: "application/xml",
          blob: mockBlob,
        },
      });

      const res = await exportarDiagramaEa("diag-123", "proy-456");

      expect(apiClient.apiRequestFile).toHaveBeenCalledTimes(1);
      const args = vi.mocked(apiClient.apiRequestFile).mock.calls[0][0];

      expect(args.url).toMatch(
        /^https?:\/\/.+\/api\/diagramas\/diag-123\/enterprise-architect\/exportar\?proyecto_id=proy-456$/
      );
      expect(args.method).toBe("GET");
      expect(args.defaultFileName).toBe("diagrama_ea.xml");
      expect(res.ok).toBe(true);
    });
  });

  describe("importarDiagramaEa", () => {
    it("llama a apiRequestFormData con FormData conteniendo proyecto_id y archivo", async () => {
      const fakeFile = new File(["<xml></xml>"], "test.xml", {
        type: "application/xml",
      });

      vi.mocked(apiClient.apiRequestFormData).mockResolvedValue({
        ok: true,
        data: {
          diagramaId: "diag-123",
          clasesImportadas: 3,
          atributosImportados: 8,
          relacionesImportadas: 2,
          estructurasNmImportadas: 0,
          advertencias: [],
        },
      });

      const res = await importarDiagramaEa("diag-123", "proy-456", fakeFile);

      expect(apiClient.apiRequestFormData).toHaveBeenCalledTimes(1);
      const args = vi.mocked(apiClient.apiRequestFormData).mock.calls[0][0];

      expect(args.url).toMatch(
        /^https?:\/\/.+\/api\/diagramas\/diag-123\/enterprise-architect\/importar$/
      );
      expect(args.method).toBe("POST");
      expect(args.body).toBeInstanceOf(FormData);
      expect(args.body.get("proyecto_id")).toBe("proy-456");
      expect(args.body.get("archivo")).toBe(fakeFile);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.clasesImportadas).toBe(3);
      }
    });
  });
});
