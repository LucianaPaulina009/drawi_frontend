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
}

export interface CrearDiagramaData {
  nombre?: string;
}

export interface ActualizarDiagramaData {
  nombre: string;
}
