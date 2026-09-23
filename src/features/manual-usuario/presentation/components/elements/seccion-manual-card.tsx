import {
  Activity,
  ArrowRight,
  Bot,
  Box,
  CheckCircle,
  CheckSquare,
  CloudCheck,
  Code2,
  Copy,
  CornerRightUp,
  Cpu,
  Diamond,
  Download,
  Eye,
  FileCode,
  FileCode2,
  FolderPlus,
  GitMerge,
  Globe,
  Image,
  Info,
  Layers,
  Lightbulb,
  Link2,
  Magnet,
  MessageSquare,
  Mic,
  Move,
  Network,
  PlusCircle,
  Share,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Terminal,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ColorAcentoSeccion,
  SeccionManual,
  TarjetaCaracteristica,
} from "../../../domain/entities/seccion-manual.entity";
import { PasoGuiaCard } from "./paso-guia-card";

const ICON_MAP: Record<string, LucideIcon> = {
  FolderPlus,
  Users,
  Layers,
  Network,
  Sparkles,
  Code2,
  FileCode2,
  PlusCircle,
  Star,
  Copy,
  Link2,
  ShieldCheck,
  Activity,
  MessageSquare,
  Move,
  Box,
  Tag,
  Eye,
  Terminal,
  CloudCheck,
  ArrowRight,
  GitMerge,
  CornerRightUp,
  Diamond,
  Share,
  Magnet,
  Bot,
  Cpu,
  Image,
  Mic,
  CheckSquare,
  Download,
  FileCode,
  Upload,
  Globe,
  CheckCircle,
};

const ACCENT_STYLES: Record<
  ColorAcentoSeccion,
  {
    badgeBorder: string;
    badgeBg: string;
    badgeText: string;
    iconContainer: string;
    glowBorder: string;
    accentText: string;
  }
> = {
  matcha: {
    badgeBorder: "border-lime-300",
    badgeBg: "bg-lime-50",
    badgeText: "text-lime-800",
    iconContainer: "bg-lime-100 text-lime-900 border-lime-300",
    glowBorder: "hover:border-lime-400",
    accentText: "text-lime-800",
  },
  cornflower: {
    badgeBorder: "border-blue-200",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    iconContainer: "bg-blue-100 text-blue-800 border-blue-200",
    glowBorder: "hover:border-blue-400",
    accentText: "text-blue-700",
  },
  amber: {
    badgeBorder: "border-amber-200",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    iconContainer: "bg-amber-100 text-amber-800 border-amber-200",
    glowBorder: "hover:border-amber-400",
    accentText: "text-amber-800",
  },
  purple: {
    badgeBorder: "border-purple-200",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800",
    iconContainer: "bg-purple-100 text-purple-800 border-purple-200",
    glowBorder: "hover:border-purple-400",
    accentText: "text-purple-800",
  },
  rose: {
    badgeBorder: "border-rose-200",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-800",
    iconContainer: "bg-rose-100 text-rose-800 border-rose-200",
    glowBorder: "hover:border-rose-400",
    accentText: "text-rose-800",
  },
};

export interface SeccionManualCardProps {
  seccion: SeccionManual;
}

export function SeccionManualCard({ seccion }: SeccionManualCardProps) {
  const IconoSeccion = ICON_MAP[seccion.icono] || Layers;
  const estilo = ACCENT_STYLES[seccion.colorAcento];

  return (
    <article
      id={seccion.id}
      className="scroll-mt-24 space-y-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-8 lg:p-10"
    >
      {/* Encabezado de Sección */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold tracking-wider",
              estilo.badgeBorder,
              estilo.badgeBg,
              estilo.badgeText
            )}
          >
            SECCIÓN {seccion.numero}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-2xs transition-transform duration-200 hover:scale-105",
              estilo.iconContainer
            )}
          >
            <IconoSeccion className="h-7 w-7 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {seccion.titulo}
            </h2>
            <p className="mt-1 text-sm font-semibold tracking-wide text-slate-700 sm:text-base">
              {seccion.eslogan}
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {seccion.descripcion}
        </p>
      </div>

      {/* Grilla de Tarjetas de Características */}
      {seccion.tarjetas && seccion.tarjetas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Capacidades principales
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {seccion.tarjetas.map((tarjeta: TarjetaCaracteristica) => {
              const IconoTarjeta = ICON_MAP[tarjeta.icono] || Box;

              return (
                <div
                  key={tarjeta.id}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xs",
                    tarjeta.destacado &&
                      "border-slate-300 bg-white ring-1 ring-slate-200 shadow-2xs",
                    estilo.glowBorder
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors group-hover:border-lime-300 group-hover:bg-[#d9f99d] group-hover:text-slate-950">
                        <IconoTarjeta className="h-5 w-5" />
                      </div>
                      {tarjeta.badge && (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                          {tarjeta.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-slate-950">
                        {tarjeta.titulo}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {tarjeta.descripcion}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flujo Paso a Paso (si existe) */}
      {seccion.pasos && seccion.pasos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Paso a paso ilustrado
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {seccion.pasos.map((paso) => (
              <PasoGuiaCard key={paso.numero} paso={paso} />
            ))}
          </div>
        </div>
      )}

      {/* Tips y Buenas Prácticas */}
      {seccion.tips && seccion.tips.length > 0 && (
        <div className="rounded-2xl border border-lime-300/80 bg-lime-50/70 p-4 shadow-2xs sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-lime-300 bg-lime-200/80 text-lime-900 shadow-2xs">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-lime-900">
                Consejos y Recomendaciones
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {seccion.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-600" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
