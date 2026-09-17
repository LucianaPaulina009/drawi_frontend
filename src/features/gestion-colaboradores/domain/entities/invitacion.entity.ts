export interface Invitacion {
  id: string;
  idProyecto: string;
  codigoAcceso: string;
  fechaExpiracion: string;
}

export interface ValidacionInvitacion {
  codigo: string;
  proyectoId: string;
  proyectoNombre: string;
  proyectoSlug: string;
  propietarioNombre: string;
  haExpirado: boolean;
}

export interface UnirseInvitacionResult {
  proyectoId: string;
  proyectoSlug: string;
  diagramaId: string | null;
  rol: string;
  mensaje: string;
}
