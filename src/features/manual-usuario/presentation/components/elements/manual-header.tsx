"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Folder, LogIn, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export interface ManualHeaderProps {
  titulo?: string;
  onVolverAtras?: () => void;
}

export function ManualHeader({
  titulo = "Manual de usuario",
  onVolverAtras,
}: ManualHeaderProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const handleVolverAtras = () => {
    if (onVolverAtras) {
      onVolverAtras();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(isAuthenticated ? "/proyectos" : "/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-colors shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Lado izquierdo: Botón volver atrás + Logo + Título */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleVolverAtras}
            className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:border-lime-400 hover:bg-lime-50 hover:text-slate-950 focus:outline-none"
            title="Volver atrás"
            aria-label="Volver a la página anterior"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <Link
            href={isAuthenticated ? "/proyectos" : "/"}
            className="flex items-center gap-2.5 transition hover:opacity-90"
            title="Drawi"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-lime-300/80 bg-[#d9f99d] text-slate-950 shadow-2xs">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
                viewBox="0 0 40 40"
              >
                <polygon points="20 4 34 12 34 28 20 36 6 28 6 12" />
                <polyline points="20 4 20 20 34 28" />
                <polyline points="20 20 6 28" />
              </svg>
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-extrabold tracking-wider text-slate-900">
                DRAWI
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-slate-500">
                Studio
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-600" />
            <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              {titulo}
            </h1>
            <span className="hidden rounded-full border border-lime-300 bg-lime-100/70 px-2 py-0.5 text-[10px] font-bold text-lime-900 md:inline-block">
              Guía Oficial
            </span>
          </div>
        </div>

        {/* Lado derecho: Acciones contextuales */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Button
              asChild
              size="sm"
              className="gap-2 rounded-xl border border-lime-300/80 bg-[#d9f99d] text-xs font-bold text-slate-950 shadow-2xs transition hover:bg-[#bef264]"
            >
              <Link href="/proyectos">
                <Folder className="h-3.5 w-3.5" />
                <span>Mis Proyectos</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                <Link href="/auth/login" className="flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 rounded-xl border border-blue-200 bg-[#91bcfb] text-xs font-bold text-blue-950 shadow-2xs transition hover:bg-[#7ab1f9]"
              >
                <Link href="/auth/signup">
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>Registrarse</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
