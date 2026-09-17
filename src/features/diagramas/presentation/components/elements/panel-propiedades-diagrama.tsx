"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  KeyRound,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Clase } from "../../../domain/entities/clase.entity";

export type ModoPanelPropiedades = "clase" | "crear-atributo" | "editar-atributo";

export interface PanelPropiedadesDiagramaProps {
  clase: Clase | null;
  atributoSeleccionado: Atributo | null;
  modo: ModoPanelPropiedades;
  puedeEditar: boolean;
  isPending: boolean;
  onCerrar: () => void;
  onCambiarModo: (
    modo: ModoPanelPropiedades,
    atributo?: Atributo | null
  ) => void;
  onGuardarNombreClase: (nuevoNombre: string) => Promise<string | null>;
  onGuardarAtributo: (datos: CrearAtributoData) => Promise<string | null>;
  onEliminarClaseTrigger: (clase: Clase) => void;
  onCopiarAtributo: (atributo: Atributo) => void;
  onReordenarAtributo: (
    idClase: string,
    idAtributo: string,
    nuevoOrden: number
  ) => void;
}

export function PanelPropiedadesDiagrama({
  clase,
  atributoSeleccionado,
  modo,
  puedeEditar,
  isPending,
  onCerrar,
  onCambiarModo,
  onGuardarNombreClase,
  onGuardarAtributo,
  onEliminarClaseTrigger,
  onCopiarAtributo,
  onReordenarAtributo,
}: PanelPropiedadesDiagramaProps) {
  if (!clase) return null;

  return (
    <aside
      className="absolute top-20 right-5 z-30 flex w-80 max-h-[calc(100vh-6.5rem)] flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-right-4 font-sans select-none"
      data-purpose="diagram-properties-panel"
      aria-label="Panel de propiedades"
    >
      {modo === "clase" && (
        <VistaPropiedadesClase
          key={clase.id}
          clase={clase}
          puedeEditar={puedeEditar}
          isPending={isPending}
          onCerrar={onCerrar}
          onAgregarAtributo={() => onCambiarModo("crear-atributo")}
          onSeleccionarAtributo={(attr) =>
            onCambiarModo("editar-atributo", attr)
          }
          onGuardarNombre={onGuardarNombreClase}
          onEliminarClase={() => onEliminarClaseTrigger(clase)}
          onCopiarAtributo={onCopiarAtributo}
          onReordenarAtributo={onReordenarAtributo}
        />
      )}

      {modo === "crear-atributo" && (
        <VistaFormularioAtributo
          key={`nuevo-attr-${clase.id}`}
          titulo="Nuevo Atributo"
          subtitulo={`Clase: ${clase.nombre}`}
          atributoInicial={null}
          puedeEditar={puedeEditar}
          isPending={isPending}
          onVolver={() => onCambiarModo("clase")}
          onCerrar={onCerrar}
          onGuardar={onGuardarAtributo}
        />
      )}

      {modo === "editar-atributo" && atributoSeleccionado && (
        <VistaFormularioAtributo
          key={`editar-attr-${atributoSeleccionado.id}`}
          titulo="Editar Atributo"
          subtitulo={`Clase: ${clase.nombre}`}
          atributoInicial={atributoSeleccionado}
          puedeEditar={puedeEditar}
          isPending={isPending}
          onVolver={() => onCambiarModo("clase")}
          onCerrar={onCerrar}
          onGuardar={onGuardarAtributo}
        />
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Selector TipoDato integrado con DropdownMenu
// ─────────────────────────────────────────────────────────────────────────────

interface SelectorTipoDatoProps {
  value: TipoDato;
  onChange: (value: TipoDato) => void;
  disabled?: boolean;
}

function SelectorTipoDato({ value, onChange, disabled }: SelectorTipoDatoProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:border-slate-300 focus:border-[#91bcfb] focus:outline-none focus:ring-2 focus:ring-[#91bcfb]/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          aria-label="Seleccionar tipo de dato"
        >
          <span className="font-mono text-xs font-bold text-slate-800">
            {value}
          </span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="min-w-64 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl text-slate-800"
      >
        {TIPOS_DATO.map((tipo) => {
          const isSelected = tipo === value;
          return (
            <DropdownMenuItem
              key={tipo}
              onClick={() => onChange(tipo)}
              className={cn(
                "flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors",
                isSelected
                  ? "bg-[#e0f2fe] text-[#003c70] font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="font-mono">{tipo}</span>
              {isSelected && <Check className="size-3.5 text-[#003c70]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Vista de Clase
// ─────────────────────────────────────────────────────────────────────────────

interface VistaPropiedadesClaseProps {
  clase: Clase;
  puedeEditar: boolean;
  isPending: boolean;
  onCerrar: () => void;
  onAgregarAtributo: () => void;
  onSeleccionarAtributo: (attr: Atributo) => void;
  onGuardarNombre: (nuevoNombre: string) => Promise<string | null>;
  onEliminarClase: () => void;
  onCopiarAtributo: (attr: Atributo) => void;
  onReordenarAtributo: (
    idClase: string,
    idAtributo: string,
    nuevoOrden: number
  ) => void;
}

function VistaPropiedadesClase({
  clase,
  puedeEditar,
  isPending,
  onCerrar,
  onAgregarAtributo,
  onSeleccionarAtributo,
  onGuardarNombre,
  onEliminarClase,
  onCopiarAtributo,
  onReordenarAtributo,
}: VistaPropiedadesClaseProps) {
  const [nombre, setNombre] = useState(clase.nombre);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const handleGuardarNombre = async (e?: FormEvent) => {
    e?.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setErrorNombre("El nombre de la clase no puede estar vacío.");
      return;
    }
    if (cleanNombre === clase.nombre) return;

    setGuardandoNombre(true);
    setErrorNombre(null);
    const err = await onGuardarNombre(cleanNombre);
    setGuardandoNombre(false);
    if (err) {
      setErrorNombre(err);
    }
  };

  const atributos = clase.atributos || [];

  const handleMoverArriba = (atributo: Atributo) => {
    const index = atributos.findIndex((a) => a.id === atributo.id);
    if (index > 0) {
      const nuevoOrden = atributos[index - 1].ordenDePosicion;
      onReordenarAtributo(clase.id, atributo.id, nuevoOrden);
    }
  };

  const handleMoverAbajo = (atributo: Atributo) => {
    const index = atributos.findIndex((a) => a.id === atributo.id);
    if (index < atributos.length - 1) {
      const nuevoOrden = atributos[index + 1].ordenDePosicion;
      onReordenarAtributo(clase.id, atributo.id, nuevoOrden);
    }
  };

  const renderTipo = (attr: Atributo) => {
    if (attr.tipoDato === "varchar" && attr.longitud) {
      return `varchar(${attr.longitud})`;
    }
    if (
      attr.tipoDato === "decimal" &&
      attr.precision !== null &&
      attr.precision !== undefined
    ) {
      return `decimal(${attr.precision}${
        attr.escala !== null && attr.escala !== undefined
          ? `, ${attr.escala}`
          : ""
      })`;
    }
    return attr.tipoDato;
  };

  return (
    <>
      {/* Header con Título Visible y Destacado */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4.5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-3 rounded-full bg-[#91bcfb] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              Propiedades de la Clase
            </h2>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {clase.nombre}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Cerrar panel"
          aria-label="Cerrar panel de propiedades"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4.5 space-y-4 max-h-[calc(100vh-14rem)]">
        {/* Formulario de Nombre de Clase */}
        <form onSubmit={handleGuardarNombre} className="space-y-2">
          <TextFormField
            id="panel-nombre-clase"
            name="nombreClase"
            label="Nombre de la tabla / clase"
            placeholder="Ej. Usuario, Factura"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorNombre) setErrorNombre(null);
            }}
            onBlur={() => {
              if (nombre.trim() && nombre.trim() !== clase.nombre) {
                handleGuardarNombre();
              }
            }}
            disabled={!puedeEditar || isPending || guardandoNombre}
            maxLength={50}
            aria-invalid={Boolean(errorNombre)}
          />
          {errorNombre && (
            <p className="text-[11px] font-medium text-destructive">
              {errorNombre}
            </p>
          )}
          {nombre.trim() !== clase.nombre && (
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs bg-[#91bcfb] text-[#003c70] font-bold hover:bg-[#7ab1f9] rounded-lg px-3"
                disabled={!puedeEditar || isPending || guardandoNombre}
              >
                {guardandoNombre ? (
                  <Spinner className="size-3" />
                ) : (
                  "Guardar nombre"
                )}
              </Button>
            </div>
          )}
        </form>

        <div className="h-px bg-slate-100" />

        {/* Sección de Atributos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Atributos ({atributos.length})
            </span>
            {puedeEditar && (
              <button
                type="button"
                onClick={onAgregarAtributo}
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#003c70] hover:bg-blue-100 transition-colors"
              >
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </button>
            )}
          </div>

          {/* Lista de Atributos */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
            {atributos.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 italic">
                Sin atributos. Añade uno con el botón superior.
              </div>
            ) : (
              atributos.map((attr, idx) => (
                <div
                  key={attr.id}
                  onClick={() => onSeleccionarAtributo(attr)}
                  className={cn(
                    "group/item flex items-center justify-between gap-1.5 p-2 transition-colors cursor-pointer hover:bg-white",
                    attr.esLlavePrimaria && "bg-blue-50/40"
                  )}
                  title="Clic para editar atributo"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {attr.esLlavePrimaria ? (
                      <KeyRound className="size-3.5 shrink-0 text-[#003c70]" />
                    ) : (
                      <div className="size-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs text-slate-800 truncate font-medium",
                        attr.esLlavePrimaria && "font-bold text-slate-900"
                      )}
                    >
                      {attr.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {renderTipo(attr)}
                    </span>
                    {attr.esLlavePrimaria && (
                      <span className="rounded bg-[#e0f2fe] px-1 py-0.2 text-[9px] font-bold text-[#003c70]">
                        PK
                      </span>
                    )}
                    {!attr.permiteNulo && !attr.esLlavePrimaria && (
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                        NN
                      </span>
                    )}
                    {attr.esUnico && (
                      <span className="rounded bg-[#f3e8ff] px-1 py-0.2 text-[9px] font-bold text-[#6b21a8]">
                        UQ
                      </span>
                    )}
                  </div>

                  {/* Acciones de reordenar y duplicar */}
                  {puedeEditar && (
                    <div
                      className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleMoverArriba(attr)}
                        disabled={idx === 0}
                        className="flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                        title="Mover arriba"
                      >
                        <ChevronUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoverAbajo(attr)}
                        disabled={idx === atributos.length - 1}
                        className="flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                        title="Mover abajo"
                      >
                        <ChevronDown className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopiarAtributo(attr)}
                        className="flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        title="Duplicar atributo"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Acciones Secundarias */}
        {puedeEditar && (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEliminarClase}
              disabled={isPending}
              className="w-full h-8 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200 rounded-xl"
            >
              <Trash2 className="size-3.5 mr-1.5 text-slate-400" />
              Eliminar clase
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Formulario Simplificado de Atributo
// ─────────────────────────────────────────────────────────────────────────────

interface VistaFormularioAtributoProps {
  titulo: string;
  subtitulo: string;
  atributoInicial?: Atributo | null;
  puedeEditar: boolean;
  isPending: boolean;
  onVolver: () => void;
  onCerrar: () => void;
  onGuardar: (datos: CrearAtributoData) => Promise<string | null>;
}

function VistaFormularioAtributo({
  titulo,
  subtitulo,
  atributoInicial,
  puedeEditar,
  isPending,
  onVolver,
  onCerrar,
  onGuardar,
}: VistaFormularioAtributoProps) {
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

  // Sección colapsable de opciones avanzadas
  const [mostrarAvanzadas, setMostrarAvanzadas] = useState(
    Boolean(atributoInicial?.esUnico || atributoInicial?.valorPorDefecto)
  );

  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorLongitud, setErrorLongitud] = useState<string | null>(null);
  const [errorPrecision, setErrorPrecision] = useState<string | null>(null);
  const [errorEscala, setErrorEscala] = useState<string | null>(null);

  const handlePkChange = (checked: boolean) => {
    setEsLlavePrimaria(checked);
    if (checked) {
      setPermiteNulo(false);
    }
  };

  const handleTipoChange = (nuevoTipo: TipoDato) => {
    setTipoDato(nuevoTipo);
    setErrorLongitud(null);
    setErrorPrecision(null);
    setErrorEscala(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorNombre(null);
    setErrorLongitud(null);
    setErrorPrecision(null);
    setErrorEscala(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setErrorNombre("El nombre del atributo es obligatorio.");
      return;
    }

    let parsedLongitud: number | null = null;
    let parsedPrecision: number | null = null;
    let parsedEscala: number | null = null;

    if (tipoDato === "varchar") {
      const parsed = parseInt(longitud, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorLongitud("El máximo de caracteres debe ser mayor a 0.");
        return;
      }
      parsedLongitud = parsed;
    } else if (tipoDato === "decimal") {
      const p = parseInt(precision, 10);
      const esc = parseInt(escala, 10);
      if (isNaN(p) || p <= 0) {
        setErrorPrecision("La cantidad de dígitos debe ser mayor a 0.");
        return;
      }
      if (isNaN(esc) || esc < 0) {
        setErrorEscala("El número de decimales debe ser mayor o igual a 0.");
        return;
      }
      if (esc > p) {
        setErrorEscala("Los decimales no pueden superar la cantidad total de dígitos.");
        return;
      }
      parsedPrecision = p;
      parsedEscala = esc;
    }

    const payload: CrearAtributoData = {
      nombre: cleanNombre,
      tipoDato,
      longitud: parsedLongitud,
      precision: parsedPrecision,
      escala: parsedEscala,
      esLlavePrimaria,
      permiteNulo: esLlavePrimaria ? false : permiteNulo,
      esUnico,
      valorPorDefecto: valorPorDefecto.trim() || null,
    };

    const err = await onGuardar(payload);
    if (err) {
      setErrorNombre(err);
    }
  };

  return (
    <>
      {/* Header con Título Visible y Destacado */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onVolver}
            className="flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Volver a la clase"
            aria-label="Volver a propiedades de la clase"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {titulo}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {subtitulo}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Cerrar panel"
          aria-label="Cerrar panel de propiedades"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Formulario Simplificado */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[calc(100vh-14rem)]"
      >
        {/* Nombre del Atributo */}
        <div className="space-y-1">
          <TextFormField
            id="panel-nombre-atributo"
            name="nombreAtributo"
            label="Nombre del atributo"
            placeholder="Ej. id, email, precio"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorNombre) setErrorNombre(null);
            }}
            disabled={!puedeEditar || isPending}
            maxLength={50}
            autoFocus
            aria-invalid={Boolean(errorNombre)}
          />
          {errorNombre && (
            <p className="text-[11px] font-medium text-destructive">
              {errorNombre}
            </p>
          )}
        </div>

        {/* Selector TipoDato integrado al sistema UI */}
        <div className="space-y-1.5">
          <Label
            htmlFor="panel-tipo-dato"
            className="text-xs font-semibold text-slate-700"
          >
            Tipo de dato
          </Label>
          <SelectorTipoDato
            value={tipoDato}
            onChange={handleTipoChange}
            disabled={!puedeEditar || isPending}
          />
        </div>

        {/* Campos Condicionales: VARCHAR -> Máximo de caracteres */}
        {tipoDato === "varchar" && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <Label
              htmlFor="panel-longitud"
              className="text-xs font-medium text-slate-700"
            >
              Máximo de caracteres
            </Label>
            <Input
              id="panel-longitud"
              name="longitud"
              type="number"
              min={1}
              max={65535}
              value={longitud}
              onChange={(e) => {
                setLongitud(e.target.value);
                if (errorLongitud) setErrorLongitud(null);
              }}
              disabled={!puedeEditar || isPending}
              className="h-8 rounded-xl text-xs"
            />
            {errorLongitud && (
              <p className="text-[11px] font-medium text-destructive">
                {errorLongitud}
              </p>
            )}
          </div>
        )}

        {/* Campos Condicionales: DECIMAL -> Cantidad total de dígitos & Número de decimales */}
        {tipoDato === "decimal" && (
          <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <Label
                htmlFor="panel-precision"
                className="text-xs font-medium text-slate-700"
              >
                Cantidad total de dígitos
              </Label>
              <Input
                id="panel-precision"
                name="precision"
                type="number"
                min={1}
                max={65}
                value={precision}
                onChange={(e) => {
                  setPrecision(e.target.value);
                  if (errorPrecision) setErrorPrecision(null);
                }}
                disabled={!puedeEditar || isPending}
                className="h-8 rounded-xl text-xs"
              />
              {errorPrecision && (
                <p className="text-[11px] font-medium text-destructive">
                  {errorPrecision}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="panel-escala"
                className="text-xs font-medium text-slate-700"
              >
                Número de decimales
              </Label>
              <Input
                id="panel-escala"
                name="escala"
                type="number"
                min={0}
                max={30}
                value={escala}
                onChange={(e) => {
                  setEscala(e.target.value);
                  if (errorEscala) setErrorEscala(null);
                }}
                disabled={!puedeEditar || isPending}
                className="h-8 rounded-xl text-xs"
              />
              {errorEscala && (
                <p className="text-[11px] font-medium text-destructive">
                  {errorEscala}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modificadores Principales: Llave primaria y Permite nulos */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esLlavePrimaria}
              onChange={(e) => handlePkChange(e.target.checked)}
              disabled={!puedeEditar || isPending}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-800">
              Llave Primaria (PK)
            </span>
          </label>

          <label
            className={cn(
              "flex items-center gap-2",
              esLlavePrimaria
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            )}
          >
            <input
              type="checkbox"
              checked={esLlavePrimaria ? false : permiteNulo}
              onChange={(e) => setPermiteNulo(e.target.checked)}
              disabled={!puedeEditar || isPending || esLlavePrimaria}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700">
              Permite Nulos (NULLABLE)
            </span>
          </label>
        </div>

        {/* Sección Colapsable: Opciones Avanzadas */}
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setMostrarAvanzadas((prev) => !prev)}
            className="flex w-full items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
          >
            <span>Opciones avanzadas</span>
            {mostrarAvanzadas ? (
              <ChevronUp className="size-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="size-3.5 text-slate-400" />
            )}
          </button>

          {mostrarAvanzadas && (
            <div className="space-y-2.5 pt-2 animate-in fade-in duration-150">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esUnico}
                  onChange={(e) => setEsUnico(e.target.checked)}
                  disabled={!puedeEditar || isPending}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  Restricción Única (UNIQUE)
                </span>
              </label>

              <div className="space-y-1">
                <Label
                  htmlFor="panel-default-val"
                  className="text-[11px] font-medium text-slate-600"
                >
                  Valor por defecto
                </Label>
                <Input
                  id="panel-default-val"
                  name="valorPorDefecto"
                  type="text"
                  placeholder="Ej. 'activo', 0"
                  value={valorPorDefecto}
                  onChange={(e) => setValorPorDefecto(e.target.value)}
                  disabled={!puedeEditar || isPending}
                  className="h-8 rounded-xl text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVolver}
              disabled={isPending}
              className="flex-1 h-8 rounded-xl text-xs font-medium border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!puedeEditar || isPending}
              className="flex-1 h-8 rounded-xl text-xs font-bold bg-[#91bcfb] text-[#003c70] hover:bg-[#7ab1f9]"
            >
              {isPending ? (
                <Spinner className="size-3.5" />
              ) : atributoInicial ? (
                "Guardar cambios"
              ) : (
                "Guardar atributo"
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
