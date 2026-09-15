"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Download,
  Folder,
  HelpCircle,
  Layers,
  MessageSquare,
  Save,
  Share2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import { NavegacionPaginas } from "./navegacion-paginas";

export interface EditorHeaderProps {
  proyecto: Proyecto;
  diagramas: Diagrama[];
  diagramaActivoId: string | null;
  creandoPagina: boolean;
  onSeleccionarDiagrama: (id: string) => void;
  onCrearPagina: () => void;
  onRenombrarPagina: (diagrama: Diagrama) => void;
  onEliminarPagina: (diagrama: Diagrama) => void;
}

export function EditorHeader({
  proyecto,
  diagramas,
  diagramaActivoId,
  creandoPagina,
  onSeleccionarDiagrama,
  onCrearPagina,
  onRenombrarPagina,
  onEliminarPagina,
}: EditorHeaderProps) {
  const [mostrarPaginas, setMostrarPaginas] = useState<boolean>(true);

  return (
    <header className="absolute top-4 inset-x-5 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* Cápsula Flotante Superior Izquierda */}
      <div className="relative pointer-events-auto flex items-center">
        <div className="flex h-14 items-center space-x-2.5 rounded-2xl border border-slate-200 bg-white px-4 shadow-md">
          {/* Menú desplegable del Proyecto */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex cursor-pointer items-center space-x-2 text-slate-900 transition-opacity hover:opacity-80 focus:outline-none"
                title="Menú del proyecto"
                aria-label={`Menú del proyecto ${proyecto.nombre}`}
              >
                {/* Icono de diagrama estilo Stitch */}
                <div className="flex h-5 w-4 shrink-0 items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-xs bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-xs" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-600" />
                <span className="max-w-[160px] truncate text-xs font-bold tracking-tight text-[#0f172a] sm:max-w-[240px]">
                  {proyecto.nombre}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[220px] rounded-2xl p-1.5 shadow-xl"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/proyectos"
                  className="flex items-center gap-2.5 text-xs font-medium text-slate-700"
                >
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span>Todos los proyectos</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between text-xs font-medium text-slate-700"
                disabled
              >
                <div className="flex items-center gap-2.5">
                  <Save className="h-4 w-4 text-slate-500" />
                  <span>Guardar cambios</span>
                </div>
                <span className="text-[10px] text-slate-400">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between text-xs font-medium text-slate-700"
                disabled
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Exportar</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Botón para alternar visibilidad del gestor de páginas */}
          <button
            type="button"
            onClick={() => setMostrarPaginas((prev) => !prev)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
              mostrarPaginas
                ? "bg-purple-100 text-purple-700"
                : "text-[#64748b] hover:bg-slate-100 hover:text-[#0f172a]"
            }`}
            title="Ver páginas"
            aria-label="Ver páginas"
            aria-expanded={mostrarPaginas}
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Gestor de Páginas Flotante */}
        {mostrarPaginas && (
          <div className="absolute top-16 left-0 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <NavegacionPaginas
              diagramas={diagramas}
              diagramaActivoId={diagramaActivoId}
              creandoPagina={creandoPagina}
              onSeleccionarDiagrama={onSeleccionarDiagrama}
              onCrearPagina={onCrearPagina}
              onRenombrarPagina={onRenombrarPagina}
              onEliminarPagina={onEliminarPagina}
            />
          </div>
        )}
      </div>

      {/* Cápsula Flotante Superior Derecha */}
      <div className="pointer-events-auto flex h-14 items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-md">
        {/* Ayuda */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#475569] transition-colors hover:bg-slate-100 hover:text-[#0f172a]"
          title="Ayuda"
          aria-label="Ayuda"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Comentarios */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#475569] transition-colors hover:bg-slate-100 hover:text-[#0f172a]"
          title="Comentarios"
          aria-label="Comentarios"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

        {/* Compartir */}
        <button
          type="button"
          className="flex h-10 items-center space-x-2 rounded-lg bg-[#91bcfb] px-5 text-xs font-bold text-[#003c70] shadow-xs transition-all hover:bg-[#7ab1f9] active:scale-95"
          title="Compartir proyecto"
          aria-label="Compartir"
        >
          <Share2 className="h-4 w-4 stroke-[2.2]" />
          <span>Compartir</span>
        </button>
      </div>
    </header>
  );
}
