import { beforeEach, describe, expect, it, vi } from "vitest";

const mockListarInteracciones = vi.fn();
const mockEnviarMensaje = vi.fn();

vi.mock("../../infrastructure/repositories/interaccion-ia.repository", () => ({
  interaccionIaRepositoryImpl: {
    listarInteracciones: (...args: unknown[]) => mockListarInteracciones(...args),
    enviarMensaje: (...args: unknown[]) => mockEnviarMensaje(...args),
  },
}));

import {
  enviarMensajeIaAction,
  listarInteraccionesIaAction,
} from "./interaccion-ia.action";

describe("interaccion-ia actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listarInteraccionesIaAction", () => {
    it("falla con 400 si el diagramaId no es válido", async () => {
      const res = await listarInteraccionesIaAction("");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.statusCode).toBe(400);
        expect(res.errors[0]).toContain("Identificador de diagrama inválido");
      }
      expect(mockListarInteracciones).not.toHaveBeenCalled();
    });

    it("delega al repositorio con parámetros válidos", async () => {
      mockListarInteracciones.mockResolvedValue({
        ok: true,
        data: { items: [], proximoCursor: null, total: 0 },
      });

      const res = await listarInteraccionesIaAction(
        "11111111-1111-1111-1111-111111111111",
        undefined,
        15
      );

      expect(res.ok).toBe(true);
      expect(mockListarInteracciones).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        undefined,
        15
      );
    });
  });

  describe("enviarMensajeIaAction", () => {
    it("falla con 400 si el payload es inválido (texto vacío o clave ausente)", async () => {
      const res = await enviarMensajeIaAction(
        "11111111-1111-1111-1111-111111111111",
        { texto: "", claveIdempotencia: "invalida" }
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.statusCode).toBe(400);
      }
      expect(mockEnviarMensaje).not.toHaveBeenCalled();
    });

    it("delega al repositorio si el payload es válido", async () => {
      mockEnviarMensaje.mockResolvedValue({
        ok: true,
        data: {
          id: "77777777-7777-7777-7777-777777777777",
          idDiagrama: "11111111-1111-1111-1111-111111111111",
          idUsuario: "user-1",
          tipo: "CONVERSACION",
          estado: "COMPLETADO",
          entradaUsuario: "Hola",
          respuestaIa: "Hola!",
          claveIdempotencia: "88888888-8888-8888-8888-888888888888",
          creadoEn: "2026-09-20T12:00:00Z",
        },
      });

      const res = await enviarMensajeIaAction(
        "11111111-1111-1111-1111-111111111111",
        {
          texto: "Hola",
          claveIdempotencia: "88888888-8888-8888-8888-888888888888",
        }
      );

      expect(res.ok).toBe(true);
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        {
          texto: "Hola",
          claveIdempotencia: "88888888-8888-8888-8888-888888888888",
        }
      );
    });
  });
});
