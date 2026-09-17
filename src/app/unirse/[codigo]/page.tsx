"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  Loader2,
  LogIn,
  UserCheck,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { ValidacionInvitacion } from "@/features/gestion-colaboradores/domain/entities/invitacion.entity";
import {
  unirseProyectoAction,
  validarInvitacionAction,
} from "@/features/gestion-colaboradores/presentation/actions/invitacion.action";

interface UnirsePageProps {
  params: Promise<{ codigo: string }>;
}

export default function UnirseProyectoPage({ params }: UnirsePageProps) {
  const resolvedParams = use(params);
  const codigo = resolvedParams.codigo;
  const router = useRouter();

  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [validacion, setValidacion] = useState<ValidacionInvitacion | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [cargandoValidacion, setCargandoValidacion] = useState<boolean>(true);
  const [isJoining, startJoinTransition] = useTransition();

  useEffect(() => {
    validarInvitacionAction(codigo)
      .then((res) => {
        if (res.ok) {
          setValidacion(res.data);
        } else {
          setErrorValidacion(
            res.errors?.[0] || "La invitación no es válida o ha expirado."
          );
        }
      })
      .catch(() => {
        setErrorValidacion("Ocurrió un error al validar la invitación.");
      })
      .finally(() => {
        setCargandoValidacion(false);
      });
  }, [codigo]);

  const handleUnirse = () => {
    if (isJoining || !validacion) return;

    startJoinTransition(async () => {
      try {
        const res = await unirseProyectoAction(codigo);
        if (res.ok) {
          appToast.success("¡Te has unido al proyecto exitosamente!");
          const targetUrl = res.data.diagramaId
            ? `/proyecto/${res.data.proyectoSlug}?diagrama=${res.data.diagramaId}`
            : `/proyecto/${res.data.proyectoSlug}`;
          router.push(targetUrl);
        } else {
          const errorMsg =
            res.errors?.[0] || "No fue posible unirse al proyecto.";
          appToast.error("Error al unirse", errorMsg);
          setErrorValidacion(errorMsg);
        }
      } catch {
        appToast.error(
          "Error",
          "Ocurrió un error inesperado al procesar la unión al proyecto."
        );
      }
    });
  };

  if (cargandoValidacion || isSessionPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#003c70]" />
          <span className="text-xs font-medium text-slate-500">
            Validando enlace de invitación...
          </span>
        </div>
      </main>
    );
  }

  if (errorValidacion || !validacion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans select-none">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Invitación no disponible
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorValidacion ||
                "El enlace de invitación no existe, ha expirado o no tienes permisos para acceder a este proyecto."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/proyectos"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Ir a mis proyectos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans select-none">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
        {/* Cabecera / Ícono del proyecto */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#91bcfb]/20 text-[#003c70] flex items-center justify-center mx-auto ring-8 ring-[#91bcfb]/10">
            <Layers className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Invitación a colaborar
            </span>
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {validacion.proyectoNombre}
            </h1>
            <p className="text-xs text-slate-500">
              Creado por{" "}
              <strong className="text-slate-700">
                {validacion.propietarioNombre}
              </strong>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Estado según sesión del usuario */}
        {session?.user ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {session.user.name || "Usuario"}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  {session.user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isJoining}
              onClick={handleUnirse}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#91bcfb] hover:bg-[#7ab1f9] text-[#003c70] text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Incorporándote al proyecto...</span>
                </>
              ) : (
                <>
                  <span>Unirse al proyecto</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-center text-slate-600">
              Inicia sesión o crea una cuenta para aceptar esta invitación y comenzar a trabajar juntos.
            </p>
            <div className="space-y-2.5">
              <Link
                href={`/auth/login?callbackURL=/unirse/${codigo}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#91bcfb] hover:bg-[#7ab1f9] text-[#003c70] text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar sesión para unirte</span>
              </Link>
              <Link
                href={`/auth/signup?callbackURL=/unirse/${codigo}`}
                className="w-full flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors text-center"
              >
                Crear una cuenta nueva
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
