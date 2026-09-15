"use server";

import { revalidatePath } from "next/cache";
import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { ProyectoCreado } from "../../domain/entities/proyecto.entity";
import { proyectoRepositoryImpl } from "../../infrastructure/repositories/proyecto.repository";
import { ActualizarProyectoRequestSchema } from "../../infrastructure/schemas/proyecto.schemas";

export async function crearProyectoAction(): Promise<ApiResult<ProyectoCreado>> {
  const result = await proyectoRepositoryImpl.crearProyecto();
  if (result.ok) {
    revalidatePath("/proyectos");
    revalidatePath("/proyectos/favoritos");
  }
  return result;
}

export async function actualizarProyectoAction(
  id: string,
  data: unknown
): Promise<ApiActionResult> {
  const parsed = ActualizarProyectoRequestSchema.safeParse(data);

  if (!parsed.success) {
    const primerError =
      parsed.error.issues[0]?.message ||
      "Los datos proporcionados para el proyecto son inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [primerError],
    };
  }

  const result = await proyectoRepositoryImpl.actualizarProyecto(
    id,
    parsed.data
  );
  if (result.ok) {
    revalidatePath("/proyectos");
    revalidatePath("/proyectos/favoritos");
  }
  return result;
}

export async function eliminarProyectoAction(
  id: string
): Promise<ApiActionResult> {
  const result = await proyectoRepositoryImpl.eliminarProyecto(id);
  if (result.ok) {
    revalidatePath("/proyectos");
    revalidatePath("/proyectos/favoritos");
  }
  return result;
}

export async function agregarFavoritoAction(
  id: string
): Promise<ApiActionResult> {
  const result = await proyectoRepositoryImpl.agregarFavorito(id);
  if (result.ok) {
    revalidatePath("/proyectos");
    revalidatePath("/proyectos/favoritos");
  }
  return result;
}

export async function desmarcarFavoritoAction(
  id: string
): Promise<ApiActionResult> {
  const result = await proyectoRepositoryImpl.desmarcarFavorito(id);
  if (result.ok) {
    revalidatePath("/proyectos");
    revalidatePath("/proyectos/favoritos");
  }
  return result;
}
