"use client";

import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";

export interface ModalEliminarPaginaProps {
  diagrama: Diagrama | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function ModalEliminarPagina({
  diagrama,
  isPending,
  onOpenChange,
  onConfirmar,
}: ModalEliminarPaginaProps) {
  if (!diagrama) return null;

  return (
    <AppAlertDialog
      open={Boolean(diagrama)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onOpenChange(false);
        }
      }}
      title="¿Eliminar página?"
      description={`¿Estás seguro de que deseas eliminar "${diagrama.nombre}"? Esta acción no se puede deshacer.`}
      cancelText="Cancelar"
      actionText={isPending ? "Eliminando..." : "Eliminar página"}
      onAction={onConfirmar}
      actionDisabled={isPending}
    />
  );
}
