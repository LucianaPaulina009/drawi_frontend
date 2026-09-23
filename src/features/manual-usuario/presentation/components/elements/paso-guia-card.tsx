import {
  Activity,
  CheckCircle2,
  Copy,
  DownloadCloud,
  Edit3,
  FileDown,
  FileUp,
  Layout,
  LayoutGrid,
  LogIn,
  MessageCircle,
  Move,
  Plus,
  PlusSquare,
  Send,
  Share2,
  Star,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { PasoAccion } from "../../../domain/entities/seccion-manual.entity";

const PASO_ICON_MAP: Record<string, LucideIcon> = {
  LogIn,
  Plus,
  LayoutGrid,
  Star,
  Share2,
  Copy,
  UserCheck,
  PlusSquare,
  Edit3,
  Move,
  MessageCircle,
  Send,
  CheckCircle2,
  Layout,
  Activity,
  DownloadCloud,
  FileUp,
  FileDown,
};

export interface PasoGuiaCardProps {
  paso: PasoAccion;
}

export function PasoGuiaCard({ paso }: PasoGuiaCardProps) {
  const Icono = PASO_ICON_MAP[paso.icono] || Plus;

  return (
    <div className="relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs">
      {/* Indicador de número */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-800">
        {paso.numero}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Icono className="h-4 w-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-900 sm:text-sm">
            {paso.titulo}
          </h4>
          {paso.ubicacionUI && (
            <span className="rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {paso.ubicacionUI}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          {paso.descripcion}
        </p>
      </div>
    </div>
  );
}
