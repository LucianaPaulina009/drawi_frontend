"use client";

import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import type { Atributo } from "../../../domain/entities/atributo.entity";

export interface ModalEliminarAtributoProps {
  atributo: Atributo | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function ModalEliminarAtributo({
  atributo,
  isPending,
  onOpenChange,
  onConfirmar,
}: ModalEliminarAtributoProps) {
  if (!atributo) return null;

  return (
    <AppAlertDialog
      open={Boolean(atributo)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onOpenChange(false);
        }
      }}
      title="¿Eliminar atributo?"
      description={`¿Estás seguro de que deseas eliminar el atributo "${atributo.nombre}"? Esta acción no se puede deshacer.`}
      cancelText="Cancelar"
      actionText={isPending ? "Eliminando..." : "Eliminar atributo"}
      onAction={onConfirmar}
      actionDisabled={isPending}
    />
  );
}
