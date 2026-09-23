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
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-slate-950 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:border-[#d9f99d]/60 hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
        title="Manual de usuario"
        aria-label="Manual de usuario"
      >
        <HelpCircle className="h-6 w-6 text-[#d9f99d] transition-transform duration-200 group-hover:rotate-12" />

        {/* Tooltip flotante al hacer hover */}
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl border border-black/10 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
          Manual de usuario
        </span>
      </Link>
    </div>
  );
}
