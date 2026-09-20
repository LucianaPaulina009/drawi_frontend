"use client";

import { useMemo } from "react";
import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Clase } from "../../../domain/entities/clase.entity";
import type { Relacion } from "../../../domain/entities/relacion.entity";

export interface ModalEliminarRelacionProps {
  relacion: Relacion | null;
  clases: Clase[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function ModalEliminarRelacion({
  relacion,
  clases,
  isPending,
  onOpenChange,
  onConfirmar,
}: ModalEliminarRelacionProps) {
  // Identificar si existen atributos con procedencia sistema_fk vinculados a las FKs de esta relación
  const atributosSistemaFkVinculados = useMemo(() => {
    if (!relacion) return [];
    const idsFk = new Set(relacion.referenciasFk.map((rf) => rf.idAtributoFk));
    const encontrados: { idClase: string; idAtributo: string; nombre: string }[] = [];

    for (const clase of clases) {
      for (const attr of clase.atributos || []) {
        if (idsFk.has(attr.id) && attr.procedencia === "sistema_fk") {
          encontrados.push({
            idClase: clase.id,
            idAtributo: attr.id,
            nombre: `${clase.nombre}.${attr.nombre}`,
          });
        }
      }
    }
    return encontrados;
  }, [relacion, clases]);

  if (!relacion) return null;

  const tieneAtributosSistemaFk = atributosSistemaFkVinculados.length > 0;

  if (tieneAtributosSistemaFk) {
    return (
      <Dialog
        open={Boolean(relacion)}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            onOpenChange(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar relación UML?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta relación? Sus referencias FK
              asociadas dejarán de estar disponibles en el modelo.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Atributos del sistema vinculados:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {atributosSistemaFkVinculados.map((item) => (
                <li key={item.idAtributo}>{item.nombre} (sistema_fk)</li>
              ))}
            </ul>
            <p className="mt-3 font-medium">
              Estos atributos FK de sistema se eliminarán automáticamente con la relación.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={onConfirmar}
            >
              {isPending ? "Eliminando..." : "Eliminar relación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AppAlertDialog
      open={Boolean(relacion)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onOpenChange(false);
        }
      }}
      title="¿Eliminar relación UML?"
      description="¿Estás seguro de que deseas eliminar esta relación? Sus referencias FK asociadas dejarán de estar disponibles en el modelo."
      cancelText="Cancelar"
      actionText={isPending ? "Eliminando..." : "Eliminar relación"}
      onAction={onConfirmar}
      actionDisabled={isPending}
    />
  );
}
