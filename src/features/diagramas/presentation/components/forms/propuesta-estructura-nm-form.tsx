"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import type { Clase } from "../../../domain/entities/clase.entity";

export interface PropuestaEstructuraNmFormProps {
  open: boolean;
  origen: Clase | null;
  destino: Clase | null;
  atributoOrigenId: string | null;
  atributoDestinoId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (nombre: string) => void;
}

/** Confirmación explícita: cancelar nunca deja una clase ni relaciones parciales. */
export function PropuestaEstructuraNmForm({ open, origen, destino, atributoOrigenId, atributoDestinoId, onOpenChange, onConfirmar }: PropuestaEstructuraNmFormProps) {
  const [nombre, setNombre] = useState("");
  const sugerido = origen && destino ? `${origen.nombre}_${destino.nombre}` : "";
  const atributoOrigen = origen?.atributos.find((item) => item.id === atributoOrigenId);
  const atributoDestino = destino?.atributos.find((item) => item.id === atributoDestinoId);
  const nombreFinal = nombre.trim() || sugerido;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} title="Crear tabla intermedia" description="Se crearán dos relaciones 1:N y sus referencias FK en una sola operación.">
      <div className="space-y-4">
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-sm text-slate-700">
          <p><b>{origen?.nombre ?? "Origen"}</b> → {atributoOrigen?.nombre ?? "Seleccione un atributo"}</p>
          <p><b>{destino?.nombre ?? "Destino"}</b> → {atributoDestino?.nombre ?? "Seleccione un atributo"}</p>
        </div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Nombre de la tabla intermedia
          <Input value={nombre || sugerido} onChange={(event) => setNombre(event.target.value)} aria-label="Nombre de la tabla intermedia" />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={!origen || !destino || !atributoOrigen || !atributoDestino || !nombreFinal} onClick={() => onConfirmar(nombreFinal)}>Confirmar estructura</Button>
        </div>
      </div>
    </AppDialog>
  );
}
