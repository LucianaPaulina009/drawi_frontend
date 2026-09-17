"use client";

import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import type {
  MiembroProyecto,
  RolColaborador,
} from "@/features/gestion-proyectos/domain/entities/colaborador.entity";
import { listarMiembrosAction } from "@/features/gestion-proyectos/presentation/actions/colaborador.action";

export interface PermisoEdicionDiagrama {
  puedeEditar: boolean;
  esPropietario: boolean;
  rol: RolColaborador | "desconocido";
  cargando: boolean;
}

export function usePermisoEdicionDiagrama(
  proyecto: Proyecto
): PermisoEdicionDiagrama {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [miembros, setMiembros] = useState<MiembroProyecto[] | null>(null);

  const userId = session?.user?.id;

  const esPropietario = Boolean(
    userId && proyecto.propietarioId && userId === proyecto.propietarioId
  );

  // If the user is the owner, we know they have edit permissions immediately.
  // If not the owner, we fetch members to determine if they are an active editor.
  useEffect(() => {
    if (isSessionPending || !userId) return;
    if (esPropietario) return;

    let cancelado = false;

    listarMiembrosAction(proyecto.id)
      .then((res) => {
        if (cancelado) return;
        if (res.ok) {
          setMiembros(res.data);
        } else {
          setMiembros([]);
        }
      })
      .catch(() => {
        if (cancelado) return;
        setMiembros([]);
      });

    return () => {
      cancelado = true;
    };
  }, [proyecto.id, userId, esPropietario, isSessionPending]);

  const permiso = useMemo((): PermisoEdicionDiagrama => {
    if (isSessionPending) {
      return {
        puedeEditar: false,
        esPropietario: false,
        rol: "desconocido",
        cargando: true,
      };
    }

    if (!userId) {
      return {
        puedeEditar: false,
        esPropietario: false,
        rol: "desconocido",
        cargando: false,
      };
    }

    if (esPropietario) {
      return {
        puedeEditar: true,
        esPropietario: true,
        rol: "propietario",
        cargando: false,
      };
    }

    if (miembros === null) {
      return {
        puedeEditar: false,
        esPropietario: false,
        rol: "desconocido",
        cargando: true,
      };
    }

    const miColaboracion = miembros?.find((m) => m.usuarioId === userId);
    if (!miColaboracion || miColaboracion.estado !== "activo") {
      return {
        puedeEditar: false,
        esPropietario: false,
        rol: miColaboracion?.rol ?? "desconocido",
        cargando: false,
      };
    }

    const puedeEditar = miColaboracion.rol === "editor";
    return {
      puedeEditar,
      esPropietario: false,
      rol: miColaboracion.rol,
      cargando: false,
    };
  }, [isSessionPending, userId, esPropietario, miembros]);

  return permiso;
}
