"use client";

import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import { RenombrarPaginaForm } from "../forms/renombrar-pagina-form";

interface ModalRenombrarPaginaProps {
  diagrama: Diagrama | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (nombre: string) => Promise<string | null>;
}

export function ModalRenombrarPagina({
  diagrama,
  isPending,
  onOpenChange,
  onGuardar,
}: ModalRenombrarPaginaProps) {
  if (!diagrama) return null;

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onOpenChange(false);
      }}
      title="Renombrar página"
      description="El nuevo nombre se guardará en esta página del proyecto."
      size="sm"
    >
      <RenombrarPaginaForm
        key={diagrama.id}
        diagrama={diagrama}
        isPending={isPending}
        onCancelar={() => onOpenChange(false)}
        onGuardar={onGuardar}
      />
    </AppDialog>
  );
}
