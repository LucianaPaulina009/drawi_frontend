import { ApiError } from "@/features/shared/domain/types/api-results";
import { solicitarGeneracionBackend } from "../../infrastructure/repositories/generacion-backend.repository";

export type GenerarBackendActionResult =
  | { ok: true; fileName: string; mensajeChat?: string; interaccionId?: string }
  | { ok: false; error: ApiError; mensajeChat?: string; interaccionId?: string };

export function descargarBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = fileName;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  window.URL.revokeObjectURL(url);
}

export async function generarBackendAction(
  diagramaId: string
): Promise<GenerarBackendActionResult> {
  const resultado = await solicitarGeneracionBackend(diagramaId);

  if (!resultado.ok) {
    return {
      ok: false,
      error: resultado,
      mensajeChat: resultado.mensajeChat,
      interaccionId: resultado.interaccionId,
    };
  }

  descargarBlob(resultado.data.blob, resultado.data.fileName);

  return {
    ok: true,
    fileName: resultado.data.fileName,
    mensajeChat: resultado.data.mensajeChat,
    interaccionId: resultado.data.interaccionId,
  };
}
