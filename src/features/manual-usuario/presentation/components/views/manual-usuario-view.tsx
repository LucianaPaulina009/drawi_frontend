"use client";

import Link from "next/link";
import { ArrowUp, BookOpen, ChevronRight, Folder, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type {
  EnlaceIndiceTOC,
  SeccionManual,
} from "../../../domain/entities/seccion-manual.entity";
import { ManualHeader } from "../elements/manual-header";
import { TablaContenidosTOC } from "../elements/tabla-contenidos-toc";
import { SeccionManualCard } from "../elements/seccion-manual-card";

export interface ManualUsuarioViewProps {
  secciones: SeccionManual[];
  enlacesTOC: EnlaceIndiceTOC[];
}

export function ManualUsuarioView({
  secciones,
  enlacesTOC,
}: ManualUsuarioViewProps) {
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-[#d9f99d] selection:text-slate-950">
      {/* Fondo con Iluminación Ambiental Atmosférica Sutil */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[130px]" />
        <div className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full bg-lime-100/60 blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[450px] w-[450px] rounded-full bg-purple-100/40 blur-[140px]" />
      </div>

      {/* Cabecera Fija */}
      <ManualHeader />

      {/* Contenido Principal */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Hero */}
        <div className="relative mb-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/90 p-6 shadow-sm sm:p-10 lg:p-12">
          {/* Gráfico decorativo hexagonal de fondo */}
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-10">
            <svg
              className="h-80 w-80 text-lime-800"
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

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-100/70 px-3 py-1 text-xs font-bold text-lime-900 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-lime-700" />
              <span>Documentación & Guía Completa de la Plataforma</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Manual de usuario de{" "}
              <span className="bg-gradient-to-r from-lime-600 via-emerald-600 to-sky-600 bg-clip-text text-transparent">
                Drawi
              </span>
            </h1>

            <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
              Aprende a diseñar arquitecturas de software visuales con diagramas de
              clases UML en tiempo real, colaboración multiusuario, asistencia de
              Inteligencia Artificial y generación instantánea de código backend en
              Spring Boot.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                className="gap-2 rounded-xl border border-lime-300/80 bg-[#d9f99d] px-5 text-xs font-bold text-slate-950 shadow-2xs transition hover:bg-[#bef264]"
              >
                <Link href={isAuthenticated ? "/proyectos" : "/auth/signup"}>
                  {isAuthenticated ? (
                    <>
                      <Folder className="h-4 w-4" />
                      <span>Ir a mis proyectos</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Comenzar gratis</span>
                    </>
                  )}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("crear-proyectos");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950"
              >
                <BookOpen className="h-4 w-4 text-sky-600" />
                <span>Explorar secciones</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de accesos rápidos para móviles (< lg) */}
        <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-none lg:hidden print:hidden">
          <div className="flex gap-2">
            {enlacesTOC.map((enlace) => (
              <button
                key={enlace.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(enlace.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-md transition hover:border-lime-400 hover:text-slate-950"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-lime-100 text-[10px] font-bold text-lime-800">
                  {enlace.numero}
                </span>
                <span>{enlace.titulo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout en dos columnas: Tabla de Contenidos (TOC) + Secciones */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Columna Izquierda: Índice Pegajoso (Desktop) */}
          <aside className="hidden lg:col-span-4 lg:block print:hidden">
            <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md">
              <TablaContenidosTOC enlaces={enlacesTOC} />
            </div>
          </aside>

          {/* Columna Derecha: Secciones del Manual */}
          <section className="space-y-10 lg:col-span-8 print:w-full">
            {secciones.map((seccion) => (
              <SeccionManualCard key={seccion.id} seccion={seccion} />
            ))}
          </section>
        </div>
      </main>

      {/* Botón flotante para volver al inicio de página */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:border-lime-400 hover:bg-lime-50 hover:text-slate-950 focus:outline-none print:hidden"
        title="Volver arriba"
        aria-label="Volver arriba de la página"
      >
        <ArrowUp className="h-5 w-5 text-slate-800" />
      </button>

      {/* Pie de Página */}
      <footer className="relative z-10 mt-20 border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl space-y-3 px-4">
          <p>© {new Date().getFullYear()} DRAWI Studio. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-slate-600">
            <Link href="/" className="transition hover:text-slate-900">
              Inicio
            </Link>
            <span>•</span>
            <Link href="/manual-de-usuario" className="font-semibold text-slate-900 transition hover:text-lime-700">
              Manual de usuario
            </Link>
            <span>•</span>
            <Link href="/proyectos" className="transition hover:text-slate-900">
              Proyectos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
