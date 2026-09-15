import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ActualizarDiagramaData,
  CrearDiagramaData,
  Diagrama,
  DiagramaDetalle,
} from "../../domain/entities/diagrama.entity";
import type { DiagramaRepository } from "../../domain/repositories/diagrama.repository";
import { diagramaMapper } from "../mappers/diagrama.mapper";
import {
  DiagramaDetalleResponseSchema,
  DiagramaReadResponseSchema,
  ListaDiagramasResponseSchema,
} from "../schemas/diagrama.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/proyectos`
  : `${rawBackendUrl}/api/proyectos`;

export const diagramaRepositoryImpl: DiagramaRepository = {
  listarDiagramas(idProyecto: string): Promise<ApiResult<Diagrama[]>> {
    return apiRequestData({
      url: `${BASE_URL}/${idProyecto}/diagramas`,
      method: "GET",
      responseSchema: ListaDiagramasResponseSchema,
      mapData: diagramaMapper.toListaDiagramas,
      fallbackMessage: "Error al obtener las páginas del proyecto.",
    });
  },

  obtenerDiagrama(
    idProyecto: string,
    idDiagrama: string
  ): Promise<ApiResult<DiagramaDetalle>> {
    return apiRequestData({
      url: `${BASE_URL}/${idProyecto}/diagramas/${idDiagrama}`,
      method: "GET",
      responseSchema: DiagramaDetalleResponseSchema,
      mapData: diagramaMapper.toDiagramaDetalle,
      fallbackMessage: "Error al obtener la información de la página.",
    });
  },

  crearDiagrama(
    idProyecto: string,
    datos?: CrearDiagramaData
  ): Promise<ApiResult<Diagrama>> {
    return apiRequestData({
      url: `${BASE_URL}/${idProyecto}/diagramas`,
      method: "POST",
      body: datos?.nombre ? { nombre: datos.nombre.trim() } : undefined,
      responseSchema: DiagramaReadResponseSchema,
      mapData: diagramaMapper.toDiagrama,
      fallbackMessage: "Error al crear la nueva página.",
    });
  },

  actualizarDiagrama(
    idProyecto: string,
    idDiagrama: string,
    datos: ActualizarDiagramaData
  ): Promise<ApiResult<Diagrama>> {
    const payload = diagramaMapper.toActualizarDiagramaRequest(datos);
    return apiRequestData({
      url: `${BASE_URL}/${idProyecto}/diagramas/${idDiagrama}`,
      method: "PATCH",
      body: payload,
      responseSchema: DiagramaReadResponseSchema,
      mapData: diagramaMapper.toDiagrama,
      fallbackMessage: "Error al actualizar el nombre de la página.",
    });
  },

  eliminarDiagrama(
    idProyecto: string,
    idDiagrama: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${idProyecto}/diagramas/${idDiagrama}`,
      method: "DELETE",
      fallbackMessage: "Error al eliminar la página del proyecto.",
    });
  },
};
