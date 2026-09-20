import type { Clase } from "./clase.entity";
import type { Relacion } from "./relacion.entity";
import type { EstructuraRelacionNm } from "./estructura-relacion-nm.entity";

export interface Diagrama {
  id: string;
  idProyecto: string;
  nombre: string;
  readonly numero: number;
}

export interface DiagramaDetalle {
  id: string;
  idProyecto: string;
  nombre: string;
  readonly numero: number;
  clases: Clase[];
  relaciones: Relacion[];
  estructurasNm: EstructuraRelacionNm[];
}

export interface CrearDiagramaData {
  nombre?: string;
}

export interface ActualizarDiagramaData {
  nombre: string;
}
