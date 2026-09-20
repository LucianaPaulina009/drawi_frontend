import type { Clase } from "./clase.entity";
import type { Atributo, TipoDato } from "./atributo.entity";
import type { ConectorRelacion, MaterializacionFkData, Relacion, TipoRelacion } from "./relacion.entity";
import type { EstructuraRelacionNm } from "./estructura-relacion-nm.entity";

// ── Eventos Semánticos del Catálogo (11 eventos del contrato) ─────────────────

export interface CrearClaseEvento {
  tipo: "CREAR_CLASE";
  datos: {
    idClase: string;
    nombre: string;
    posicionX: number;
    posicionY: number;
    ancho: number;
    idAtributoInicial?: string;
    nombreAtributoInicial?: string;
  };
}

export interface ActualizarClaseEvento {
  tipo: "ACTUALIZAR_CLASE";
  datos: {
    idClase: string;
    nombre?: string;
    posicionX?: number;
    posicionY?: number;
    ancho?: number;
  };
}

export interface EliminarClaseEvento {
  tipo: "ELIMINAR_CLASE";
  datos: {
    idClase: string;
  };
}

export interface CrearAtributoEvento {
  tipo: "CREAR_ATRIBUTO";
  datos: {
    idClase: string;
    idAtributo: string;
    nombre: string;
    tipoDato: TipoDato;
    longitud?: number | null;
    precision?: number | null;
    escala?: number | null;
    permiteNulo?: boolean;
    esUnico?: boolean;
    valorPorDefecto?: string | null;
    ordenDePosicion?: number;
    esLlavePrimaria?: boolean;
  };
}

export interface ActualizarAtributoEvento {
  tipo: "ACTUALIZAR_ATRIBUTO";
  datos: {
    idClase: string;
    idAtributo: string;
    campos?: Partial<Omit<Atributo, "id" | "idClase">>;
    nombre?: string;
    tipoDato?: TipoDato;
    longitud?: number | null;
    precision?: number | null;
    escala?: number | null;
    permiteNulo?: boolean;
    esUnico?: boolean;
    valorPorDefecto?: string | null;
    ordenDePosicion?: number;
  };
}

export interface EliminarAtributoEvento {
  tipo: "ELIMINAR_ATRIBUTO";
  datos: {
    idClase: string;
    idAtributo: string;
  };
}

export interface CrearRelacionEvento {
  tipo: "CREAR_RELACION";
  datos: {
    idRelacion: string;
    idClaseOrigen: string;
    idClaseDestino: string;
    tipoRelacion: TipoRelacion;
    cardinalidadOrigen: string;
    cardinalidadDestino: string;
    conectorOrigen: ConectorRelacion;
    conectorDestino: ConectorRelacion;
    nombre?: string | null;
    materializacionFk?: MaterializacionFkData[];
  };
}

export interface RenombrarRelacionEvento {
  tipo: "RENOMBRAR_RELACION";
  datos: {
    idRelacion: string;
    nombre: string;
  };
}

export interface EliminarRelacionEvento {
  tipo: "ELIMINAR_RELACION";
  datos: {
    idRelacion: string;
  };
}

export interface CrearEstructuraNmEvento {
  tipo: "CREAR_ESTRUCTURA_NM";
  datos: {
    idEstructuraNm: string;
    idClaseOrigen: string;
    idClaseDestino: string;
    claseIntermedia: {
      idClase: string;
      nombre: string;
      posicionX: number;
      posicionY: number;
      ancho: number;
      idAtributoPk: string;
      nombreAtributoPk?: string;
    };
    relacionOrigen: {
      idRelacion: string;
      cardinalidadOrigen?: string;
      cardinalidadDestino?: string;
      conectorOrigen?: string;
      conectorDestino?: string;
      nombre?: string;
    };
    relacionDestino: {
      idRelacion: string;
      cardinalidadOrigen?: string;
      cardinalidadDestino?: string;
      conectorOrigen?: string;
      conectorDestino?: string;
      nombre?: string;
    };
    referenciaFkOrigen: {
      idReferenciaFk: string;
      idAtributoFk: string;
      nombreAtributoFk?: string;
      onDelete?: string;
      onUpdate?: string;
    };
    referenciaFkDestino: {
      idReferenciaFk: string;
      idAtributoFk: string;
      nombreAtributoFk?: string;
      onDelete?: string;
      onUpdate?: string;
    };
  };
}

export interface EliminarEstructuraNmEvento {
  tipo: "ELIMINAR_ESTRUCTURA_NM";
  datos: {
    idEstructuraNm: string;
  };
}

export type EventoEditor =
  | CrearClaseEvento
  | ActualizarClaseEvento
  | EliminarClaseEvento
  | CrearAtributoEvento
  | ActualizarAtributoEvento
  | EliminarAtributoEvento
  | CrearRelacionEvento
  | RenombrarRelacionEvento
  | EliminarRelacionEvento
  | CrearEstructuraNmEvento
  | EliminarEstructuraNmEvento;

export type TipoEventoEditor = EventoEditor["tipo"];

// ── Recibo Canónico / Confirmación con Efectos del Backend ───────────────────

export interface EfectosOperacionDiagrama {
  clasesActualizadas: Clase[];
  clasesEliminadas: string[];
  relacionesActualizadas: Relacion[];
  relacionesEliminadas: string[];
  estructurasNmActualizadas: EstructuraRelacionNm[];
  estructurasNmEliminadas: string[];
}

export interface ConfirmacionOperacionDiagrama {
  actionId: string;
  idDiagrama: string;
  tipo: TipoEventoEditor;
  efectos: EfectosOperacionDiagrama;
}
