import { describe, expect, it, vi, beforeEach } from "vitest";
import * as apiClient from "@/features/shared/infrastructure/http/api-client";
import { interaccionIaMapper } from "../mappers/interaccion-ia.mapper";
import { InteraccionIaResponseSchema } from "../schemas/interaccion-ia.schemas";
import { interaccionIaRepositoryImpl } from "./interaccion-ia.repository";

vi.mock("@/features/shared/infrastructure/http/api-client", () => ({
  apiRequestData: vi.fn(),
  apiRequestFormData: vi.fn(),
}));

describe("interaccionIaRepositoryImpl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarInteracciones invoca apiRequestData con la URL y parámetros correctos", async () => {
    const mockResponse = {
      ok: true as const,
      data: {
        items: [
          {
            id: "77777777-7777-7777-7777-777777777777",
            idDiagrama: "11111111-1111-1111-1111-111111111111",
            idUsuario: "user-1",
            tipo: "CONVERSACION",
            estado: "COMPLETADO",
            entradaUsuario: "Hola DRAWI",
            respuestaIa: "Hola! ¿En qué puedo ayudarte?",
            claveIdempotencia: "88888888-8888-8888-8888-888888888888",
            creadoEn: "2026-09-20T12:00:00Z",
          },
        ],
        proximoCursor: null,
        total: 1,
      },
    };

    vi.mocked(apiClient.apiRequestData).mockResolvedValue(mockResponse);

    const result = await interaccionIaRepositoryImpl.listarInteracciones(
      "11111111-1111-1111-1111-111111111111",
      "cursor-abc",
      20
    );

    expect(apiClient.apiRequestData).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          "/diagramas/11111111-1111-1111-1111-111111111111/interacciones-ia?cursor=cursor-abc&limite=20"
        ),
        method: "GET",
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].entradaUsuario).toBe("Hola DRAWI");
    }
  });

  it("enviarMensaje invoca apiRequestData con POST y cuerpo formateado", async () => {
    const mockResponse = {
      ok: true as const,
      data: {
        id: "77777777-7777-7777-7777-777777777777",
        idDiagrama: "11111111-1111-1111-1111-111111111111",
        idUsuario: "user-1",
        tipo: "CONVERSACION",
        estado: "COMPLETADO",
        entradaUsuario: "Crea una clase Usuario",
        respuestaIa: "Clase Usuario creada exitosamente.",
        claveIdempotencia: "88888888-8888-8888-8888-888888888888",
        creadoEn: "2026-09-20T12:00:00Z",
      },
    };

    vi.mocked(apiClient.apiRequestData).mockResolvedValue(mockResponse);

    const result = await interaccionIaRepositoryImpl.enviarMensaje(
      "11111111-1111-1111-1111-111111111111",
      {
        texto: "  Crea una clase Usuario  ",
        claveIdempotencia: "88888888-8888-8888-8888-888888888888",
      }
    );

    expect(apiClient.apiRequestData).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          "/diagramas/11111111-1111-1111-1111-111111111111/interacciones-ia"
        ),
        method: "POST",
        body: {
          texto: "Crea una clase Usuario",
          claveIdempotencia: "88888888-8888-8888-8888-888888888888",
        },
      })
    );
    expect(result.ok).toBe(true);
  });

  it("enviarAudio invoca apiRequestFormData con POST y endpoint /interacciones-ia/audio", async () => {
    const mockResponse = {
      ok: true as const,
      data: {
        id: "77777777-7777-7777-7777-777777777777",
        idDiagrama: "11111111-1111-1111-1111-111111111111",
        idUsuario: "user-1",
        tipo: "VOZ_AUDIO",
        estado: "COMPLETADO",
        entradaUsuario: "Crea una clase Factura",
        respuestaIa: "Clase Factura creada exitosamente.",
        claveIdempotencia: "key-voice-1",
        creadoEn: "2026-09-20T12:00:00Z",
      },
    };

    vi.mocked(apiClient.apiRequestFormData).mockResolvedValue(mockResponse as never);

    const blob = new Blob(["audio-bytes"], { type: "audio/webm" });
    const result = await interaccionIaRepositoryImpl.enviarAudio(
      "11111111-1111-1111-1111-111111111111",
      blob,
      "key-voice-1",
      "audio/webm",
      4.2
    );

    expect(apiClient.apiRequestFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          "/diagramas/11111111-1111-1111-1111-111111111111/interacciones-ia/audio"
        ),
        method: "POST",
      })
    );
    expect(result.ok).toBe(true);
  });

  it("enviarImagen invoca apiRequestFormData con POST y endpoint /interacciones-ia/imagen", async () => {
    const mockResponse = {
      ok: true as const,
      data: {
        id: "77777777-7777-7777-7777-777777777777",
        idDiagrama: "11111111-1111-1111-1111-111111111111",
        idUsuario: "user-1",
        tipo: "IMAGEN",
        estado: "COMPLETADO",
        entradaUsuario: "Importación de imagen UML: uml.png",
        respuestaIa: "Se crearon 2 clases.",
        claveIdempotencia: "key-img-1",
        creadoEn: "2026-09-20T12:00:00Z",
      },
    };

    vi.mocked(apiClient.apiRequestFormData).mockResolvedValue(mockResponse as never);

    const blob = new Blob(["png-bytes"], { type: "image/png" });
    const result = await interaccionIaRepositoryImpl.enviarImagen(
      "11111111-1111-1111-1111-111111111111",
      blob,
      "key-img-1",
      "uml.png"
    );

    expect(apiClient.apiRequestFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          "/diagramas/11111111-1111-1111-1111-111111111111/interacciones-ia/imagen"
        ),
        method: "POST",
      })
    );
    expect(result.ok).toBe(true);
  });

  it("Zod valida y el mapper convierte correctamente el payload 201 real del backend", () => {
    const backendJson = {
      id: "77777777-7777-7777-7777-777777777777",
      idDiagrama: "11111111-1111-1111-1111-111111111111",
      idUsuario: "user-123",
      tipoInteraccion: "texto",
      entradaUsuario: "¿Qué clases existen actualmente en esta página?",
      respuestaIa: "Actualmente existen las clases Usuario y Factura.",
      urlImagen: null,
      estado: "completado",
      creadoEn: "2026-09-20T20:25:00.000Z",
    };

    const parsed = InteraccionIaResponseSchema.safeParse(backendJson);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const domain = interaccionIaMapper.toDomain(parsed.data);
    expect(domain.id).toBe("77777777-7777-7777-7777-777777777777");
    expect(domain.idDiagrama).toBe("11111111-1111-1111-1111-111111111111");
    expect(domain.idUsuario).toBe("user-123");
    expect(domain.tipo).toBe("CONVERSACION");
    expect(domain.estado).toBe("COMPLETADO");
    expect(domain.entradaUsuario).toBe("¿Qué clases existen actualmente en esta página?");
    expect(domain.respuestaIa).toBe("Actualmente existen las clases Usuario y Factura.");
    expect(domain.creadoEn).toBe("2026-09-20T20:25:00.000Z");
  });
});
