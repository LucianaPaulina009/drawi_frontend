import { openDB, type DBSchema } from "idb";

import type { ConfirmacionOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import {
  esScopeValido,
  parsearScopeEditor,
  type EstadoOperacionEditor,
  type InstantaneaEditor,
  type OperacionEditor,
} from "../../domain/entities/operacion-editor.entity";
import type { ColaEditorRepository } from "../../domain/repositories/cola-editor.repository";

interface EditorDb extends DBSchema {
  operaciones: {
    key: string;
    value: OperacionEditor;
    indexes: {
      "por-scope": string;
      "por-scope-fecha": [string, number];
      "por-scope-secuencia": [string, number];
      "por-usuario": string;
    };
  };
  instantaneas: {
    key: string;
    value: InstantaneaEditor;
  };
  recibos: {
    key: string;
    value: ConfirmacionOperacionDiagrama;
    indexes: {
      "por-diagrama": string;
    };
  };
}

const DB_NAME = "drawi-editor";
const DB_VERSION = 2;

const MAPA_EVENTOS_LEGACY: Record<string, string> = {
  crearClase: "CREAR_CLASE",
  actualizarClase: "ACTUALIZAR_CLASE",
  eliminarClase: "ELIMINAR_CLASE",
  crearAtributo: "CREAR_ATRIBUTO",
  actualizarAtributo: "ACTUALIZAR_ATRIBUTO",
  eliminarAtributo: "ELIMINAR_ATRIBUTO",
  crearRelacion: "CREAR_RELACION",
  actualizarRelacion: "RENOMBRAR_RELACION",
  eliminarRelacion: "ELIMINAR_RELACION",
  crearEstructuraNm: "CREAR_ESTRUCTURA_NM",
  eliminarEstructuraNm: "ELIMINAR_ESTRUCTURA_NM",
};

const EVENTOS_VALIDOS_016 = new Set([
  "CREAR_CLASE",
  "ACTUALIZAR_CLASE",
  "ELIMINAR_CLASE",
  "CREAR_ATRIBUTO",
  "ACTUALIZAR_ATRIBUTO",
  "ELIMINAR_ATRIBUTO",
  "CREAR_RELACION",
  "RENOMBRAR_RELACION",
  "ELIMINAR_RELACION",
  "CREAR_ESTRUCTURA_NM",
  "ELIMINAR_ESTRUCTURA_NM",
]);

export function adaptarOperacionCola(op: any): OperacionEditor {
  if (!op || typeof op !== "object") {
    throw new Error("Operación inválida en cola");
  }

  // Sanitización estricta: nunca persistir tokens ni credenciales
  const opLimpia = { ...op };
  delete opLimpia.token;
  delete opLimpia.jwt;
  delete opLimpia.authorization;
  if (opLimpia.payload && typeof opLimpia.payload === "object") {
    const payloadLimpio = { ...opLimpia.payload };
    delete payloadLimpio.token;
    delete payloadLimpio.jwt;
    delete payloadLimpio.authorization;
    opLimpia.payload = payloadLimpio;
  }

  const scopeKey = typeof opLimpia.scopeKey === "string" ? opLimpia.scopeKey : "";
  const { usuarioId: userFromScope, diagramaId: diagFromScope } = parsearScopeEditor(scopeKey);

  const usuarioId = opLimpia.usuarioId ?? opLimpia.userId ?? userFromScope ?? "";
  const idDiagrama = opLimpia.idDiagrama ?? opLimpia.diagramId ?? diagFromScope ?? "";
  const idProyecto = opLimpia.idProyecto ?? opLimpia.projectId ?? "";

  const dependsOn = Array.isArray(opLimpia.dependsOn)
    ? opLimpia.dependsOn
    : Array.isArray(opLimpia.dependencias)
      ? opLimpia.dependencias
      : [];

  let estado: EstadoOperacionEditor = opLimpia.estado ?? "pendiente";
  if (estado === "en_progreso" || estado === "enviando") {
    // Invariante: recuperar enviando como pendiente tras interrupción, manteniendo identidad y payload
    estado = "pendiente";
  }

  let tipo = String(opLimpia.tipo ?? "");
  let reconciliacionRequerida = Boolean(opLimpia.reconciliacionRequerida);
  let errorDefinitivo = Boolean(opLimpia.errorDefinitivo);
  let ultimoError = opLimpia.ultimoError;

  if (MAPA_EVENTOS_LEGACY[tipo]) {
    tipo = MAPA_EVENTOS_LEGACY[tipo];
  } else if (!EVENTOS_VALIDOS_016.has(tipo)) {
    // Comando no reconocido: conservar para reconciliación, no descartar
    reconciliacionRequerida = true;
    errorDefinitivo = true;
    estado = "bloqueada";
    ultimoError = ultimoError ?? `Comando no reconocido: ${tipo}. Conservado para reconciliación.`;
  }

  const actionIdOriginal =
    typeof opLimpia.actionId === "string" ? opLimpia.actionId.trim() : "";
  const creadaEn = typeof opLimpia.creadaEn === "number" ? opLimpia.creadaEn : Date.now();
  const secuencia = typeof opLimpia.secuencia === "number" ? opLimpia.secuencia : creadaEn;
  const version = typeof opLimpia.version === "number" ? opLimpia.version : 1;
  const intentos = typeof opLimpia.intentos === "number" ? opLimpia.intentos : 0;

  // Las operaciones históricas sin actionId no pueden recuperarse de forma
  // segura. Se conserva una clave determinista únicamente para poder
  // bloquearlas y mostrarlas en reconciliación; nunca se inventa una
  // identidad UUID de recurso ni se modifica el payload original.
  const actionId = actionIdOriginal ||
    `invalid-action:${scopeKey || "sin-scope"}:${String(opLimpia.secuencia ?? opLimpia.creadaEn ?? "sin-secuencia")}:${tipo}`;
  if (!actionIdOriginal) {
    reconciliacionRequerida = true;
    errorDefinitivo = true;
    estado = "bloqueada";
    ultimoError = ultimoError ??
      "Operación sin actionId definitivo; requiere reconciliación manual antes de reintentar.";
  }

  return {
    actionId,
    scopeKey,
    usuarioId,
    userId: usuarioId,
    idDiagrama,
    diagramId: idDiagrama,
    idProyecto,
    projectId: idProyecto,
    secuencia,
    tipo,
    payload: opLimpia.payload ?? {},
    dependsOn,
    dependencias: dependsOn,
    grupoAtomico: opLimpia.grupoAtomico,
    estado,
    intentos,
    proximoIntento: opLimpia.proximoIntento,
    creadaEn,
    version,
    ultimoError,
    errorDefinitivo,
    reconciliacionRequerida,
  };
}

export function esReciboValido(obj: unknown): obj is ConfirmacionOperacionDiagrama {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, any>;
  return (
    typeof r.actionId === "string" &&
    r.actionId.trim().length > 0 &&
    typeof r.efectos === "object" &&
    r.efectos !== null &&
    Array.isArray(r.efectos.clasesActualizadas) &&
    Array.isArray(r.efectos.clasesEliminadas) &&
    Array.isArray(r.efectos.relacionesActualizadas) &&
    Array.isArray(r.efectos.relacionesEliminadas) &&
    Array.isArray(r.efectos.estructurasNmActualizadas) &&
    Array.isArray(r.efectos.estructurasNmEliminadas)
  );
}

function esRecibo(obj: unknown): obj is ConfirmacionOperacionDiagrama {
  return esReciboValido(obj);
}

function esInstantanea(obj: unknown): obj is InstantaneaEditor {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "detalleConfirmado" in obj &&
    typeof (obj as any).detalleConfirmado === "object" &&
    (obj as any).detalleConfirmado !== null
  );
}

async function abrirDb() {
  return openDB<EditorDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const operaciones = db.createObjectStore("operaciones", { keyPath: "actionId" });
        operaciones.createIndex("por-scope", "scopeKey");
        operaciones.createIndex("por-scope-fecha", ["scopeKey", "creadaEn"]);
        operaciones.createIndex("por-scope-secuencia", ["scopeKey", "secuencia"]);
        operaciones.createIndex("por-usuario", "usuarioId");
        db.createObjectStore("instantaneas", { keyPath: "scopeKey" });
      } else {
        const operaciones = transaction.objectStore("operaciones");
        if (!operaciones.indexNames.contains("por-scope-secuencia")) {
          operaciones.createIndex("por-scope-secuencia", ["scopeKey", "secuencia"]);
        }
        if (!operaciones.indexNames.contains("por-usuario")) {
          operaciones.createIndex("por-usuario", "usuarioId");
        }
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("recibos")) {
          const recibos = db.createObjectStore("recibos", { keyPath: "actionId" });
          recibos.createIndex("por-diagrama", "idDiagrama");
        }
      }
    },
  });
}

export class ColaEditorIndexedDbRepository implements ColaEditorRepository {
  async listar(scopeKey: string): Promise<OperacionEditor[]> {
    const db = await abrirDb();
    const ops = await db.getAllFromIndex(
      "operaciones",
      "por-scope",
      scopeKey,
    );

    return ops
      .map(adaptarOperacionCola)
      .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0) || a.creadaEn - b.creadaEn);
  }

  async listarScopesPorUsuario(usuarioId: string): Promise<string[]> {
    if (!usuarioId || usuarioId === "sesion") return [];
    const db = await abrirDb();
    const todas = await db.getAll("operaciones");
    const scopes = new Set<string>();

    for (const op of todas) {
      const adaptada = adaptarOperacionCola(op);
      if (
        adaptada.usuarioId === usuarioId ||
        adaptada.userId === usuarioId ||
        adaptada.scopeKey.startsWith(`${usuarioId}:`)
      ) {
        if (esScopeValido(adaptada.scopeKey)) {
          scopes.add(adaptada.scopeKey);
        }
      }
    }

    return Array.from(scopes);
  }

  async obtener(actionId: string): Promise<OperacionEditor | undefined> {
    const db = await abrirDb();
    const op = await db.get("operaciones", actionId);
    return op ? adaptarOperacionCola(op) : undefined;
  }

  async guardar(operacion: OperacionEditor): Promise<void> {
    const db = await abrirDb();
    let opAdaptada = adaptarOperacionCola(operacion);

    if (!opAdaptada.secuencia || opAdaptada.secuencia <= 0) {
      const existentes = await this.listar(opAdaptada.scopeKey);
      const maxSecuencia = existentes.reduce((max, item) => Math.max(max, item.secuencia ?? 0), 0);
      opAdaptada = { ...opAdaptada, secuencia: maxSecuencia + 1 };
    }

    await db.put("operaciones", opAdaptada);
  }

  async guardarLote(operaciones: OperacionEditor[]): Promise<void> {
    const db = await abrirDb();
    const tx = db.transaction("operaciones", "readwrite");
    for (const op of operaciones) {
      const opAdaptada = adaptarOperacionCola(op);
      await tx.store.put(opAdaptada);
    }
    await tx.done;
  }

  async actualizar(operacion: OperacionEditor): Promise<void> {
    const opAdaptada = adaptarOperacionCola(operacion);
    const db = await abrirDb();
    await db.put("operaciones", opAdaptada);
  }

  async confirmar(
    operacion: OperacionEditor,
    reciboOInstantanea: ConfirmacionOperacionDiagrama | InstantaneaEditor,
    instantanea?: InstantaneaEditor,
  ): Promise<void> {
    const db = await abrirDb();
    let reciboParaGuardar: ConfirmacionOperacionDiagrama | undefined;
    let instantaneaParaGuardar: InstantaneaEditor | undefined;

    if (esRecibo(reciboOInstantanea)) {
      reciboParaGuardar = reciboOInstantanea;
      instantaneaParaGuardar = instantanea;
    } else if (esInstantanea(reciboOInstantanea)) {
      instantaneaParaGuardar = reciboOInstantanea;
      if (instantanea && esRecibo(instantanea)) {
        reciboParaGuardar = instantanea;
      }
    } else {
      throw new Error("Recibo o instantánea inválido para confirmar la operación.");
    }

    const tx = db.transaction(["operaciones", "instantaneas", "recibos"], "readwrite");
    if (instantaneaParaGuardar) {
      await tx.objectStore("instantaneas").put(instantaneaParaGuardar);
    }
    if (reciboParaGuardar) {
      await tx.objectStore("recibos").put(reciboParaGuardar);
    }
    await tx.objectStore("operaciones").delete(operacion.actionId);
    await tx.done;
  }

  async obtenerRecibo(actionId: string): Promise<ConfirmacionOperacionDiagrama | undefined> {
    const db = await abrirDb();
    return db.get("recibos", actionId);
  }

  async guardarInstantanea(instantanea: InstantaneaEditor): Promise<void> {
    const db = await abrirDb();
    await db.put("instantaneas", instantanea);
  }

  async obtenerInstantanea(scopeKey: string): Promise<InstantaneaEditor | undefined> {
    const db = await abrirDb();
    return db.get("instantaneas", scopeKey);
  }

  async eliminarInstantanea(scopeKey: string): Promise<void> {
    const db = await abrirDb();
    await db.delete("instantaneas", scopeKey);
  }

  async eliminar(actionId: string): Promise<void> {
    const db = await abrirDb();
    await db.delete("operaciones", actionId);
  }

  async limpiarScope(scopeKey: string): Promise<void> {
    const db = await abrirDb();
    const ops = await db.getAllFromIndex("operaciones", "por-scope", scopeKey);
    const tx = db.transaction("operaciones", "readwrite");
    for (const op of ops) {
      await tx.store.delete(op.actionId);
    }
    await tx.done;
  }
}
