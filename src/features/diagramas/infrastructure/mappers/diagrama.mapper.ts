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
    return {
      id: raw.id,
      idProyecto: raw.id_proyecto,
      nombre: raw.nombre,
      numero: raw.numero,
    };
  },

  toActualizarDiagramaRequest(data: ActualizarDiagramaData): { nombre: string } {
    return {
      nombre: data.nombre.trim(),
    };
  },
};
