"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ControlIAProps {
  className?: string;
}

export function ControlIA({ className }: ControlIAProps) {
  return (
    <div
      aria-label="Asistente de inteligencia artificial"
      className={cn(
        "fixed right-0 bottom-0 z-40 flex flex-col items-end select-none pointer-events-none group",
        className
      )}
    >
      <div
        className="pointer-events-auto relative cursor-pointer"
        title="Asistente IA (Disponible en próximas fases)"
        role="button"
        tabIndex={0}
        aria-label="Abrir Asistente IA"
      >
        {/* Insignia flotante con icono / avatar de IA */}
        <div className="flex h-24 w-24 translate-x-6 translate-y-6 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl transition-all duration-300 hover:scale-105">
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d9f99d]/50 via-[#bfdbfe]/50 to-[#91bcfb]/60">
            <Sparkles className="h-8 w-8 text-[#003c70] transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        {/* Indicador de estado activo (Matcha status dot) */}
        <span className="absolute top-2 right-8 z-10 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#91bcfb] opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#91bcfb]" />
        </span>
      </div>
    </div>
  );
}
