"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComentarioEstatico {
  id: string;
  proyecto: string;
  dotColor: string;
  iniciales: string;
  avatarBg: string;
  avatarText: string;
  autor: string;
  tiempo: string;
  texto: string;
}

const COMENTARIOS_ESTATICOS: ComentarioEstatico[] = [
  {
    id: "1",
    proyecto: "Foodio E-commerce",
    dotColor: "bg-blue-400",
    iniciales: "KM",
    avatarBg: "bg-blue-50",
    avatarText: "text-blue-900 border-blue-100",
    autor: "Karla Morales",
    tiempo: "hace un momento",
    texto:
      "Ajusté los conectores de la pasarela de pagos en el nodo central. ¿Alguien puede revisar?",
  },
  {
    id: "2",
    proyecto: "Habit tracker",
    dotColor: "bg-lime-500",
    iniciales: "KT",
    avatarBg: "bg-lime-50",
    avatarText: "text-lime-800 border-lime-200",
    autor: "Karina Torres",
    tiempo: "hoy",
    texto:
      "Subí la paleta de colores salvia y los nuevos iconos UML al canvas.",
  },
  {
    id: "3",
    proyecto: "Starship Company",
    dotColor: "bg-pink-400",
    iniciales: "KK",
    avatarBg: "bg-pink-50",
    avatarText: "text-pink-800 border-pink-100",
    autor: "Kevin Krause",
    tiempo: "hoy",
    texto:
      "Los diagramas de secuencia para el módulo de telemetría ya están sincronizados.",
  },
];

export function ComentariosEquipo() {
  return (
    <aside
      className="hidden w-80 shrink-0 flex-col rounded-3xl border border-gray-200/70 bg-white/90 p-7 shadow-sm xl:flex"
      data-purpose="team-progress-sidebar"
    >
      {/* Barra superior de miembros */}
      <div className="mb-8 flex items-center justify-between">
        <div className="-space-x-1 flex items-center rounded-full border border-gray-200/60 bg-gray-50/80 px-2 py-1 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/50 bg-white text-[10px] font-bold text-gray-700">
            KM
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/50 bg-white text-[10px] font-bold text-gray-700">
            DM
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/50 bg-white text-[10px] font-bold text-gray-700">
            KT
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/50 bg-white text-[10px] font-bold text-gray-700">
            KK
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200/80 text-[10px] font-bold text-gray-600">
            8
          </span>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-gray-500 hover:text-black focus:outline-none"
          title="Invitar miembro del equipo"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Título */}
      <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">
        Comentarios del equipo
      </h2>

      {/* Tarjetas de comentarios */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {COMENTARIOS_ESTATICOS.map((c) => (
          <div
            key={c.id}
            className="flex flex-col space-y-3 rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={cn("h-2 w-2 rounded-full", c.dotColor)} />
                <span className="text-xs font-bold text-gray-700">
                  {c.proyecto}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  c.avatarBg,
                  c.avatarText
                )}
              >
                {c.iniciales}
              </span>
              <div className="flex-1">
                <div className="mb-1 flex flex-col">
                  <span className="text-xs font-bold text-slate-900">
                    {c.autor}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {c.tiempo}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">
                  {c.texto}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
