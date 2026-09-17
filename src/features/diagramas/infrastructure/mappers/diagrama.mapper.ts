import type { z } from "zod";
import type {
  ActualizarDiagramaData,
  Diagrama,
  DiagramaDetalle,
} from "../../domain/entities/diagrama.entity";
import type {
  DiagramaDetalleResponseSchema,
  DiagramaReadResponseSchema,
  ListaDiagramasResponseSchema,
} from "../schemas/diagrama.schemas";
import { claseMapper } from "./clase.mapper";

export const diagramaMapper = {
  toDiagrama(raw: z.infer<typeof DiagramaReadResponseSchema>): Diagrama {
    return {
      id: raw.id,
      idProyecto: raw.id_proyecto,
      nombre: raw.nombre,
      numero: raw.numero,
    };
  },

  toListaDiagramas(
    raw: z.infer<typeof ListaDiagramasResponseSchema>
  ): Diagrama[] {
    return raw.items.map(diagramaMapper.toDiagrama);
  },

  toDiagramaDetalle(
    raw: z.infer<typeof DiagramaDetalleResponseSchema>
  ): DiagramaDetalle {
    const rawClases = raw.clases || [];
    return {
      id: raw.id,
      idProyecto: raw.id_proyecto,
      nombre: raw.nombre,
      numero: raw.numero,
      clases: rawClases.map(claseMapper.toClase),
    };
  },

  toActualizarDiagramaRequest(data: ActualizarDiagramaData): { nombre: string } {
    return {
      nombre: data.nombre.trim(),
    };
  },
};
