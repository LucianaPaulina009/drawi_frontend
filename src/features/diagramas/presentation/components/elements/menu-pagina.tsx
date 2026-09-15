"use client";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="rounded-full text-gray-400 hover:text-slate-900"
          aria-label={`Opciones de ${diagrama.nombre}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onRenombrar(diagrama)}>
          <Pencil aria-hidden="true" />
          Renombrar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onEliminar(diagrama)}
        >
          <Trash2 aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
