import type { ApiError } from "@/features/shared/domain/types/api-results";
import type { ResultadoImportacionEa } from "../../domain/entities/intercambio-enterprise-architect.entity";
import {
  exportarDiagramaEa,
  importarDiagramaEa,
} from "../../infrastructure/repositories/intercambio-enterprise-architect.repository";

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

export type ExportarDiagramaEaActionResult =
  | { ok: true; fileName: string }
  | { ok: false; error: ApiError };

export async function exportarDiagramaEaAction(
  idDiagrama: string,
  idProyecto: string
): Promise<ExportarDiagramaEaActionResult> {
  const resultado = await exportarDiagramaEa(idDiagrama, idProyecto);

  if (!resultado.ok) {
    return {
      ok: false,
      error: resultado,
    };
  }

  descargarBlob(resultado.data.blob, resultado.data.fileName);

  return {
    ok: true,
    fileName: resultado.data.fileName,
  };
}

export type ImportarDiagramaEaActionResult =
  | { ok: true; data: ResultadoImportacionEa }
  | { ok: false; error: ApiError };

const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024; // 10 MB

export async function importarDiagramaEaAction(
  idDiagrama: string,
  idProyecto: string,
  archivo: File
): Promise<ImportarDiagramaEaActionResult> {
  const nombreLower = archivo.name.toLowerCase();
  if (!nombreLower.endsWith(".xml") && !nombreLower.endsWith(".xmi")) {
    return {
      ok: false,
      error: {
        ok: false,
        statusCode: 400,
        errors: ["Solo se admiten archivos .xml o .xmi de Enterprise Architect."],
        code: "FORMATO_NO_SOPORTADO",
      },
    };
  }

  if (archivo.size > MAX_ARCHIVO_BYTES) {
    return {
      ok: false,
      error: {
        ok: false,
        statusCode: 413,
        errors: ["El archivo supera el tamaño máximo permitido de 10 MB."],
        code: "ARCHIVO_EXCEDE_TAMANO_MAXIMO",
      },
    };
  }


  const resultado = await importarDiagramaEa(idDiagrama, idProyecto, archivo);

  if (!resultado.ok) {
    return {
      ok: false,
      error: resultado,
    };
  }

  return {
    ok: true,
    data: resultado.data,
  };
}
