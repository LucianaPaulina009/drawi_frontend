"use client";

import { useCallback, useRef } from "react";
import type { Viewport } from "@xyflow/react";

export const VIEWPORT_PREDETERMINADO: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export function useViewportPorDiagrama() {
  const viewportsRef = useRef<Record<string, Viewport>>({});

  const obtenerViewport = useCallback((idDiagrama: string | null): Viewport => {
    if (!idDiagrama) return VIEWPORT_PREDETERMINADO;
    return viewportsRef.current[idDiagrama] ?? VIEWPORT_PREDETERMINADO;
  }, []);

  const guardarViewport = useCallback(
    (idDiagrama: string, viewport: Viewport) => {
      if (!idDiagrama) return;
      viewportsRef.current[idDiagrama] = viewport;
    },
    []
  );

  const limpiarViewport = useCallback((idDiagrama: string) => {
    if (!idDiagrama) return;
    delete viewportsRef.current[idDiagrama];
  }, []);

  return {
    obtenerViewport,
    guardarViewport,
    limpiarViewport,
  };
}
