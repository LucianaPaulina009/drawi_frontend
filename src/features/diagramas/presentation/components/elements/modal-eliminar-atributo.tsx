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

  if (atributo.procedencia === "sistema_fk") {
    return (
      <AppAlertDialog
        open
        onOpenChange={onOpenChange}
        title="Acción no permitida"
        description="No se puede eliminar la clave foránea. Elimina la relación que la materializa."
        cancelText="Cerrar"
        actionText="Entendido"
        onAction={() => onOpenChange(false)}
      />
    );
  }

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
