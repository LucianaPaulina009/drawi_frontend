"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  FileCode2,
  FolderPlus,
  Layers,
  Network,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnlaceIndiceTOC } from "../../../domain/entities/seccion-manual.entity";

const ICON_MAP: Record<string, LucideIcon> = {
  FolderPlus,
  Users,
  Layers,
  Network,
  Sparkles,
  Code2,
  FileCode2,
};

export interface TablaContenidosTOCProps {
  enlaces: EnlaceIndiceTOC[];
  className?: string;
}

export function TablaContenidosTOC({
  enlaces,
  className,
}: TablaContenidosTOCProps) {
  const [seccionActiva, setSeccionActiva] = useState<string>(
    enlaces[0]?.id || ""
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSeccionActiva(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0.1,
      }
    );

    enlaces.forEach((enlace) => {
      const elemento = document.getElementById(enlace.id);
      if (elemento) {
        observer.observe(elemento);
      }
    });

    return () => observer.disconnect();
  }, [enlaces]);

  const handleNavegar = (id: string) => {
    setSeccionActiva(id);
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className={cn("flex flex-col space-y-1 select-none", className)}
      aria-label="Tabla de contenidos del manual"
    >
      <div className="mb-3 px-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-lime-800">
          Contenido del Manual
        </p>
        <p className="text-xs font-medium text-slate-500">7 secciones temáticas</p>
      </div>

      <div className="space-y-1">
        {enlaces.map((enlace) => {
          const Icono = ICON_MAP[enlace.icono] || Layers;
          const esActivo = seccionActiva === enlace.id;

          return (
            <button
              key={enlace.id}
              type="button"
              onClick={() => handleNavegar(enlace.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-all duration-150 focus:outline-none",
                esActivo
                  ? "border border-lime-300/80 bg-lime-50/90 font-bold text-slate-950 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold transition-colors",
                  esActivo
                    ? "border border-lime-400 bg-[#d9f99d] text-slate-950 shadow-2xs"
                    : "border border-slate-200 bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800"
                )}
              >
                {enlace.numero}
              </span>

              <Icono
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  esActivo
                    ? "text-lime-800"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />

              <span className="truncate">{enlace.titulo}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
