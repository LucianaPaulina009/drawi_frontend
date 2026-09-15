"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import { ActualizarDiagramaRequestSchema } from "../../../infrastructure/schemas/diagrama.schemas";

interface RenombrarPaginaFormProps {
  diagrama: Diagrama;
  isPending: boolean;
  onCancelar: () => void;
  onGuardar: (nombre: string) => Promise<string | null>;
}

export function RenombrarPaginaForm({
  diagrama,
  isPending,
  onCancelar,
  onGuardar,
}: RenombrarPaginaFormProps) {
  const [nombre, setNombre] = useState(diagrama.nombre);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorNombre(null);

    const validacion = ActualizarDiagramaRequestSchema.safeParse({ nombre });
    if (!validacion.success) {
      setErrorNombre(
        validacion.error.issues[0]?.message ||
          "El nombre de la página es inválido."
      );
      return;
    }

    const error = await onGuardar(validacion.data.nombre);
    if (error) {
      setErrorNombre(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo de nombre controlado para el diagrama seleccionado. */}
      <div className="space-y-2">
        <TextFormField
          id="nombre-pagina"
          name="nombre"
          label="Nombre de la página"
          placeholder="Ej. Diagrama de clases"
          type="text"
          value={nombre}
          onChange={(event) => {
            setNombre(event.target.value);
            if (errorNombre) setErrorNombre(null);
          }}
          disabled={isPending}
          maxLength={50}
          aria-invalid={Boolean(errorNombre)}
          aria-describedby={errorNombre ? "error-nombre-pagina" : undefined}
        />
        {errorNombre ? (
          <p id="error-nombre-pagina" className="px-1 text-xs font-medium text-destructive">
            {errorNombre}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelar}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="bg-app-primary text-app-primary-foreground hover:bg-app-primary/90">
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="size-4" />
              Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
