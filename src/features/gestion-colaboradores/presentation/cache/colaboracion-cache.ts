import type { MiembroProyecto } from "../../domain/entities/colaborador.entity";
import type { Invitacion } from "../../domain/entities/invitacion.entity";

export interface CacheColaboracionProyecto {
  invitacion?: Invitacion | null;
  promesaInvitacion?: Promise<Invitacion | null> | null;
  miembros?: MiembroProyecto[];
  timestamp: number;
}

// Caché en memoria para los datos de colaboración indexado por proyectoId
const cacheColaboracion = new Map<string, CacheColaboracionProyecto>();

export const colaboracionCache = {
  getInvitacion(proyectoId: string): Invitacion | null | undefined {
    const entrada = cacheColaboracion.get(proyectoId);
    return entrada ? entrada.invitacion : undefined;
  },

  hasInvitacion(proyectoId: string): boolean {
    const entrada = cacheColaboracion.get(proyectoId);
    return entrada !== undefined && entrada.invitacion !== undefined;
  },

  setInvitacion(proyectoId: string, invitacion: Invitacion | null): void {
    const entrada = cacheColaboracion.get(proyectoId) || { timestamp: Date.now() };
    entrada.invitacion = invitacion;
    entrada.promesaInvitacion = null;
    entrada.timestamp = Date.now();
    cacheColaboracion.set(proyectoId, entrada);
  },

  getPromesaInvitacion(proyectoId: string): Promise<Invitacion | null> | null | undefined {
    const entrada = cacheColaboracion.get(proyectoId);
    return entrada ? entrada.promesaInvitacion : undefined;
  },

  setPromesaInvitacion(proyectoId: string, promesa: Promise<Invitacion | null> | null): void {
    const entrada = cacheColaboracion.get(proyectoId) || { timestamp: Date.now() };
    entrada.promesaInvitacion = promesa;
    cacheColaboracion.set(proyectoId, entrada);
  },

  getMiembros(proyectoId: string): MiembroProyecto[] | undefined {
    const entrada = cacheColaboracion.get(proyectoId);
    return entrada ? entrada.miembros : undefined;
  },

  hasMiembros(proyectoId: string): boolean {
    const entrada = cacheColaboracion.get(proyectoId);
    return entrada !== undefined && entrada.miembros !== undefined;
  },

  setMiembros(proyectoId: string, miembros: MiembroProyecto[]): void {
    const entrada = cacheColaboracion.get(proyectoId) || { timestamp: Date.now() };
    entrada.miembros = miembros;
    entrada.timestamp = Date.now();
    cacheColaboracion.set(proyectoId, entrada);
  },

  invalidar(proyectoId: string): void {
    cacheColaboracion.delete(proyectoId);
  },

  limpiarTodo(): void {
    cacheColaboracion.clear();
  },
};
