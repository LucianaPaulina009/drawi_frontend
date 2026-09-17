import type { Clase } from "./clase.entity";

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
}

export interface CrearDiagramaData {
  nombre?: string;
}

export interface ActualizarDiagramaData {
  nombre: string;
}
