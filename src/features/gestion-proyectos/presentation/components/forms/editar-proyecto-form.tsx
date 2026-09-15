"use client";

import { useState } from "react";
import { Check, Coins, Package, Star, TrendingUp, Warehouse } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  ColorProyecto,
  IconoProyecto,
  Proyecto,
} from "../../../domain/entities/proyecto.entity";
import { actualizarProyectoAction } from "../../actions/proyecto.action";
import { ActualizarProyectoFormSchema } from "../../../infrastructure/schemas/proyecto.schemas";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

interface EditarProyectoFormProps {
  proyecto: Proyecto;
  onSuccess: () => void;
  onCancel: () => void;
}

const OPCIONES_COLORES: { valor: ColorProyecto; nombre: string; bgClass: string; hex: string }[] = [
  { valor: "celeste", nombre: "Celeste", bgClass: "bg-[#bfdbfe]", hex: "#bfdbfe" },
  { valor: "verde", nombre: "Verde", bgClass: "bg-[#d9f99d]", hex: "#d9f99d" },
  { valor: "rojo", nombre: "Rojo", bgClass: "bg-[#fecdd3]", hex: "#fecdd3" },
  { valor: "azul", nombre: "Azul", bgClass: "bg-[#93c5fd]", hex: "#93c5fd" },
  { valor: "naranja", nombre: "Naranja", bgClass: "bg-[#fed7aa]", hex: "#fed7aa" },
  { valor: "amarillo", nombre: "Amarillo", bgClass: "bg-[#fef08a]", hex: "#fef08a" },
  { valor: "morado", nombre: "Morado", bgClass: "bg-[#ddd6fe]", hex: "#ddd6fe" },
];

const OPCIONES_ICONOS: {
  valor: IconoProyecto;
  etiqueta: string;
  icono: ComponentType<{ className?: string }>;
}[] = [
  { valor: "caja", etiqueta: "Caja", icono: Package },
  { valor: "finanza", etiqueta: "Finanzas", icono: TrendingUp },
  { valor: "almacen", etiqueta: "Almacén", icono: Warehouse },
  { valor: "estrella", etiqueta: "Estrella", icono: Star },
  { valor: "dinero", etiqueta: "Dinero", icono: Coins },
];

export function EditarProyectoForm({
  proyecto,
  onSuccess,
  onCancel,
}: EditarProyectoFormProps) {
  const [nombre, setNombre] = useState(proyecto.nombre);
  const [color, setColor] = useState<ColorProyecto>(proyecto.color);
  const [icono, setIcono] = useState<IconoProyecto>(proyecto.icono);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNombre(null);

    const validacion = ActualizarProyectoFormSchema.safeParse({
      nombre,
      color,
      icono,
    });

    if (!validacion.success) {
      const issue = validacion.error.issues[0];
      setErrorNombre(issue?.message || "Los datos son inválidos.");
      return;
    }

    setIsPending(true);

    try {
      const result = await actualizarProyectoAction(proyecto.id, {
        nombre: validacion.data.nombre,
        color: validacion.data.color,
        icono: validacion.data.icono,
      });

      if (result.ok) {
        appToast.success("Proyecto actualizado con éxito.");
        onSuccess();
      } else {
        const mensaje = result.errors[0] || "No se pudo actualizar el proyecto.";
        appToast.error("Error al actualizar", mensaje);
        setErrorNombre(mensaje);
      }
    } catch {
      appToast.error("Error", "Ocurrió un error inesperado al actualizar.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo: Nombre del proyecto */}
      <div className="space-y-2">
        <Label htmlFor="nombre-proyecto" className="text-xs font-bold uppercase tracking-wider text-gray-800">
          Nombre del proyecto
        </Label>
        <Input
          id="nombre-proyecto"
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (errorNombre) setErrorNombre(null);
          }}
          maxLength={40}
          placeholder="Nombre del proyecto"
          className={cn(
            "rounded-2xl border-gray-200 bg-gray-50/70 text-sm font-semibold transition focus:bg-white focus:ring-2 focus:ring-lime-400",
            errorNombre && "border-destructive focus:ring-destructive"
          )}
          disabled={isPending}
        />
        <div className="flex justify-between text-[11px] text-gray-500">
          <span>{errorNombre ? <span className="text-destructive font-medium">{errorNombre}</span> : null}</span>
          <span>{nombre.length}/40</span>
        </div>
      </div>

      {/* Selector de Icono */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-800">
          Ícono del proyecto
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {OPCIONES_ICONOS.map((opcion) => {
            const IconComponent = opcion.icono;
            const seleccionado = icono === opcion.valor;
            return (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setIcono(opcion.valor)}
                disabled={isPending}
                title={opcion.etiqueta}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-2xl border transition duration-150 hover:scale-105",
                  seleccionado
                    ? "border-2 border-lime-500 bg-lime-50/60 text-slate-900 shadow-sm"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-slate-900"
                )}
              >
                <IconComponent className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Color */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-800">
          Color temático
        </Label>
        <div className="flex flex-wrap items-center gap-3">
          {OPCIONES_COLORES.map((opcion) => {
            const seleccionado = color === opcion.valor;
            return (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setColor(opcion.valor)}
                disabled={isPending}
                title={opcion.nombre}
                style={{ backgroundColor: opcion.hex }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition transform hover:scale-110",
                  seleccionado
                    ? "ring-2 ring-slate-800 ring-offset-2"
                    : "ring-offset-1 hover:ring-1 hover:ring-gray-300"
                )}
              >
                {seleccionado ? (
                  <Check className="h-4 w-4 text-slate-800 stroke-[3]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Acciones del formulario */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#d9f99d] px-6 py-2 text-xs font-bold text-slate-900 border border-lime-300 shadow-sm transition hover:bg-lime-400"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
