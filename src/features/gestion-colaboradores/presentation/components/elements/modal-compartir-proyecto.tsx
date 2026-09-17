"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import { ListaMiembrosModal } from "./lista-miembros-modal";
import { SeccionInvitacionModal } from "./seccion-invitacion-modal";

interface ModalCompartirProyectoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyecto: Proyecto;
  esUsuarioPropietario: boolean;
}

export function ModalCompartirProyecto({
  open,
  onOpenChange,
  proyecto,
  esUsuarioPropietario,
}: ModalCompartirProyectoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-2xl bg-white p-0 text-slate-800 shadow-2xl border border-slate-200"
        aria-describedby="dialog-descripcion-compartir"
      >
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-slate-900">
              Compartir proyecto
            </DialogTitle>
            <DialogDescription
              id="dialog-descripcion-compartir"
              className="text-xs text-slate-500"
            >
              Invita a colaboradores y gestiona los permisos de acceso para este proyecto.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Sección de enlace de invitación */}
          <SeccionInvitacionModal
            proyectoId={proyecto.id}
            esUsuarioPropietario={esUsuarioPropietario}
          />

          <div className="border-t border-slate-100" />

          {/* Sección de miembros y roles */}
          <ListaMiembrosModal
            proyectoId={proyecto.id}
            esUsuarioPropietario={esUsuarioPropietario}
          />
        </div>

        <div className="border-t border-slate-100 px-6 py-3.5 flex justify-end bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 bg-slate-100 transition-colors focus:outline-none"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
