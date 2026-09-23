export type ColorAcentoSeccion =
  | "matcha"
  | "cornflower"
  | "amber"
  | "rose"
  | "purple";

export interface TarjetaCaracteristica {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  badge?: string;
  destacado?: boolean;
}

export interface PasoAccion {
  numero: number;
  titulo: string;
  descripcion: string;
  icono: string;
  ubicacionUI?: string;
}

export interface SeccionManual {
  id: string;
  numero: string;
  titulo: string;
  eslogan: string;
  icono: string;
  colorAcento: ColorAcentoSeccion;
  descripcion: string;
  tarjetas: TarjetaCaracteristica[];
  pasos?: PasoAccion[];
  tips?: string[];
}

export interface EnlaceIndiceTOC {
  id: string;
  titulo: string;
  icono: string;
  numero: string;
}
