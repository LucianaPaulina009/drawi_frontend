"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Download,
  Folder,
  HelpCircle,
  Layers,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
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
import { authClient } from "@/lib/auth-client";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import { crearProyectoAction } from "@/features/gestion-proyectos/presentation/actions/proyecto.action";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import { NavegacionPaginas } from "./navegacion-paginas";
import { EstadoSincronizacionEditor } from "./estado-sincronizacion-editor";
import { useSalidaEditorPendiente } from "../../hooks/use-salida-editor-pendiente";

export interface EditorHeaderProps {
  proyecto: Proyecto;
  diagramas: Diagrama[];
  diagramaActivoId: string | null;
  creandoPagina: boolean;
  onSeleccionarDiagrama: (id: string) => void;
  onCrearPagina: () => void;
  onRenombrarPagina: (diagrama: Diagrama) => void;
  onEliminarPagina: (diagrama: Diagrama) => void;
  onCrearProyecto?: () => void;
  isCreandoProyecto?: boolean;
  onCompartir?: () => void;
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
  onCrearProyecto,
  isCreandoProyecto,
  onCompartir,
}: EditorHeaderProps) {
  const router = useRouter();
  const [mostrarPaginas, setMostrarPaginas] = useState<boolean>(true);
  const [isCreatingLocal, startCreateTransition] = useTransition();

  const isCreating = isCreandoProyecto ?? isCreatingLocal;

  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const {
    modalSalidaAbierto,
    setModalSalidaAbierto,
    solicitarSalida,
    confirmarSalida,
    totalPendientes,
  } = useSalidaEditorPendiente(session?.user?.id);

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  const handleCrearProyecto = () => {
    if (isCreating) return;
    if (onCrearProyecto) {
      onCrearProyecto();
      return;
    }
    startCreateTransition(async () => {
      try {
        const result = await crearProyectoAction();
        if (result.ok) {
          appToast.success("Proyecto creado con éxito.");
          router.push(`/proyecto/${result.data.slug}`);
        } else {
          const errorMsg = result.errors?.[0] || "No se pudo crear el proyecto.";
          appToast.error("Error al crear", errorMsg);
        }
      } catch {
        appToast.error("Error", "Ocurrió un error inesperado al crear el proyecto.");
      }
    });
  };

  const handleSignOut = () => {
    solicitarSalida(async () => {
      clearJWT();
      const { error } = await authClient.signOut();
      if (error) {
        appToast.error(
          "Error al cerrar sesión",
          "Tuvimos un error al cerrar tu sesión."
        );
        return;
      }
      appToast.info("Cerrando sesión. Hasta luego!");
      router.replace("/auth/login");
    });
  };

  const handleIrAProyectos = () => {
    solicitarSalida(() => {
      router.push("/proyectos");
    });
  };

  return (
    <header className="absolute top-4 inset-x-5 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* Cápsula Flotante Superior Izquierda */}
      <div className="relative pointer-events-auto flex items-center">
        <div className="flex h-14 items-center space-x-2.5 rounded-2xl border border-slate-200 bg-white px-4 shadow-md">
          {/* Menú desplegable del Proyecto */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex h-full cursor-pointer items-center space-x-2 text-slate-900 transition-opacity hover:opacity-80 focus:outline-none"
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
              alignOffset={-16}
              side="bottom"
              sideOffset={12}
              className="min-w-[240px] rounded-2xl p-2 border border-slate-200 shadow-xl bg-white text-slate-800"
            >
              {/* Sección de perfil de usuario */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700">
                <div className="w-7 h-7 rounded-full bg-[#91bcfb] flex items-center justify-center text-[#003c70] text-[11px] font-bold ring-1 ring-black/5 shrink-0 overflow-hidden">
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Usuario"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{isSessionPending ? "..." : userInitials}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold leading-tight text-slate-900 truncate">
                    {isSessionPending
                      ? "Cargando..."
                      : session?.user?.name || "Usuario"}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight truncate">
                    {isSessionPending ? "..." : session?.user?.email || ""}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator className="-mx-1 my-1.5 h-px bg-slate-100" />

              {/* Acción: Nuevo proyecto */}
              <DropdownMenuItem
                onClick={handleCrearProyecto}
                disabled={isCreating}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer focus:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  ) : (
                    <Plus className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="text-xs font-medium">Nuevo proyecto</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Ctrl+N</span>
              </DropdownMenuItem>

              {/* Acción: Todos los proyectos */}
              <DropdownMenuItem
                onClick={handleIrAProyectos}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer focus:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium">Todos los proyectos</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="-mx-1 my-1.5 h-px bg-slate-100" />

              {/* Placeholders visuales estilo Stitch */}
              <DropdownMenuItem
                disabled
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <Save className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium">Guardar cambios</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium">Exportar</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="-mx-1 my-1.5 h-px bg-slate-100" />

              {/* Acción: Cerrar sesión */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-destructive hover:bg-red-50 cursor-pointer focus:bg-red-50 focus:text-destructive"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs font-medium">Cerrar sesión</span>
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
          <div className="absolute top-full mt-3 left-0 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
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
        <EstadoSincronizacionEditor className="shrink-0" />

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
          onClick={onCompartir}
          className="flex h-10 items-center space-x-2 rounded-lg bg-[#91bcfb] px-5 text-xs font-bold text-[#003c70] shadow-xs transition-all hover:bg-[#7ab1f9] active:scale-95 cursor-pointer"
          title="Compartir proyecto"
          aria-label="Compartir"
        >
          <Share2 className="h-4 w-4 stroke-[2.2]" />
          <span>Compartir</span>
        </button>
      </div>

      {/* Diálogo accesible de confirmación de salida cuando hay operaciones pendientes */}
      <AppAlertDialog
        open={modalSalidaAbierto}
        onOpenChange={setModalSalidaAbierto}
        title="Cambios pendientes de sincronización"
        description={`Tienes ${totalPendientes} operación(es) pendiente(s) de sincronizar con el servidor. Se conservarán en este dispositivo, pero no se han confirmado en el servidor todavía. ¿Deseas salir de todas formas?`}
        cancelText="Permanecer en el editor"
        actionText="Salir de todos modos"
        onAction={confirmarSalida}
      />
    </header>
  );
}
