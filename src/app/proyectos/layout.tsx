import type { ReactNode } from "react";
import { LayoutProyectos } from "@/features/gestion-proyectos/presentation/components/elements/layout-proyectos";

interface ProyectosLayoutProps {
  children: ReactNode;
}

export default function ProyectosLayout({ children }: ProyectosLayoutProps) {
  return <LayoutProyectos>{children}</LayoutProyectos>;
}
