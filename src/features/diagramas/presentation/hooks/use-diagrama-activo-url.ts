"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DIAGRAMA_QUERY_PARAM = "diagrama";

export function useDiagramaActivoUrl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagramaSolicitado = searchParams.get(DIAGRAMA_QUERY_PARAM);

  const construirUrl = useCallback(
    (idDiagrama: string) => {
      const parametros = new URLSearchParams(searchParams.toString());
      parametros.set(DIAGRAMA_QUERY_PARAM, idDiagrama);

      return `${pathname}?${parametros.toString()}`;
    },
    [pathname, searchParams]
  );

  const pushDiagrama = useCallback(
    (idDiagrama: string) => {
      if (diagramaSolicitado === idDiagrama) return;
      router.push(construirUrl(idDiagrama));
    },
    [construirUrl, diagramaSolicitado, router]
  );

  const replaceDiagrama = useCallback(
    (idDiagrama: string) => {
      if (diagramaSolicitado === idDiagrama) return;
      router.replace(construirUrl(idDiagrama));
    },
    [construirUrl, diagramaSolicitado, router]
  );

  return {
    diagramaSolicitado,
    pushDiagrama,
    replaceDiagrama,
  };
}
