"use server";

import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { Atributo } from "../../domain/entities/atributo.entity";
import { atributoRepositoryImpl } from "../../infrastructure/repositories/atributo.repository";
import {
  ActualizarAtributoInputSchema,
  CrearAtributoInputSchema,
} from "../../infrastructure/schemas/atributo.schemas";
import { IdParamSchema } from "../../infrastructure/schemas/diagrama.schemas";

export async function listarAtributosAction(
  idClase: string
): Promise<ApiResult<Atributo[]>> {
  const parsedClase = IdParamSchema.safeParse(idClase);

  if (!parsedClase.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de clase inválido."],
    };
  }

  return atributoRepositoryImpl.listarAtributos(parsedClase.data);
}

export async function obtenerAtributoAction(
  idClase: string,
  idAtributo: string
): Promise<ApiResult<Atributo>> {
  const parsedClase = IdParamSchema.safeParse(idClase);
  const parsedAtributo = IdParamSchema.safeParse(idAtributo);

  if (!parsedClase.success || !parsedAtributo.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  return atributoRepositoryImpl.obtenerAtributo(
    parsedClase.data,
    parsedAtributo.data
  );
}

export async function crearAtributoAction(
  idClase: string,
  data: unknown
): Promise<ApiResult<Atributo>> {
  const parsedClase = IdParamSchema.safeParse(idClase);
  const parsedData = CrearAtributoInputSchema.safeParse(data);

  if (!parsedClase.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de clase inválido."],
    };
  }

  if (!parsedData.success) {
    const errorMsg =
      parsedData.error.issues[0]?.message || "Datos de atributo inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return atributoRepositoryImpl.crearAtributo(
    parsedClase.data,
    parsedData.data
  );
}

export async function actualizarAtributoAction(
  idClase: string,
  idAtributo: string,
  data: unknown
): Promise<ApiResult<Atributo>> {
  const parsedClase = IdParamSchema.safeParse(idClase);
  const parsedAtributo = IdParamSchema.safeParse(idAtributo);
  const parsedData = ActualizarAtributoInputSchema.safeParse(data);

  if (!parsedClase.success || !parsedAtributo.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  if (!parsedData.success) {
    const errorMsg =
      parsedData.error.issues[0]?.message || "Datos de atributo inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return atributoRepositoryImpl.actualizarAtributo(
    parsedClase.data,
    parsedAtributo.data,
    parsedData.data
  );
}

export async function eliminarAtributoAction(
  idClase: string,
  idAtributo: string
): Promise<ApiActionResult> {
  const parsedClase = IdParamSchema.safeParse(idClase);
  const parsedAtributo = IdParamSchema.safeParse(idAtributo);

  if (!parsedClase.success || !parsedAtributo.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificadores inválidos."],
    };
  }

  return atributoRepositoryImpl.eliminarAtributo(
    parsedClase.data,
    parsedAtributo.data
  );
}
