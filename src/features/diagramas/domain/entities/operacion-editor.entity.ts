import type { DiagramaDetalle } from "./diagrama.entity";
import type { EventoEditor, TipoEventoEditor } from "./evento-editor.entity";

export type EstadoOperacionEditor =
  | "pendiente"
  | "en_progreso"
  | "enviando"
  | "confirmada"
  | "rechazada"
  | "bloqueada";

export interface OperacionEditor<T extends EventoEditor = EventoEditor> {
  /**
   * Identidad de una intención persistible. Nunca es el UUID de una clase,
   * atributo, relación o estructura del diagrama; un replay conserva este
   * valor y una nueva intención genera otro UUID.
   */
  actionId: string;
  scopeKey: string;
  usuarioId?: string;
  userId?: string;
  idProyecto?: string;
  projectId?: string;
  idDiagrama?: string;
  diagramId?: string;
  secuencia?: number;
  tipo: T["tipo"] | TipoEventoEditor | string;
  payload: T["datos"] | Record<string, unknown>;
  dependsOn: string[];
  dependencias?: string[];
  grupoAtomico?: string;
  estado: EstadoOperacionEditor;
  intentos: number;
  proximoIntento?: number;
  creadaEn: number;
  version?: number;
  ultimoError?: string;
  errorDefinitivo?: boolean;
  reconciliacionRequerida?: boolean;
}

export interface InstantaneaEditor {
  scopeKey: string;
  detalleConfirmado: DiagramaDetalle;
  version: number;
  actualizadaEn?: number;
}

export const crearScopeEditor = (usuarioId: string, diagramaId: string) =>
  `${usuarioId}:${diagramaId}`;

export const parsearScopeEditor = (scopeKey: string): { usuarioId: string; diagramaId: string } => {
  const [usuarioId = "", diagramaId = ""] = scopeKey.split(":");
  return { usuarioId, diagramaId };
};

export const esScopeValido = (scopeKey: string): boolean => {
  if (!scopeKey || typeof scopeKey !== "string") return false;
  if (scopeKey.startsWith("sesion:") || scopeKey.includes("undefined") || scopeKey.includes("null")) {
    return false;
  }
  const parts = scopeKey.split(":");
  return parts.length >= 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
};
