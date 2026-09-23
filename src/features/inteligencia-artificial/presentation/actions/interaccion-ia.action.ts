import { z } from "zod";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  InteraccionIa,
  ListaInteraccionesIa,
} from "../../domain/entities/interaccion-ia.entity";
import { interaccionIaRepositoryImpl } from "../../infrastructure/repositories/interaccion-ia.repository";
import { EnviarMensajeIaRequestSchema } from "../../infrastructure/schemas/interaccion-ia.schemas";

const IdDiagramaParamSchema = z
  .string()
  .min(1, "Identificador de diagrama inválido");

export async function listarInteraccionesIaAction(
  idDiagrama: string,
  cursorUopciones?: string | { cursor?: string; limite?: number; offset?: number },
  limite?: number
): Promise<ApiResult<ListaInteraccionesIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  return interaccionIaRepositoryImpl.listarInteracciones(
    parsedDiagrama.data,
    cursorUopciones,
    limite
  );
}

export async function enviarMensajeIaAction(
  idDiagrama: string,
  datos: unknown
): Promise<ApiResult<InteraccionIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  const parsedBody = EnviarMensajeIaRequestSchema.safeParse(datos);
  if (!parsedBody.success) {
    const errorMsg =
      parsedBody.error.issues[0]?.message ||
      "El mensaje enviado contiene datos inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return interaccionIaRepositoryImpl.enviarMensaje(
    parsedDiagrama.data,
    parsedBody.data
  );
}

export async function enviarAudioIaAction(
  idDiagrama: string,
  formData: FormData
): Promise<ApiResult<InteraccionIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["No se proporcionó un archivo de audio válido."],
    };
  }

  const claveIdempotenciaRaw = formData.get("clave_idempotencia");
  const claveIdempotencia =
    typeof claveIdempotenciaRaw === "string" && claveIdempotenciaRaw.trim()
      ? claveIdempotenciaRaw.trim()
      : crypto.randomUUID();

  const duracionRaw = formData.get("duracion_segundos");
  const duracion = duracionRaw ? Number(duracionRaw) : undefined;

  return interaccionIaRepositoryImpl.enviarAudio(
    parsedDiagrama.data,
    audioFile,
    claveIdempotencia,
    audioFile.type,
    duracion
  );
}

export async function transcribirAudioIaAction(
  idDiagrama: string,
  formData: FormData
) {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false as const,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return {
      ok: false as const,
      statusCode: 400,
      errors: ["No se proporcionó un archivo de audio válido."],
    };
  }

  const duracionRaw = formData.get("duracion_segundos");
  const duracion = duracionRaw ? Number(duracionRaw) : undefined;

  return interaccionIaRepositoryImpl.transcribirAudio(
    parsedDiagrama.data,
    audioFile,
    audioFile.type,
    duracion
  );
}

export async function enviarImagenIaAction(
  idDiagrama: string,
  formData: FormData
): Promise<ApiResult<InteraccionIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  const imageFile = formData.get("imagen");
  if (!imageFile || !(imageFile instanceof Blob)) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["No se proporcionó un archivo de imagen válido."],
    };
  }

  const claveIdempotenciaRaw = formData.get("clave_idempotencia");
  const claveIdempotencia =
    typeof claveIdempotenciaRaw === "string" && claveIdempotenciaRaw.trim()
      ? claveIdempotenciaRaw.trim()
      : crypto.randomUUID();

  const nombreArchivoRaw = formData.get("nombre_archivo");
  const nombreArchivo =
    typeof nombreArchivoRaw === "string" && nombreArchivoRaw.trim()
      ? nombreArchivoRaw.trim()
      : imageFile instanceof File
      ? imageFile.name
      : "diagrama.png";

  return interaccionIaRepositoryImpl.enviarImagen(
    parsedDiagrama.data,
    imageFile,
    claveIdempotencia,
    nombreArchivo
  );
}
