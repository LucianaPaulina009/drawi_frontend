import type { Atributo } from "./atributo.entity";

export interface Clase {
  id: string;
  idDiagrama: string;
  nombre: string;
  posicionX: number;
  posicionY: number;
  ancho: number;
  atributos: Atributo[];
}

export interface CrearClaseData {
  idClase?: string;
  idAtributoInicial?: string;
  nombre?: string;
  posicionX: number;
  posicionY: number;
  ancho?: number;
}

export interface ActualizarClaseData {
  nombre?: string;
  posicionX?: number;
  posicionY?: number;
  ancho?: number;
}
