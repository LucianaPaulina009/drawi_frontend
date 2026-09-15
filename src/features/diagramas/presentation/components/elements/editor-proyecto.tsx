"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import type {
  Diagrama,
  DiagramaDetalle,
} from "../../../domain/entities/diagrama.entity";
import {
  actualizarDiagramaAction,
  crearDiagramaAction,
  eliminarDiagramaAction,
  obtenerDiagramaAction,
} from "../../actions/diagrama.action";
import { BarraHerramientas } from "./barra-herramientas";
import { ControlesZoom } from "./controles-zoom";
import { ControlIA } from "./control-ia";
import { EditorHeader } from "./editor-header";
import { LienzoDiagrama } from "./lienzo-diagrama";
import { ModalEliminarPagina } from "./modal-eliminar-pagina";
import { ModalRenombrarPagina } from "./modal-renombrar-pagina";

export interface EditorProyectoProps {
  proyecto: Proyecto;
  diagramasIniciales: Diagrama[];
}

export function EditorProyecto({
  proyecto,
  diagramasIniciales,
}: EditorProyectoProps) {
  // Lista de páginas en estado local
  const [diagramas, setDiagramas] = useState<Diagrama[]>(diagramasIniciales);

  // Determinar la página inicial activa con el menor número
  const idInicial = useMemo(() => {
    if (diagramasIniciales.length === 0) return null;
    const ordenados = [...diagramasIniciales].sort(
      (a, b) => a.numero - b.numero
    );
    return ordenados[0].id;
  }, [diagramasIniciales]);

  const [diagramaActivoId, setDiagramaActivoId] = useState<string | null>(
    idInicial
  );
  const [detalleActivo, setDetalleActivo] = useState<DiagramaDetalle | null>(
    null
  );
  const [cargandoDetalle, setCargandoDetalle] = useState(
    () => idInicial !== null
  );
  const [operacionPendiente, setOperacionPendiente] = useState<
    "crear" | "renombrar" | "eliminar" | null
  >(null);
  const [diagramaARenombrar, setDiagramaARenombrar] =
    useState<Diagrama | null>(null);
  const [diagramaAEliminar, setDiagramaAEliminar] =
    useState<Diagrama | null>(null);

  // Contador para ignorar respuestas de solicitudes anteriores si el usuario cambia rápido de página
  const peticionActivaRef = useRef<number>(0);

  // Cargar el detalle del diagrama activo
  useEffect(() => {
    if (!diagramaActivoId) return;

    let cancelado = false;
    const peticionActual = ++peticionActivaRef.current;

    obtenerDiagramaAction(proyecto.id, diagramaActivoId)
      .then((res) => {
        if (cancelado || peticionActual !== peticionActivaRef.current) return;

        if (res.ok) {
          setDetalleActivo(res.data);
        } else {
          appToast.error(
            "Error",
            res.errors[0] || "No se pudo cargar el detalle de la página."
          );
        }
      })
      .catch(() => {
        if (cancelado || peticionActual !== peticionActivaRef.current) return;
        appToast.error("Error", "Error de conexión al cargar la página.");
      })
      .finally(() => {
        if (!cancelado && peticionActual === peticionActivaRef.current) {
          setCargandoDetalle(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [proyecto.id, diagramaActivoId]);

  const handleSeleccionarDiagrama = (id: string) => {
    if (id === diagramaActivoId) return;
    setDetalleActivo(null);
    setCargandoDetalle(true);
    setDiagramaActivoId(id);
  };

  const handleCrearPagina = async () => {
    if (operacionPendiente) return;

    setOperacionPendiente("crear");
    try {
      // No se envía nombre ni número: el backend asigna ambos valores necesarios.
      const result = await crearDiagramaAction(proyecto.id, proyecto.slug);
      if (!result.ok) {
        appToast.error(
          "Error al crear la página",
          result.errors[0] || "No se pudo crear la página."
        );
        return;
      }

      setDiagramas((actuales) => {
        const existe = actuales.some(
          (diagrama) => diagrama.id === result.data.id
        );
        return existe
          ? actuales.map((diagrama) =>
              diagrama.id === result.data.id ? result.data : diagrama
            )
          : [...actuales, result.data];
      });
      setDetalleActivo(null);
      setCargandoDetalle(true);
      setDiagramaActivoId(result.data.id);
      appToast.success("Página creada correctamente.");
    } catch {
      appToast.error("Error", "Ocurrió un error inesperado al crear la página.");
    } finally {
      setOperacionPendiente(null);
    }
  };

  const handleGuardarRenombrado = async (
    nombre: string
  ): Promise<string | null> => {
    if (!diagramaARenombrar || operacionPendiente) {
      return "No se pudo identificar la página a renombrar.";
    }

    setOperacionPendiente("renombrar");
    try {
      const result = await actualizarDiagramaAction(
        proyecto.id,
        diagramaARenombrar.id,
        { nombre },
        proyecto.slug
      );
      if (!result.ok) {
        const mensaje =
          result.errors[0] || "No se pudo actualizar el nombre de la página.";
        appToast.error("Error al renombrar", mensaje);
        return mensaje;
      }

      setDiagramas((actuales) =>
        actuales.map((diagrama) =>
          diagrama.id === result.data.id ? result.data : diagrama
        )
      );
      setDiagramaARenombrar(null);
      appToast.success("Página renombrada correctamente.");
      return null;
    } catch {
      const mensaje = "Ocurrió un error inesperado al renombrar la página.";
      appToast.error("Error", mensaje);
      return mensaje;
    } finally {
      setOperacionPendiente(null);
    }
  };

  const handleConfirmarEliminacion = async () => {
    if (!diagramaAEliminar || operacionPendiente) return;

    setOperacionPendiente("eliminar");
    try {
      const result = await eliminarDiagramaAction(
        proyecto.id,
        diagramaAEliminar.id,
        proyecto.slug
      );

      if (!result.ok) {
        const errorMsg =
          result.errors[0] ||
          (result.statusCode === 409
            ? "No se puede eliminar la única página del proyecto."
            : "No se pudo eliminar la página.");
        appToast.error("Error al eliminar", errorMsg);
        setDiagramaAEliminar(null);
        return;
      }

      const idEliminado = diagramaAEliminar.id;
      const diagramasActualizados = diagramas.filter(
        (diagrama) => diagrama.id !== idEliminado
      );

      setDiagramas(diagramasActualizados);

      // Si la página eliminada era la que estaba activa, seleccionar la de menor número restante
      if (diagramaActivoId === idEliminado) {
        if (diagramasActualizados.length > 0) {
          const ordenados = [...diagramasActualizados].sort(
            (a, b) => a.numero - b.numero
          );
          const siguienteId = ordenados[0].id;
          setDiagramaActivoId(siguienteId);
          setDetalleActivo(null);
          setCargandoDetalle(true);
        } else {
          setDiagramaActivoId(null);
          setDetalleActivo(null);
          setCargandoDetalle(false);
        }
      }

      setDiagramaAEliminar(null);
      appToast.success("Página eliminada correctamente.");
    } catch {
      appToast.error(
        "Error",
        "Ocurrió un error inesperado al eliminar la página."
      );
      setDiagramaAEliminar(null);
    } finally {
      setOperacionPendiente(null);
    }
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f5f5f5] text-slate-800 select-none font-sans">
      {/* Cabecera Flotante con Selector de Páginas Integrado */}
      <EditorHeader
        proyecto={proyecto}
        diagramas={diagramas}
        diagramaActivoId={diagramaActivoId}
        creandoPagina={operacionPendiente === "crear"}
        onSeleccionarDiagrama={handleSeleccionarDiagrama}
        onCrearPagina={handleCrearPagina}
        onRenombrarPagina={setDiagramaARenombrar}
        onEliminarPagina={setDiagramaAEliminar}
      />

      {/* Lienzo Diagrama Central */}
      <LienzoDiagrama
        diagramaActivo={detalleActivo}
        cargandoDetalle={cargandoDetalle}
      />

      {/* Controles de Zoom y Navegación (Inferior Izquierda) */}
      <ControlesZoom />

      {/* Barra de Herramientas Flotante (Inferior Central) */}
      <BarraHerramientas />

      {/* Asistente IA (Inferior Derecha) */}
      <ControlIA />

      {/* Modal para renombrar página */}
      <ModalRenombrarPagina
        diagrama={diagramaARenombrar}
        isPending={operacionPendiente === "renombrar"}
        onOpenChange={(open) => {
          if (!open && operacionPendiente !== "renombrar") {
            setDiagramaARenombrar(null);
          }
        }}
        onGuardar={handleGuardarRenombrado}
      />

      {/* Modal para eliminar página */}
      <ModalEliminarPagina
        diagrama={diagramaAEliminar}
        isPending={operacionPendiente === "eliminar"}
        onOpenChange={(open) => {
          if (!open && operacionPendiente !== "eliminar") {
            setDiagramaAEliminar(null);
          }
        }}
        onConfirmar={handleConfirmarEliminacion}
      />
    </div>
  );
}
