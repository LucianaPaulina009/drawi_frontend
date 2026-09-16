export type ColorProyecto =
  | "celeste"
  | "rojo"
  | "verde"
  | "azul"
  | "naranja"
  | "amarillo"
  | "morado";

export type IconoProyecto =
  | "finanza"
  | "almacen"
  | "estrella"
  | "dinero"
  | "caja";

export interface Proyecto {
  id: string;
  nombre: string;
  color: ColorProyecto;
  icono: IconoProyecto;
  fechaActualizacion: string;
  esFavorito: boolean;
  slug: string;
  propietarioId?: string;
}

export interface ActualizarProyectoData {
  nombre?: string;
  color?: ColorProyecto;
  icono?: IconoProyecto;
}

export interface ProyectoCreado {
  slug: string;
}
