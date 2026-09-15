"use server";

import { revalidatePath } from "next/cache";
import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  Diagrama,
  DiagramaDetalle,
} from "../../domain/entities/diagrama.entity";
import { diagramaRepositoryImpl } from "../../infrastructure/repositories/diagrama.repository";
import {
  ActualizarDiagramaRequestSchema,
  IdParamSchema,
} from "../../infrastructure/schemas/diagrama.schemas";

export async function obtenerDiagramaAction(
  idProyecto: string,
  idDiagrama: string
): Promise<ApiResult<DiagramaDetalle>> {
  const parsedProyecto = IdParamSchema.safeParse(idProyecto);
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);

  if (!parsedProyecto.success || !parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  return diagramaRepositoryImpl.obtenerDiagrama(
    parsedProyecto.data,
    parsedDiagrama.data
  );
}

export async function crearDiagramaAction(
  idProyecto: string,
  slug?: string
): Promise<ApiResult<Diagrama>> {
  const parsedProyecto = IdParamSchema.safeParse(idProyecto);

  if (!parsedProyecto.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de proyecto inválido."],
    };
  }

  const result = await diagramaRepositoryImpl.crearDiagrama(
    parsedProyecto.data
  );

  if (result.ok && slug) {
    revalidatePath(`/proyecto/${slug}`, "page");
  }

  return result;
}

export async function actualizarDiagramaAction(
  idProyecto: string,
  idDiagrama: string,
  data: unknown,
  slug?: string
): Promise<ApiResult<Diagrama>> {
  const parsedProyecto = IdParamSchema.safeParse(idProyecto);
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);
  const parsedData = ActualizarDiagramaRequestSchema.safeParse(data);

  if (!parsedProyecto.success || !parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  if (!parsedData.success) {
    const errorMsg =
      parsedData.error.issues[0]?.message ||
      "El nombre proporcionado para la página es inválido.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  const result = await diagramaRepositoryImpl.actualizarDiagrama(
    parsedProyecto.data,
    parsedDiagrama.data,
    parsedData.data
  );

  if (result.ok && slug) {
    revalidatePath(`/proyecto/${slug}`, "page");
  }

  return result;
}

export async function eliminarDiagramaAction(
  idProyecto: string,
  idDiagrama: string,
  slug?: string
): Promise<ApiActionResult> {
  const parsedProyecto = IdParamSchema.safeParse(idProyecto);
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);

  if (!parsedProyecto.success || !parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  const result = await diagramaRepositoryImpl.eliminarDiagrama(
    parsedProyecto.data,
    parsedDiagrama.data
  );

  if (result.ok && slug) {
    revalidatePath(`/proyecto/${slug}`, "page");
  }

  return result;
}
