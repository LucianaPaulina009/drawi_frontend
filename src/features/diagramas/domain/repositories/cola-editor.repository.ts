import type { ConfirmacionOperacionDiagrama } from "../entities/evento-editor.entity";
import type { InstantaneaEditor, OperacionEditor } from "../entities/operacion-editor.entity";

export interface ColaEditorRepository {
  listar(scopeKey: string): Promise<OperacionEditor[]>;
  listarScopesPorUsuario(usuarioId: string): Promise<string[]>;
  obtener(actionId: string): Promise<OperacionEditor | undefined>;
  guardar(operacion: OperacionEditor): Promise<void>;
  guardarLote(operaciones: OperacionEditor[]): Promise<void>;
  actualizar(operacion: OperacionEditor): Promise<void>;
  confirmar(
    operacion: OperacionEditor,
    reciboOInstantanea: ConfirmacionOperacionDiagrama | InstantaneaEditor,
    instantanea?: InstantaneaEditor,
  ): Promise<void>;
  obtenerRecibo(actionId: string): Promise<ConfirmacionOperacionDiagrama | undefined>;
  guardarInstantanea(instantanea: InstantaneaEditor): Promise<void>;
  obtenerInstantanea(scopeKey: string): Promise<InstantaneaEditor | undefined>;
  eliminarInstantanea(scopeKey: string): Promise<void>;
  eliminar(actionId: string): Promise<void>;
  limpiarScope(scopeKey: string): Promise<void>;
}

