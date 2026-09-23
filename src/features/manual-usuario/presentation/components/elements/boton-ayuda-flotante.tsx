"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BotonAyudaFlotanteProps {
  href?: string;
  className?: string;
}

export function BotonAyudaFlotante({
  href = "/manual-de-usuario",
  className,
}: BotonAyudaFlotanteProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2",
        className
      )}
    >
      <Link
        href={href}
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-md transition-all duration-200 hover:scale-105 hover:border-lime-400 hover:bg-lime-50/80 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
        title="Manual de usuario"
        aria-label="Manual de usuario"
      >
        <HelpCircle className="h-6 w-6 text-slate-700 transition-all duration-200 group-hover:rotate-12 group-hover:text-lime-800" />

        {/* Tooltip flotante al hacer hover */}
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
          Manual de usuario
        </span>
      </Link>
    </div>
  );
}
