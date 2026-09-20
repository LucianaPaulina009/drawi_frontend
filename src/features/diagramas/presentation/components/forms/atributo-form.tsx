"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import {
  TIPOS_DATO,
  type Atributo,
  type CrearAtributoData,
  type TipoDato,
} from "../../../domain/entities/atributo.entity";
import { CrearAtributoInputSchema } from "../../../infrastructure/schemas/atributo.schemas";

export interface AtributoFormProps {
  atributoInicial?: Atributo | null;
  isPending: boolean;
  onCancelar: () => void;
  onGuardar: (datos: CrearAtributoData) => Promise<string | null>;
}

export function AtributoForm({
  atributoInicial,
  isPending,
  onCancelar,
  onGuardar,
}: AtributoFormProps) {
  const [nombre, setNombre] = useState(atributoInicial?.nombre || "");
  const [tipoDato, setTipoDato] = useState<TipoDato>(
    atributoInicial?.tipoDato || "varchar"
  );
  const [longitud, setLongitud] = useState(
    atributoInicial?.longitud ? String(atributoInicial.longitud) : "255"
  );
  const [precision, setPrecision] = useState(
    atributoInicial?.precision ? String(atributoInicial.precision) : "10"
  );
  const [escala, setEscala] = useState(
    atributoInicial?.escala !== null && atributoInicial?.escala !== undefined
      ? String(atributoInicial.escala)
      : "2"
  );
  const [esLlavePrimaria, setEsLlavePrimaria] = useState(
    Boolean(atributoInicial?.esLlavePrimaria)
  );
  const [permiteNulo, setPermiteNulo] = useState(
    atributoInicial ? atributoInicial.permiteNulo : true
  );
  const [esUnico, setEsUnico] = useState(Boolean(atributoInicial?.esUnico));
  const [valorPorDefecto, setValorPorDefecto] = useState(
    atributoInicial?.valorPorDefecto || ""
  );

  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorTipo, setErrorTipo] = useState<string | null>(null);
  const [errorLongitud, setErrorLongitud] = useState<string | null>(null);
  const [errorPrecision, setErrorPrecision] = useState<string | null>(null);
  const [errorEscala, setErrorEscala] = useState<string | null>(null);

  const esPk = Boolean(atributoInicial?.esLlavePrimaria);
  const esFk = Boolean(atributoInicial?.procedencia === "sistema_fk");
  const esEstructuralBloqueado = esPk || esFk;

  const handleTipoChange = (nuevoTipo: TipoDato) => {
    if (esEstructuralBloqueado) return;
    setTipoDato(nuevoTipo);
    setErrorTipo(null);
  };

  const handlePkChange = (checked: boolean) => {
    if (esEstructuralBloqueado || !esPk) return;
    setEsLlavePrimaria(checked);
    if (checked) {
      setPermiteNulo(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorNombre(null);
    setErrorTipo(null);
    setErrorLongitud(null);
    setErrorPrecision(null);
    setErrorEscala(null);

    let parsedLongitud: number | null = null;
    let parsedPrecision: number | null = null;
    let parsedEscala: number | null = null;

    if (tipoDato === "varchar") {
      const parsed = parseInt(longitud, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorLongitud("La longitud debe ser un número entero mayor a 0.");
        return;
      }
      parsedLongitud = parsed;
    } else if (tipoDato === "decimal") {
      const p = parseInt(precision, 10);
      const e = parseInt(escala, 10);
      if (isNaN(p) || p <= 0) {
        setErrorPrecision("La precisión debe ser un número entero mayor a 0.");
        return;
      }
      if (isNaN(e) || e < 0) {
        setErrorEscala("La escala debe ser un número mayor o igual a 0.");
        return;
      }
      if (e > p) {
        setErrorEscala("La escala no puede superar a la precisión.");
        return;
      }
      parsedPrecision = p;
      parsedEscala = e;
    }

    const payload: CrearAtributoData = {
      nombre: nombre.trim(),
      tipoDato,
      longitud: parsedLongitud,
      precision: parsedPrecision,
      escala: parsedEscala,
      esLlavePrimaria,
      permiteNulo: esLlavePrimaria ? false : permiteNulo,
      esUnico,
      valorPorDefecto: valorPorDefecto.trim() || null,
    };

    const validacion = CrearAtributoInputSchema.safeParse(payload);
    if (!validacion.success) {
      for (const issue of validacion.error.issues) {
        if (issue.path[0] === "nombre") setErrorNombre(issue.message);
        if (issue.path[0] === "longitud") setErrorLongitud(issue.message);
        if (issue.path[0] === "precision") setErrorPrecision(issue.message);
        if (issue.path[0] === "escala") setErrorEscala(issue.message);
      }
      return;
    }

    const error = await onGuardar(payload);
    if (error) {
      setErrorNombre(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-1.5">
        <TextFormField
          id="nombre-atributo"
          name="nombre"
          label="Nombre del atributo"
          placeholder="Ej. correo_electronico, edad"
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (errorNombre) setErrorNombre(null);
          }}
          disabled={isPending}
          maxLength={80}
          aria-invalid={Boolean(errorNombre)}
          aria-describedby={errorNombre ? "error-nombre-atributo" : undefined}
        />
        {errorNombre ? (
          <p id="error-nombre-atributo" className="px-1 text-xs font-medium text-destructive">
            {errorNombre}
          </p>
        ) : null}
      </div>

      {/* Tipo de dato */}
      <div className="space-y-1.5">
        <Label htmlFor="tipo-dato-select" className="text-xs font-medium text-slate-700">
          Tipo de dato
        </Label>
        <select
          id="tipo-dato-select"
          value={tipoDato}
          onChange={(e) => handleTipoChange(e.target.value as TipoDato)}
          disabled={isPending || esEstructuralBloqueado}
          className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {TIPOS_DATO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {errorTipo ? (
          <p className="px-1 text-xs font-medium text-destructive">{errorTipo}</p>
        ) : null}
      </div>

      {/* Campos dependientes del tipo */}
      {tipoDato === "varchar" && (
        <div className="space-y-1.5">
          <Label htmlFor="longitud-atributo" className="text-xs font-medium text-slate-700">
            Longitud máxima
          </Label>
          <Input
            id="longitud-atributo"
            name="longitud"
            type="number"
            placeholder="255"
            value={longitud}
            onChange={(e) => {
              setLongitud(e.target.value);
              if (errorLongitud) setErrorLongitud(null);
            }}
            disabled={isPending || esEstructuralBloqueado}
            min={1}
            max={65535}
            className="h-10 rounded-xl px-3 py-2 text-sm"
            aria-invalid={Boolean(errorLongitud)}
            aria-describedby={errorLongitud ? "error-longitud" : undefined}
          />
          {errorLongitud ? (
            <p id="error-longitud" className="px-1 text-xs font-medium text-destructive">
              {errorLongitud}
            </p>
          ) : null}
        </div>
      )}

      {tipoDato === "decimal" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="precision-atributo" className="text-xs font-medium text-slate-700">
              Precisión (Total)
            </Label>
            <Input
              id="precision-atributo"
              name="precision"
              type="number"
              placeholder="10"
              value={precision}
              onChange={(e) => {
                setPrecision(e.target.value);
                if (errorPrecision) setErrorPrecision(null);
              }}
              disabled={isPending || esEstructuralBloqueado}
              min={1}
              max={100}
              className="h-10 rounded-xl px-3 py-2 text-sm"
              aria-invalid={Boolean(errorPrecision)}
            />
            {errorPrecision ? (
              <p className="px-1 text-xs font-medium text-destructive">{errorPrecision}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="escala-atributo" className="text-xs font-medium text-slate-700">
              Escala (Decimales)
            </Label>
            <Input
              id="escala-atributo"
              name="escala"
              type="number"
              placeholder="2"
              value={escala}
              onChange={(e) => {
                setEscala(e.target.value);
                if (errorEscala) setErrorEscala(null);
              }}
              disabled={isPending || esEstructuralBloqueado}
              min={0}
              max={100}
              className="h-10 rounded-xl px-3 py-2 text-sm"
              aria-invalid={Boolean(errorEscala)}
            />
            {errorEscala ? (
              <p className="px-1 text-xs font-medium text-destructive">{errorEscala}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Restricciones / Flags */}
      <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
        <label className="flex items-center space-x-2.5 cursor-not-allowed opacity-75">
          <input
            type="checkbox"
            id="chk-pk"
            checked={esLlavePrimaria}
            onChange={(e) => handlePkChange(e.target.checked)}
            disabled={true}
            className="size-4 rounded border-slate-300 text-[#003c70] focus:ring-[#91bcfb]"
          />
          <span className="text-xs font-medium text-slate-800">
            Llave Primaria (PK)
          </span>
        </label>

        <label
          className={cn(
            "flex items-center space-x-2.5",
            esLlavePrimaria || esEstructuralBloqueado
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          )}
        >
          <input
            type="checkbox"
            id="chk-null"
            checked={permiteNulo}
            onChange={(e) => setPermiteNulo(e.target.checked)}
            disabled={isPending || esLlavePrimaria || esEstructuralBloqueado}
            className="size-4 rounded border-slate-300 text-[#003c70] focus:ring-[#91bcfb] disabled:opacity-50"
          />
          <span className="text-xs font-medium text-slate-800">
            Permite nulos (NULL)
          </span>
        </label>

        <label
          className={cn(
            "flex items-center space-x-2.5",
            esEstructuralBloqueado
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          )}
        >
          <input
            type="checkbox"
            id="chk-unique"
            checked={esUnico}
            onChange={(e) => setEsUnico(e.target.checked)}
            disabled={isPending || esEstructuralBloqueado}
            className="size-4 rounded border-slate-300 text-[#003c70] focus:ring-[#91bcfb]"
          />
          <span className="text-xs font-medium text-slate-800">
            Restricción única (UNIQUE)
          </span>
        </label>
      </div>

      {/* Valor por defecto */}
      <div className="space-y-1.5">
        <TextFormField
          id="default-atributo"
          name="valorPorDefecto"
          label="Valor por defecto"
          placeholder="Ej. 'PENDIENTE', 0, true"
          type="text"
          value={valorPorDefecto}
          onChange={(e) => setValorPorDefecto(e.target.value)}
          disabled={isPending || esEstructuralBloqueado}
          maxLength={100}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelar}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-app-primary text-app-primary-foreground hover:bg-app-primary/90"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="size-4" />
              Guardando...
            </span>
          ) : (
            "Guardar atributo"
          )}
        </Button>
      </div>
    </form>
  );
}
