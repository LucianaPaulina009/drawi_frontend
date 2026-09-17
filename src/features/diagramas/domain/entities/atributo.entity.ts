export type TipoDato =
  | "integer"
  | "bigint"
  | "varchar"
  | "text"
  | "decimal"
  | "boolean"
  | "date"
  | "timestamp";

export const TIPOS_DATO: readonly TipoDato[] = [
  "integer",
  "bigint",
  "varchar",
  "text",
  "decimal",
  "boolean",
  "date",
  "timestamp",
] as const;

export interface Atributo {
  id: string;
  idClase: string;
  tipoDato: TipoDato;
  nombre: string;
  longitud: number | null;
  precision: number | null;
  escala: number | null;
  esLlavePrimaria: boolean;
  permiteNulo: boolean;
  esUnico: boolean;
  valorPorDefecto: string | null;
  ordenDePosicion: number;
}

export interface CrearAtributoData {
  idAtributo?: string;
  tipoDato: TipoDato;
  nombre: string;
  longitud?: number | null;
  precision?: number | null;
  escala?: number | null;
  esLlavePrimaria?: boolean;
  permiteNulo?: boolean;
  esUnico?: boolean;
  valorPorDefecto?: string | null;
  ordenDePosicion?: number | null;
}

export interface ActualizarAtributoData {
  tipoDato?: TipoDato;
  nombre?: string;
  longitud?: number | null;
  precision?: number | null;
  escala?: number | null;
  esLlavePrimaria?: boolean;
  permiteNulo?: boolean;
  esUnico?: boolean;
  valorPorDefecto?: string | null;
  ordenDePosicion?: number | null;
}
