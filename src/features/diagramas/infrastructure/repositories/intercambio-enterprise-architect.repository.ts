import type {
  ApiFileResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestFile,
  apiRequestFormData,
} from "@/features/shared/infrastructure/http/api-client";
import type { ResultadoImportacionEa } from "../../domain/entities/intercambio-enterprise-architect.entity";
import type { IntercambioEnterpriseArchitectRepository } from "../../domain/repositories/intercambio-enterprise-architect.repository";
import {
  intercambioEaMapper,
  ResultadoImportacionEaResponseSchema,
} from "../schemas/intercambio-enterprise-architect.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/diagramas`
  : `${rawBackendUrl}/api/diagramas`;

export const intercambioEnterpriseArchitectRepositoryImpl: IntercambioEnterpriseArchitectRepository =
  {
    exportarDiagramaEa(
      idDiagrama: string,
      idProyecto: string
    ): Promise<ApiFileResult> {
      const url = `${BASE_URL}/${idDiagrama}/enterprise-architect/exportar?proyecto_id=${encodeURIComponent(
        idProyecto
      )}`;
      return apiRequestFile({
        url,
        method: "GET",
        defaultFileName: "diagrama_ea.xml",
        defaultContentType: "application/xml",
        fallbackMessage:
          "No se pudo exportar el diagrama a Enterprise Architect.",
      });
    },

    importarDiagramaEa(
      idDiagrama: string,
      idProyecto: string,
      archivo: File
    ): Promise<ApiResult<ResultadoImportacionEa>> {
      const url = `${BASE_URL}/${idDiagrama}/enterprise-architect/importar`;
      const formData = new FormData();
      formData.append("proyecto_id", idProyecto);
      formData.append("archivo", archivo);

      return apiRequestFormData({
        url,
        method: "POST",
        body: formData,
        responseSchema: ResultadoImportacionEaResponseSchema,
        mapData: intercambioEaMapper.toResultadoImportacion,
        fallbackMessage:
          "No se pudo importar el archivo de Enterprise Architect.",
      });
    },
  };

export async function exportarDiagramaEa(
  idDiagrama: string,
  idProyecto: string
): Promise<ApiFileResult> {
  return intercambioEnterpriseArchitectRepositoryImpl.exportarDiagramaEa(
    idDiagrama,
    idProyecto
  );
}

export async function importarDiagramaEa(
  idDiagrama: string,
  idProyecto: string,
  archivo: File
): Promise<ApiResult<ResultadoImportacionEa>> {
  return intercambioEnterpriseArchitectRepositoryImpl.importarDiagramaEa(
    idDiagrama,
    idProyecto,
    archivo
  );
}
