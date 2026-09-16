export type RolColaborador = "ver" | "editor" | "comentarista" | "propietario";
export type EstadoColaborador = "activo" | "bloqueado";

export interface MiembroProyecto {
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  rol: RolColaborador;
  estado: EstadoColaborador;
  esPropietario: boolean;
}

export interface CambiarRolData {
  rol: "ver" | "editor" | "comentarista";
}
