import { beforeEach, describe, expect, it, vi } from "vitest";
import * as eaRepo from "../infrastructure/repositories/intercambio-enterprise-architect.repository";
import {
  exportarDiagramaEaAction,
  importarDiagramaEaAction,
} from "../presentation/actions/intercambio-enterprise-architect.action";

vi.mock("../infrastructure/repositories/intercambio-enterprise-architect.repository");

describe("intercambioEnterpriseArchitectActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global URL methods and DOM for blob downloading
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  describe("exportarDiagramaEaAction", () => {
    it("descarga el blob correctamente cuando el repositorio responde ok", async () => {
      const mockBlob = new Blob(["<xml></xml>"], { type: "application/xml" });
      vi.mocked(eaRepo.exportarDiagramaEa).mockResolvedValue({
        ok: true,
        data: {
          fileName: "modelo_ea.xml",
          contentType: "application/xml",
          blob: mockBlob,
        },
      });

      const res = await exportarDiagramaEaAction("diag-1", "proy-1");

      expect(eaRepo.exportarDiagramaEa).toHaveBeenCalledWith("diag-1", "proy-1");
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.fileName).toBe("modelo_ea.xml");
      }
    });

    it("retorna error cuando la exportación falla", async () => {
      vi.mocked(eaRepo.exportarDiagramaEa).mockResolvedValue({
        ok: false,
        error: "El diagrama está vacío",
        status: 400,
        code: "DIAGRAMA_VACIO",
      });

      const res = await exportarDiagramaEaAction("diag-1", "proy-1");

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("DIAGRAMA_VACIO");
      }
    });
  });

  describe("importarDiagramaEaAction", () => {
    it("rechaza archivos con extensiones no soportadas sin llamar al backend", async () => {
      const invalidFile = new File(["dummy"], "diagrama.pdf", {
        type: "application/pdf",
      });

      const res = await importarDiagramaEaAction("diag-1", "proy-1", invalidFile);

      expect(eaRepo.importarDiagramaEa).not.toHaveBeenCalled();
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("FORMATO_NO_SOPORTADO");
      }
    });

    it("rechaza archivos de más de 10 MB sin llamar al backend", async () => {
      const largeFile = new File(["dummy"], "grande.xml", {
        type: "application/xml",
      });
      Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 });

      const res = await importarDiagramaEaAction("diag-1", "proy-1", largeFile);

      expect(eaRepo.importarDiagramaEa).not.toHaveBeenCalled();
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("ARCHIVO_EXCEDE_TAMANO_MAXIMO");
      }
    });

    it("importa exitosamente cuando el archivo es válido y el repositorio responde ok", async () => {
      const validFile = new File(["<xml></xml>"], "modelo.xml", {
        type: "application/xml",
      });
      vi.mocked(eaRepo.importarDiagramaEa).mockResolvedValue({
        ok: true,
        data: {
          diagramaId: "diag-1",
          clasesImportadas: 2,
          atributosImportados: 5,
          relacionesImportadas: 1,
          estructurasNmImportadas: 0,
          advertencias: [],
        },
      });

      const res = await importarDiagramaEaAction("diag-1", "proy-1", validFile);

      expect(eaRepo.importarDiagramaEa).toHaveBeenCalledWith(
        "diag-1",
        "proy-1",
        validFile
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.clasesImportadas).toBe(2);
      }
    });
  });
});
