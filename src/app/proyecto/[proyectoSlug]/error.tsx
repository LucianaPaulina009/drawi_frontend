"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ProyectoSlugErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProyectoSlugError({
  error,
  reset,
}: ProyectoSlugErrorProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h1 className="text-lg font-bold text-slate-900">
          No se pudo cargar el proyecto
        </h1>
        <p className="mt-2 text-xs text-gray-500">
          {error.message ||
            "Ocurrió un error inesperado al consultar las páginas del proyecto."}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full text-xs font-semibold"
          >
            <Link href="/proyectos" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a proyectos</span>
            </Link>
          </Button>

          <Button
            onClick={() => reset()}
            className="rounded-full border border-lime-300 bg-[#d9f99d] text-xs font-bold text-slate-900 shadow-sm transition hover:bg-lime-400"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            <span>Reintentar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
