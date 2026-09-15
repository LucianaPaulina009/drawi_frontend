"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { Proyecto } from "../../../domain/entities/proyecto.entity";
import {
  agregarFavoritoAction,
  desmarcarFavoritoAction,
  eliminarProyectoAction,
} from "../../actions/proyecto.action";
import { EditarProyectoForm } from "../forms/editar-proyecto-form";
import { NotificacionesProyectos } from "./notificaciones-proyectos";
import {
  SelectorProyectos,
  type VistaSelectorProyectos,
} from "./selector-proyectos";
import { TarjetaProyecto } from "./tarjeta-proyecto";

export interface ListaProyectosProps {
  proyectosIniciales: Proyecto[];
  titulo?: string;
  esFavoritos?: boolean;
}

export function ListaProyectos({
  proyectosIniciales,
  titulo = "Mis Proyectos",
  esFavoritos = false,
}: ListaProyectosProps) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [vistaActiva, setVistaActiva] =
    useState<VistaSelectorProyectos>("mis-proyectos");
  const [isPendingDelete, setIsPendingDelete] = useState(false);

  // Estados de modales
  const [proyectoAEditar, setProyectoAEditar] = useState<Proyecto | null>(null);
  const [proyectoAEliminar, setProyectoAEliminar] = useState<Proyecto | null>(
    null
  );

  // Búsqueda local puramente en memoria
  const proyectosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return proyectosIniciales;
    return proyectosIniciales.filter((p) =>
      p.nombre.toLowerCase().includes(termino)
    );
  }, [proyectosIniciales, busqueda]);

  // Manejador: Alternar Favorito
  const handleToggleFavorito = async (proyecto: Proyecto) => {
    try {
      const result = proyecto.esFavorito
        ? await desmarcarFavoritoAction(proyecto.id)
        : await agregarFavoritoAction(proyecto.id);

      if (result.ok) {
        appToast.success(
          proyecto.esFavorito
            ? "Proyecto quitado de favoritos."
            : "Proyecto agregado a favoritos."
        );
        router.refresh();
      } else {
        appToast.error(
          "Error",
          result.errors[0] || "No se pudo actualizar el estado de favorito."
        );
      }
    } catch {
      appToast.error("Error", "Error al cambiar favorito.");
    }
  };

  // Manejador: Confirmar Eliminación
  const handleConfirmarEliminar = async () => {
    if (!proyectoAEliminar) return;

    setIsPendingDelete(true);
    try {
      const result = await eliminarProyectoAction(proyectoAEliminar.id);
      if (result.ok) {
        appToast.success("Proyecto eliminado correctamente.");
        setProyectoAEliminar(null);
        router.refresh();
      } else {
        appToast.error(
          "Error al eliminar",
          result.errors[0] || "No se pudo eliminar el proyecto."
        );
      }
    } catch {
      appToast.error("Error", "Error al eliminar el proyecto.");
    } finally {
      setIsPendingDelete(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Barra superior de Búsqueda y Notificaciones alineados (Stitch) */}
      <header className="relative z-40 mb-7 flex items-center justify-between gap-4">
        <div className="relative max-w-xl flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search className="h-5 w-5" />
          </span>
          <Input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={
              esFavoritos
                ? "Buscar en favoritos..."
                : "Buscar proyecto..."
            }
            className="h-12 w-full rounded-full border-gray-100 bg-white pl-11 pr-5 text-sm font-medium shadow-sm transition placeholder:text-gray-400 focus:ring-2 focus:ring-lime-400"
          />
        </div>

        <NotificacionesProyectos />
      </header>

      {/* Encabezado de sección con Título, Contador y Switch/Tabs (Stitch) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {titulo}
          </h2>
          <span className="inline-flex items-center justify-center rounded-full border border-lime-200 bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
            {vistaActiva === "mis-proyectos" ? proyectosFiltrados.length : 0}{" "}
            {(vistaActiva === "mis-proyectos" ? proyectosFiltrados.length : 0) === 1
              ? "proyecto"
              : "proyectos"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <SelectorProyectos
            vistaActiva={vistaActiva}
            onCambioVista={setVistaActiva}
          />
        </div>
      </div>

      {/* Listado de proyectos o Estados Vacíos */}
      {vistaActiva === "compartidos-conmigo" ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/60 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No tienes proyectos compartidos
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Cuando otros miembros del equipo compartan proyectos contigo, aparecerán aquí.
          </p>
        </div>
      ) : proyectosIniciales.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/60 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-50 text-lime-700">
            <FolderPlus className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {esFavoritos
              ? "No tienes proyectos favoritos"
              : "Aún no tienes proyectos"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            {esFavoritos
              ? "Marca tus proyectos importantes con la estrella para acceder rápidamente desde aquí."
              : "Comienza creando tu primer proyecto con diagramas UML y flujos de arquitectura desde el botón + en la barra lateral."}
          </p>
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Sin resultados para &ldquo;{busqueda}&rdquo;
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Intenta con otro término o limpia la búsqueda para ver todos los proyectos.
          </p>
          <Button
            variant="outline"
            onClick={() => setBusqueda("")}
            className="mt-4 rounded-full text-xs font-semibold"
          >
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {proyectosFiltrados.map((proyecto) => (
            <TarjetaProyecto
              key={proyecto.id}
              proyecto={proyecto}
              onToggleFavorito={handleToggleFavorito}
              onEditar={(p) => setProyectoAEditar(p)}
              onEliminar={(p) => setProyectoAEliminar(p)}
            />
          ))}
        </div>
      )}

      {/* Diálogo de Edición */}
      {proyectoAEditar ? (
        <AppDialog
          open={!!proyectoAEditar}
          onOpenChange={(open) => {
            if (!open) setProyectoAEditar(null);
          }}
          title="Editar información del proyecto"
          description="Actualiza el nombre, ícono o color temático de tu proyecto."
          size="md"
        >
          <EditarProyectoForm
            proyecto={proyectoAEditar}
            onSuccess={() => {
              setProyectoAEditar(null);
              router.refresh();
            }}
            onCancel={() => setProyectoAEditar(null)}
          />
        </AppDialog>
      ) : null}

      {/* Diálogo de Confirmación para Eliminar */}
      <AppAlertDialog
        open={!!proyectoAEliminar}
        onOpenChange={(open) => {
          if (!open) setProyectoAEliminar(null);
        }}
        title="¿Eliminar proyecto?"
        description="Esta acción no se puede deshacer. El proyecto y sus diagramas asociados serán eliminados permanentemente."
        cancelText="Cancelar"
        actionText={
          isPendingDelete ? "Eliminando..." : "Eliminar definitivamente"
        }
        actionDisabled={isPendingDelete}
        onAction={handleConfirmarEliminar}
      />
    </div>
  );
}
