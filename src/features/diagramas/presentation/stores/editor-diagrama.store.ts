"use client";

import { create } from "zustand";

import type { Atributo } from "../../domain/entities/atributo.entity";
import type { Clase } from "../../domain/entities/clase.entity";
import type { DiagramaDetalle } from "../../domain/entities/diagrama.entity";
import type { EstructuraRelacionNm } from "../../domain/entities/estructura-relacion-nm.entity";
import type {
  ConfirmacionOperacionDiagrama,
  EfectosOperacionDiagrama,
} from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import type { ReferenciaFk } from "../../domain/entities/referencia-fk.entity";
import type { Relacion } from "../../domain/entities/relacion.entity";
import { adaptarOperacionCola } from "../../infrastructure/repositories/cola-editor-indexeddb.repository";

export interface DominioDiagrama {
  clases: Clase[];
  relaciones: Relacion[];
  estructurasNm: EstructuraRelacionNm[];
}

/** Mantiene una única secuencia activa, continua y basada en 1 por clase. */
export function reordenarAtributosEnSecuencia(
  atributos: Atributo[],
  idAtributo: string,
  ordenSolicitado: number
): Atributo[] {
  const ordenados = [...atributos].sort(
    (izquierdo, derecho) =>
      izquierdo.ordenDePosicion - derecho.ordenDePosicion ||
      izquierdo.id.localeCompare(derecho.id)
  );
  const indiceActual = ordenados.findIndex((atributo) => atributo.id === idAtributo);

  if (indiceActual < 0) return atributos;

  const ordenFinal = Math.max(1, Math.min(ordenados.length, Math.trunc(ordenSolicitado)));
  const [atributo] = ordenados.splice(indiceActual, 1);
  ordenados.splice(ordenFinal - 1, 0, atributo);

  return ordenados.map((atributoActivo, indice) => ({
    ...atributoActivo,
    ordenDePosicion: indice + 1,
  }));
}

export function reducirOperacion(
  dominio: DominioDiagrama,
  operacionOriginal: OperacionEditor
): DominioDiagrama {
  const op = adaptarOperacionCola(operacionOriginal);
  // Las operaciones que no conservan una identidad durable no se proyectan:
  // quedan disponibles para reconciliación sin inventar recursos nuevos.
  if (op.reconciliacionRequerida || op.estado === "bloqueada" || op.estado === "rechazada") {
    return dominio;
  }
  const p = (op.payload ?? {}) as Record<string, any>;

  let clases = [...dominio.clases];
  let relaciones = [...dominio.relaciones];
  let estructurasNm = [...dominio.estructurasNm];

  switch (op.tipo) {
    case "CREAR_CLASE": {
      const idClase = p.idClase ?? p.classId ?? p.id_clase ?? p.datos?.id;
      if (!idClase) break;
      const atributos: Atributo[] = [];

      const idAtributoInicial =
        p.idAtributoInicial ?? p.atributoInicialId ?? p.datos?.atributoInicialId;
      if (idAtributoInicial) {
        atributos.push({
          id: idAtributoInicial,
          idClase,
          nombre: p.nombreAtributoInicial ?? p.datos?.nombreAtributoInicial ?? "id",
          tipoDato: "integer",
          longitud: null,
          precision: null,
          escala: null,
          permiteNulo: false,
          esLlavePrimaria: true,
          esUnico: false,
          valorPorDefecto: null,
          ordenDePosicion: 1,
          procedencia: "sistema_clase",
        });
      }

      const nuevaClase: Clase = {
        id: idClase,
        idDiagrama: op.idDiagrama ?? op.diagramId ?? "",
        nombre: p.nombre ?? p.datos?.nombre ?? "Tabla",
        posicionX: p.posicionX ?? p.posicion_x ?? p.datos?.posicion_x ?? p.datos?.posicionX ?? 0,
        posicionY: p.posicionY ?? p.posicion_y ?? p.datos?.posicion_y ?? p.datos?.posicionY ?? 0,
        ancho: p.ancho ?? p.datos?.ancho ?? 220,
        atributos,
      };

      // Si ya existe por rebase/id, reemplazar; si no, agregar
      const idx = clases.findIndex((c) => c.id === idClase);
      if (idx >= 0) {
        clases[idx] = nuevaClase;
      } else {
        clases.push(nuevaClase);
      }
      break;
    }

    case "ACTUALIZAR_CLASE": {
      const idClase = p.idClase ?? p.id_clase ?? p.claseId ?? p.datos?.id;
      clases = clases.map((c) => {
        if (c.id !== idClase) return c;
        return {
          ...c,
          nombre: p.nombre ?? p.datos?.nombre ?? c.nombre,
          posicionX:
            p.posicionX ?? p.posicion_x ?? p.datos?.posicion_x ?? p.datos?.posicionX ?? c.posicionX,
          posicionY:
            p.posicionY ?? p.posicion_y ?? p.datos?.posicion_y ?? p.datos?.posicionY ?? c.posicionY,
          ancho: p.ancho ?? p.datos?.ancho ?? c.ancho,
        };
      });
      break;
    }

    case "ELIMINAR_CLASE": {
      const idClase = p.idClase ?? p.id_clase ?? p.claseId;
      const estructurasAfectadas = estructurasNm.filter(
        (estructura) =>
          estructura.idClaseOrigen === idClase ||
          estructura.idClaseDestino === idClase ||
          estructura.idClaseIntermedia === idClase
      );
      const idsClasesIntermedias = new Set(
        estructurasAfectadas.map((estructura) => estructura.idClaseIntermedia)
      );
      const idsRelacionesEstructurales = new Set(
        estructurasAfectadas.flatMap((estructura) => [
          estructura.idRelacionOrigen,
          estructura.idRelacionDestino,
        ])
      );

      clases = clases.filter(
        (clase) =>
          clase.id !== idClase && !idsClasesIntermedias.has(clase.id)
      );
      // Eliminar relaciones conectadas y las dos relaciones del agregado N:M.
      relaciones = relaciones.filter(
        (relacion) =>
          relacion.idClaseOrigen !== idClase &&
          relacion.idClaseDestino !== idClase &&
          !idsRelacionesEstructurales.has(relacion.id)
      );
      // Eliminar las estructuras N:M involucradas.
      estructurasNm = estructurasNm.filter(
        (estructura) => !estructurasAfectadas.some(
          (afectada) => afectada.id === estructura.id
        )
      );
      break;
    }

    case "CREAR_ATRIBUTO": {
      const idClase = p.idClase ?? p.id_clase ?? p.claseId;
      const idAtributo = p.idAtributo ?? p.id_atributo ?? p.datos?.id;
      if (!idClase || !idAtributo) break;
      const clasePadre = clases.find((c) => c.id === idClase);
      const ordenSolicitado =
        p.ordenDePosicion ??
        p.orden_de_posicion ??
        p.datos?.ordenDePosicion ??
        p.datos?.orden_de_posicion;
      const nuevoAtributo: Atributo = {
        id: idAtributo,
        idClase,
        nombre: p.nombre ?? p.datos?.nombre ?? "atributo",
        tipoDato: p.tipoDato ?? p.tipo_dato ?? p.datos?.tipo_dato ?? "integer",
        longitud: p.longitud ?? p.datos?.longitud ?? null,
        precision: p.precision ?? p.datos?.precision ?? null,
        escala: p.escala ?? p.datos?.escala ?? null,
        permiteNulo: p.permiteNulo ?? p.permite_nulo ?? p.datos?.permite_nulo ?? true,
        esLlavePrimaria: false,
        esUnico: p.esUnico ?? p.es_unico ?? p.datos?.es_unico ?? false,
        valorPorDefecto: p.valorPorDefecto ?? p.valor_por_defecto ?? p.datos?.valor_por_defecto ?? null,
        ordenDePosicion:
          typeof ordenSolicitado === "number"
            ? ordenSolicitado
            : (clasePadre?.atributos?.length || 0) + 1,
        procedencia: "manual",
      };

      clases = clases.map((c) => {
        if (c.id !== idClase) return c;
        const attrs = [...c.atributos];
        const aIdx = attrs.findIndex((a) => a.id === idAtributo);
        if (aIdx >= 0) {
          attrs[aIdx] = nuevoAtributo;
        } else {
          attrs.push(nuevoAtributo);
        }
        return {
          ...c,
          atributos:
            typeof ordenSolicitado === "number"
              ? reordenarAtributosEnSecuencia(
                  attrs,
                  idAtributo,
                  nuevoAtributo.ordenDePosicion
                )
              : attrs,
        };
      });
      break;
    }

    case "ACTUALIZAR_ATRIBUTO": {
      const idClase = p.idClase ?? p.id_clase ?? p.claseId;
      const idAtributo = p.idAtributo ?? p.id_atributo ?? p.atributoId;
      const ordenSolicitado =
        p.ordenDePosicion ??
        p.orden_de_posicion ??
        p.datos?.ordenDePosicion ??
        p.datos?.orden_de_posicion;
      clases = clases.map((c) => {
        if (c.id !== idClase) return c;
        const atributosActualizados = c.atributos.map((a) => {
          if (a.id !== idAtributo) return a;
          return {
            ...a,
            nombre: p.nombre ?? p.datos?.nombre ?? a.nombre,
            tipoDato: p.tipoDato ?? p.tipo_dato ?? p.datos?.tipo_dato ?? a.tipoDato,
            longitud: p.longitud !== undefined ? p.longitud : a.longitud,
            precision: p.precision !== undefined ? p.precision : a.precision,
            escala: p.escala !== undefined ? p.escala : a.escala,
            permiteNulo: p.permiteNulo !== undefined ? p.permiteNulo : a.permiteNulo,
            esUnico: p.esUnico !== undefined ? p.esUnico : a.esUnico,
            valorPorDefecto:
              p.valorPorDefecto !== undefined ? p.valorPorDefecto : a.valorPorDefecto,
            ordenDePosicion:
              typeof ordenSolicitado === "number" ? ordenSolicitado : a.ordenDePosicion,
          };
        });
        return {
          ...c,
          atributos:
            typeof ordenSolicitado === "number"
              ? reordenarAtributosEnSecuencia(
                  atributosActualizados,
                  idAtributo,
                  ordenSolicitado
                )
              : atributosActualizados,
        };
      });
      break;
    }

    case "ELIMINAR_ATRIBUTO": {
      const idClase = p.idClase ?? p.id_clase ?? p.claseId;
      const idAtributo = p.idAtributo ?? p.id_atributo ?? p.atributoId;
      clases = clases.map((c) => {
        if (c.id !== idClase) return c;
        return {
          ...c,
          atributos: c.atributos.filter((a) => a.id !== idAtributo),
        };
      });
      // Cascada FK: si el atributo eliminado es una FK estructural, eliminar la relación asociada
      const relacionesAfectadas = relaciones.filter((r) =>
        r.referenciasFk?.some((ref) => ref.idAtributoFk === idAtributo || ref.idAtributoReferenciado === idAtributo)
      );
      if (relacionesAfectadas.length > 0) {
        const idsRelEliminadas = new Set(relacionesAfectadas.map((r) => r.id));
        relaciones = relaciones.filter((r) => !idsRelEliminadas.has(r.id));
        // Cascada NM si pertenecía a una estructura N:M
        const estAfectadas = estructurasNm.filter((e) =>
          idsRelEliminadas.has(e.idRelacionOrigen) || idsRelEliminadas.has(e.idRelacionDestino)
        );
        if (estAfectadas.length > 0) {
          const idsClasesIntermedias = new Set(estAfectadas.map((e) => e.idClaseIntermedia));
          const idsEstEliminadas = new Set(estAfectadas.map((e) => e.id));
          clases = clases.filter((c) => !idsClasesIntermedias.has(c.id));
          estructurasNm = estructurasNm.filter((e) => !idsEstEliminadas.has(e.id));
        }
      }
      break;
    }

    case "CREAR_RELACION": {
      const idRelacion = p.idRelacion ?? p.id_relacion ?? p.datos?.id;
      if (!idRelacion) break;
      const nuevaRelacion: Relacion = {
        id: idRelacion,
        idDiagrama: op.idDiagrama ?? op.diagramId ?? "",
        idClaseOrigen: p.idClaseOrigen ?? p.id_clase_origen ?? p.datos?.id_clase_origen,
        idClaseDestino: p.idClaseDestino ?? p.id_clase_destino ?? p.datos?.id_clase_destino,
        tipoRelacion: p.tipoRelacion ?? p.tipo_relacion ?? p.datos?.tipo_relacion,
        cardinalidadOrigen:
          p.cardinalidadOrigen ?? p.cardinalidad_origen ?? p.datos?.cardinalidad_origen,
        cardinalidadDestino:
          p.cardinalidadDestino ?? p.cardinalidad_destino ?? p.datos?.cardinalidad_destino,
        conectorOrigen: p.conectorOrigen ?? p.conector_origen ?? p.datos?.conector_origen,
        conectorDestino: p.conectorDestino ?? p.conector_destino ?? p.datos?.conector_destino,
        nombre: p.nombre ?? p.datos?.nombre ?? null,
        referenciasFk: [],
      };

      // Materialización de atributos FK
      const rawMats = p.materializacionFk ?? p.materializacion_fk ?? p.datos?.materializacion_fk;
      let mats: any[] = [];
      if (Array.isArray(rawMats)) {
        mats = rawMats;
      } else if (rawMats && typeof rawMats === "object") {
        if (Array.isArray(rawMats.referencias)) {
          mats = rawMats.referencias.map((ref: any) => ({
            idClaseFk: rawMats.idClaseReceptora,
            idReferenciaFk: ref.idReferenciaFk ?? ref.id_referencia_fk,
            idAtributoReferenciado: ref.idAtributoReferenciado ?? ref.id_atributo_referenciado,
            onDelete: ref.onDelete ?? ref.on_delete,
            onUpdate: ref.onUpdate ?? ref.on_update,
            atributoFkNuevo: {
              idAtributo: ref.idAtributoFk ?? ref.id,
              nombre: ref.nombreAtributoFk ?? ref.nombre,
              tipoDato: ref.tipoDato,
              permiteNulo: ref.permiteNulo ?? true,
            },
          }));
        } else {
          mats = [rawMats];
        }
      }

      const refsFk: ReferenciaFk[] = [];
      let materializacionIncompleta = false;
      for (const mat of mats) {
        const idRef = mat.idReferenciaFk ?? mat.id_referencia_fk;
        const idAttrRef = mat.idAtributoReferenciado ?? mat.id_atributo_referenciado;
        const idAttrFk =
          mat.idAtributoFk ??
          mat.id_atributo_fk ??
          mat.atributoFkNuevo?.idAtributo ??
          mat.atributo_fk_nuevo?.id_atributo;

        if (idRef && idAttrRef && idAttrFk) {
          refsFk.push({
            id: idRef,
            idRelacion,
            idAtributoFk: idAttrFk,
            idAtributoReferenciado: idAttrRef,
            onDelete: mat.onDelete ?? mat.on_delete ?? "NO_ACTION",
            onUpdate: mat.onUpdate ?? mat.on_update ?? "NO_ACTION",
          });
        } else if (rawMats) {
          materializacionIncompleta = true;
        }

        if (mat.atributoFkNuevo && mat.idClaseFk) {
          const fkAttr = mat.atributoFkNuevo;
          const nuevoAtributoFk: Atributo = {
            id: fkAttr.idAtributo ?? fkAttr.id_atributo,
            idClase: mat.idClaseFk,
            nombre: fkAttr.nombre,
            tipoDato: fkAttr.tipoDato ?? fkAttr.tipo_dato,
            longitud: fkAttr.longitud ?? null,
            precision: fkAttr.precision ?? null,
            escala: fkAttr.escala ?? null,
            permiteNulo: fkAttr.permiteNulo ?? fkAttr.permite_nulo ?? true,
            esLlavePrimaria: false,
            esUnico: fkAttr.esUnico ?? fkAttr.es_unico ?? false,
            valorPorDefecto: fkAttr.valorPorDefecto ?? fkAttr.valor_por_defecto ?? null,
            ordenDePosicion: 1,
            procedencia: "sistema_fk",
          };

          clases = clases.map((c) => {
            if (c.id !== mat.idClaseFk) return c;
            const attrs = [...c.atributos];
            if (!attrs.some((a) => a.id === nuevoAtributoFk.id)) {
              attrs.push(nuevoAtributoFk);
            }
            return {
              ...c,
              atributos: reordenarAtributosEnSecuencia(
                attrs,
                nuevoAtributoFk.id,
                attrs.length
              ),
            };
          });
        }
      }

      if (materializacionIncompleta) return dominio;

      nuevaRelacion.referenciasFk = refsFk;

      const rIdx = relaciones.findIndex((r) => r.id === idRelacion);
      if (rIdx >= 0) {
        relaciones[rIdx] = nuevaRelacion;
      } else {
        relaciones.push(nuevaRelacion);
      }
      break;
    }

    case "RENOMBRAR_RELACION": {
      const idRelacion = p.idRelacion ?? p.id_relacion ?? p.relacionId;
      relaciones = relaciones.map((r) => {
        if (r.id !== idRelacion) return r;
        if (r.tipoRelacion !== "asociacion") return r;
        return { ...r, nombre: p.nombre ?? p.datos?.nombre ?? "Asociación" };
      });
      break;
    }

    case "ELIMINAR_RELACION": {
      const idRelacion = p.idRelacion ?? p.id_relacion ?? p.relacionId;
      const relEliminada = relaciones.find((r) => r.id === idRelacion);
      if (relEliminada && relEliminada.referenciasFk && relEliminada.referenciasFk.length > 0) {
        const idsAtributosFk = relEliminada.referenciasFk.map((rf) => rf.idAtributoFk);
        clases = clases.map((c) => {
          const atributosFiltrados = c.atributos.filter(
            (a) => !idsAtributosFk.includes(a.id) || a.procedencia !== "sistema_fk"
          );
          return {
            ...c,
            atributos: atributosFiltrados.map((a, idx) => ({
              ...a,
              ordenDePosicion: idx + 1,
            })),
          };
        });
      }
      relaciones = relaciones.filter((r) => r.id !== idRelacion);
      // Cascada NM: si la relación eliminada formaba parte de una estructura N:M, eliminar la estructura y la clase intermedia
      const estAfectada = estructurasNm.find(
        (e) => e.idRelacionOrigen === idRelacion || e.idRelacionDestino === idRelacion
      );
      if (estAfectada) {
        clases = clases.filter((c) => c.id !== estAfectada.idClaseIntermedia);
        relaciones = relaciones.filter(
          (r) => r.id !== estAfectada.idRelacionOrigen && r.id !== estAfectada.idRelacionDestino
        );
        estructurasNm = estructurasNm.filter((e) => e.id !== estAfectada.id);
      }
      break;
    }

    case "CREAR_ESTRUCTURA_NM": {
      const cInter = p.claseIntermedia || p.clase_intermedia || {};
      const rOrig = p.relacionOrigen || p.relacion_origen || {};
      const rDest = p.relacionDestino || p.relacion_destino || {};
      const refOrig = p.referenciaFkOrigen || p.referencia_fk_origen || {};
      const refDest = p.referenciaFkDestino || p.referencia_fk_destino || {};

      const idDiagrama = op.idDiagrama ?? op.diagramId ?? "";
      const idClaseOrigen = p.idClaseOrigen ?? p.id_clase_origen ?? p.datos?.idClaseOrigen;
      const idClaseDestino = p.idClaseDestino ?? p.id_clase_destino ?? p.datos?.idClaseDestino;
      const idClaseIntermedia = cInter.idClase ?? cInter.id_clase ?? p.idClaseIntermedia ?? p.id_clase_intermedia;

      const idPk = cInter.idAtributoPk ?? cInter.id_atributo_pk ?? p.idAtributoInicial ?? p.id_atributo_inicial;
      const nombrePk = cInter.nombreAtributoPk ?? cInter.nombre_atributo_pk ?? "id";

      const idFkOrig = refOrig.idAtributoFk ?? refOrig.id_atributo_fk ?? p.idAtributoFkOrigen ?? p.id_atributo_fk_origen;
      let nombreFkOrig = refOrig.nombreAtributoFk ?? refOrig.nombre_atributo_fk ?? p.nombreAtributoFkOrigen ?? `${(clases.find((c) => c.id === idClaseOrigen)?.nombre || "origen").toLowerCase()}_id`;

      const idFkDest = refDest.idAtributoFk ?? refDest.id_atributo_fk ?? p.idAtributoFkDestino ?? p.id_atributo_fk_destino;
      let nombreFkDest = refDest.nombreAtributoFk ?? refDest.nombre_atributo_fk ?? p.nombreAtributoFkDestino ?? `${(clases.find((c) => c.id === idClaseDestino)?.nombre || "destino").toLowerCase()}_id`;

      if (idClaseOrigen === idClaseDestino && nombreFkOrig === nombreFkDest) {
        const baseNombre = (clases.find((c) => c.id === idClaseOrigen)?.nombre || "origen").toLowerCase();
        nombreFkOrig = `${baseNombre}_origen_id`;
        nombreFkDest = `${baseNombre}_destino_id`;
      }

      const idRelOrig = rOrig.idRelacion ?? rOrig.id_relacion ?? p.idRelacionOrigen ?? p.id_relacion_origen;
      const idRelDest = rDest.idRelacion ?? rDest.id_relacion ?? p.idRelacionDestino ?? p.id_relacion_destino;

      const idRefOrig = refOrig.idReferenciaFk ?? refOrig.id_referencia_fk ?? p.idReferenciaFkOrigen ?? p.id_referencia_fk_origen;
      const idRefDest = refDest.idReferenciaFk ?? refDest.id_referencia_fk ?? p.idReferenciaFkDestino ?? p.id_referencia_fk_destino;

      const refAttrOrigId = refOrig.idAtributoReferenciado ?? p.idAtributoReferenciadoOrigen ?? clases.find((c) => c.id === idClaseOrigen)?.atributos.find((a) => a.esLlavePrimaria)?.id ?? "";
      const refAttrDestId = refDest.idAtributoReferenciado ?? p.idAtributoReferenciadoDestino ?? clases.find((c) => c.id === idClaseDestino)?.atributos.find((a) => a.esLlavePrimaria)?.id ?? "";

      // La estructura N:M es atómica: un payload incompleto se conserva para
      // reconciliación, pero nunca se proyecta como una estructura parcial.
      if (!idClaseOrigen || !idClaseDestino || !idClaseIntermedia || !idPk ||
        !idFkOrig || !idFkDest || !idRelOrig || !idRelDest || !idRefOrig || !idRefDest) {
        break;
      }

      const origPk = clases.find((c) => c.id === idClaseOrigen)?.atributos.find((a) => a.id === refAttrOrigId || a.esLlavePrimaria);
      const destPk = clases.find((c) => c.id === idClaseDestino)?.atributos.find((a) => a.id === refAttrDestId || a.esLlavePrimaria);

      if (idClaseIntermedia && idPk) {
        const atributos: Atributo[] = [
          {
            id: idPk,
            idClase: idClaseIntermedia,
            nombre: nombrePk,
            tipoDato: "integer",
            longitud: null,
            precision: null,
            escala: null,
            permiteNulo: false,
            esLlavePrimaria: true,
            esUnico: true,
            valorPorDefecto: null,
            ordenDePosicion: 1,
            procedencia: "sistema_clase",
          },
        ];

        if (idFkOrig) {
          atributos.push({
            id: idFkOrig,
            idClase: idClaseIntermedia,
            nombre: nombreFkOrig,
            tipoDato: origPk?.tipoDato ?? "integer",
            longitud: origPk?.longitud ?? null,
            precision: origPk?.precision ?? null,
            escala: origPk?.escala ?? null,
            permiteNulo: false,
            esLlavePrimaria: false,
            esUnico: false,
            valorPorDefecto: null,
            ordenDePosicion: 2,
            procedencia: "sistema_fk",
          });
        }

        if (idFkDest) {
          atributos.push({
            id: idFkDest,
            idClase: idClaseIntermedia,
            nombre: nombreFkDest,
            tipoDato: destPk?.tipoDato ?? "integer",
            longitud: destPk?.longitud ?? null,
            precision: destPk?.precision ?? null,
            escala: destPk?.escala ?? null,
            permiteNulo: false,
            esLlavePrimaria: false,
            esUnico: false,
            valorPorDefecto: null,
            ordenDePosicion: 3,
            procedencia: "sistema_fk",
          });
        }

        const claseInter: Clase = {
          id: idClaseIntermedia,
          idDiagrama,
          nombre: cInter.nombre ?? p.nombreIntermedia ?? "Intermedia",
          posicionX: cInter.posicionX ?? cInter.posicion_x ?? p.posicionX ?? 0,
          posicionY: cInter.posicionY ?? cInter.posicion_y ?? p.posicionY ?? 0,
          ancho: cInter.ancho ?? p.ancho ?? 280,
          atributos,
        };

        const idx = clases.findIndex((c) => c.id === idClaseIntermedia);
        if (idx >= 0) {
          clases[idx] = claseInter;
        } else {
          clases.push(claseInter);
        }
      }

      if (idRelOrig) {
        const nuevaRelOrig: Relacion = {
          id: idRelOrig,
          idDiagrama,
          idClaseOrigen,
          idClaseDestino: idClaseIntermedia,
          tipoRelacion: "asociacion",
          cardinalidadOrigen: rOrig.cardinalidadOrigen ?? "1",
          cardinalidadDestino: rOrig.cardinalidadDestino ?? "0..*",
          conectorOrigen: rOrig.conectorOrigen ?? "right",
          conectorDestino: rOrig.conectorDestino ?? "left",
          nombre: rOrig.nombre ?? "Asociación",
          referenciasFk: idRefOrig && idFkOrig
            ? [
                {
                  id: idRefOrig,
                  idRelacion: idRelOrig,
                  idAtributoFk: idFkOrig,
                  idAtributoReferenciado: refAttrOrigId,
                  onDelete: refOrig.onDelete ?? "NO_ACTION",
                  onUpdate: refOrig.onUpdate ?? "NO_ACTION",
                },
              ]
            : [],
        };
        const idx = relaciones.findIndex((r) => r.id === idRelOrig);
        if (idx >= 0) {
          relaciones[idx] = nuevaRelOrig;
        } else {
          relaciones.push(nuevaRelOrig);
        }
      }

      if (idRelDest) {
        const nuevaRelDest: Relacion = {
          id: idRelDest,
          idDiagrama,
          idClaseOrigen: idClaseDestino,
          idClaseDestino: idClaseIntermedia,
          tipoRelacion: "asociacion",
          cardinalidadOrigen: rDest.cardinalidadOrigen ?? "1",
          cardinalidadDestino: rDest.cardinalidadDestino ?? "0..*",
          conectorOrigen: rDest.conectorOrigen ?? "right",
          conectorDestino: rDest.conectorDestino ?? "left",
          nombre: rDest.nombre ?? "Asociación",
          referenciasFk: idRefDest && idFkDest
            ? [
                {
                  id: idRefDest,
                  idRelacion: idRelDest,
                  idAtributoFk: idFkDest,
                  idAtributoReferenciado: refAttrDestId,
                  onDelete: refDest.onDelete ?? "NO_ACTION",
                  onUpdate: refDest.onUpdate ?? "NO_ACTION",
                },
              ]
            : [],
        };
        const idx = relaciones.findIndex((r) => r.id === idRelDest);
        if (idx >= 0) {
          relaciones[idx] = nuevaRelDest;
        } else {
          relaciones.push(nuevaRelDest);
        }
      }

      const structId = p.idEstructuraNm ?? p.id_estructura_nm ?? p.idEstructura ?? op.actionId;
      if (structId) {
        const nuevaEstructura: EstructuraRelacionNm = {
          id: structId,
          idDiagrama,
          idClaseOrigen,
          idClaseDestino,
          idClaseIntermedia,
          idRelacionOrigen: idRelOrig,
          idRelacionDestino: idRelDest,
        };
        const idx = estructurasNm.findIndex((e) => e.id === structId);
        if (idx >= 0) {
          estructurasNm[idx] = nuevaEstructura;
        } else {
          estructurasNm.push(nuevaEstructura);
        }
      }
      break;
    }

    case "ELIMINAR_ESTRUCTURA_NM": {
      const idEstructura = p.idEstructuraNm ?? p.id_estructura_nm;
      const estructura = estructurasNm.find((e) => e.id === idEstructura);
      if (estructura) {
        clases = clases.filter((c) => c.id !== estructura.idClaseIntermedia);
        relaciones = relaciones.filter(
          (r) => r.id !== estructura.idRelacionOrigen && r.id !== estructura.idRelacionDestino
        );
        estructurasNm = estructurasNm.filter((e) => e.id !== idEstructura);
      }
      break;
    }
  }

  return { clases, relaciones, estructurasNm };
}

export function reproyectarDominio(
  base: DominioDiagrama,
  operaciones: OperacionEditor[]
): DominioDiagrama {
  let actual: DominioDiagrama = {
    clases: [...base.clases],
    relaciones: [...base.relaciones],
    estructurasNm: [...base.estructurasNm],
  };

  for (const op of operaciones) {
    if (op.estado === "rechazada" || op.estado === "bloqueada") continue;
    actual = reducirOperacion(actual, op);
  }

  return actual;
}

export function aplicarEfectosConfirmados(
  base: DominioDiagrama,
  efectos: EfectosOperacionDiagrama
): DominioDiagrama {
  // Clases
  const idsClasesEliminadas = new Set(efectos.clasesEliminadas);
  const clases = base.clases.filter((c) => !idsClasesEliminadas.has(c.id));
  for (const act of efectos.clasesActualizadas) {
    const idx = clases.findIndex((c) => c.id === act.id);
    if (idx >= 0) {
      clases[idx] = act;
    } else {
      clases.push(act);
    }
  }

  // Relaciones
  const idsRelacionesEliminadas = new Set(efectos.relacionesEliminadas);
  const relaciones = base.relaciones.filter((r) => !idsRelacionesEliminadas.has(r.id));
  for (const act of efectos.relacionesActualizadas) {
    const idx = relaciones.findIndex((r) => r.id === act.id);
    if (idx >= 0) {
      relaciones[idx] = act;
    } else {
      relaciones.push(act);
    }
  }

  // Estructuras NM
  const idsNmEliminadas = new Set(efectos.estructurasNmEliminadas);
  const estructurasNm = base.estructurasNm.filter((e) => !idsNmEliminadas.has(e.id));
  for (const act of efectos.estructurasNmActualizadas) {
    const idx = estructurasNm.findIndex((e) => e.id === act.id);
    if (idx >= 0) {
      estructurasNm[idx] = act;
    } else {
      estructurasNm.push(act);
    }
  }

  return { clases, relaciones, estructurasNm };
}

interface EstadoEditorDiagrama {
  scopeKey: string | null;
  detalleConfirmado: DiagramaDetalle | null;
  clases: Clase[];
  relaciones: Relacion[];
  estructurasNm: EstructuraRelacionNm[];
  operacionIds: string[];
  operacionesPendientes: OperacionEditor[];
  revisionCola: number;
  trabajoNoProtegido: boolean;
  claseSeleccionadaId: string | null;
  relacionSeleccionadaId: string | null;

  hidratar: (
    scopeKey: string,
    detalle: DiagramaDetalle,
    operaciones?: OperacionEditor[]
  ) => void;
  ejecutarOperacionLocal: (operacion: OperacionEditor) => void;
  aplicarRecibo: (recibo: ConfirmacionOperacionDiagrama) => void;
  aplicarCambioRemoto: (efectos: EfectosOperacionDiagrama, actionId?: string) => void;
  confirmarOperacion: (actionId: string, efectos: EfectosOperacionDiagrama) => void;
  rebasarYReproyectar: (
    detalleBase: DiagramaDetalle,
    operaciones: OperacionEditor[]
  ) => void;
  fijarTrabajoNoProtegido: (noProtegido: boolean) => void;

  actualizarClases: (clases: Clase[]) => void;
  actualizarPosicionClaseDuranteArrastre: (idClase: string, posicionX: number, posicionY: number) => void;
  actualizarRelaciones: (relaciones: Relacion[]) => void;
  actualizarEstructurasNm: (estructuras: EstructuraRelacionNm[]) => void;
  registrarOperacion: (actionId: string) => void;
  retirarOperacion: (actionId: string) => void;
  actualizarOperacionPendiente: (
    actionId: string,
    cambios: Partial<OperacionEditor>
  ) => void;
  seleccionarClase: (id: string | null) => void;
  seleccionarRelacion: (id: string | null) => void;
  fijarClaseSeleccionada: (id: string | null) => void;
  fijarRelacionSeleccionada: (id: string | null) => void;
  limpiarDominioVisible: () => void;
  limpiar: () => void;
}

export const useEditorDiagramaStore = create<EstadoEditorDiagrama>((set) => ({
  scopeKey: null,
  detalleConfirmado: null,
  clases: [],
  relaciones: [],
  estructurasNm: [],
  operacionIds: [],
  operacionesPendientes: [],
  revisionCola: 0,
  trabajoNoProtegido: false,
  claseSeleccionadaId: null,
  relacionSeleccionadaId: null,

  hidratar: (scopeKey, detalle, operaciones = []) => {
    const reproyectado = reproyectarDominio(detalle, operaciones);
    set({
      scopeKey,
      detalleConfirmado: detalle,
      clases: reproyectado.clases,
      relaciones: reproyectado.relaciones,
      estructurasNm: reproyectado.estructurasNm,
      operacionesPendientes: operaciones,
      operacionIds: operaciones.map((operacion) => operacion.actionId),
      revisionCola: operaciones.length,
      claseSeleccionadaId: null,
      relacionSeleccionadaId: null,
      trabajoNoProtegido: false,
    });
  },

  ejecutarOperacionLocal: (operacion) =>
    set((estado) => {
      const dominioActual: DominioDiagrama = {
        clases: estado.clases,
        relaciones: estado.relaciones,
        estructurasNm: estado.estructurasNm,
      };
      const nuevoDominio = reducirOperacion(dominioActual, operacion);
      const nuevasPendientes = [...estado.operacionesPendientes, operacion];

      return {
        ...nuevoDominio,
        operacionesPendientes: nuevasPendientes,
        operacionIds: nuevasPendientes.map((op) => op.actionId),
        revisionCola: estado.revisionCola + 1,
      };
    }),

  aplicarRecibo: (recibo) =>
    set((estado) => {
      if (!recibo || !recibo.actionId) {
        return estado;
      }
      if (!estado.detalleConfirmado || !recibo.efectos) {
        const restantes = estado.operacionesPendientes.filter(
          (op) => op.actionId !== recibo.actionId
        );
        return {
          operacionesPendientes: restantes,
          operacionIds: restantes.map((op) => op.actionId),
          revisionCola: estado.revisionCola + 1,
        };
      }

      // 1. Rebase: aplicar efectos confirmados a la base confirmada
      const confirmada = aplicarEfectosConfirmados(
        estado.detalleConfirmado,
        recibo.efectos
      );

      const detalleActualizado: DiagramaDetalle = {
        ...estado.detalleConfirmado,
        clases: confirmada.clases,
        relaciones: confirmada.relaciones,
        estructurasNm: confirmada.estructurasNm,
      };

      // 2. Filtrar operación confirmada de las pendientes
      const pendientesRestantes = estado.operacionesPendientes.filter(
        (op) => op.actionId !== recibo.actionId
      );

      // 3. Replay: reproyectar todas las pendientes restantes sobre la base actualizada
      const reproyectado = reproyectarDominio(detalleActualizado, pendientesRestantes);

      return {
        detalleConfirmado: detalleActualizado,
        operacionesPendientes: pendientesRestantes,
        clases: reproyectado.clases,
        relaciones: reproyectado.relaciones,
        estructurasNm: reproyectado.estructurasNm,
        operacionIds: pendientesRestantes.map((op) => op.actionId),
        revisionCola: estado.revisionCola + 1,
      };
    }),

  aplicarCambioRemoto: (efectos) =>
    set((estado) => {
      if (!efectos || !estado.detalleConfirmado) {
        return estado;
      }

      // 1. Rebase: aplicar efectos confirmados a la base confirmada
      const confirmada = aplicarEfectosConfirmados(
        estado.detalleConfirmado,
        efectos
      );

      const detalleActualizado: DiagramaDetalle = {
        ...estado.detalleConfirmado,
        clases: confirmada.clases,
        relaciones: confirmada.relaciones,
        estructurasNm: confirmada.estructurasNm,
      };

      // 2. Replay: reproyectar las operaciones locales pendientes sobre la nueva base
      const reproyectado = reproyectarDominio(
        detalleActualizado,
        estado.operacionesPendientes
      );

      return {
        detalleConfirmado: detalleActualizado,
        clases: reproyectado.clases,
        relaciones: reproyectado.relaciones,
        estructurasNm: reproyectado.estructurasNm,
      };
    }),

  confirmarOperacion: (actionId, efectos) =>
    set((estado) => {
      const pendiente = estado.operacionesPendientes.find((op) => op.actionId === actionId);
      if (!pendiente) return estado;
      const recibo: ConfirmacionOperacionDiagrama = {
        actionId,
        idDiagrama: pendiente.scopeKey.split(":").slice(1).join(":") || "",
        tipo: pendiente.tipo as ConfirmacionOperacionDiagrama["tipo"],
        efectos,
      };
      const confirmada = aplicarEfectosConfirmados(estado.detalleConfirmado ?? {
        id: recibo.idDiagrama,
        idProyecto: "",
        nombre: "",
        numero: 0,
        clases: [],
        relaciones: [],
        estructurasNm: [],
      }, recibo.efectos);
      const detalleActualizado = estado.detalleConfirmado
        ? { ...estado.detalleConfirmado, ...confirmada }
        : estado.detalleConfirmado;
      const pendientesRestantes = estado.operacionesPendientes.filter((op) => op.actionId !== actionId);
      const reproyectado = detalleActualizado
        ? reproyectarDominio(detalleActualizado, pendientesRestantes)
        : { clases: estado.clases, relaciones: estado.relaciones, estructurasNm: estado.estructurasNm };
      return {
        detalleConfirmado: detalleActualizado,
        operacionesPendientes: pendientesRestantes,
        operacionIds: pendientesRestantes.map((op) => op.actionId),
        ...reproyectado,
        revisionCola: estado.revisionCola + 1,
      };
    }),

  rebasarYReproyectar: (detalleBase, operaciones) => {
    const reproyectado = reproyectarDominio(detalleBase, operaciones);
    set((estado) => ({
      detalleConfirmado: detalleBase,
      operacionesPendientes: operaciones,
      operacionIds: operaciones.map((op) => op.actionId),
      clases: reproyectado.clases,
      relaciones: reproyectado.relaciones,
      estructurasNm: reproyectado.estructurasNm,
      revisionCola: estado.revisionCola + 1,
    }));
  },

  fijarTrabajoNoProtegido: (trabajoNoProtegido) => set({ trabajoNoProtegido }),

  actualizarClases: (clases) => set({ clases }),
  actualizarPosicionClaseDuranteArrastre: (idClase, posicionX, posicionY) =>
    set((estado) => {
      if (!Number.isFinite(posicionX) || !Number.isFinite(posicionY)) {
        return estado;
      }
      return {
        clases: estado.clases.map((clase) =>
          clase.id === idClase ? { ...clase, posicionX, posicionY } : clase
        ),
      };
    }),
  actualizarRelaciones: (relaciones) => set({ relaciones }),
  actualizarEstructurasNm: (estructurasNm) => set({ estructurasNm }),

  registrarOperacion: (actionId) =>
    set((estado) =>
      estado.operacionIds.includes(actionId)
        ? estado
        : {
            operacionIds: [...estado.operacionIds, actionId],
            revisionCola: estado.revisionCola + 1,
          }
    ),

  retirarOperacion: (actionId) =>
    set((estado) => {
      const restantes = estado.operacionesPendientes.filter(
        (op) => op.actionId !== actionId
      );
      return {
        operacionesPendientes: restantes,
        operacionIds: estado.operacionIds.filter((id) => id !== actionId),
        revisionCola: estado.revisionCola + 1,
      };
    }),

  actualizarOperacionPendiente: (actionId, cambios) =>
    set((estado) => ({
      operacionesPendientes: estado.operacionesPendientes.map((op) =>
        op.actionId === actionId ? { ...op, ...cambios } : op
      ),
      revisionCola: estado.revisionCola + 1,
    })),

  seleccionarClase: (claseSeleccionadaId) =>
    set({ claseSeleccionadaId, relacionSeleccionadaId: null }),
  seleccionarRelacion: (relacionSeleccionadaId) =>
    set({ relacionSeleccionadaId, claseSeleccionadaId: null }),
  fijarClaseSeleccionada: (claseSeleccionadaId) => set({ claseSeleccionadaId }),
  fijarRelacionSeleccionada: (relacionSeleccionadaId) => set({ relacionSeleccionadaId }),

  limpiarDominioVisible: () =>
    set((estado) => ({
      scopeKey: null,
      detalleConfirmado: null,
      clases: [],
      relaciones: [],
      estructurasNm: [],
      operacionIds: [],
      operacionesPendientes: [],
      revisionCola: estado.revisionCola + 1,
      trabajoNoProtegido: false,
      claseSeleccionadaId: null,
      relacionSeleccionadaId: null,
    })),

  limpiar: () =>
    set({
      scopeKey: null,
      detalleConfirmado: null,
      clases: [],
      relaciones: [],
      estructurasNm: [],
      operacionIds: [],
      operacionesPendientes: [],
      revisionCola: 0,
      trabajoNoProtegido: false,
      claseSeleccionadaId: null,
      relacionSeleccionadaId: null,
    }),
}));
