"use client";

import { useTransition } from "react";
import { Ban, Check, ChevronDown, MoreVertical, Trash2, Unlock } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { MiembroProyecto, RolColaborador } from "../../../domain/entities/colaborador.entity";
import {
  bloquearColaboradorAction,
  cambiarRolAction,
  desbloquearColaboradorAction,
  removerColaboradorAction,
} from "../../actions/colaborador.action";

interface ItemMiembroFilaProps {
  proyectoId: string;
  miembro: MiembroProyecto;
  esUsuarioPropietario: boolean;
  onMiembroActualizado: () => void;
}

const NOMBRES_ROLES: Record<string, string> = {
  propietario: "Propietario",
  editor: "Editor",
  ver: "Lector",
  comentarista: "Comentador",
};

export function ItemMiembroFila({
  proyectoId,
  miembro,
  esUsuarioPropietario,
  onMiembroActualizado,
}: ItemMiembroFilaProps) {
  const [isPending, startTransition] = useTransition();

  const handleCambiarRol = (nuevoRol: RolColaborador) => {
    if (miembro.esPropietario || nuevoRol === miembro.rol) return;

    startTransition(async () => {
      try {
        const res = await cambiarRolAction(proyectoId, miembro.id, {
          rol: nuevoRol as "ver" | "editor" | "comentarista",
        });
        if (res.ok) {
          appToast.success(`Rol cambiado a ${NOMBRES_ROLES[nuevoRol] || nuevoRol}.`);
          onMiembroActualizado();
        } else {
          appToast.error("Error al cambiar rol", res.errors?.[0] || "No se pudo actualizar el rol.");
        }
      } catch {
        appToast.error("Error", "Error inesperado al cambiar el rol.");
      }
    });
  };

  const handleRemover = () => {
    if (miembro.esPropietario) return;

    startTransition(async () => {
      try {
        const res = await removerColaboradorAction(proyectoId, miembro.id);
        if (res.ok) {
          appToast.success(`${miembro.nombre} fue removido del proyecto.`);
          onMiembroActualizado();
        } else {
          appToast.error("Error al remover", res.errors?.[0] || "No se pudo remover al miembro.");
        }
      } catch {
        appToast.error("Error", "Error inesperado al remover al miembro.");
      }
    });
  };

  const handleBloquear = () => {
    if (miembro.esPropietario) return;

    startTransition(async () => {
      try {
        const res = await bloquearColaboradorAction(proyectoId, miembro.id);
        if (res.ok) {
          appToast.success(`${miembro.nombre} fue bloqueado.`);
          onMiembroActualizado();
        } else {
          appToast.error("Error al bloquear", res.errors?.[0] || "No se pudo bloquear al miembro.");
        }
      } catch {
        appToast.error("Error", "Error inesperado al bloquear al miembro.");
      }
    });
  };

  const handleDesbloquear = () => {
    if (miembro.esPropietario) return;

    startTransition(async () => {
      try {
        const res = await desbloquearColaboradorAction(proyectoId, miembro.id);
        if (res.ok) {
          appToast.success(`${miembro.nombre} fue desbloqueado.`);
          onMiembroActualizado();
        } else {
          appToast.error("Error al desbloquear", res.errors?.[0] || "No se pudo desbloquear al miembro.");
        }
      } catch {
        appToast.error("Error", "Error inesperado al desbloquear al miembro.");
      }
    });
  };

  const iniciales = miembro.nombre
    ? miembro.nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  const estaBloqueado = miembro.estado === "bloqueado";

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
        estaBloqueado ? "bg-red-50/50 border border-red-100" : "hover:bg-slate-50"
      } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Información del usuario */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        <div className="w-8 h-8 rounded-full bg-[#91bcfb] flex items-center justify-center text-[#003c70] text-xs font-bold ring-1 ring-black/5 shrink-0 overflow-hidden">
          {miembro.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miembro.avatarUrl}
              alt={miembro.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{iniciales}</span>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 truncate">
              {miembro.nombre}
            </span>
            {estaBloqueado && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                Bloqueado
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            {miembro.email || "Sin correo"}
          </span>
        </div>
      </div>

      {/* Selector de Rol y Menú de Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        {miembro.esPropietario ? (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
            Propietario
          </span>
        ) : esUsuarioPropietario ? (
          <>
            {/* Dropdown de cambio de Rol */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isPending || estaBloqueado}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 focus:outline-none disabled:opacity-50"
                  aria-label={`Cambiar rol de ${miembro.nombre}`}
                >
                  <span>{NOMBRES_ROLES[miembro.rol] || miembro.rol}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl bg-white p-1 shadow-lg border border-slate-200">
                <DropdownMenuItem
                  onClick={() => handleCambiarRol("ver")}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <span>Lector</span>
                  {miembro.rol === "ver" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCambiarRol("editor")}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <span>Editor</span>
                  {miembro.rol === "editor" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCambiarRol("comentarista")}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <span>Comentador</span>
                  {miembro.rol === "comentarista" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menú de Opciones (Bloquear / Desbloquear / Remover) */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isPending}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none"
                  aria-label={`Acciones para ${miembro.nombre}`}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white p-1 shadow-lg border border-slate-200">
                {estaBloqueado ? (
                  <DropdownMenuItem
                    onClick={handleDesbloquear}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer text-slate-700 hover:bg-slate-50"
                  >
                    <Unlock className="w-3.5 h-3.5 text-green-600" />
                    <span>Desbloquear</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={handleBloquear}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer text-amber-700 hover:bg-amber-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bloquear</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-slate-100" />
                <DropdownMenuItem
                  onClick={handleRemover}
                  className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
            {NOMBRES_ROLES[miembro.rol] || miembro.rol}
          </span>
        )}
      </div>
    </div>
  );
}
