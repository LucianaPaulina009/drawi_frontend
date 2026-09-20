"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Clase } from "../../../domain/entities/clase.entity";
import type {
  MaterializacionFkData,
  Relacion,
} from "../../../domain/entities/relacion.entity";

export interface PropuestaReferenciaFkModalProps {
  abierto: boolean;
  relacion: Pick<
    Relacion,
    | "idClaseOrigen"
    | "idClaseDestino"
    | "cardinalidadOrigen"
    | "cardinalidadDestino"
    | "tipoRelacion"
  > | null;
  clases: Clase[];
  onOpenChange: (open: boolean) => void;
  onConfirmar: (materializacion: MaterializacionFkData[]) => void;
}

export function PropuestaReferenciaFkModal({
  abierto,
  relacion,
  clases,
  onOpenChange,
  onConfirmar,
}: PropuestaReferenciaFkModalProps) {
  if (!abierto || !relacion) return null;

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <PropuestaReferenciaFkContent
        key={`${relacion.idClaseOrigen}-${relacion.idClaseDestino}-${relacion.cardinalidadOrigen}-${relacion.cardinalidadDestino}`}
        relacion={relacion}
        clases={clases}
        onOpenChange={onOpenChange}
        onConfirmar={onConfirmar}
      />
    </Dialog>
  );
}

function PropuestaReferenciaFkContent({
  relacion,
  clases,
  onOpenChange,
  onConfirmar,
}: {
  relacion: NonNullable<PropuestaReferenciaFkModalProps["relacion"]>;
  clases: Clase[];
  onOpenChange: (open: boolean) => void;
  onConfirmar: (materializacion: MaterializacionFkData[]) => void;
}) {
  const esMuchos = (valor: string) => {
    const v = valor.trim().toLowerCase();
    return (
      v === "*" ||
      v === "n" ||
      v === "m" ||
      /\.\.\*$/.test(v) ||
      /\.\.n$/.test(v) ||
      /\.\.m$/.test(v) ||
      (!Number.isNaN(Number(v)) && Number(v) > 1)
    );
  };

  const claseOrigen = useMemo(
    () => clases.find((c) => c.id === relacion.idClaseOrigen),
    [clases, relacion.idClaseOrigen]
  );
  const claseDestino = useMemo(
    () => clases.find((c) => c.id === relacion.idClaseDestino),
    [clases, relacion.idClaseDestino]
  );

  const esDireccional = ["herencia", "realizacion", "dependencia"].includes(
    relacion.tipoRelacion
  );
  const esRecursiva = relacion.idClaseOrigen === relacion.idClaseDestino;

  const esUnoAUno =
    !esDireccional &&
    !esRecursiva &&
    !esMuchos(relacion.cardinalidadOrigen) &&
    !esMuchos(relacion.cardinalidadDestino);

  // Deducción automática:
  // - Direccionales (herencia, realizacion, dependencia): Origen recibe FK
  // - 1:N / N:1: La FK reside en el lado N (muchos)
  // - 1:1: Por defecto en la clase destino (según la especificación de Drawi)
  const defaultClaseFk = useMemo(() => {
    if (esDireccional) {
      return relacion.idClaseOrigen;
    }
    const origenMuchos = esMuchos(relacion.cardinalidadOrigen);
    const destinoMuchos = esMuchos(relacion.cardinalidadDestino);
    if (origenMuchos && !destinoMuchos) return relacion.idClaseOrigen;
    if (destinoMuchos && !origenMuchos) return relacion.idClaseDestino;
    // Si es 1:1, por defecto en la clase destino
    return relacion.idClaseDestino;
  }, [esDireccional, relacion]);

  const [claseFkId, setClaseFkId] = useState(defaultClaseFk);
  const [modoCreacion, setModoCreacion] = useState<"nuevo" | "existente">("nuevo");
  const [atributoFkExistenteId, setAtributoFkExistenteId] = useState("");

  const claseHost = useMemo(() => {
    if (esRecursiva) return claseOrigen;
    return claseFkId === relacion.idClaseOrigen ? claseOrigen : claseDestino;
  }, [esRecursiva, claseFkId, relacion, claseOrigen, claseDestino]);

  const claseReferenciada = useMemo(() => {
    if (esRecursiva) return claseOrigen;
    return claseFkId === relacion.idClaseOrigen ? claseDestino : claseOrigen;
  }, [esRecursiva, claseFkId, relacion, claseOrigen, claseDestino]);

  // Atributo referenciado (PK de la otra tabla, o de sí misma en recursiva)
  const atributoReferenciado = useMemo(() => {
    if (!claseReferenciada) return null;
    return (
      claseReferenciada.atributos?.find((a) => a.esLlavePrimaria || a.esUnico) ??
      claseReferenciada.atributos?.[0] ??
      null
    );
  }, [claseReferenciada]);

  // Nombre sugerido por defecto
  const nombreSugeridoInicial = useMemo(() => {
    if (esRecursiva) {
      const selfName = claseOrigen?.nombre
        ? claseOrigen.nombre.toLowerCase().replace(/\s+/g, "_")
        : "nodo";
      return `id_${selfName}_padre`;
    }
    const refName = claseReferenciada?.nombre
      ? claseReferenciada.nombre.toLowerCase().replace(/\s+/g, "_")
      : "ref";
    return `id_${refName}`;
  }, [esRecursiva, claseOrigen, claseReferenciada]);

  const [nombreAtributoNuevo, setNombreAtributoNuevo] = useState(nombreSugeridoInicial);

  const atributosHostDisponibles = useMemo(() => {
    return claseHost?.atributos || [];
  }, [claseHost]);

  // Nulabilidad: cardinalidad referenciada 0..1 admite nulo, 1 no; tipos direccionales no relacionales usan no nullable
  const cardinalidadReferenciada = useMemo(() => {
    if (esDireccional) return "1";
    return claseFkId === relacion.idClaseOrigen
      ? relacion.cardinalidadDestino
      : relacion.cardinalidadOrigen;
  }, [esDireccional, claseFkId, relacion]);

  const permiteNuloCalculado = useMemo(() => {
    if (esDireccional) return false;
    if (esRecursiva) return true;
    const card = cardinalidadReferenciada.trim();
    return card.startsWith("0");
  }, [esDireccional, esRecursiva, cardinalidadReferenciada]);

  const esUnicoCalculado = useMemo(() => {
    if (esDireccional) return true;
    if (esUnoAUno) return true;
    return false;
  }, [esDireccional, esUnoAUno]);

  const puedeConfirmar = useMemo(() => {
    if (!atributoReferenciado) return false;
    if (modoCreacion === "nuevo") {
      return Boolean(nombreAtributoNuevo.trim());
    }
    return Boolean(atributoFkExistenteId);
  }, [atributoReferenciado, modoCreacion, nombreAtributoNuevo, atributoFkExistenteId]);

  const handleEjecutarConfirmacion = () => {
    if (!puedeConfirmar || !atributoReferenciado) return;

    const idReferenciaFk = crypto.randomUUID();

    if (modoCreacion === "nuevo") {
      const materializacion: MaterializacionFkData = {
        idReferenciaFk,
        idAtributoReferenciado: atributoReferenciado.id,
        idClaseFk: claseFkId,
        atributoFkNuevo: {
          idAtributo: crypto.randomUUID(),
          nombre: nombreAtributoNuevo.trim(),
          tipoDato: atributoReferenciado.tipoDato || "integer",
          longitud: atributoReferenciado.longitud ?? null,
          precision: atributoReferenciado.precision ?? null,
          escala: atributoReferenciado.escala ?? null,
          permiteNulo: permiteNuloCalculado,
          esUnico: esUnicoCalculado,
          valorPorDefecto: null,
        },
        onDelete: "NO_ACTION",
        onUpdate: "NO_ACTION",
      };
      onConfirmar([materializacion]);
    } else {
      const materializacion: MaterializacionFkData = {
        idReferenciaFk,
        idAtributoReferenciado: atributoReferenciado.id,
        idAtributoFk: atributoFkExistenteId,
        idClaseFk: claseFkId,
        onDelete: "NO_ACTION",
        onUpdate: "NO_ACTION",
      };
      onConfirmar([materializacion]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleEjecutarConfirmacion();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEjecutarConfirmacion();
    }
  };

  return (
    <DialogContent className="max-w-sm rounded-2xl p-4.5" onKeyDown={handleKeyDown}>
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#91bcfb]" aria-hidden="true" />
          Clave Foránea (FK)
        </DialogTitle>
        <DialogDescription className="text-[11px] text-slate-500">
          {claseHost?.nombre || "Tabla"} contendrá la FK que referencia a{" "}
          <b>{claseReferenciada?.nombre || "Tabla"}</b> ({atributoReferenciado?.nombre || "id"}).
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1 text-xs">
        {/* Selector de clase host si es 1:1 */}
        {esUnoAUno && (
          <div>
            <Label className="text-[11px] font-semibold text-slate-700">
              Tabla que almacena la FK
            </Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  setClaseFkId(relacion.idClaseOrigen);
                  setNombreAtributoNuevo(
                    `id_${(claseDestino?.nombre || "ref").toLowerCase().replace(/\s+/g, "_")}`
                  );
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                  claseFkId === relacion.idClaseOrigen
                    ? "border-[#91bcfb] bg-sky-50 text-[#003c70]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {claseOrigen?.nombre || "Origen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setClaseFkId(relacion.idClaseDestino);
                  setNombreAtributoNuevo(
                    `id_${(claseOrigen?.nombre || "ref").toLowerCase().replace(/\s+/g, "_")}`
                  );
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                  claseFkId === relacion.idClaseDestino
                    ? "border-[#91bcfb] bg-sky-50 text-[#003c70]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {claseDestino?.nombre || "Destino"}
              </button>
            </div>
          </div>
        )}

        {/* Alternar entre crear nuevo o reutilizar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="nombre-fk-input" className="text-[11px] font-semibold text-slate-700">
              {modoCreacion === "nuevo" ? "Nombre del atributo FK" : "Seleccionar atributo"}
            </Label>
            {atributosHostDisponibles.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setModoCreacion((prev) => (prev === "nuevo" ? "existente" : "nuevo"))
                }
                className="text-[10px] text-[#003c70] hover:underline cursor-pointer"
              >
                {modoCreacion === "nuevo" ? "Reutilizar existente" : "Crear nuevo"}
              </button>
            )}
          </div>

          {modoCreacion === "nuevo" ? (
            <div className="space-y-1">
              <Input
                id="nombre-fk-input"
                autoFocus
                value={nombreAtributoNuevo}
                onChange={(e) => setNombreAtributoNuevo(e.target.value)}
                placeholder="ej. id_cliente"
                className="h-8.5 text-xs bg-white focus-visible:ring-[#91bcfb]"
              />
              <p className="text-[10px] text-slate-400">
                Tipo: <b>{atributoReferenciado?.tipoDato || "integer"}</b> · Presiona{" "}
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600">
                  Enter ↵
                </kbd>{" "}
                para confirmar.
              </p>
            </div>
          ) : (
            <select
              value={atributoFkExistenteId}
              onChange={(e) => setAtributoFkExistenteId(e.target.value)}
              className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-xs"
            >
              <option value="">Selecciona un atributo existente...</option>
              {atributosHostDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} : {a.tipoDato}
                </option>
              ))}
            </select>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!puedeConfirmar}
            className="h-8 bg-[#91bcfb] text-[#003c70] font-semibold hover:bg-[#7ab1f9] text-xs"
          >
            Crear relación
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

