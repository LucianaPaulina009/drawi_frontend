import { describe, expect, it } from "vitest";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import { adaptarOperacionCola, ColaEditorIndexedDbRepository } from "./cola-editor-indexeddb.repository";

describe("ColaEditorIndexedDbRepository", () => {
  it("bloquea operaciones sin actionId sin inventar un UUID", () => {
    const adaptada = adaptarOperacionCola({
      scopeKey: "u:diag",
      tipo: "CREAR_CLASE",
      payload: { nombre: "Incompleta" },
      dependsOn: [],
      estado: "pendiente",
      creadaEn: 11,
    });

    expect(adaptada.actionId).toBe("invalid-action:u:diag:11:CREAR_CLASE");
    expect(adaptada.estado).toBe("bloqueada");
    expect(adaptada.reconciliacionRequerida).toBe(true);
    expect(adaptada.errorDefinitivo).toBe(true);
  });

  it("mantiene FIFO por ámbito y retira solo tras confirmar la instantánea", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const base = { scopeKey: "u:d", tipo: "actualizarClase", payload: {}, dependsOn: [], estado: "pendiente" as const, intentos: 0 };
    const primera = { ...base, actionId: "a", creadaEn: 1 };
    const segunda = { ...base, actionId: "b", creadaEn: 2 };
    await repo.guardar(segunda);
    await repo.guardar(primera);
    expect((await repo.listar("u:d")).map((operacion) => operacion.actionId)).toEqual(["a", "b"]);
    await repo.confirmar(primera, {
      scopeKey: "u:d",
      detalleConfirmado: { id: "d", idProyecto: "p", nombre: "P", numero: 1, clases: [], relaciones: [], estructurasNm: [] },
      version: 1,
    });
    expect((await repo.listar("u:d")).map((operacion) => operacion.actionId)).toEqual(["b"]);
  });

  it("adapta comandos legacy 015 a eventos 016 manteniendo actionId y payload intactos", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-1:diag-1";
    await repo.guardar({
      actionId: "cmd-legacy-1",
      scopeKey,
      secuencia: 1,
      tipo: "crearClase",
      payload: { nombre: "Factura", posicion_x: 100, posicion_y: 200 },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 1000,
      version: 1,
    });

    const ops = await repo.listar(scopeKey);
    const op = ops.find((item) => item.actionId === "cmd-legacy-1");
    expect(op).toBeDefined();
    expect(op?.tipo).toBe("CREAR_CLASE");
    expect(op?.actionId).toBe("cmd-legacy-1");
    expect(op?.payload).toEqual({ nombre: "Factura", posicion_x: 100, posicion_y: 200 });
    expect(op?.usuarioId).toBe("user-1");
    expect(op?.idDiagrama).toBe("diag-1");
  });

  it("conserva comandos desconocidos marcados para reconciliación sin descartarlos", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-2:diag-2";
    await repo.guardar({
      actionId: "cmd-desconocido",
      scopeKey,
      secuencia: 1,
      tipo: "EVENTO_FUTURO_DESCONOCIDO",
      payload: { foo: "bar" },
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 2000,
      version: 1,
    });

    const ops = await repo.listar(scopeKey);
    const op = ops.find((item) => item.actionId === "cmd-desconocido");
    expect(op).toBeDefined();
    expect(op?.reconciliacionRequerida).toBe(true);
    expect(op?.errorDefinitivo).toBe(true);
    expect(op?.estado).toBe("bloqueada");
    expect(op?.ultimoError).toContain("Comando no reconocido");
  });

  it("sanitiza y nunca persiste tokens o JWTs en operaciones ni payloads", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-3:diag-3";
    const opConJwt = {
      actionId: "cmd-con-token",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { nombre: "Segura", token: "bearer-secret-token", jwt: "eyJhbG..." },
      token: "secret-outer-jwt",
      jwt: "outer-jwt",
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 3000,
      version: 1,
    };

    await repo.guardar(opConJwt as any);
    const recuperada = await repo.obtener("cmd-con-token");
    expect(recuperada).toBeDefined();
    expect((recuperada as any).token).toBeUndefined();
    expect((recuperada as any).jwt).toBeUndefined();
    expect((recuperada?.payload as any).token).toBeUndefined();
    expect((recuperada?.payload as any).jwt).toBeUndefined();
  });

  it("recupera estado 'enviando' o 'en_progreso' como 'pendiente' tras interrupción", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-4:diag-4";
    await repo.guardar({
      actionId: "cmd-interrumpido",
      scopeKey,
      secuencia: 1,
      tipo: "ACTUALIZAR_CLASE",
      payload: { id_clase: "c-1", nombre: "EnVuelo" },
      dependsOn: [],
      estado: "enviando" as const,
      intentos: 1,
      creadaEn: 4000,
      version: 1,
    });

    const ops = await repo.listar(scopeKey);
    const op = ops.find((item) => item.actionId === "cmd-interrumpido");
    expect(op?.estado).toBe("pendiente");
    expect(op?.actionId).toBe("cmd-interrumpido");
    expect(op?.payload).toEqual({ id_clase: "c-1", nombre: "EnVuelo" });
  });

  it("guarda recibo y retira operación transaccionalmente", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-5:diag-5";
    const operacion = {
      actionId: "cmd-para-confirmar",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE" as const,
      payload: { classId: "clase-1", nombre: "Tabla", posicion_x: 0, posicion_y: 0, ancho: 200 },
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 5000,
      version: 1,
    };
    await repo.guardar(operacion);

    const recibo: ConfirmacionOperacionDiagrama = {
      actionId: "cmd-para-confirmar",
      idDiagrama: "diag-5",
      tipo: "CREAR_CLASE",
      efectos: {
        clasesActualizadas: [{ id: "clase-1", idDiagrama: "diag-5", nombre: "Tabla", posicionX: 0, posicionY: 0, ancho: 200, atributos: [] }],
        clasesEliminadas: [],
        relacionesActualizadas: [],
        relacionesEliminadas: [],
        estructurasNmActualizadas: [],
        estructurasNmEliminadas: [],
      },
    };

    await repo.confirmar(operacion, recibo);

    // Operación retirada de la cola
    const ops = await repo.listar(scopeKey);
    expect(ops.some((item) => item.actionId === "cmd-para-confirmar")).toBe(false);

    // Recibo almacenado en disco
    const reciboGuardado = await repo.obtenerRecibo("cmd-para-confirmar");
    expect(reciboGuardado).toBeDefined();
    expect(reciboGuardado?.actionId).toBe("cmd-para-confirmar");
    expect(reciboGuardado?.efectos.clasesActualizadas[0].id).toBe("clase-1");
  });

  it("aísla scopes por usuario e ignora scopes provisionales de sesión compartida", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    await repo.guardar({
      actionId: "op-userA",
      scopeKey: "userA:diag-A",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 6000,
      version: 1,
    });
    await repo.guardar({
      actionId: "op-userB",
      scopeKey: "userB:diag-B",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 6001,
      version: 1,
    });
    await repo.guardar({
      actionId: "op-sesion-compartida",
      scopeKey: "sesion:diag-provisional",
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: {},
      dependsOn: [],
      estado: "pendiente",
      intentos: 0,
      creadaEn: 6002,
      version: 1,
    });

    const scopesUserA = await repo.listarScopesPorUsuario("userA");
    expect(scopesUserA).toEqual(["userA:diag-A"]);

    const scopesUserB = await repo.listarScopesPorUsuario("userB");
    expect(scopesUserB).toEqual(["userB:diag-B"]);

    const scopesSesion = await repo.listarScopesPorUsuario("sesion");
    expect(scopesSesion).toEqual([]);
  });

  it("rechaza confirmación con recibo inválido y preserva la operación en la cola", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-inv:diag-inv";
    const op = {
      actionId: "op-valida-recibo-invalido",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-inv", nombre: "Invalida" },
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 7000,
      version: 1,
    };
    await repo.guardar(op);

    // Intentar confirmar con recibo malformado / vacío
    const reciboInvalido = { actionId: "", efectos: null } as any;
    await expect(repo.confirmar(op, reciboInvalido)).rejects.toThrow(
      /Recibo o instantánea inválido/
    );

    // La operación permanece intacta en la cola para replay idempotente
    const ops = await repo.listar(scopeKey);
    expect(ops.some((item) => item.actionId === "op-valida-recibo-invalido")).toBe(true);
  });

  it("conserva la operación si ocurre una interrupción durante el retiro para permitir replay idempotente", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-abort:diag-abort";
    const op = {
      actionId: "op-abortada",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-abort", nombre: "Abort" },
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 8000,
      version: 1,
    };
    await repo.guardar(op);

    // Verificar que ante excepción previa al commit, la operación se conserva
    try {
      await repo.confirmar(op, {} as any);
    } catch {
      // Ignorar error esperado de confirmación
    }

    const enCola = await repo.obtener("op-abortada");
    expect(enCola).toBeDefined();
    expect(enCola?.actionId).toBe("op-abortada");
    expect(enCola?.payload).toEqual({ idClase: "c-abort", nombre: "Abort" });
  });

  it("permite guardar, leer y descartar la instantánea sin alterar la cola de operaciones", async () => {
    const repo = new ColaEditorIndexedDbRepository();
    const scopeKey = "user-snap:diag-snap";
    const op = {
      actionId: "op-snap-test",
      scopeKey,
      secuencia: 1,
      tipo: "CREAR_CLASE",
      payload: { idClase: "c-snap", nombre: "ConSnapshot" },
      dependsOn: [],
      estado: "pendiente" as const,
      intentos: 0,
      creadaEn: 9000,
      version: 1,
    };
    await repo.guardar(op);

    const snapshot = {
      scopeKey,
      detalleConfirmado: {
        id: "diag-snap",
        idProyecto: "p-snap",
        nombre: "Página Snap",
        numero: 1,
        clases: [],
        relaciones: [],
        estructurasNm: [],
      },
      version: 1,
    };

    await repo.guardarInstantanea(snapshot);
    const recuperada = await repo.obtenerInstantanea(scopeKey);
    expect(recuperada).toBeDefined();
    expect(recuperada?.detalleConfirmado.nombre).toBe("Página Snap");

    // Descartar la instantánea
    await repo.eliminarInstantanea(scopeKey);
    const postEliminada = await repo.obtenerInstantanea(scopeKey);
    expect(postEliminada).toBeUndefined();

    // La cola de operaciones sigue intacta en disco
    const ops = await repo.listar(scopeKey);
    expect(ops.some((item) => item.actionId === "op-snap-test")).toBe(true);
  });
});
