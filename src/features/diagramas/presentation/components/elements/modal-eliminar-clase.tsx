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
      description={`¿Estás seguro de que deseas eliminar la clase "${clase.nombre}" y todos sus atributos asociados? Esta acción no se puede deshacer.`}
      cancelText="Cancelar"
      actionText={isPending ? "Eliminando..." : "Eliminar clase"}
      onAction={onConfirmar}
      actionDisabled={isPending}
    />
  );
}
