import { describe, expect, it, vi } from "vitest";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import {
  clasificarResultado,
  crearDespachadorOperacionEditor,
  demoraReintentoMs,
} from "./ejecutor-operacion-editor";

describe("ejecutor-operacion-editor", () => {
  describe("clasificarResultado", () => {
    it("clasifica ok: true como confirmada", () => {
      expect(clasificarResultado({ ok: true, data: {} as any })).toBe("confirmada");
    });

    it("clasifica fallos de red (statusCode: 0) y códigos 5xx/408/429 como transitoria", () => {
      expect(clasificarResultado({ ok: false, statusCode: 0, errors: ["Network Error"] })).toBe("transitoria");
      expect(clasificarResultado({ ok: false, statusCode: 500, errors: ["Internal Server Error"] })).toBe("transitoria");
      expect(clasificarResultado({ ok: false, statusCode: 503, errors: ["Service Unavailable"] })).toBe("transitoria");
      expect(clasificarResultado({ ok: false, statusCode: 408, errors: ["Request Timeout"] })).toBe("transitoria");
      expect(clasificarResultado({ ok: false, statusCode: 429, errors: ["Too Many Requests"] })).toBe("transitoria");
    });

    it("clasifica errores de cliente 400/404/409/422 como definitiva", () => {
      expect(clasificarResultado({ ok: false, statusCode: 400, errors: ["Bad Request"] })).toBe("definitiva");
      expect(clasificarResultado({ ok: false, statusCode: 409, errors: ["Conflict"] })).toBe("definitiva");
      expect(clasificarResultado({ ok: false, statusCode: 422, errors: ["Unprocessable"] })).toBe("definitiva");
      expect(clasificarResultado({ ok: false, statusCode: 404, errors: ["Not Found"] })).toBe("definitiva");
    });
  });

  describe("demoraReintentoMs", () => {
    it("calcula backoff exponencial acotado a 16s", () => {
      expect(demoraReintentoMs(0)).toBe(1000);
      expect(demoraReintentoMs(1)).toBe(2000);
      expect(demoraReintentoMs(2)).toBe(4000);
      expect(demoraReintentoMs(3)).toBe(8000);
      expect(demoraReintentoMs(4)).toBe(16000);
      expect(demoraReintentoMs(5)).toBe(16000);
      expect(demoraReintentoMs(10)).toBe(16000);
    });
  });

  describe("despacharOperacionEditor", () => {
    it("despacha un evento normalizado una sola vez a la acción especializada", async () => {
      const mockAccion = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          actionId: "act-123",
          idDiagrama: "diag-1",
          tipo: "CREAR_CLASE",
          efectos: {
            clasesActualizadas: [],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        } as ConfirmacionOperacionDiagrama,
      });

      const despachador = crearDespachadorOperacionEditor(mockAccion);
      const op: OperacionEditor = {
        actionId: "act-123",
        scopeKey: "user-1:diag-1",
        secuencia: 1,
        tipo: "CREAR_CLASE",
        payload: {
          idClase: "c-1",
          nombre: "Factura",
          posicionX: 100,
          posicionY: 200,
          ancho: 220,
        },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: 1000,
        version: 1,
      };

      const res = await despachador(op);
      expect(res.ok).toBe(true);
      expect(mockAccion).toHaveBeenCalledTimes(1);
      expect(mockAccion).toHaveBeenCalledWith("diag-1", "act-123", {
        tipo: "CREAR_CLASE",
        datos: {
          idClase: "c-1",
          nombre: "Factura",
          posicionX: 100,
          posicionY: 200,
          ancho: 220,
          idAtributoInicial: undefined,
          nombreAtributoInicial: undefined,
        },
      });
    });

    it("adapta comando legacy 015 a evento 016 antes de despachar", async () => {
      const mockAccion = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          actionId: "act-leg",
          idDiagrama: "diag-leg",
          tipo: "ACTUALIZAR_CLASE",
          efectos: {
            clasesActualizadas: [],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        } as ConfirmacionOperacionDiagrama,
      });

      const despachador = crearDespachadorOperacionEditor(mockAccion);
      const opLegacy: OperacionEditor = {
        actionId: "act-leg",
        scopeKey: "user-1:diag-leg",
        secuencia: 1,
        tipo: "actualizarClase",
        payload: {
          claseId: "c-leg",
          datos: { nombre: "Renombrada" },
        },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: 1000,
        version: 1,
      };

      const res = await despachador(opLegacy);
      expect(res.ok).toBe(true);
      expect(mockAccion).toHaveBeenCalledTimes(1);
      expect(mockAccion).toHaveBeenCalledWith("diag-leg", "act-leg", {
        tipo: "ACTUALIZAR_CLASE",
        datos: {
          idClase: "c-leg",
          nombre: "Renombrada",
          posicionX: undefined,
          posicionY: undefined,
          ancho: undefined,
        },
      });
    });

    it("despacha una estructura N:M como una única operación compuesta", async () => {
      const mockAccion = vi.fn().mockResolvedValue({ ok: true, data: {} });
      const despachador = crearDespachadorOperacionEditor(mockAccion);
      const operacionNm: OperacionEditor = {
        actionId: "act-nm-unica",
        scopeKey: "user-1:diag-nm",
        secuencia: 1,
        tipo: "CREAR_ESTRUCTURA_NM",
        payload: {
          idEstructuraNm: "estructura-nm",
          idClaseOrigen: "clase-a",
          idClaseDestino: "clase-b",
          claseIntermedia: {
            idClase: "clase-intermedia",
            idAtributoPk: "atributo-pk",
          },
          relacionOrigen: { idRelacion: "relacion-a" },
          relacionDestino: { idRelacion: "relacion-b" },
          referenciaFkOrigen: {
            idReferenciaFk: "referencia-a",
            idAtributoFk: "atributo-fk-a",
          },
          referenciaFkDestino: {
            idReferenciaFk: "referencia-b",
            idAtributoFk: "atributo-fk-b",
          },
        },
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: 1000,
        version: 1,
      };

      const resultado = await despachador(operacionNm);

      expect(resultado.ok).toBe(true);
      expect(mockAccion).toHaveBeenCalledTimes(1);
      expect(mockAccion).toHaveBeenCalledWith(
        "diag-nm",
        "act-nm-unica",
        expect.objectContaining({ tipo: "CREAR_ESTRUCTURA_NM" })
      );
    });

    it("retorna error 400 si el evento es desconocido o requiere reconciliación", async () => {
      const mockAccion = vi.fn();
      const despachador = crearDespachadorOperacionEditor(mockAccion);

      const opDesconocida: OperacionEditor = {
        actionId: "act-err",
        scopeKey: "user-1:diag-1",
        secuencia: 1,
        tipo: "EVENTO_TOTALMENTE_INVALIDO",
        payload: {},
        dependsOn: [],
        estado: "pendiente",
        intentos: 0,
        creadaEn: 1000,
        version: 1,
      };

      const res = await despachador(opDesconocida);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.statusCode).toBe(400);
      }
      expect(mockAccion).not.toHaveBeenCalled();
    });
  });
});
