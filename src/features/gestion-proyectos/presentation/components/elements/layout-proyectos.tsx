"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Folder, LogOut, Plus, Star } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { crearProyectoAction } from "../../actions/proyecto.action";
import { ComentariosEquipo } from "./comentarios-equipo";

interface LayoutProyectosProps {
  children: ReactNode;
}

export function LayoutProyectos({ children }: LayoutProyectosProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();

  const handleCrearProyecto = () => {
    startCreateTransition(async () => {
      try {
        const result = await crearProyectoAction();
        if (result.ok) {
          appToast.success("Proyecto creado con éxito.");
          router.push(`/proyecto/${result.data.slug}`);
        } else {
          appToast.error(
            "Error al crear",
            result.errors[0] || "No se pudo crear el proyecto."
          );
        }
      } catch {
        appToast.error(
          "Error",
          "Ocurrió un error inesperado al crear el proyecto."
        );
      }
    });
  };

  const handleCerrarSesion = async () => {
    clearJWT();
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/login");
          },
        },
      });
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  const esFavoritos = pathname === "/proyectos/favoritos";
  const esProyectos = pathname === "/proyectos";

  return (
    <div
      className="flex h-full min-h-screen w-full overflow-hidden bg-[#f9fafb] text-slate-900"
      data-purpose="dashboard-wrapper"
    >
      {/* Barra de Navegación Lateral Izquierda (Stitch) */}
      <aside
        className="z-20 flex w-20 shrink-0 select-none flex-col items-center justify-between border-r border-slate-900/60 bg-[#090d16] py-7"
        data-purpose="left-navigation"
      >
        {/* Logo Drawi Hexagonal */}
        <div className="flex flex-col items-center">
          <Link
            href="/proyectos"
            className="flex h-10 w-10 cursor-pointer items-center justify-center transition hover:scale-105"
            title="Drawi"
          >
            <svg
              className="h-9 w-9 text-[#d9f99d]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 40 40"
            >
              <polygon points="20 4 34 12 34 28 20 36 6 28 6 12" />
              <polyline points="20 4 20 20 34 28" />
              <polyline points="20 20 6 28" />
            </svg>
          </Link>
        </div>

        {/* Lista de Iconos de Navegación */}
        <nav className="my-auto flex flex-col items-center space-y-7">
          {/* Botón: Crear Proyecto */}
          <button
            type="button"
            onClick={handleCrearProyecto}
            disabled={isCreating}
            className="group flex h-10 w-10 items-center justify-center rounded-2xl bg-white font-bold text-slate-900 shadow-sm transition duration-150 hover:bg-[#d9f99d] focus:outline-none"
            title="Nuevo Proyecto / Canvas"
          >
            {isCreating ? (
              <Spinner className="h-5 w-5 text-slate-900" />
            ) : (
              <Plus className="h-5 w-5 stroke-[2.5]" />
            )}
          </button>

          {/* Enlace: Mis Proyectos */}
          <Link
            href="/proyectos"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition duration-150 focus:outline-none",
              esProyectos
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
            title="Mis Proyectos"
          >
            <Folder className="h-5 w-5" />
          </Link>

          {/* Enlace: Favoritos */}
          <Link
            href="/proyectos/favoritos"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition duration-150 focus:outline-none",
              esFavoritos
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
            title="Favoritos"
          >
            <Star
              className={cn("h-5 w-5", esFavoritos && "fill-current")}
            />
          </Link>
        </nav>

        {/* Botón: Cerrar Sesión */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="flex h-10 w-10 items-center justify-center text-gray-500 transition duration-150 hover:text-white focus:outline-none"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Área de Contenido Central */}
      <main
        className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8"
        data-purpose="central-workspace"
      >
        {/* Contenido inyectado por las páginas hijas */}
        {children}
      </main>

      {/* Panel Derecho: Comentarios del Equipo */}
      <div className="hidden xl:block p-6 md:p-8 pl-0">
        <ComentariosEquipo />
      </div>
    </div>
  );
}
