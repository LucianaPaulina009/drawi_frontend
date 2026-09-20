"use client";

import { useEffect, useState } from "react";

export interface UseAtajosEditorOptions {
  onNuevoProyecto?: () => void;
  onGuardarCambios?: () => void;
  onEliminarSeleccion?: () => void;
  onDuplicarSeleccion?: () => void;
  onCancelarInteraccion?: () => void;
  /** Las operaciones de historial se conectarán únicamente cuando existan. */
  onDeshacer?: () => void;
  onRehacer?: () => void;
  deshabilitado?: boolean;
}

/**
 * Determina si el evento ocurrió dentro de un control editable, formulario,
 * diálogo, menú desplegable u overlay interactivo (incluyendo portales de Radix).
 */
function esElementoExcluido(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  // 1. Controles nativos y editables
  const tag = target.tagName.toLowerCase();
  if (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true"
  ) {
    return true;
  }

  // 2. Elementos dentro de formularios, diálogos, menús o portales de Radix
  const esContenedorExcluido = target.closest(
    'form, dialog, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-portal], [data-radix-popper-content-wrapper], [data-slot="dropdown-menu-content"]'
  );

  return Boolean(esContenedorExcluido);
}

export function useAtajosEditor({
  onNuevoProyecto,
  onGuardarCambios,
  onEliminarSeleccion,
  onDuplicarSeleccion,
  onCancelarInteraccion,
  onDeshacer,
  onRehacer,
  deshabilitado = false,
}: UseAtajosEditorOptions = {}) {
  const [espacioPresionado, setEspacioPresionado] = useState(false);

  useEffect(() => {
    if (deshabilitado) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Si el foco está en un elemento excluido (inputs, modales, etc.), ignorar
      if (esElementoExcluido(event.target)) {
        return;
      }

      // 1. Pan temporal con Barra Espaciadora
      if (event.code === "Space" && !event.repeat) {
        // Prevenir el scroll por defecto de la barra espaciadora en el navegador
        event.preventDefault();
        setEspacioPresionado(true);
        return;
      }

      // 2. Atajo Ctrl+N / Cmd+N (Nuevo proyecto)
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "n" || event.key === "N") &&
        !event.repeat
      ) {
        event.preventDefault();
        onNuevoProyecto?.();
        return;
      }

      // 3. Atajo Ctrl+S / Cmd+S (Guardar cambios)
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "s" || event.key === "S") &&
        !event.repeat
      ) {
        // Prevenir el diálogo nativo de guardar página del navegador
        event.preventDefault();
        onGuardarCambios?.();
        return;
      }

      // 4. Atajo Ctrl+D / Cmd+D (Duplicar selección de atributo)
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "d" || event.key === "D") &&
        !event.repeat
      ) {
        event.preventDefault();
        onDuplicarSeleccion?.();
        return;
      }

      // 5. Atajo Delete / Supr / Backspace para eliminar selección
      if (
        (event.key === "Delete" ||
          event.key === "Backspace" ||
          event.code === "Delete") &&
        !event.repeat
      ) {
        event.preventDefault();
        onEliminarSeleccion?.();
        return;
      }

      // 6. Escape retorna de una herramienta transitoria a Selección.
      if (event.key === "Escape" && !event.repeat) {
        onCancelarInteraccion?.();
        return;
      }

      // No se finge historial: estas combinaciones solamente se consumen
      // cuando una implementación real de deshacer/rehacer las provee.
      if ((event.ctrlKey || event.metaKey) && !event.repeat && event.key.toLowerCase() === "z" && onDeshacer) {
        event.preventDefault();
        onDeshacer();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && !event.repeat && event.key.toLowerCase() === "y" && onRehacer) {
        event.preventDefault();
        onRehacer();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setEspacioPresionado(false);
      }
    };

    const handleWindowBlur = () => {
      // Si la ventana pierde el foco, restablecer la tecla espacio
      setEspacioPresionado(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    onNuevoProyecto,
    onGuardarCambios,
    onEliminarSeleccion,
    onCancelarInteraccion,
    onDeshacer,
    onRehacer,
    onDuplicarSeleccion,
    deshabilitado,
  ]);

  return {
    espacioPresionado,
  };
}
