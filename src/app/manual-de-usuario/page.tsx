import type { Metadata } from "next";
import {
  SECCIONES_MANUAL_USUARIO,
  ENLACES_TOC,
} from "@/features/manual-usuario/infrastructure/data/contenido-manual.data";
import { ManualUsuarioView } from "@/features/manual-usuario/presentation/components/views/manual-usuario-view";

export const metadata: Metadata = {
  title: "Manual de usuario | Drawi Studio",
  description:
    "Guía completa y documentación oficial de Drawi: modelado de clases UML, colaboración en tiempo real, inteligencia artificial y generación de backend Spring Boot.",
};

export default function ManualDeUsuarioPage() {
  return (
    <ManualUsuarioView
      secciones={SECCIONES_MANUAL_USUARIO}
      enlacesTOC={ENLACES_TOC}
    />
  );
}
