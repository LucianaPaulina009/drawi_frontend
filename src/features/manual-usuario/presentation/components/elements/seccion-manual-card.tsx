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
    badgeBorder: "border-[#d9f99d]/30",
    badgeBg: "bg-[#d9f99d]/10",
    badgeText: "text-[#d9f99d]",
    iconContainer: "bg-[#d9f99d]/15 text-[#d9f99d] border-[#d9f99d]/30",
    glowBorder: "hover:border-[#d9f99d]/40",
    accentText: "text-[#d9f99d]",
  },
  cornflower: {
    badgeBorder: "border-[#91bcfb]/30",
    badgeBg: "bg-[#91bcfb]/10",
    badgeText: "text-[#91bcfb]",
    iconContainer: "bg-[#91bcfb]/15 text-[#91bcfb] border-[#91bcfb]/30",
    glowBorder: "hover:border-[#91bcfb]/40",
    accentText: "text-[#91bcfb]",
  },
  amber: {
    badgeBorder: "border-amber-400/30",
    badgeBg: "bg-amber-400/10",
    badgeText: "text-amber-300",
    iconContainer: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    glowBorder: "hover:border-amber-400/40",
    accentText: "text-amber-300",
  },
  purple: {
    badgeBorder: "border-purple-400/30",
    badgeBg: "bg-purple-400/10",
    badgeText: "text-purple-300",
    iconContainer: "bg-purple-400/15 text-purple-300 border-purple-400/30",
    glowBorder: "hover:border-purple-400/40",
    accentText: "text-purple-300",
  },
  rose: {
    badgeBorder: "border-rose-400/30",
    badgeBg: "bg-rose-400/10",
    badgeText: "text-rose-300",
    iconContainer: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    glowBorder: "hover:border-rose-400/40",
    accentText: "text-rose-300",
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
      className="scroll-mt-24 space-y-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:p-10"
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
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition-transform duration-200 hover:scale-105",
              estilo.iconContainer
            )}
          >
            <IconoSeccion className="h-7 w-7 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {seccion.titulo}
            </h2>
            <p className="mt-1 text-sm font-semibold tracking-wide text-slate-300 sm:text-base">
              {seccion.eslogan}
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
          {seccion.descripcion}
        </p>
      </div>

      {/* Grilla de Tarjetas de Características */}
      {seccion.tarjetas && seccion.tarjetas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Capacidades principales
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {seccion.tarjetas.map((tarjeta: TarjetaCaracteristica) => {
              const IconoTarjeta = ICON_MAP[tarjeta.icono] || Box;

              return (
                <div
                  key={tarjeta.id}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]",
                    tarjeta.destacado &&
                      "border-white/20 bg-white/[0.05] ring-1 ring-white/10",
                    estilo.glowBorder
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-[#d9f99d] group-hover:text-slate-950">
                        <IconoTarjeta className="h-5 w-5" />
                      </div>
                      {tarjeta.badge && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {tarjeta.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white transition-colors group-hover:text-[#d9f99d]">
                        {tarjeta.titulo}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
        <div className="rounded-2xl border border-[#d9f99d]/20 bg-[#d9f99d]/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d9f99d]/20 text-[#d9f99d]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#d9f99d]">
                Consejos y Recomendaciones
              </h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {seccion.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#d9f99d]" />
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
