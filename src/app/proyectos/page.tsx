import { proyectoRepositoryImpl } from "@/features/gestion-proyectos/infrastructure/repositories/proyecto.repository";
import { ListaProyectos } from "@/features/gestion-proyectos/presentation/components/elements/lista-proyectos";

export default async function ProyectosPage() {
  const result = await proyectoRepositoryImpl.listarProyectos();

  return (
    <ListaProyectos
      proyectosIniciales={result.ok ? result.data : []}
      titulo="Mis Proyectos"
    />
  );
}
