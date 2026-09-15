"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Proyecto } from "../../../domain/entities/proyecto.entity";
import {
  formatearFechaProyecto,
  IconoProyectoRender,
} from "./tarjeta-proyecto";

const COLOR_AVATAR_CLASSES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  celeste: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  verde: {
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-200",
  },
  rojo: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  azul: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
  },
  naranja: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  amarillo: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  morado: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
};

const DEFAULT_AVATAR_CLASSES = {
  bg: "bg-slate-50",
  text: "text-slate-700",
  border: "border-slate-200",
};

export interface ItemProyectoProps {
  proyecto: Proyecto;
  onToggleFavorito?: (proyecto: Proyecto) => void;
  onEditar?: (proyecto: Proyecto) => void;
  onEliminar?: (proyecto: Proyecto) => void;
}

export function ItemProyecto({
  proyecto,
  onToggleFavorito,
  onEditar,
  onEliminar,
}: ItemProyectoProps) {
  const avatarStyle =
    COLOR_AVATAR_CLASSES[proyecto.color] ?? DEFAULT_AVATAR_CLASSES;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100/80 bg-white px-5 py-4 shadow-sm transition duration-150 hover:shadow-md">
      {/* Información izquierda con enlace al lienzo */}
      <Link
        href={`/proyecto/${proyecto.slug}`}
        className="flex min-w-0 flex-1 items-center space-x-4 pr-3"
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
            avatarStyle.bg,
            avatarStyle.text,
            avatarStyle.border
          )}
        >
          <IconoProyectoRender
            icono={proyecto.icono}
            className="h-6 w-6"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className="truncate text-sm font-bold text-gray-900"
            title={proyecto.nombre}
          >
            {proyecto.nombre}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatearFechaProyecto(proyecto.fechaActualizacion)}
          </p>
        </div>
      </Link>

      {/* Acciones y menú contextual derecho */}
      <div className="flex items-center space-x-2">
        {proyecto.esFavorito ? (
          <span
            className="flex h-8 w-8 items-center justify-center text-amber-500"
            title="Proyecto favorito"
          >
            <Star className="h-4 w-4 fill-current" />
          </span>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 p-1.5 text-gray-700 transition hover:bg-gray-200 focus:outline-none"
              title="Opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border-gray-100/90 py-1.5 shadow-lg"
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
  );
}
