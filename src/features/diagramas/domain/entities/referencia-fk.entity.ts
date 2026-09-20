export type AccionReferencial =
  | "NO_ACTION"
  | "RESTRICT"
  | "CASCADE"
  | "SET_NULL"
  | "SET_DEFAULT";

export interface ReferenciaFk {
  id: string;
  idRelacion: string;
  idAtributoFk: string;
  idAtributoReferenciado: string;
  onDelete: AccionReferencial;
  onUpdate: AccionReferencial;
}

export interface CrearReferenciaFkData {
  idReferenciaFk: string;
  idAtributoFk: string;
  idAtributoReferenciado: string;
  onDelete?: AccionReferencial;
  onUpdate?: AccionReferencial;
}

export interface ActualizarReferenciaFkData {
  idAtributoFk?: string;
  idAtributoReferenciado?: string;
  onDelete?: AccionReferencial;
  onUpdate?: AccionReferencial;
}
