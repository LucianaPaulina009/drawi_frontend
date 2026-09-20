import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import {
  esScopeValido,
  type OperacionEditor,
} from "../../domain/entities/operacion-editor.entity";
import type { ColaEditorRepository } from "../../domain/repositories/cola-editor.repository";
import { ColaEditorIndexedDbRepository } from "../../infrastructure/repositories/cola-editor-indexeddb.repository";
import {
  clasificarResultado,
  demoraReintentoMs,
  despacharOperacionEditor,
  type DespachadorOperacionEditor,
} from "./ejecutor-operacion-editor";

export interface CoordinadorColaEditorOpciones {
  repository?: ColaEditorRepository;
  despachar?: DespachadorOperacionEditor;
  alConfirmar?: (operacion: OperacionEditor, recibo?: ConfirmacionOperacionDiagrama) => void;
  alRechazar?: (operacion: OperacionEditor, mensaje: string) => void;
  alCambiarEstado?: (operacion: OperacionEditor) => void;
}

export class CoordinadorColaEditor {
  private repository: ColaEditorRepository;
  private despachar: DespachadorOperacionEditor;
  private usuarioId: string | null = null;
  private scopesRegistrados = new Set<string>();
  private scopeBackoff = new Map<string, number>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private activo = false;
  private ejecucionActual: Promise<void> | null = null;
  private repeticionPendiente = false;
  private listenersConfirmacion = new Set<
    (operacion: OperacionEditor, recibo?: ConfirmacionOperacionDiagrama) => void
  >();
  private listenersRechazo = new Set<
    (operacion: OperacionEditor, mensaje: string) => void
  >();
  private listenersEstado = new Set<(operacion: OperacionEditor) => void>();
  private listenerOnline: (() => void) | null = null;

  constructor(opciones?: CoordinadorColaEditorOpciones) {
    this.repository = opciones?.repository ?? new ColaEditorIndexedDbRepository();
    this.despachar = opciones?.despachar ?? despacharOperacionEditor;
    if (opciones?.alConfirmar) this.listenersConfirmacion.add(opciones.alConfirmar);
    if (opciones?.alRechazar) this.listenersRechazo.add(opciones.alRechazar);
    if (opciones?.alCambiarEstado) this.listenersEstado.add(opciones.alCambiarEstado);
  }

  establecerUsuario(usuarioId: string | null): void {
    if (!usuarioId || usuarioId === "sesion") {
      this.usuarioId = null;
      return;
    }
    if (this.usuarioId !== usuarioId) {
      this.usuarioId = usuarioId;
      this.iniciar();
    }
  }

  obtenerUsuario(): string | null {
    return this.usuarioId;
  }

  registrarScope(scopeKey: string | null): void {
    if (!scopeKey || !esScopeValido(scopeKey)) return;
    this.scopesRegistrados.add(scopeKey);
    this.despertar();
  }

  /** Cuenta operaciones durables de todos los diagramas del usuario actual. */
  async contarPendientesUsuario(usuarioId: string | null): Promise<number> {
    if (!usuarioId || usuarioId === "sesion") return 0;
    const scopes = await this.repository.listarScopesPorUsuario(usuarioId);
    const operaciones = await Promise.all(scopes.map((scopeKey) => this.repository.listar(scopeKey)));
    return operaciones.reduce(
      (total, operacionesScope) =>
        total + operacionesScope.filter((operacion) => operacion.estado !== "confirmada").length,
      0
    );
  }

  suscribir(
    alConfirmar?: (operacion: OperacionEditor, recibo?: ConfirmacionOperacionDiagrama) => void,
    alRechazar?: (operacion: OperacionEditor, mensaje: string) => void,
    alCambiarEstado?: (operacion: OperacionEditor) => void
  ): () => void {
    if (alConfirmar) this.listenersConfirmacion.add(alConfirmar);
    if (alRechazar) this.listenersRechazo.add(alRechazar);
    if (alCambiarEstado) this.listenersEstado.add(alCambiarEstado);

    return () => {
      if (alConfirmar) this.listenersConfirmacion.delete(alConfirmar);
      if (alRechazar) this.listenersRechazo.delete(alRechazar);
      if (alCambiarEstado) this.listenersEstado.delete(alCambiarEstado);
    };
  }

  private notificarEstado(operacion: OperacionEditor): void {
    for (const listener of this.listenersEstado) {
      listener(operacion);
    }
  }

  iniciar(): void {
    if (this.activo) return;
    this.activo = true;

    if (typeof window !== "undefined") {
      this.listenerOnline = () => {
        this.scopeBackoff.clear();
        this.despertar();
      };
      window.addEventListener("online", this.listenerOnline);
    }

    this.despertar();
  }

  detener(): void {
    this.activo = false;
    // Limpia timers sin tocar ni borrar operaciones de disco en IndexedDB
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.scopeBackoff.clear();

    if (typeof window !== "undefined" && this.listenerOnline) {
      window.removeEventListener("online", this.listenerOnline);
      this.listenerOnline = null;
    }
  }

  despertar(): void {
    if (!this.activo || !this.usuarioId) return;
    void this.procesar();
  }

  async procesar(): Promise<void> {
    if (!this.activo || !this.usuarioId) return;

    if (this.ejecucionActual) {
      this.repeticionPendiente = true;
      return this.ejecucionActual;
    }

    this.ejecucionActual = (async () => {
      try {
        do {
          this.repeticionPendiente = false;
          // Descubrir scopes del usuario actual desde disco y scopes registrados
          const scopesDisco = await this.repository.listarScopesPorUsuario(this.usuarioId!);
          const todosLosScopes = new Set<string>([...scopesDisco, ...this.scopesRegistrados]);

          const ahora = Date.now();

          for (const scopeKey of todosLosScopes) {
            if (!this.activo || !this.usuarioId) break;
            if (!esScopeValido(scopeKey)) continue;

            // Saltar ámbito en espera por backoff activo
            const tiempoEspera = this.scopeBackoff.get(scopeKey);
            if (tiempoEspera && tiempoEspera > ahora) {
              continue;
            }

            // Procesar FIFO dentro de este scope
            await this.procesarScope(scopeKey);
          }
        } while (this.repeticionPendiente && this.activo && this.usuarioId);
      } finally {
        this.ejecucionActual = null;
      }
    })();

    return this.ejecucionActual;
  }

  private async procesarScope(scopeKey: string): Promise<void> {
    const MAX_REINTENTOS = 5;

    // Bucle para lectura actualizada tras cada recibo o avance
    while (this.activo && this.usuarioId) {
      const operaciones = await this.repository.listar(scopeKey);
      if (!operaciones || operaciones.length === 0) break;

      // 1. Identificar operaciones ya bloqueadas o rechazadas
      const idsBloqueadosORechazados = new Set<string>();
      for (const op of operaciones) {
        if (op.estado === "bloqueada" || op.estado === "rechazada") {
          idsBloqueadosORechazados.add(op.actionId);
        }
      }

      // 2. Propagar bloqueo a dependientes (directas o transitivas)
      let huboCambioEstado = false;
      for (const op of operaciones) {
        if (op.estado === "pendiente" || op.estado === "enviando") {
          const deps = op.dependsOn ?? op.dependencias ?? [];
          const depBloqueada = deps.find((depId) => idsBloqueadosORechazados.has(depId));
          if (depBloqueada) {
            idsBloqueadosORechazados.add(op.actionId);
            await this.repository.actualizar({
              ...op,
              estado: "bloqueada",
              ultimoError: `Bloqueada por rechazo o bloqueo en predecesora ${depBloqueada}.`,
            });
            huboCambioEstado = true;
          }
        }
      }
      if (huboCambioEstado) {
        continue;
      }

      // 3. Buscar la primera operación ejecutable (FIFO)
      // Debe estar en "pendiente" (o "enviando" recuperada),
      // no tener dependencias no confirmadas en cola, y no estar en backoff futuro.
      let candidata: OperacionEditor | null = null;
      for (const op of operaciones) {
        if (op.estado !== "pendiente" && op.estado !== "enviando") {
          continue;
        }

        const dependencias = op.dependsOn ?? op.dependencias ?? [];
        const tieneDependenciaPendiente = dependencias.some((depId) =>
          operaciones.some((item) => item.actionId === depId)
        );
        if (tieneDependenciaPendiente) {
          // Predecesora aún en cola; esperar a que se resuelva
          continue;
        }

        // Si tiene proximoIntento futuro por backoff
        if (op.proximoIntento && op.proximoIntento > Date.now()) {
          this.scopeBackoff.set(scopeKey, op.proximoIntento);
          candidata = null;
          break;
        }

        candidata = op;
        break;
      }

      if (!candidata) {
        // Ninguna operación lista o desbloqueada en este ámbito
        break;
      }

      // Procesar serialmente la operación candidata
      const enCurso: OperacionEditor = { ...candidata, estado: "enviando" };
      await this.repository.actualizar(enCurso);
      this.notificarEstado(enCurso);

      const resultado = await this.despachar(enCurso);
      const clasificacion = clasificarResultado(resultado);

      if (clasificacion === "confirmada") {
        this.scopeBackoff.delete(scopeKey);
        const recibo = resultado.ok && "data" in resultado ? (resultado.data as any) : undefined;

        if (recibo && typeof recibo === "object" && "actionId" in recibo && "efectos" in recibo) {
          await this.repository.confirmar(enCurso, recibo);
        } else {
          await this.repository.eliminar(enCurso.actionId);
        }

        for (const listener of this.listenersConfirmacion) {
          listener(enCurso, recibo);
        }

        // Lectura actualizada tras cada recibo: continuar al siguiente en FIFO
        continue;
      }

      if (clasificacion === "transitoria") {
        const intentos = (enCurso.intentos ?? 0) + 1;

        if (intentos >= MAX_REINTENTOS) {
          // Máximo de reintentos alcanzado: conservar propuesta/cola y dependientes bloqueados
          const errorMsg =
            "Se alcanzó el máximo de 5 reintentos automáticos. Conservado en cola; reanude o reconcilie cuando la conexión esté disponible.";
          const bloqueadaPorMax: OperacionEditor = {
            ...enCurso,
            estado: "bloqueada",
            intentos: MAX_REINTENTOS,
            reconciliacionRequerida: true,
            ultimoError: errorMsg,
          };
          await this.repository.actualizar(bloqueadaPorMax);
          this.notificarEstado(bloqueadaPorMax);

          // Bloquear dependientes
          for (const op of operaciones) {
            const deps = op.dependsOn ?? op.dependencias ?? [];
            if (deps.includes(bloqueadaPorMax.actionId)) {
              const opBloqueada: OperacionEditor = {
                ...op,
                estado: "bloqueada",
                ultimoError: `Bloqueada por agotamiento de reintentos en predecesora ${bloqueadaPorMax.actionId}.`,
              };
              await this.repository.actualizar(opBloqueada);
              this.notificarEstado(opBloqueada);
            }
          }

          for (const listener of this.listenersRechazo) {
            listener(bloqueadaPorMax, errorMsg);
          }

          // Continuar para permitir independientes
          continue;
        }

        const retryAfterSec =
          (resultado as any)?.retryAfterSec ?? (resultado as any)?.retryAfter;
        const delay = demoraReintentoMs(intentos, retryAfterSec);
        const proximoIntento = Date.now() + delay;
        const ultimoError =
          (resultado.ok ? undefined : resultado.errors?.[0]) ??
          "Error temporal de conectividad o servidor.";

        const opReintento: OperacionEditor = {
          ...enCurso,
          estado: "pendiente",
          intentos,
          proximoIntento,
          ultimoError,
        };
        await this.repository.actualizar(opReintento);
        this.notificarEstado(opReintento);

        this.scopeBackoff.set(scopeKey, proximoIntento);

        const timer = setTimeout(() => {
          this.timers.delete(timer);
          this.scopeBackoff.delete(scopeKey);
          this.despertar();
        }, delay);
        this.timers.add(timer);

        // Pausar este ámbito mientras dura el backoff
        break;
      }

      // Fallo definitivo (400, 401, 403, 404, 409, 422, etc.): rechazar y bloquear descendientes
      const esConflicto409 = !resultado.ok && resultado.statusCode === 409;
      const errorMsg =
        (resultado.ok ? undefined : resultado.errors?.[0]) ??
        (esConflicto409
          ? "Conflicto 409 definitivo: la operación entra en conflicto con el estado del servidor."
          : "La operación fue rechazada definitivamente por el servidor.");

      const rechazada: OperacionEditor = {
        ...enCurso,
        estado: "rechazada",
        errorDefinitivo: true,
        reconciliacionRequerida: true,
        ultimoError: errorMsg,
      };

      await this.repository.actualizar(rechazada);
      this.notificarEstado(rechazada);

      // Bloquear operaciones en la cola que dependan de esta
      const idsBloqueados = new Set<string>([rechazada.actionId]);
      for (const op of operaciones) {
        if (op.actionId === rechazada.actionId) continue;
        const deps = op.dependsOn ?? op.dependencias ?? [];
        if (deps.some((depId) => idsBloqueados.has(depId))) {
          idsBloqueados.add(op.actionId);
          const opBloqueada: OperacionEditor = {
            ...op,
            estado: "bloqueada",
            ultimoError: `Bloqueada por rechazo en predecesora ${rechazada.actionId}.`,
          };
          await this.repository.actualizar(opBloqueada);
          this.notificarEstado(opBloqueada);
        }
      }

      for (const listener of this.listenersRechazo) {
        listener(rechazada, errorMsg);
      }

      // Continuar para permitir independientes
      continue;
    }
  }

  async reanudarOperacion(actionId: string): Promise<void> {
    const op = await this.repository.obtener(actionId);
    if (!op) return;

    const reactivada: OperacionEditor = {
      ...op,
      estado: "pendiente",
      intentos: 0,
      proximoIntento: undefined,
      errorDefinitivo: false,
      reconciliacionRequerida: false,
      ultimoError: undefined,
    };
    await this.repository.actualizar(reactivada);

    // Desbloquear también dependientes que estaban bloqueadas por esta
    const enScope = await this.repository.listar(op.scopeKey);
    for (const item of enScope) {
      if (item.estado === "bloqueada") {
        const deps = item.dependsOn ?? item.dependencias ?? [];
        if (deps.includes(actionId)) {
          await this.repository.actualizar({
            ...item,
            estado: "pendiente",
            errorDefinitivo: false,
            reconciliacionRequerida: false,
            ultimoError: undefined,
          });
        }
      }
    }

    this.scopeBackoff.delete(op.scopeKey);
    this.despertar();
  }

  async descartarOperacion(actionId: string): Promise<void> {
    const op = await this.repository.obtener(actionId);
    if (!op) return;

    await this.repository.eliminar(actionId);
    this.scopeBackoff.delete(op.scopeKey);
    this.despertar();
  }

  async reintentarScope(scopeKey: string): Promise<void> {
    const ops = await this.repository.listar(scopeKey);
    for (const op of ops) {
      if (op.estado === "bloqueada" || op.estado === "rechazada" || (op.intentos ?? 0) > 0) {
        await this.repository.actualizar({
          ...op,
          estado: "pendiente",
          intentos: 0,
          proximoIntento: undefined,
          errorDefinitivo: false,
          reconciliacionRequerida: false,
          ultimoError: undefined,
        });
      }
    }
    this.scopeBackoff.delete(scopeKey);
    this.despertar();
  }
}

export const coordinadorColaEditor = new CoordinadorColaEditor();
