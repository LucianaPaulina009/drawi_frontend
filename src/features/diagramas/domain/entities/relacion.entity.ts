import type { AccionReferencial, ReferenciaFk } from "./referencia-fk.entity";
import type { TipoDato } from "./atributo.entity";

export type TipoRelacion =
  | "asociacion"
  | "asociacion_dirigida"
  | "agregacion"
  | "composicion"
  | "dependencia"
  | "realizacion"
  | "herencia";

export type ConectorRelacion = "top" | "right" | "bottom" | "left";

export interface Relacion {
  id: string;
  idDiagrama: string;
  idClaseOrigen: string;
  idClaseDestino: string;
  tipoRelacion: TipoRelacion;
  cardinalidadOrigen: string;
  cardinalidadDestino: string;
  conectorOrigen: ConectorRelacion;
  conectorDestino: ConectorRelacion;
  nombre?: string | null;
  referenciasFk: ReferenciaFk[];
}

export interface AtributoFkNuevoData {
  idAtributo: string;
  nombre: string;
  tipoDato: TipoDato;
  longitud?: number | null;
  precision?: number | null;
  escala?: number | null;
  permiteNulo?: boolean;
  esUnico?: boolean;
  valorPorDefecto?: string | null;
}

export interface MaterializacionFkData {
  idReferenciaFk: string;
  idAtributoReferenciado: string;
  idAtributoFk?: string;
  idClaseFk?: string;
  atributoFkNuevo?: AtributoFkNuevoData;
  onDelete?: AccionReferencial;
  onUpdate?: AccionReferencial;
}

export interface CrearRelacionData {
  idRelacion: string;
  idClaseOrigen: string;
  idClaseDestino: string;
  tipoRelacion: TipoRelacion;
  cardinalidadOrigen: string;
  cardinalidadDestino: string;
  conectorOrigen: ConectorRelacion;
  conectorDestino: ConectorRelacion;
  nombre?: string | null;
  materializacionFk?: MaterializacionFkData[];
}

export interface ActualizarRelacionData {
  nombre?: string | null;
  idClaseOrigen?: string;
  idClaseDestino?: string;
  tipoRelacion?: TipoRelacion;
  cardinalidadOrigen?: string;
  cardinalidadDestino?: string;
  conectorOrigen?: ConectorRelacion;
  conectorDestino?: ConectorRelacion;
  materializacionFk?: MaterializacionFkData[];
}

export const TIPOS_RELACION: readonly TipoRelacion[] = [
  "asociacion", "asociacion_dirigida", "agregacion", "composicion",
  "dependencia", "realizacion", "herencia",
] as const;

export function requiereMaterializacion(
  tipo: TipoRelacion,
  origen: string,
  destino: string,
): boolean {
  if (["herencia", "realizacion", "dependencia"].includes(tipo)) return true;
  if (!(["asociacion", "asociacion_dirigida", "agregacion", "composicion"] as string[]).includes(tipo)) return false;
  const esMuchos = (valor: string) => valor.trim() === "*" || /\.\.\*$/.test(valor.trim()) || Number(valor) > 1;
  return !(esMuchos(origen) && esMuchos(destino));
}
