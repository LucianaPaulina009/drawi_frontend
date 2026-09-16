"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider, type Viewport } from "@xyflow/react";

import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { crearProyectoAction } from "@/features/gestion-proyectos/presentation/actions/proyecto.action";
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
import { DiagramaQueryParamSchema } from "../../../infrastructure/schemas/diagrama.schemas";
import { useDiagramaActivoUrl } from "../../hooks/use-diagrama-activo-url";
import { useViewportPorDiagrama } from "../../hooks/use-viewport-por-diagrama";
import { useAtajosEditor } from "../../hooks/use-atajos-editor";
import { BarraHerramientas, type HerramientaLienzo } from "./barra-herramientas";
import { ControlesZoom } from "./controles-zoom";
import { ControlIA } from "./control-ia";
import { EditorHeader } from "./editor-header";
import { LienzoDiagrama } from "./lienzo-diagrama";
import { ModalEliminarPagina } from "./modal-eliminar-pagina";
import { ModalRenombrarPagina } from "./modal-renombrar-pagina";
import { ModalCompartirProyecto } from "@/features/gestion-proyectos/presentation/components/elements/modal-compartir-proyecto";

export interface EditorProyectoProps {
  proyecto: Proyecto;
  diagramasIniciales: Diagrama[];
}

export function EditorProyecto({
  proyecto,
  diagramasIniciales,
}: EditorProyectoProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const esUsuarioPropietario = Boolean(
    session?.user?.id && proyecto.propietarioId
      ? session.user.id === proyecto.propietarioId
      : true
  );

  // Lista de páginas en estado local
  const [diagramas, setDiagramas] = useState<Diagrama[]>(diagramasIniciales);
  const { diagramaSolicitado, pushDiagrama, replaceDiagrama } =
    useDiagramaActivoUrl();

  const idDiagramaSolicitado = useMemo(() => {
    const resultado = DiagramaQueryParamSchema.safeParse(diagramaSolicitado);
    return resultado.success ? resultado.data : null;
  }, [diagramaSolicitado]);

  // La URL solicita la selección; el listado autorizado decide si es utilizable.
  const diagramaActivoId = useMemo(() => {
    const ordenados = [...diagramas].sort(
      (a, b) => a.numero - b.numero
    );
    const solicitado = ordenados.find(
      (diagrama) => diagrama.id === idDiagramaSolicitado
    );

    return solicitado?.id ?? ordenados[0]?.id ?? null;
  }, [diagramas, idDiagramaSolicitado]);

  const [detalleActivo, setDetalleActivo] = useState<DiagramaDetalle | null>(
    null
  );
  const [idDiagramaConError, setIdDiagramaConError] = useState<string | null>(
    null
  );
  const [operacionPendiente, setOperacionPendiente] = useState<
    "crear" | "renombrar" | "eliminar" | null
  >(null);
  const [diagramaARenombrar, setDiagramaARenombrar] =
    useState<Diagrama | null>(null);
  const [diagramaAEliminar, setDiagramaAEliminar] =
    useState<Diagrama | null>(null);
  const [modalCompartirAbierto, setModalCompartirAbierto] =
    useState<boolean>(false);

  // Estado de herramienta de navegación activa
  const [herramientaActiva, setHerramientaActiva] =
    useState<HerramientaLienzo>("seleccion");

  // Estado efímero de viewport por diagrama en sesión
  const { obtenerViewport, guardarViewport, limpiarViewport } =
    useViewportPorDiagrama();

  // Estado de transición para creación centralizada de proyecto (compartida por Header y Ctrl+N)
  const [isCreandoProyecto, startCreateProjectTransition] = useTransition();

  const handleCrearProyecto = useCallback(() => {
    if (isCreandoProyecto) return;
    startCreateProjectTransition(async () => {
      try {
        const result = await crearProyectoAction();
        if (result.ok) {
          appToast.success("Proyecto creado con éxito.");
          router.push(`/proyecto/${result.data.slug}`);
        } else {
          const errorMsg =
            result.errors?.[0] || "No se pudo crear el proyecto.";
          appToast.error("Error al crear", errorMsg);
        }
      } catch {
        appToast.error(
          "Error",
          "Ocurrió un error inesperado al crear el proyecto."
        );
      }
    });
  }, [isCreandoProyecto, router]);

  // Atajo Ctrl+S: previene la acción por defecto del navegador sin simular persistencia
  const handleGuardarCambios = useCallback(() => {
    // Actualmente no existe caso de uso de persistencia de diagrama.
    // Queda interceptado para evitar que el navegador abra el diálogo de guardado.
  }, []);

  // Hook centralizado de atajos del editor (Espacio, Ctrl+N, Ctrl+S)
  const { espacioPresionado } = useAtajosEditor({
    onNuevoProyecto: handleCrearProyecto,
    onGuardarCambios: handleGuardarCambios,
    deshabilitado: Boolean(
      diagramaARenombrar || diagramaAEliminar || modalCompartirAbierto
    ),
  });

  // Callback para registrar cambios en el viewport del diagrama activo
  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      if (diagramaActivoId) {
        guardarViewport(diagramaActivoId, viewport);
      }
    },
    [diagramaActivoId, guardarViewport]
  );

  // Contador para ignorar respuestas de solicitudes anteriores si el usuario cambia rápido de página
  const peticionActivaRef = useRef<number>(0);

  const detalleVisible =
    detalleActivo?.id === diagramaActivoId ? detalleActivo : null;
  const cargandoDetalle =
    diagramaActivoId !== null &&
    detalleVisible === null &&
    idDiagramaConError !== diagramaActivoId;

  // Una URL ausente, inválida o no disponible se corrige sin añadir historial.
  useEffect(() => {
    if (
      diagramaActivoId !== null &&
      idDiagramaSolicitado !== diagramaActivoId
    ) {
      replaceDiagrama(diagramaActivoId);
    }
  }, [diagramaActivoId, idDiagramaSolicitado, replaceDiagrama]);

  // Cargar el detalle del diagrama activo
  useEffect(() => {
    if (!diagramaActivoId) return;

    let cancelado = false;
    const peticionActual = ++peticionActivaRef.current;

    obtenerDiagramaAction(proyecto.id, diagramaActivoId)
      .then((res) => {
        if (cancelado || peticionActual !== peticionActivaRef.current) {
          return;
        }

        if (res.ok) {
          if (res.data.id === diagramaActivoId) {
            setDetalleActivo(res.data);
            setIdDiagramaConError(null);
          }
        } else {
          setIdDiagramaConError(diagramaActivoId);
          appToast.error(
            "Error",
            res.errors[0] || "No se pudo cargar el detalle de la página."
          );
        }
      })
      .catch(() => {
        if (cancelado || peticionActual !== peticionActivaRef.current) {
          return;
        }
        setIdDiagramaConError(diagramaActivoId);
        appToast.error("Error", "Error de conexión al cargar la página.");
      });

    return () => {
      cancelado = true;
    };
  }, [proyecto.id, diagramaActivoId]);

  const handleSeleccionarDiagrama = (idDiagrama: string) => {
    if (idDiagrama === diagramaActivoId) return;
    pushDiagrama(idDiagrama);
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
      pushDiagrama(result.data.id);
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
      limpiarViewport(idEliminado);

      const diagramasActualizados = diagramas.filter(
        (diagrama) => diagrama.id !== idEliminado
      );
      const siguienteDiagrama =
        idEliminado === diagramaActivoId
          ? [...diagramasActualizados].sort((a, b) => a.numero - b.numero)[0]
          : undefined;

      setDiagramas(diagramasActualizados);

      if (siguienteDiagrama) {
        replaceDiagrama(siguienteDiagrama.id);
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
    <ReactFlowProvider>
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
          onCrearProyecto={handleCrearProyecto}
          isCreandoProyecto={isCreandoProyecto}
          onCompartir={() => setModalCompartirAbierto(true)}
        />

        {/* Lienzo Diagrama Central */}
        <LienzoDiagrama
          idDiagramaActivo={diagramaActivoId}
          diagramaActivo={detalleVisible}
          cargandoDetalle={cargandoDetalle}
          herramientaActiva={herramientaActiva}
          espacioPresionado={espacioPresionado}
          viewportInicial={obtenerViewport(diagramaActivoId)}
          onViewportChange={handleViewportChange}
        />

        {/* Controles de Zoom y Navegación (Inferior Izquierda) */}
        <ControlesZoom />

        {/* Barra de Herramientas Flotante (Inferior Central) */}
        <BarraHerramientas
          herramientaActiva={herramientaActiva}
          onCambiarHerramienta={setHerramientaActiva}
        />

        {/* Asistente IA (Inferior Derecha) */}
        <ControlIA />

        {/* Modal para compartir proyecto */}
        <ModalCompartirProyecto
          open={modalCompartirAbierto}
          onOpenChange={setModalCompartirAbierto}
          proyecto={proyecto}
          esUsuarioPropietario={esUsuarioPropietario}
        />

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
    </ReactFlowProvider>
  );
}
