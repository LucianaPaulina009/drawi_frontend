import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ActualizarProyectoData,
  Proyecto,
  ProyectoCreado,
} from "../../domain/entities/proyecto.entity";
import type { ProyectoRepository } from "../../domain/repositories/proyecto.repository";
import { proyectoMapper } from "../mappers/proyecto.mapper";
import {
  ListaProyectosResponseSchema,
  ProyectoCreadoResponseSchema,
} from "../schemas/proyecto.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/proyectos`
  : `${rawBackendUrl}/api/proyectos`;

export const proyectoRepositoryImpl: ProyectoRepository = {
  listarProyectos(): Promise<ApiResult<Proyecto[]>> {
    return apiRequestData({
      url: `${BASE_URL}/listado`,
      method: "GET",
      responseSchema: ListaProyectosResponseSchema,
      mapData: proyectoMapper.toListaProyectos,
      fallbackMessage: "Error al obtener el listado de proyectos.",
    });
  },

  listarFavoritos(): Promise<ApiResult<Proyecto[]>> {
    return apiRequestData({
      url: `${BASE_URL}/listado?favoritos=true`,
      method: "GET",
      responseSchema: ListaProyectosResponseSchema,
      mapData: proyectoMapper.toListaProyectos,
      fallbackMessage: "Error al obtener los proyectos favoritos.",
    });
  },

  crearProyecto(): Promise<ApiResult<ProyectoCreado>> {
    return apiRequestData({
      url: `${BASE_URL}/crear`,
      method: "POST",
      responseSchema: ProyectoCreadoResponseSchema,
      mapData: proyectoMapper.toProyectoCreado,
      fallbackMessage: "Error al crear el proyecto.",
    });
  },

  actualizarProyecto(
    id: string,
    datos: ActualizarProyectoData
  ): Promise<ApiActionResult> {
    const payload = proyectoMapper.toActualizarProyectoRequest(datos);
    return apiRequestStatus({
      url: `${BASE_URL}/${id}/actualizar`,
      method: "PATCH",
      body: payload,
      fallbackMessage: "Error al actualizar la información del proyecto.",
    });
  },

  eliminarProyecto(id: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${id}/eliminar`,
      method: "DELETE",
      fallbackMessage: "Error al eliminar el proyecto.",
    });
  },

  agregarFavorito(id: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${id}/agregar_favorito`,
      method: "POST",
      fallbackMessage: "Error al agregar el proyecto a favoritos.",
    });
  },

  desmarcarFavorito(id: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${id}/desmarcar_favorito`,
      method: "POST",
      fallbackMessage: "Error al quitar el proyecto de favoritos.",
    });
  },
};
