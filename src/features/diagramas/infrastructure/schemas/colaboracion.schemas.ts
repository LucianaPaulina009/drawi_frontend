import { z } from "zod";

export const ParticipanteWSSchema = z.object({
  idUsuario: z.string(),
  nombreUsuario: z.string(),
  color: z.string(),
  rol: z.string(),
  puedeEditar: z.boolean(),
});

export const BloqueoWSSchema = z.object({
  idClase: z.string(),
  idUsuario: z.string(),
  nombreUsuario: z.string(),
  expiraEn: z.number(),
});

export const SalaUnidaPayloadSchema = z.object({
  diagramaId: z.string(),
  miUsuarioId: z.string(),
  miRol: z.string(),
  puedeEditar: z.boolean(),
  participantes: z.array(ParticipanteWSSchema),
  bloqueos: z.array(BloqueoWSSchema),
});

export const CursorActualizadoPayloadSchema = z.object({
  idUsuario: z.string(),
  nombreUsuario: z.string(),
  color: z.string(),
  x: z.number(),
  y: z.number(),
  actualizadoEn: z.number(),
});

export const DragClaseActualizadoPayloadSchema = z.object({
  idClase: z.string(),
  idUsuario: z.string(),
  posicionX: z.number(),
  posicionY: z.number(),
});

export const BloqueoConcedidoPayloadSchema = z.object({
  idClase: z.string(),
  idUsuario: z.string(),
  nombreUsuario: z.string(),
  expiraEn: z.number(),
});

export const BloqueoDenegadoPayloadSchema = z.object({
  idClase: z.string(),
  bloqueadoPor: z.string(),
  mensaje: z.string(),
});

export const BloqueoLiberadoPayloadSchema = z.object({
  idClase: z.string(),
});

export const MutacionConfirmadaPayloadSchema = z.object({
  diagramaId: z.string(),
  actionId: z.string(),
  tipoOperacion: z.string(),
  emisorId: z.string(),
  efectos: z.any(),
});

export const ParticipanteDesconectadoPayloadSchema = z.object({
  idUsuario: z.string(),
});

export const FrameServidorWSSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("SALA_UNIDA"), payload: SalaUnidaPayloadSchema }),
  z.object({ tipo: z.literal("CURSOR_ACTUALIZADO"), payload: CursorActualizadoPayloadSchema }),
  z.object({ tipo: z.literal("DRAG_CLASE_ACTUALIZADO"), payload: DragClaseActualizadoPayloadSchema }),
  z.object({ tipo: z.literal("BLOQUEO_CLASE_CONCEDIDO"), payload: BloqueoConcedidoPayloadSchema }),
  z.object({ tipo: z.literal("BLOQUEO_CLASE_DENEGADO"), payload: BloqueoDenegadoPayloadSchema }),
  z.object({ tipo: z.literal("BLOQUEO_CLASE_LIBERADO"), payload: BloqueoLiberadoPayloadSchema }),
  z.object({ tipo: z.literal("MUTACION_CONFIRMADA"), payload: MutacionConfirmadaPayloadSchema }),
  z.object({ tipo: z.literal("PARTICIPANTE_DESCONECTADO"), payload: ParticipanteDesconectadoPayloadSchema }),
  z.object({ tipo: z.literal("PONG") }),
]);

export type FrameServidorWS = z.infer<typeof FrameServidorWSSchema>;
