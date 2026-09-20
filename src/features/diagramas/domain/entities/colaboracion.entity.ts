import type { EfectosOperacionDiagrama } from "./evento-editor.entity";

export interface CursorRemoto {
  idUsuario: string;
  nombreUsuario: string;
  color: string;
  x: number;
  y: number;
  actualizadoEn: number;
}

export interface BloqueoClase {
  idClase: string;
  idUsuario: string;
  nombreUsuario: string;
  expiraEn: number;
}

export interface DragPreviewClase {
  idClase: string;
  idUsuario: string;
  posicionX: number;
  posicionY: number;
}

export interface ParticipanteColaborador {
  idUsuario: string;
  nombreUsuario: string;
  color: string;
  rol: "propietario" | "editor" | "ver" | "comentarista" | string;
  puedeEditar: boolean;
}

export interface SalaUnidaData {
  diagramaId: string;
  miUsuarioId: string;
  miRol: string;
  puedeEditar: boolean;
  participantes: ParticipanteColaborador[];
  bloqueos: BloqueoClase[];
}

export interface MutacionConfirmadaData {
  diagramaId: string;
  actionId: string;
  tipoOperacion: string;
  emisorId: string;
  efectos: EfectosOperacionDiagrama;
}
