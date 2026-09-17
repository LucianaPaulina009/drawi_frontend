"use client";

import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import type {
  Atributo,
  CrearAtributoData,
} from "../../../domain/entities/atributo.entity";
import { AtributoForm } from "../forms/atributo-form";

export interface ModalAtributoProps {
  open: boolean;
  atributoAEditar: Atributo | null;
  idClaseParaNuevoAtributo: string | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (datos: CrearAtributoData) => Promise<string | null>;
}

export function ModalAtributo({
  open,
  atributoAEditar,
  idClaseParaNuevoAtributo,
  isPending,
  onOpenChange,
  onGuardar,
}: ModalAtributoProps) {
  if (!open || (!atributoAEditar && !idClaseParaNuevoAtributo)) return null;

  const esEdicion = Boolean(atributoAEditar);

  return (
    <AppDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen && !isPending) onOpenChange(false);
      }}
      title={esEdicion ? "Editar atributo" : "Nuevo atributo"}
      description={
        esEdicion
          ? "Modifica las restricciones y el tipo de dato del atributo."
          : "Define una nueva propiedad para la clase UML."
      }
      size="sm"
    >
      <AtributoForm
        key={atributoAEditar?.id || "nuevo-atributo"}
        atributoInicial={atributoAEditar}
        isPending={isPending}
        onCancelar={() => onOpenChange(false)}
        onGuardar={onGuardar}
      />
    </AppDialog>
  );
}
