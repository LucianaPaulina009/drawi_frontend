"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NotificacionEstatica {
  id: string;
  titulo: string;
  descripcion: string;
  etiqueta: string;
  etiquetaClase: string;
  tiempo: string;
  leida: boolean;
}

const NOTIFICACIONES_INICIALES: NotificacionEstatica[] = [
  {
    id: "1",
    titulo: "Karla Morales comentó",
    descripcion:
      "Ajusté los conectores de la pasarela de pagos en el nodo central.",
    etiqueta: "Foodio E-commerce",
    etiquetaClase: "text-blue-600 bg-blue-50/80",
    tiempo: "hace 5 min",
    leida: false,
  },
  {
    id: "2",
    titulo: "Nuevo Canvas publicado",
    descripcion:
      "Karina Torres subió la paleta matcha y nuevos diagramas UML.",
    etiqueta: "Habit tracker",
    etiquetaClase: "text-lime-700 bg-lime-50",
    tiempo: "hace 28 min",
    leida: false,
  },
  {
    id: "3",
    titulo: "Kevin Krause sincronizó datos",
    descripcion:
      "Diagramas de secuencia de telemetría finalizados con éxito.",
    etiqueta: "Starship Company",
    etiquetaClase: "text-pink-600 bg-pink-50/80",
    tiempo: "hace 1 hora",
    leida: true,
  },
];

export function NotificacionesProyectos() {
  const [notificaciones, setNotificaciones] = useState(
    NOTIFICACIONES_INICIALES
  );

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-400"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {noLeidas > 0 ? (
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-lime-400" />
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 rounded-3xl border border-gray-100/90 p-0 shadow-xl sm:w-96"
      >
        {/* Cabecera de notificaciones */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Notificaciones
            </h3>
            {noLeidas > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full border border-lime-200 bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                {noLeidas} nuevas
              </span>
            ) : null}
          </div>

          {noLeidas > 0 ? (
            <button
              onClick={handleMarcarTodasLeidas}
              className="text-xs font-semibold text-lime-700 transition hover:text-lime-800"
            >
              Marcar como leídas
            </button>
          ) : null}
        </div>

        {/* Lista de notificaciones */}
        <div className="max-h-[340px] divide-y divide-gray-50 overflow-y-auto">
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 p-4 transition hover:bg-slate-50/70",
                !n.leida && "bg-lime-50/20"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {n.titulo}
                  </p>
                  {!n.leida ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-lime-500" />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-gray-200" />
                  )}
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {n.descripcion}
                </p>

                <div className="mt-1.5 flex items-center space-x-2">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      n.etiquetaClase
                    )}
                  >
                    {n.etiqueta}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {n.tiempo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pie */}
        <div className="border-t border-gray-100 bg-gray-50/60 p-3 text-center">
          <button
            type="button"
            className="w-full rounded-xl py-2 text-xs font-bold text-slate-900 transition hover:bg-white hover:text-lime-700"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
