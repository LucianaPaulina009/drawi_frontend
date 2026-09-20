"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, ChevronLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TipoRelacion } from "../../../domain/entities/relacion.entity";

export function esCardinalidadValida(valor: string): boolean {
  const v = valor.trim();
  if (v === "*" || /^\d+$/.test(v)) return true;
  const match = v.match(/^(\d+)\.\.(\d+|\*)$/);
  if (!match) return false;
  const min = parseInt(match[1], 10);
  if (match[2] === "*") return true;
  const max = parseInt(match[2], 10);
  return min <= max;
}

interface TipoUmlDef {
  valor: TipoRelacion;
  etiqueta: string;
  descripcion: string;
  requiereCardinalidad: boolean;
  badge?: string;
  icon: React.ReactNode;
}

const TIPOS_UML: TipoUmlDef[] = [
  {
    valor: "asociacion",
    etiqueta: "Asociación",
    descripcion: "Línea continua simple",
    requiereCardinalidad: true,
    badge: "1..*",
    icon: (
      <svg
        className="size-5 text-slate-400 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
      </svg>
    ),
  },
  {
    valor: "asociacion_dirigida",
    etiqueta: "Dirigida",
    descripcion: "Línea continua con flecha",
    requiereCardinalidad: true,
    icon: (
      <svg
        className="size-5 text-slate-400 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
    ),
  },
  {
    valor: "herencia",
    etiqueta: "Herencia",
    descripcion: "Línea con triángulo hueco",
    requiereCardinalidad: false,
    icon: (
      <svg
        className="size-5 text-[#003c70] transition-colors"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="15" y1="12" y2="12" />
        <polygon fill="white" points="15,8 21,12 15,16" stroke="currentColor" />
      </svg>
    ),
  },
  {
    valor: "realizacion",
    etiqueta: "Realización",
    descripcion: "Discontinua con triángulo",
    requiereCardinalidad: false,
    icon: (
      <svg
        className="size-5 text-slate-400 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeDasharray="2 2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="15" y1="12" y2="12" />
        <polygon fill="white" points="15,8 21,12 15,16" stroke="currentColor" strokeDasharray="none" />
      </svg>
    ),
  },
  {
    valor: "dependencia",
    etiqueta: "Dependencia",
    descripcion: "Discontinua con flecha",
    requiereCardinalidad: false,
    icon: (
      <svg
        className="size-5 text-slate-400 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeDasharray="2 2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <polyline points="14 6 20 12 14 18" strokeDasharray="none" />
      </svg>
    ),
  },
  {
    valor: "agregacion",
    etiqueta: "Agregación",
    descripcion: "Rombo hueco en el origen",
    requiereCardinalidad: true,
    icon: (
      <svg
        className="size-5 text-slate-400 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="14" y1="12" y2="12" />
        <polygon fill="white" points="14,12 17.5,8.5 21,12 17.5,15.5" stroke="currentColor" />
      </svg>
    ),
  },
  {
    valor: "composicion",
    etiqueta: "Composición",
    descripcion: "Rombo relleno en el origen",
    requiereCardinalidad: true,
    icon: (
      <svg
        className="size-5 text-slate-700 transition-colors group-hover:text-[#003c70]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="4" x2="14" y1="12" y2="12" />
        <polygon fill="#334155" points="14,12 17.5,8.5 21,12 17.5,15.5" stroke="currentColor" />
      </svg>
    ),
  },
];

const PRESETS_STITCH = [
  { origen: "0..*", destino: "1", titulo: "N..1 (Muchos a Uno)", subtitulo: "FK en origen" },
  { origen: "1", destino: "0..*", titulo: "1..N (Uno a Muchos)", subtitulo: "FK en destino" },
  { origen: "1", destino: "1", titulo: "1..1 (Uno a Uno)", subtitulo: "Exactamente uno" },
  { origen: "0..1", destino: "1", titulo: "0..1 (Cero a Uno)", subtitulo: "Opcional a Uno" },
  { origen: "1..*", destino: "1", titulo: "1..* (Uno a N a 1)", subtitulo: "Al menos 1 a Uno" },
  { origen: "0..*", destino: "0..*", titulo: "*..* (Muchos a Muchos)", subtitulo: "Libre N:M" },
];

export interface PanelRelacionesProps {
  abierto: boolean;
  tipo?: TipoRelacion;
  cardinalidades: [string, string];
  conexionPendiente: boolean;
  onCerrar: () => void;
  onElegirTipo: (tipo: TipoRelacion, requiere: boolean) => void;
  onElegirCardinalidad: (origen: string, destino: string) => void;
  onActualizarCardinalidades: (origen: string, destino: string) => void;
  onIntercambiar: () => void;
  onCancelarConexion: () => void;
  onVolverTipos?: () => void;
  onVolverCardinalidad?: () => void;
}

export function PanelRelaciones({
  abierto,
  tipo,
  cardinalidades,
  conexionPendiente,
  onCerrar,
  onElegirTipo,
  onElegirCardinalidad,
  onActualizarCardinalidades,
  onIntercambiar,
  onCancelarConexion,
  onVolverTipos,
  onVolverCardinalidad,
}: PanelRelacionesProps) {
  const [modoPersonalizado, setModoPersonalizado] = useState(false);

  if (!abierto) return null;

  const definicion = TIPOS_UML.find((item) => item.valor === tipo);

  return (
    <aside
      className="fixed left-6 top-20 z-40 w-72 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl flex flex-col gap-3 pointer-events-auto select-none backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
      aria-label="Panel de relaciones UML"
      id="uml-tools-panel"
    >
      {/* Cabecera Stitch */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#91bcfb]" aria-hidden="true" />
          <span className="text-xs font-bold tracking-tight text-slate-800 uppercase">
            {tipo && definicion ? definicion.etiqueta : "Herramientas UML"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="size-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1 cursor-pointer"
          title="Cerrar panel"
          aria-label="Cerrar panel de relaciones"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Vista 1: Selector de tipos en 2 columnas */}
      {!tipo && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Relaciones
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2" id="uml-relations-grid">
            {TIPOS_UML.map((item) => (
              <button
                key={item.valor}
                type="button"
                onClick={() => onElegirTipo(item.valor, item.requiereCardinalidad)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-[#91bcfb] hover:bg-slate-50 transition-all text-slate-700 hover:text-slate-900 group text-center gap-1.5 cursor-pointer"
                title={item.descripcion}
              >
                {item.icon}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium leading-none">
                    {item.etiqueta}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.5 bg-[#91bcfb]/20 text-[#003c70] font-bold rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vista 2: Selector de cardinalidades Stitch en 2 columnas */}
      {tipo && definicion?.requiereCardinalidad && !conexionPendiente && (
        <div className="flex flex-col gap-2" id="uml-cardinality-grid">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setModoPersonalizado(false);
                onVolverTipos?.();
              }}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#003c70] hover:text-[#0f172a] hover:underline cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              <span>Volver a Relaciones</span>
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Cardinalidad
            </span>
          </div>

          {!modoPersonalizado ? (
            <div className="grid grid-cols-2 gap-2">
              {PRESETS_STITCH.map((p) => {
                const seleccionado =
                  cardinalidades[0] === p.origen && cardinalidades[1] === p.destino;
                return (
                  <button
                    key={`${p.origen}-${p.destino}`}
                    type="button"
                    onClick={() => {
                      onActualizarCardinalidades(p.origen, p.destino);
                      onElegirCardinalidad(p.origen, p.destino);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl transition-all text-center gap-1 cursor-pointer",
                      seleccionado
                        ? "border-2 border-[#91bcfb] bg-[#91bcfb]/10 text-slate-800 shadow-xs"
                        : "border border-slate-100 hover:border-[#91bcfb] hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold">
                      <span className={seleccionado ? "text-[#003c70]" : "text-slate-500"}>
                        {p.origen}
                      </span>
                      <span
                        className={cn(
                          "h-0.5 flex-1 mx-1.5",
                          seleccionado ? "bg-[#91bcfb]" : "bg-slate-300"
                        )}
                      />
                      <span className={seleccionado ? "text-[#003c70]" : "text-slate-500"}>
                        {p.destino}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-800">
                      {p.titulo}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal leading-tight">
                      {p.subtitulo}
                    </span>
                  </button>
                );
              })}

              {/* Botón de preset Personalizado */}
              <button
                type="button"
                onClick={() => setModoPersonalizado(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-300 hover:border-[#91bcfb] hover:bg-slate-50 transition-all text-slate-700 hover:text-slate-900 text-center gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-center w-full px-1 text-[10px] font-bold text-slate-400 gap-1">
                  <Plus className="size-3.5 text-slate-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-800">
                  Personalizado
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-tight">
                  Definir valor
                </span>
              </button>
            </div>
          ) : (
            <CardinalidadPersonalizadaForm
              cardinalidades={cardinalidades}
              onVolverPresets={() => setModoPersonalizado(false)}
              onConfirmar={(orig, dest) => {
                onActualizarCardinalidades(orig, dest);
                onElegirCardinalidad(orig, dest);
              }}
            />
          )}
        </div>
      )}

      {/* Vista 3: Modo Conexión Activo */}
      {tipo && conexionPendiente && (
        <div className="flex flex-col gap-2.5 pt-0.5">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                if (definicion?.requiereCardinalidad) {
                  onVolverCardinalidad?.();
                } else {
                  onVolverTipos?.();
                }
              }}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#003c70] hover:text-[#0f172a] hover:underline cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              <span>
                {definicion?.requiereCardinalidad
                  ? "Volver a Cardinalidad"
                  : "Volver a Relaciones"}
              </span>
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Conexión
            </span>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-[#003c70]">
            <p className="font-semibold">Modo conexión activo</p>
            <p className="mt-1 text-[11px] text-slate-600">
              Haz clic y arrastra desde un conector de la Clase <b>Origen</b> hacia la
              Clase <b>Destino</b>.
            </p>
          </div>

          {definicion?.requiereCardinalidad && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
              <span className="text-slate-700 text-[11px]">
                Origen: <b>{cardinalidades[0]}</b> &nbsp;|&nbsp; Destino: <b>{cardinalidades[1]}</b>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onIntercambiar}
                className="h-7 text-xs px-2 cursor-pointer"
                title="Invertir origen y destino"
              >
                <ArrowLeftRight className="mr-1 size-3" /> Invertir
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full text-xs cursor-pointer"
            onClick={onCancelarConexion}
          >
            Cancelar conexión
          </Button>
        </div>
      )}
    </aside>
  );
}

function CardinalidadPersonalizadaForm({
  cardinalidades,
  onVolverPresets,
  onConfirmar,
}: {
  cardinalidades: [string, string];
  onVolverPresets: () => void;
  onConfirmar: (origen: string, destino: string) => void;
}) {
  const [origenInput, setOrigenInput] = useState(cardinalidades[0]);
  const [destinoInput, setDestinoInput] = useState(cardinalidades[1]);

  const origenValido = useMemo(() => esCardinalidadValida(origenInput), [origenInput]);
  const destinoValido = useMemo(() => esCardinalidadValida(destinoInput), [destinoInput]);
  const valido = origenValido && destinoValido;

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">Rango personalizado</span>
        <button
          type="button"
          onClick={onVolverPresets}
          className="text-[10px] text-[#003c70] hover:underline"
        >
          Ver presets
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-slate-500">Origen</label>
          <Input
            value={origenInput}
            onChange={(e) => setOrigenInput(e.target.value)}
            placeholder="ej. 1..*"
            className={cn(
              "h-8 bg-white text-xs mt-0.5",
              !origenValido && "border-red-500 focus-visible:ring-red-500"
            )}
            aria-label="Cardinalidad origen"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500">Destino</label>
          <Input
            value={destinoInput}
            onChange={(e) => setDestinoInput(e.target.value)}
            placeholder="ej. 0..1"
            className={cn(
              "h-8 bg-white text-xs mt-0.5",
              !destinoValido && "border-red-500 focus-visible:ring-red-500"
            )}
            aria-label="Cardinalidad destino"
          />
        </div>
      </div>
      {!valido && (
        <p className="text-[10px] text-red-500">
          Formato inválido. Use *, n, o min..max (donde min ≤ max).
        </p>
      )}
      <Button
        type="button"
        disabled={!valido}
        className="w-full bg-[#91bcfb] text-[#003c70] font-semibold hover:bg-[#7ab1f9] h-8 text-xs"
        onClick={() => onConfirmar(origenInput.trim(), destinoInput.trim())}
      >
        <Check className="mr-1.5 size-3.5" /> Aplicar y conectar
      </Button>
    </div>
  );
}

