import { notFound } from "next/navigation";
import { proyectoRepositoryImpl } from "@/features/gestion-proyectos/infrastructure/repositories/proyecto.repository";
import { diagramaRepositoryImpl } from "@/features/diagramas/infrastructure/repositories/diagrama.repository";
import { EditorProyecto } from "@/features/diagramas/presentation/components/elements/editor-proyecto";

interface ProyectoSlugPageProps {
  params: Promise<{ proyectoSlug: string }>;
}

export default async function ProyectoSlugPage({
  params,
}: ProyectoSlugPageProps) {
  const { proyectoSlug } = await params;

  // 1. Resolver el proyecto autenticado a partir de su slug
  const proyectosResult = await proyectoRepositoryImpl.listarProyectos();
  if (!proyectosResult.ok) {
    throw new Error(
      proyectosResult.errors[0] || "Error al consultar los proyectos del usuario."
    );
  }

  const proyecto = proyectosResult.data.find((p) => p.slug === proyectoSlug);
  if (!proyecto) {
    notFound();
  }

  // 2. Cargar las páginas/diagramas iniciales del proyecto
  const diagramasResult = await diagramaRepositoryImpl.listarDiagramas(
    proyecto.id
  );

  if (!diagramasResult.ok) {
    if (diagramasResult.statusCode === 404) {
      notFound();
    }
    throw new Error(
      diagramasResult.errors[0] ||
        "Error al obtener las páginas internas del proyecto."
    );
  }

  // 3. Renderizar el compositor delgado del editor
  return (
    <EditorProyecto
      proyecto={proyecto}
      diagramasIniciales={diagramasResult.data}
    />
  );
}
