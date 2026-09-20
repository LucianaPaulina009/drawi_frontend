import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import type { ColaEditorRepository } from "../../domain/repositories/cola-editor.repository";
import { CoordinadorColaEditor } from "./coordinador-cola-editor";

class MockColaRepository implements ColaEditorRepository {
  public operaciones: Map<string, OperacionEditor> = new Map();
  public recibos: Map<string, ConfirmacionOperacionDiagrama> = new Map();

  async listar(scopeKey: string): Promise<OperacionEditor[]> {
    return Array.from(this.operaciones.values())
      .filter((op) => op.scopeKey === scopeKey)
      .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0) || a.creadaEn - b.creadaEn);
  }

  async listarScopesPorUsuario(usuarioId: string): Promise<string[]> {
    const scopes = new Set<string>();
    for (const op of this.operaciones.values()) {
      if (op.usuarioId === usuarioId || op.scopeKey.startsWith(`${usuarioId}:`)) {
        scopes.add(op.scopeKey);
      }
    }
    return Array.from(scopes);
  }

  async obtener(actionId: string): Promise<OperacionEditor | undefined> {
    return this.operaciones.get(actionId);
  }

  async guardar(operacion: OperacionEditor): Promise<void> {
    this.operaciones.set(operacion.actionId, { ...operacion });
  }

  async guardarLote(operaciones: OperacionEditor[]): Promise<void> {
    for (const op of operaciones) {
      this.operaciones.set(op.actionId, { ...op });
    }
  }

  async actualizar(operacion: OperacionEditor): Promise<void> {
    this.operaciones.set(operacion.actionId, { ...operacion });
  }

  async confirmar(
    operacion: OperacionEditor,
    recibo: ConfirmacionOperacionDiagrama
  ): Promise<void> {
    this.recibos.set(operacion.actionId, recibo);
    this.operaciones.delete(operacion.actionId);
  }

  async obtenerRecibo(actionId: string): Promise<ConfirmacionOperacionDiagrama | undefined> {
    return this.recibos.get(actionId);
  }

  async guardarInstantanea(): Promise<void> {}
  async obtenerInstantanea(): Promise<undefined> {
    return undefined;
  }
  async eliminarInstantanea(): Promise<void> {}
  async eliminar(actionId: string): Promise<void> {
    this.operaciones.delete(actionId);
  }
  async limpiarScope(scopeKey: string): Promise<void> {
    for (const [id, op] of this.operaciones.entries()) {
      if (op.scopeKey === scopeKey) {
        this.operaciones.delete(id);
      }
    }
  }
}

describe("CoordinadorColaEditor", () => {
  let repo: MockColaRepository;

  beforeEach(() => {
    repo = new MockColaRepository();
    vi.useFakeTimers();
  });

  it("cuenta operaciones pendientes de todos los diagramas del usuario, no solo del ámbito visible", async () => {
    await repo.guardar({
      actionId: "op-a",
      scopeKey: "userA:diag-A",
      usuarioId: "userA",
      idDiagrama: "diag-A",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "clase-a" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1,
    });
    await repo.guardar({
      actionId: "op-b",
      scopeKey: "userA:diag-B",
      usuarioId: "userA",
      idDiagrama: "diag-B",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "clase-b" },
      dependsOn: [],
      estado: "bloqueada",
      intentos: 0,
      creadaEn: 2,
    });
    await repo.guardar({
      actionId: "op-otro-usuario",
      scopeKey: "userB:diag-C",
      usuarioId: "userB",
      idDiagrama: "diag-C",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "clase-c" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 3,
    });

    const coordinador = new CoordinadorColaEditor({ repository: repo });
    await expect(coordinador.contarPendientesUsuario("userA")).resolves.toBe(2);
    await expect(coordinador.contarPendientesUsuario("userB")).resolves.toBe(1);
  });

  it("procesa operaciones en estricto orden FIFO dentro de un scope", async () => {
    const ejecuciones: string[] = [];
    const mockDespachar = vi.fn().mockImplementation(async (op: OperacionEditor) => {
      ejecuciones.push(op.actionId);
      return {
        ok: true,
        data: {
          actionId: op.actionId,
          idDiagrama: "diag-1",
          tipo: "CREAR_CLASE",
          efectos: {
            clasesActualizadas: [],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        } as ConfirmacionOperacionDiagrama,
      };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    await repo.guardar({
      actionId: "op-1",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    await repo.guardar({
      actionId: "op-2",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 2,
      tipo: "CREAR_ATRIBUTO",
      payload: {},
      dependsOn: ["op-1"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");

    await coordinador.procesar();

    expect(ejecuciones).toEqual(["op-1", "op-2"]);
    expect(repo.operaciones.size).toBe(0);
    expect(repo.recibos.has("op-1")).toBe(true);
    expect(repo.recibos.has("op-2")).toBe(true);
  });

  it("salta ámbitos en espera por backoff temporal y procesa otros scopes listos", async () => {
    const ejecuciones: string[] = [];
    const mockDespachar = vi.fn().mockImplementation(async (op: OperacionEditor) => {
      ejecuciones.push(op.actionId);
      return {
        ok: true,
        data: {
          actionId: op.actionId,
          idDiagrama: op.idDiagrama ?? "diag",
          tipo: "CREAR_CLASE",
          efectos: {
            clasesActualizadas: [],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        } as ConfirmacionOperacionDiagrama,
      };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    // Scope 1: en espera hasta dentro de 10 segundos
    await repo.guardar({
      actionId: "op-bloqueada-temporal",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 1,
      proximoIntento: Date.now() + 10000,
      creadaEn: 1000,
    });

    // Scope 2: listo de inmediato
    await repo.guardar({
      actionId: "op-inmediata",
      scopeKey: "userA:diag-2",
      usuarioId: "userA",
      idDiagrama: "diag-2",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");
    coordinador.registrarScope("userA:diag-2");

    await coordinador.procesar();

    // Solo se procesó la del scope 2, la de scope 1 fue saltada
    expect(ejecuciones).toEqual(["op-inmediata"]);
    expect(repo.operaciones.has("op-bloqueada-temporal")).toBe(true);
    expect(repo.operaciones.has("op-inmediata")).toBe(false);
  });

  it("no procesa scopes de otra cuenta de usuario", async () => {
    const ejecuciones: string[] = [];
    const mockDespachar = vi.fn().mockImplementation(async (op: OperacionEditor) => {
      ejecuciones.push(op.actionId);
      return { ok: true, data: { actionId: op.actionId } as any };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    await repo.guardar({
      actionId: "op-userB",
      scopeKey: "userB:diag-9",
      usuarioId: "userB",
      idDiagrama: "diag-9",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    coordinador.establecerUsuario("userA");
    await coordinador.procesar();

    expect(ejecuciones).toEqual([]);
    expect(repo.operaciones.has("op-userB")).toBe(true);
  });

  it("detener limpia timers y conserva los comandos en disco", async () => {
    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: vi.fn(),
    });

    await repo.guardar({
      actionId: "op-conservada",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.iniciar();
    coordinador.detener();

    // Comandos en disco se preservan
    expect(repo.operaciones.has("op-conservada")).toBe(true);
  });

  it("rechazar una operación bloquea descendientes directos y transitivos pero permite procesar independientes", async () => {
    const ejecuciones: string[] = [];
    const mockDespachar = vi.fn().mockImplementation(async (op: OperacionEditor) => {
      ejecuciones.push(op.actionId);
      if (op.actionId === "op-padre-fallida") {
        return {
          ok: false,
          statusCode: 400,
          errors: ["Nombre de clase inválido."],
        };
      }
      return {
        ok: true,
        data: {
          actionId: op.actionId,
          idDiagrama: "diag-1",
          tipo: op.tipo,
          efectos: {
            clasesActualizadas: [],
            clasesEliminadas: [],
            relacionesActualizadas: [],
            relacionesEliminadas: [],
            estructurasNmActualizadas: [],
            estructurasNmEliminadas: [],
          },
        } as ConfirmacionOperacionDiagrama,
      };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    // 1. Predecesora que fallará definitivamente (400)
    await repo.guardar({
      actionId: "op-padre-fallida",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    // 2. Descendiente directa (depende de op-padre-fallida)
    await repo.guardar({
      actionId: "op-hijo-dependiente",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 2,
      tipo: "CREAR_ATRIBUTO",
      payload: {},
      dependsOn: ["op-padre-fallida"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
    });

    // 3. Descendiente transitiva (depende de op-hijo-dependiente)
    await repo.guardar({
      actionId: "op-nieto-transitivo",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 3,
      tipo: "ACTUALIZAR_ATRIBUTO",
      payload: {},
      dependsOn: ["op-hijo-dependiente"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 3000,
    });

    // 4. Operación independiente (otra clase)
    await repo.guardar({
      actionId: "op-independiente",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 4,
      tipo: "CREAR_CLASE",
      payload: { nombre: "OtraClase" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 4000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");

    await coordinador.procesar();

    // Se despachó la fallida y la independiente; los descendientes NUNCA se despacharon
    expect(ejecuciones).toEqual(["op-padre-fallida", "op-independiente"]);

    const opPadre = await repo.obtener("op-padre-fallida");
    expect(opPadre?.estado).toBe("rechazada");
    expect(opPadre?.errorDefinitivo).toBe(true);

    const opHijo = await repo.obtener("op-hijo-dependiente");
    expect(opHijo?.estado).toBe("bloqueada");
    expect(opHijo?.ultimoError).toContain("Bloqueada por rechazo");

    const opNieto = await repo.obtener("op-nieto-transitivo");
    expect(opNieto?.estado).toBe("bloqueada");

    const opIndep = await repo.obtener("op-independiente");
    // op-independiente fue confirmada y retirada
    expect(opIndep).toBeUndefined();
    expect(repo.recibos.has("op-independiente")).toBe(true);
  });

  it("máximo de 5 reintentos acotados conserva la operación y bloquea dependientes sin rollback", async () => {
    let intentosDespacho = 0;
    const mockDespachar = vi.fn().mockImplementation(async () => {
      intentosDespacho++;
      return {
        ok: false,
        statusCode: 503,
        errors: ["Servicio no disponible temporalmente"],
      };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    // Simular operación que ya lleva 4 intentos
    await repo.guardar({
      actionId: "op-al-limite",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 4,
      creadaEn: 1000,
    });

    await repo.guardar({
      actionId: "op-dep-limite",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 2,
      tipo: "CREAR_ATRIBUTO",
      payload: {},
      dependsOn: ["op-al-limite"],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");

    await coordinador.procesar();

    expect(intentosDespacho).toBe(1);

    const opLimite = await repo.obtener("op-al-limite");
    expect(opLimite?.estado).toBe("bloqueada");
    expect(opLimite?.intentos).toBe(5);
    expect(opLimite?.reconciliacionRequerida).toBe(true);
    expect(opLimite?.ultimoError).toContain("máximo de 5 reintentos");

    const opDep = await repo.obtener("op-dep-limite");
    expect(opDep?.estado).toBe("bloqueada");
  });

  it("trata 409 Conflict como fallo definitivo y no entra en bucle de reintento", async () => {
    let intentosDespacho = 0;
    const mockDespachar = vi.fn().mockImplementation(async () => {
      intentosDespacho++;
      return {
        ok: false,
        statusCode: 409,
        errors: ["Conflicto de concurrencia o huella alterada."],
      };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    await repo.guardar({
      actionId: "op-conflicto-409",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");

    await coordinador.procesar();

    // Solo se intentó 1 vez, nunca bucle de reintentos
    expect(intentosDespacho).toBe(1);

    const op = await repo.obtener("op-conflicto-409");
    expect(op?.estado).toBe("rechazada");
    expect(op?.errorDefinitivo).toBe(true);
    expect(op?.reconciliacionRequerida).toBe(true);
  });

  it("reanudarOperacion reactiva una operación bloqueada y sus dependientes", async () => {
    let despachoExitoso = false;
    const mockDespachar = vi.fn().mockImplementation(async (op: OperacionEditor) => {
      if (despachoExitoso) {
        return {
          ok: true,
          data: {
            actionId: op.actionId,
            idDiagrama: "diag-1",
            tipo: op.tipo,
            efectos: {
              clasesActualizadas: [],
              clasesEliminadas: [],
              relacionesActualizadas: [],
              relacionesEliminadas: [],
              estructurasNmActualizadas: [],
              estructurasNmEliminadas: [],
            },
          } as ConfirmacionOperacionDiagrama,
        };
      }
      return { ok: false, statusCode: 503, errors: ["Error"] };
    });

    const coordinador = new CoordinadorColaEditor({
      repository: repo,
      despachar: mockDespachar,
    });

    await repo.guardar({
      actionId: "op-pausada",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "bloqueada",
      intentos: 5,
      reconciliacionRequerida: true,
      creadaEn: 1000,
    });

    await repo.guardar({
      actionId: "op-dep-pausada",
      scopeKey: "userA:diag-1",
      usuarioId: "userA",
      idDiagrama: "diag-1",
      secuencia: 2,
      tipo: "CREAR_ATRIBUTO",
      payload: {},
      dependsOn: ["op-pausada"],
      estado: "bloqueada",
      intentos: 0,
      creadaEn: 2000,
    });

    coordinador.establecerUsuario("userA");
    coordinador.registrarScope("userA:diag-1");

    // Reanudar la operación
    despachoExitoso = true;
    await coordinador.reanudarOperacion("op-pausada");
    await coordinador.procesar();

    // Ambas operaciones fueron reactivadas y completadas con éxito
    expect(repo.operaciones.size).toBe(0);
    expect(repo.recibos.has("op-pausada")).toBe(true);
    expect(repo.recibos.has("op-dep-pausada")).toBe(true);
  });
});
