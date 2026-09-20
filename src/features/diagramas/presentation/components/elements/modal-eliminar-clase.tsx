"use client";

import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import type { Clase } from "../../../domain/entities/clase.entity";

export interface ModalEliminarClaseProps {
  clase: Clase | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function ModalEliminarClase({
  clase,
  isPending,
  onOpenChange,
  onConfirmar,
}: ModalEliminarClaseProps) {
  if (!clase) return null;

  return (
    <AppAlertDialog
      open={Boolean(clase)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onOpenChange(false);
        }
      }}
      title="¿Eliminar clase UML?"
      description={`¿Estás seguro de que deseas eliminar la clase "${clase.nombre}"? Esta acción eliminará sus atributos, las relaciones conectadas y las estructuras intermedias vinculadas. No se puede deshacer.`}
      cancelText="Cancelar"
      actionText={isPending ? "Eliminando..." : "Eliminar clase"}
      onAction={onConfirmar}
      actionDisabled={isPending}
    />
  );
}
