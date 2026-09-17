"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import type { Clase } from "../../../domain/entities/clase.entity";
import { ActualizarClaseInputSchema } from "../../../infrastructure/schemas/clase.schemas";

export interface EditarClaseFormProps {
  clase: Clase;
  isPending: boolean;
  onCancelar: () => void;
  onGuardar: (datos: { nombre: string; ancho?: number }) => Promise<string | null>;
}

export function EditarClaseForm({
  clase,
  isPending,
  onCancelar,
  onGuardar,
}: EditarClaseFormProps) {
  const [nombre, setNombre] = useState(clase.nombre);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorNombre(null);

    const validacion = ActualizarClaseInputSchema.safeParse({
      nombre,
    });

    if (!validacion.success) {
      for (const issue of validacion.error.issues) {
        if (issue.path[0] === "nombre") {
          setErrorNombre(issue.message);
        }
      }
      return;
    }

    const error = await onGuardar({
      nombre: validacion.data.nombre || nombre,
    });

    if (error) {
      setErrorNombre(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <TextFormField
          id="nombre-clase"
          name="nombre"
          label="Nombre de la clase"
          placeholder="Ej. Usuario, Producto"
          type="text"
          value={nombre}
          onChange={(event) => {
            setNombre(event.target.value);
            if (errorNombre) setErrorNombre(null);
          }}
          disabled={isPending}
          maxLength={50}
          aria-invalid={Boolean(errorNombre)}
          aria-describedby={errorNombre ? "error-nombre-clase" : undefined}
        />
        {errorNombre ? (
          <p id="error-nombre-clase" className="px-1 text-xs font-medium text-destructive">
            {errorNombre}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelar}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-app-primary text-app-primary-foreground hover:bg-app-primary/90"
        >
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
