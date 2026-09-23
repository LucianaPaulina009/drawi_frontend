"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Users } from "lucide-react";

import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { MiembroProyecto } from "../../../domain/entities/colaborador.entity";
import { listarMiembrosAction } from "../../actions/colaborador.action";
import { colaboracionCache } from "../../cache/colaboracion-cache";
import { ItemMiembroFila } from "./item-miembro-fila";

interface ListaMiembrosModalProps {
  proyectoId: string;
  idUsuarioActual?: string;
  esUsuarioPropietario: boolean;
}

export function ListaMiembrosModal({
  proyectoId,
  esUsuarioPropietario,
}: ListaMiembrosModalProps) {
  const cached = colaboracionCache.getMiembros(proyectoId);
  const [miembros, setMiembros] = useState<MiembroProyecto[]>(
    cached !== undefined ? cached : []
  );
  const [cargando, setCargando] = useState<boolean>(cached === undefined);
  const [, startTransition] = useTransition();

  const cargarMiembros = (forzar = false) => {
    if (forzar) {
      colaboracionCache.invalidar(proyectoId);
    } else if (colaboracionCache.hasMiembros(proyectoId)) {
      const data = colaboracionCache.getMiembros(proyectoId);
      if (data) {
        setMiembros(data);
        setCargando(false);
        return;
      }
    }

    setCargando(true);
    startTransition(async () => {
      try {
        const res = await listarMiembrosAction(proyectoId);
        if (res.ok) {
          setMiembros(res.data);
          colaboracionCache.setMiembros(proyectoId, res.data);
        } else if (cached === undefined) {
          appToast.error("Error", res.errors?.[0] || "No se pudo cargar la lista de miembros.");
        }
      } catch {
        if (cached === undefined) {
          appToast.error("Error", "Ocurrió un error al consultar los miembros.");
        }
      } finally {
        setCargando(false);
      }
    });
  };

  useEffect(() => {
    cargarMiembros(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);


  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (miembros.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500">
        No hay miembros registrados en este proyecto.
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
      <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Users className="w-3.5 h-3.5" />
        <span>Miembros ({miembros.length})</span>
      </div>
      {miembros.map((miembro) => (
        <ItemMiembroFila
          key={miembro.id}
          proyectoId={proyectoId}
          miembro={miembro}
          esUsuarioPropietario={esUsuarioPropietario}
          onMiembroActualizado={() => cargarMiembros(true)}
        />
      ))}

    </div>
  );
}
