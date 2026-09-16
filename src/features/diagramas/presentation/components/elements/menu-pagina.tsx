"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";

interface MenuPaginaProps {
  diagrama: Diagrama;
  onRenombrar: (diagrama: Diagrama) => void;
  onEliminar: (diagrama: Diagrama) => void;
}

export function MenuPagina({
  diagrama,
  onRenombrar,
  onEliminar,
}: MenuPaginaProps) {
  const [abierto, setAbierto] = useState(false);
  const accionPendienteRef = useRef<"renombrar" | "eliminar" | null>(null);

  const handleSeleccionarAccion = (
    event: Event,
    accion: "renombrar" | "eliminar"
  ) => {
    // El menú se cierra antes de montar un diálogo modal.
    event.preventDefault();
    accionPendienteRef.current = accion;
    setAbierto(false);
  };

  const handleCerrarMenu = (event: Event) => {
    const accion = accionPendienteRef.current;
    if (!accion) return;

    // Evita que Radix devuelva el foco al trigger, que quedará oculto por el diálogo.
    event.preventDefault();
    accionPendienteRef.current = null;

    if (accion === "renombrar") {
      onRenombrar(diagrama);
      return;
    }

    onEliminar(diagrama);
  };

  return (
    <DropdownMenu open={abierto} onOpenChange={setAbierto}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="rounded-full text-gray-400 hover:text-slate-900"
          aria-label={`Opciones de ${diagrama.nombre}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={handleCerrarMenu}>
        <DropdownMenuItem
          onSelect={(event) => handleSeleccionarAccion(event, "renombrar")}
        >
          <Pencil aria-hidden="true" />
          Renombrar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => handleSeleccionarAccion(event, "eliminar")}
        >
          <Trash2 aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
