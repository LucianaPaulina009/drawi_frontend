"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Link as LinkIcon, Loader2, ShieldAlert } from "lucide-react";

import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { Invitacion } from "../../../domain/entities/invitacion.entity";
import { obtenerInvitacionAction } from "../../actions/invitacion.action";

interface SeccionInvitacionModalProps {
  proyectoId: string;
  esUsuarioPropietario: boolean;
}

export function SeccionInvitacionModal({
  proyectoId,
  esUsuarioPropietario,
}: SeccionInvitacionModalProps) {
  const [invitacion, setInvitacion] = useState<Invitacion | null>(null);
  const [cargando, setCargando] = useState<boolean>(esUsuarioPropietario);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!esUsuarioPropietario) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await obtenerInvitacionAction(proyectoId);
        if (res.ok) {
          setInvitacion(res.data);
        } else {
          appToast.error(
            "Error",
            res.errors?.[0] || "No se pudo obtener el enlace de invitación."
          );
        }
      } catch {
        appToast.error("Error", "Ocurrió un error al obtener la invitación.");
      } finally {
        setCargando(false);
      }
    });
  }, [proyectoId, esUsuarioPropietario]);

  const enlaceCompleto =
    invitacion && typeof window !== "undefined"
      ? `${window.location.origin}/unirse/${invitacion.codigoAcceso}`
      : "";

  const handleCopiar = async () => {
    if (!enlaceCompleto) return;

    try {
      await navigator.clipboard.writeText(enlaceCompleto);
      setCopiado(true);
      appToast.success("Enlace copiado al portapapeles.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      appToast.error("Error", "No se pudo copiar el enlace al portapapeles.");
    }
  };

  if (!esUsuarioPropietario) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Solo el propietario del proyecto puede generar enlaces de invitación para nuevos colaboradores.
        </span>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        Enlace de invitación
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            readOnly
            value={enlaceCompleto}
            aria-label="Enlace de invitación"
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono focus:outline-none select-all"
          />
        </div>
        <button
          type="button"
          onClick={handleCopiar}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
            copiado
              ? "bg-emerald-500 text-white"
              : "bg-[#91bcfb] text-[#003c70] hover:bg-[#7ab1f9]"
          }`}
          aria-label={copiado ? "Enlace copiado" : "Copiar enlace"}
        >
          {copiado ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Cualquier persona con este enlace podrá unirse como lector a este proyecto.
      </p>
    </div>
  );
}
