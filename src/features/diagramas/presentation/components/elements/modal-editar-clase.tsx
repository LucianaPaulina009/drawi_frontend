"use client";

import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import type { Clase } from "../../../domain/entities/clase.entity";
import { EditarClaseForm } from "../forms/editar-clase-form";

export interface ModalEditarClaseProps {
  clase: Clase | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (datos: { nombre: string; ancho?: number }) => Promise<string | null>;
}

export function ModalEditarClase({
  clase,
  isPending,
  onOpenChange,
  onGuardar,
}: ModalEditarClaseProps) {
  if (!clase) return null;

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onOpenChange(false);
      }}
      title="Editar clase UML"
      description="Modifica el nombre y las propiedades visuales de la entidad."
      size="sm"
    >
      <EditarClaseForm
        key={clase.id}
        clase={clase}
        isPending={isPending}
        onCancelar={() => onOpenChange(false)}
        onGuardar={onGuardar}
      />
    </AppDialog>
  );
}
