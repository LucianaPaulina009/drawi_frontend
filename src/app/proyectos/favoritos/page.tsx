import { proyectoRepositoryImpl } from "@/features/gestion-proyectos/infrastructure/repositories/proyecto.repository";
import { ListaProyectos } from "@/features/gestion-proyectos/presentation/components/elements/lista-proyectos";

export default async function ProyectosFavoritosPage() {
  const result = await proyectoRepositoryImpl.listarFavoritos();

  return (
    <ListaProyectos
      proyectosIniciales={result.ok ? result.data : []}
      titulo="Favoritos"
      esFavoritos
    />
  );
}
