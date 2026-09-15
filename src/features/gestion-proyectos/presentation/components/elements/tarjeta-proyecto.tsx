"use client";

import Link from "next/link";
import {
  ChevronRight,
  Coins,
  MoreHorizontal,
  Package,
  Pencil,
  Star,
  Trash2,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type {
  ColorProyecto,
  Proyecto,
} from "../../../domain/entities/proyecto.entity";

interface ColorConfig {
  bg: string;
  border: string;
  text: string;
  badgeText: string;
  wireframeStroke: string;
  starColor: string;
}

const COLOR_CONFIGS: Record<ColorProyecto, ColorConfig> = {
  celeste: {
    bg: "bg-[#bfdbfe]",
    border: "border-blue-200/80",
    text: "text-blue-950",
    badgeText: "text-blue-700",
    wireframeStroke: "stroke-blue-700",
    starColor: "text-blue-600",
  },
  verde: {
    bg: "bg-[#d9f99d]",
    border: "border-lime-200/80",
    text: "text-slate-900",
    badgeText: "text-lime-800",
    wireframeStroke: "stroke-lime-700",
    starColor: "text-lime-700",
  },
  rojo: {
    bg: "bg-[#fecdd3]",
    border: "border-rose-200/80",
    text: "text-rose-950",
    badgeText: "text-rose-700",
    wireframeStroke: "stroke-rose-600",
    starColor: "text-rose-600",
  },
  azul: {
    bg: "bg-[#93c5fd]",
    border: "border-blue-300/80",
    text: "text-blue-950",
    badgeText: "text-blue-800",
    wireframeStroke: "stroke-blue-700",
    starColor: "text-blue-700",
  },
  naranja: {
    bg: "bg-[#fed7aa]",
    border: "border-orange-200/80",
    text: "text-orange-950",
    badgeText: "text-orange-800",
    wireframeStroke: "stroke-orange-600",
    starColor: "text-orange-600",
  },
  amarillo: {
    bg: "bg-[#fef08a]",
    border: "border-amber-200/80",
    text: "text-amber-950",
    badgeText: "text-amber-800",
    wireframeStroke: "stroke-amber-600",
    starColor: "text-amber-600",
  },
  morado: {
    bg: "bg-[#ddd6fe]",
    border: "border-purple-200/80",
    text: "text-purple-950",
    badgeText: "text-purple-800",
    wireframeStroke: "stroke-purple-600",
    starColor: "text-purple-600",
  },
};

const DEFAULT_COLOR_CONFIG: ColorConfig = {
  bg: "bg-slate-100",
  border: "border-slate-200",
  text: "text-slate-900",
  badgeText: "text-slate-700",
  wireframeStroke: "stroke-slate-400",
  starColor: "text-amber-500",
};

export function IconoProyectoRender({
  icono,
  className,
}: {
  icono: string;
  className?: string;
}) {
  switch (icono) {
    case "finanza":
      return <TrendingUp className={className} />;
    case "almacen":
      return <Warehouse className={className} />;
    case "estrella":
      return <Star className={className} />;
    case "dinero":
      return <Coins className={className} />;
    case "caja":
    default:
      return <Package className={className} />;
  }
}

export function formatearFechaProyecto(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return "Actualizado recientemente";
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Editado hace un momento";
    if (diffMin < 60) return `Editado hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24)
      return `Editado hace ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"}`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return "Actualizado ayer";
    if (diffDias < 7) return `Actualizado hace ${diffDias} días`;
    return `Actualizado el ${fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })}`;
  } catch {
    return "Actualizado recientemente";
  }
}

export interface TarjetaProyectoProps {
  proyecto: Proyecto;
  onToggleFavorito?: (proyecto: Proyecto) => void;
  onEditar?: (proyecto: Proyecto) => void;
  onEliminar?: (proyecto: Proyecto) => void;
}

export function TarjetaProyecto({
  proyecto,
  onToggleFavorito,
  onEditar,
  onEliminar,
}: TarjetaProyectoProps) {
  const colorConfig = COLOR_CONFIGS[proyecto.color] ?? DEFAULT_COLOR_CONFIG;

  return (
    <div
      className={cn(
        "group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-sm transition duration-200 hover:shadow-md",
        colorConfig.bg,
        colorConfig.border,
        "border"
      )}
    >
      {/* Gráfico decorativo de fondo Stitch */}
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 flex w-3/5 items-center justify-end pr-2 opacity-30">
        <svg
          className={cn("h-56 w-56", colorConfig.wireframeStroke)}
          fill="none"
          strokeWidth="1.2"
          viewBox="0 0 100 100"
        >
          <polygon
            points="50 15 85 35 85 75 50 95 15 75 15 35"
            stroke="currentColor"
            strokeDasharray="3,3"
          />
          <polyline points="50 15 50 55 85 75" stroke="currentColor" />
          <polyline points="50 55 15 75" stroke="currentColor" />
          <polygon
            points="50 35 70 47 70 70 50 82 30 70 30 47"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Cabecera de la tarjeta: Badge de icono y acciones */}
      <div className="z-10 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 shadow-sm">
          <IconoProyectoRender
            icono={proyecto.icono}
            className={cn("h-6 w-6", colorConfig.badgeText)}
          />
        </div>

        <div className="flex items-center space-x-2">
          {proyecto.esFavorito ? (
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm",
                colorConfig.starColor
              )}
              title="Proyecto favorito"
            >
              <Star className="h-5 w-5 fill-current" />
            </span>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm transition hover:bg-white hover:text-black focus:outline-none"
                title="Opciones de proyecto"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border-gray-100/90 py-1.5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 px-3.5 py-2 text-xs font-medium"
                onClick={() => onToggleFavorito?.(proyecto)}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    proyecto.esFavorito
                      ? "fill-amber-500 text-amber-500"
                      : "text-gray-500"
                  )}
                />
                <span>
                  {proyecto.esFavorito
                    ? "Desmarcar de favoritos"
                    : "Agregar a favoritos"}
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2.5 px-3.5 py-2 text-xs font-medium"
                onClick={() => onEditar?.(proyecto)}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                <span>Editar información</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-gray-100" />

              <DropdownMenuItem
                className="cursor-pointer gap-2.5 px-3.5 py-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onEliminar?.(proyecto)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pie de la tarjeta: Título, fecha y enlace navegable */}
      <Link
        href={`/proyecto/${proyecto.slug}`}
        className="z-10 mt-6 flex items-end justify-between"
      >
        <div className="min-w-0 flex-1 pr-2">
          <h3
            className={cn(
              "truncate text-2xl font-extrabold tracking-tight leading-tight",
              colorConfig.text
            )}
            title={proyecto.nombre}
          >
            {proyecto.nombre}
          </h3>
          <p
            className={cn(
              "mt-1 text-xs font-semibold opacity-80",
              colorConfig.text
            )}
          >
            {formatearFechaProyecto(proyecto.fechaActualizacion)}
          </p>
        </div>

        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center font-bold",
            colorConfig.text
          )}
        >
          <ChevronRight className="h-5 w-5 transform transition group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}
