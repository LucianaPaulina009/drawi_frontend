"use server";

import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { Clase } from "../../domain/entities/clase.entity";
import { claseRepositoryImpl } from "../../infrastructure/repositories/clase.repository";
import {
  ActualizarClaseInputSchema,
  CrearClaseInputSchema,
} from "../../infrastructure/schemas/clase.schemas";
import { IdParamSchema } from "../../infrastructure/schemas/diagrama.schemas";

export async function listarClasesAction(
  idDiagrama: string
): Promise<ApiResult<Clase[]>> {
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);

  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  return claseRepositoryImpl.listarClases(parsedDiagrama.data);
}

export async function obtenerClaseAction(
  idDiagrama: string,
  idClase: string
): Promise<ApiResult<Clase>> {
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);
  const parsedClase = IdParamSchema.safeParse(idClase);

  if (!parsedDiagrama.success || !parsedClase.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  return claseRepositoryImpl.obtenerClase(
    parsedDiagrama.data,
    parsedClase.data
  );
}

export async function crearClaseAction(
  idDiagrama: string,
  data: unknown
): Promise<ApiResult<Clase>> {
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);
  const parsedData = CrearClaseInputSchema.safeParse(data);

  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  if (!parsedData.success) {
    const errorMsg =
      parsedData.error.issues[0]?.message || "Datos de clase inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return claseRepositoryImpl.crearClase(
    parsedDiagrama.data,
    parsedData.data
  );
}

export async function actualizarClaseAction(
  idDiagrama: string,
  idClase: string,
  data: unknown
): Promise<ApiResult<Clase>> {
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);
  const parsedClase = IdParamSchema.safeParse(idClase);
  const parsedData = ActualizarClaseInputSchema.safeParse(data);

  if (!parsedDiagrama.success || !parsedClase.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  if (!parsedData.success) {
    const errorMsg =
      parsedData.error.issues[0]?.message || "Datos de clase inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return claseRepositoryImpl.actualizarClase(
    parsedDiagrama.data,
    parsedClase.data,
    parsedData.data
  );
}

export async function eliminarClaseAction(
  idDiagrama: string,
  idClase: string
): Promise<ApiActionResult> {
  const parsedDiagrama = IdParamSchema.safeParse(idDiagrama);
  const parsedClase = IdParamSchema.safeParse(idClase);

  if (!parsedDiagrama.success || !parsedClase.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  return claseRepositoryImpl.eliminarClase(
    parsedDiagrama.data,
    parsedClase.data
  );
}
