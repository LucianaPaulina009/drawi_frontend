"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider, type Connection, type Viewport } from "@xyflow/react";

import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { crearProyectoAction } from "@/features/gestion-proyectos/presentation/actions/proyecto.action";
import type { Proyecto } from "@/features/gestion-proyectos/domain/entities/proyecto.entity";
import type {
  Atributo,
  CrearAtributoData,
} from "../../../domain/entities/atributo.entity";
import type {
  Clase,
} from "../../../domain/entities/clase.entity";
import type { Diagrama } from "../../../domain/entities/diagrama.entity";
import {
  requiereMaterializacion,
  type ConectorRelacion,
  type MaterializacionFkData,
  type Relacion,
  type TipoRelacion,
} from "../../../domain/entities/relacion.entity";
import {
  actualizarDiagramaAction,
  crearDiagramaAction,
  eliminarDiagramaAction,
} from "../../actions/diagrama.action";
import { useHidratacionEditor } from "../../hooks/use-hidratacion-editor";
import { DiagramaQueryParamSchema } from "../../../infrastructure/schemas/diagrama.schemas";
import { useDiagramaActivoUrl } from "../../hooks/use-diagrama-activo-url";
import { useViewportPorDiagrama } from "../../hooks/use-viewport-por-diagrama";
import { useAtajosEditor } from "../../hooks/use-atajos-editor";
import { usePermisoEdicionDiagrama } from "../../hooks/use-permiso-edicion-diagrama";
import { BarraHerramientas, type HerramientaLienzo } from "./barra-herramientas";
import { ControlesZoom } from "./controles-zoom";
import { AsistenteIaEditor } from "@/features/inteligencia-artificial/presentation/components/elements/asistente-ia-editor";
import { EditorHeader } from "./editor-header";
import { LienzoDiagrama } from "./lienzo-diagrama";
import {
  PanelPropiedadesDiagrama,
  type ModoPanelPropiedades,
} from "./panel-propiedades-diagrama";
import { ModalEliminarPagina } from "./modal-eliminar-pagina";
import { ModalRenombrarPagina } from "./modal-renombrar-pagina";
import { ModalEliminarClase } from "./modal-eliminar-clase";
import { ModalEliminarAtributo } from "./modal-eliminar-atributo";
import { ModalEliminarRelacion } from "./modal-eliminar-relacion";
import { PanelRelaciones } from "./panel-relaciones";
import { PropuestaReferenciaFkModal } from "./propuesta-referencia-fk-modal";
import { PropuestaEstructuraNmForm } from "../forms/propuesta-estructura-nm-form";
import { ModalCompartirProyecto } from "@/features/gestion-colaboradores/presentation/components/elements/modal-compartir-proyecto";
import { authClient } from "@/lib/auth-client";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";
import { crearScopeEditor, type OperacionEditor } from "../../../domain/entities/operacion-editor.entity";
import { useProcesadorColaEditor } from "../../hooks/use-procesador-cola-editor";
import { colaEditorRepository, useEncolarOperacionEditor } from "../../hooks/use-encolar-operacion-editor";
import { despacharOperacionEditor } from "../../services/ejecutor-operacion-editor";
import { useColaboracionTiempoReal } from "../../hooks/use-colaboracion-tiempo-real";
import { useBloqueoClase } from "../../hooks/use-bloqueo-clase";
import { useColaboracionStore } from "../../stores/colaboracion.store";
import { colaboracionSocketService } from "../../../infrastructure/websocket/colaboracion-socket.service";

export interface EditorProyectoProps {
  proyecto: Proyecto;
  diagramasIniciales: Diagrama[];
}

interface RelacionNmPendiente {
  origen: Clase;
  destino: Clase;
  atributoOrigenId: string;
  atributoDestinoId: string;
  posicionX: number;
  posicionY: number;
}

const ANCHO_CLASE_INTERMEDIA_NM = 280;
const ALTO_ESTIMADO_CLASE_INTERMEDIA_NM = 140;
const SEPARACION_CLASE_INTERMEDIA_NM = 120;
const LIMITE_VERTICAL_SUPERIOR_LIENZO = -6000;
const LIMITE_VERTICAL_INFERIOR_LIENZO = 6000;

function calcularPosicionIntermediaNm(
  origen: Clase,
  destino: Clase
): { posicionX: number; posicionY: number } {
  const origX = Number.isFinite(origen.posicionX) ? origen.posicionX : 0;
  const origY = Number.isFinite(origen.posicionY) ? origen.posicionY : 0;
  const origAncho = Number.isFinite(origen.ancho) ? origen.ancho : 280;
  const destX = Number.isFinite(destino.posicionX) ? destino.posicionX : 0;
  const destY = Number.isFinite(destino.posicionY) ? destino.posicionY : 0;
  const destAncho = Number.isFinite(destino.ancho) ? destino.ancho : 280;

  // Las posiciones son la esquina superior izquierda. La clase intermedia se
  // sitúa sobre el punto medio de A/B para que la proyección N:M quede como
  // una línea principal con un único ramal ortogonal, no dos asociaciones.
  const centroOrigenX = origX + origAncho / 2;
  const centroDestinoX = destX + destAncho / 2;
  const centroOrigenY = origY + ALTO_ESTIMADO_CLASE_INTERMEDIA_NM / 2;
  const centroDestinoY = destY + ALTO_ESTIMADO_CLASE_INTERMEDIA_NM / 2;

  const centroY = (centroOrigenY + centroDestinoY) / 2;
  const posicionSuperior =
    centroY - ALTO_ESTIMADO_CLASE_INTERMEDIA_NM - SEPARACION_CLASE_INTERMEDIA_NM;
  const posicionInferior = centroY + SEPARACION_CLASE_INTERMEDIA_NM;
  const posicionY =
    posicionSuperior >= LIMITE_VERTICAL_SUPERIOR_LIENZO
      ? posicionSuperior
      : Math.min(
          posicionInferior,
          LIMITE_VERTICAL_INFERIOR_LIENZO - ALTO_ESTIMADO_CLASE_INTERMEDIA_NM
        );

  return {
    posicionX: Math.round(
      (centroOrigenX + centroDestinoX) / 2 - ANCHO_CLASE_INTERMEDIA_NM / 2
    ),
    posicionY: Math.round(posicionY),
  };
}

function resolverConectoresHacia(
  origen: Pick<Clase, "posicionX" | "posicionY">,
  destino: Pick<Clase, "posicionX" | "posicionY">
): { conectorOrigen: ConectorRelacion; conectorDestino: ConectorRelacion } {
  const deltaX = destino.posicionX - origen.posicionX;
  const deltaY = destino.posicionY - origen.posicionY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { conectorOrigen: "right", conectorDestino: "left" }
      : { conectorOrigen: "left", conectorDestino: "right" };
  }

  return deltaY >= 0
    ? { conectorOrigen: "bottom", conectorDestino: "top" }
    : { conectorOrigen: "top", conectorDestino: "bottom" };
}

export function EditorProyecto({
  proyecto,
  diagramasIniciales,
}: EditorProyectoProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { puedeEditar, esPropietario } = usePermisoEdicionDiagrama(proyecto);

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

  // El dominio del editor vive exclusivamente en Zustand. Los nombres de
  // adaptador conservan la API de los flujos visuales existentes de 014.
  const detalleActivo = useEditorDiagramaStore((estado) => estado.detalleConfirmado);
  const clasesLocales = useEditorDiagramaStore((estado) => estado.clases);
  const relacionesLocales = useEditorDiagramaStore((estado) => estado.relaciones);
  const revisionCola = useEditorDiagramaStore((estado) => estado.revisionCola);
  const claseSeleccionadaId = useEditorDiagramaStore((estado) => estado.claseSeleccionadaId);
  const relacionSeleccionadaId = useEditorDiagramaStore((estado) => estado.relacionSeleccionadaId);
  const fijarClaseSeleccionada = useEditorDiagramaStore((estado) => estado.fijarClaseSeleccionada);
  const fijarRelacionSeleccionada = useEditorDiagramaStore((estado) => estado.fijarRelacionSeleccionada);
  const setClaseSeleccionadaId = fijarClaseSeleccionada;
  const setRelacionSeleccionadaId = fijarRelacionSeleccionada;
  const clasesLocalesRef = useRef<Clase[]>(clasesLocales);
  const relacionesLocalesRef = useRef<Relacion[]>(relacionesLocales);
  useEffect(() => {
    clasesLocalesRef.current = clasesLocales;
    relacionesLocalesRef.current = relacionesLocales;
  }, [clasesLocales, relacionesLocales]);
  const scopeEditor =
    diagramaActivoId && session?.user?.id
      ? crearScopeEditor(session.user.id, diagramaActivoId)
      : null;
  const encolarOperacion = useEncolarOperacionEditor(scopeEditor);
  const handleOperacionRechazada = useCallback((_operacion: OperacionEditor, mensaje: string) => {
    appToast.error("No se pudo sincronizar un cambio", mensaje);
  }, []);
  useProcesadorColaEditor({
    scopeKey: scopeEditor,
    repository: colaEditorRepository,
    despachar: despacharOperacionEditor,
    obtenerDetalleConfirmado: () => useEditorDiagramaStore.getState().detalleConfirmado,
    alRechazar: handleOperacionRechazada,
    revision: revisionCola,
  });
  useColaboracionTiempoReal({
    diagramaId: diagramaActivoId,
    habilitado: Boolean(diagramaActivoId),
  });

  // Estado del Panel Lateral Contextual de Propiedades
  const [modoPanel, setModoPanel] = useState<ModoPanelPropiedades>("clase");
  const [atributoSeleccionadoId, setAtributoSeleccionadoId] = useState<
    string | null
  >(null);

  // Exclusividad de paneles principales (propiedades vs IA)
  const [panelPrincipal, setPanelPrincipal] = useState<"propiedades" | "ia" | null>(null);
  const panelPropiedadesAbierto = panelPrincipal === "propiedades";
  const panelIaAbierto = panelPrincipal === "ia";

  const setPanelPropiedadesAbierto = useCallback((abierto: boolean) => {
    setPanelPrincipal(abierto ? "propiedades" : null);
  }, []);

  const handleAbrirIa = useCallback(() => {
    const idActual = useEditorDiagramaStore.getState().claseSeleccionadaId;
    if (idActual) {
      colaboracionSocketService.liberarBloqueoClase(idActual);
    }
    setClaseSeleccionadaId(null);
    setAtributoSeleccionadoId(null);
    setRelacionSeleccionadaId(null);
    setPanelPrincipal("ia");
  }, [setClaseSeleccionadaId, setAtributoSeleccionadoId, setRelacionSeleccionadaId]);

  const handleCerrarIa = useCallback(() => {
    setPanelPrincipal((prev) => (prev === "ia" ? null : prev));
  }, []);

  useBloqueoClase(panelPropiedadesAbierto ? claseSeleccionadaId : null);
  const [tipoRelacionPendiente, setTipoRelacionPendiente] = useState<
    TipoRelacion | undefined
  >();
  const [cardinalidadesPendientes, setCardinalidadesPendientes] = useState<
    [string, string]
  >(["1", "1"]);
  const [conexionPendiente, setConexionPendiente] = useState(false);
  const [relacionPendienteFk, setRelacionPendienteFk] =
    useState<Relacion | null>(null);
  const [relacionAEliminar, setRelacionAEliminar] = useState<Relacion | null>(
    null
  );
  const [relacionNmPendiente, setRelacionNmPendiente] = useState<RelacionNmPendiente | null>(null);

  const [idDiagramaConError, setIdDiagramaConError] = useState<string | null>(
    null
  );
  const [operacionPaginaPendiente, setOperacionPaginaPendiente] = useState<
    "crear" | "renombrar" | "eliminar" | null
  >(null);
  const [diagramaARenombrar, setDiagramaARenombrar] =
    useState<Diagrama | null>(null);
  const [diagramaAEliminar, setDiagramaAEliminar] =
    useState<Diagrama | null>(null);
  const [modalCompartirAbierto, setModalCompartirAbierto] =
    useState<boolean>(false);

  // Diálogos de confirmación destructiva
  const [claseAEliminar, setClaseAEliminar] = useState<Clase | null>(null);
  const [atributoAEliminar, setAtributoAEliminar] = useState<Atributo | null>(
    null
  );
  const [isPendingOperacion] = useState(false);

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
    // Interceptado para evitar que el navegador abra el diálogo de guardado.
  }, []);

  // Manejo de Delete / Supr centralizado
  const handleEliminarSeleccion = useCallback(() => {
    if (!puedeEditar) return;
    if (relacionSeleccionadaId) {
      const rel = relacionesLocalesRef.current.find(
        (r) => r.id === relacionSeleccionadaId
      );
      if (rel) {
        setRelacionAEliminar(rel);
        return;
      }
    }
    if (
      modoPanel === "editar-atributo" &&
      atributoSeleccionadoId &&
      claseSeleccionadaId
    ) {
      const clasePadre = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      const attr = clasePadre?.atributos?.find(
        (a) => a.id === atributoSeleccionadoId
      );
      if (attr) {
        setAtributoAEliminar(attr);
        return;
      }
    }
    if (claseSeleccionadaId) {
      const lock = useColaboracionStore.getState().bloqueosClases[claseSeleccionadaId];
      const miId = useColaboracionStore.getState().miUsuarioId;
      if (lock && miId && lock.idUsuario !== miId) {
        appToast.error("Clase bloqueada", `Esta clase está siendo editada por ${lock.nombreUsuario}`);
        return;
      }
      const seleccionada = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      if (seleccionada) {
        setClaseAEliminar(seleccionada);
      }
    }
  }, [
    puedeEditar,
    relacionSeleccionadaId,
    modoPanel,
    atributoSeleccionadoId,
    claseSeleccionadaId,
  ]);

  // Copia de Atributo (Ctrl+D o botón de fila)
  const handleCopiarAtributo = useCallback(
    async (atributo: Atributo) => {
      if (!puedeEditar || isPendingOperacion || !diagramaActivoId) return;

      if (atributo.esLlavePrimaria) {
        appToast.error("Acción no permitida", "No se puede duplicar la clave primaria de una clase.");
        return;
      }

      const nuevoAttrId = crypto.randomUUID();
      const claseTarget = clasesLocalesRef.current.find(
        (c) => c.id === atributo.idClase
      );
      const nuevoOrden = (claseTarget?.atributos?.length || 0) + 1;

      try {
        await encolarOperacion(
          "CREAR_ATRIBUTO",
          {
            idClase: atributo.idClase,
            idAtributo: nuevoAttrId,
            nombre: `${atributo.nombre}_copia`,
            tipoDato: atributo.tipoDato,
            longitud: atributo.longitud,
            precision: atributo.precision,
            escala: atributo.escala,
            permiteNulo: atributo.permiteNulo,
            esLlavePrimaria: false,
            esUnico: false,
            valorPorDefecto: atributo.valorPorDefecto,
            ordenDePosicion: nuevoOrden,
          },
          { actionId: crypto.randomUUID() }
        );
      } catch {
        appToast.error("Error", "No se pudo registrar la copia del atributo.");
      }
    },
    [puedeEditar, isPendingOperacion, diagramaActivoId, encolarOperacion]
  );

  // Atajo Ctrl+D para duplicar el atributo activo
  const handleDuplicarSeleccion = useCallback(() => {
    if (!puedeEditar) return;
    if (atributoSeleccionadoId && claseSeleccionadaId) {
      const clasePadre = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      const attr = clasePadre?.atributos?.find(
        (a) => a.id === atributoSeleccionadoId
      );
      if (attr) {
        handleCopiarAtributo(attr);
      }
    }
  }, [puedeEditar, atributoSeleccionadoId, claseSeleccionadaId, handleCopiarAtributo]);

  // Hook centralizado de atajos del editor (Espacio, Ctrl+N, Ctrl+S, Ctrl+D, Delete)
  const { espacioPresionado } = useAtajosEditor({
    onNuevoProyecto: handleCrearProyecto,
    onGuardarCambios: handleGuardarCambios,
    onDuplicarSeleccion: handleDuplicarSeleccion,
    onEliminarSeleccion: handleEliminarSeleccion,
    onCancelarInteraccion: () => setHerramientaActiva("seleccion"),
    deshabilitado: Boolean(
      diagramaARenombrar ||
        diagramaAEliminar ||
        modalCompartirAbierto ||
        claseAEliminar ||
        atributoAEliminar ||
        relacionAEliminar ||
        relacionPendienteFk
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

  const { cargando: cargandoHidratacion } = useHidratacionEditor({
    usuarioId: session?.user?.id ?? null,
    proyectoId: proyecto.id,
    diagramaId: diagramaActivoId,
    alFallar: (msg) => {
      if (diagramaActivoId) {
        setIdDiagramaConError(diagramaActivoId);
      }
      appToast.error("Error", msg);
    },
  });

  // Limpiar paneles y selección cuando cambia de diagrama activo
  useEffect(() => {
    // El cambio de página requiere descartar el formulario visible del diagrama anterior.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAtributoSeleccionadoId(null);
    setPanelPropiedadesAbierto(false);
    setIdDiagramaConError(null);
  }, [diagramaActivoId, setPanelPropiedadesAbierto]);

  const detalleVisible =
    detalleActivo?.id === diagramaActivoId ? detalleActivo : null;
  const cargandoDetalle =
    diagramaActivoId !== null &&
    (detalleVisible === null || cargandoHidratacion) &&
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

  const handleSeleccionarDiagrama = (idDiagrama: string) => {
    if (idDiagrama === diagramaActivoId) return;
    setClaseSeleccionadaId(null);
    setAtributoSeleccionadoId(null);
    setModoPanel("clase");
    setClaseAEliminar(null);
    setAtributoAEliminar(null);
    setRelacionSeleccionadaId(null);
    setRelacionPendienteFk(null);
    setRelacionAEliminar(null);
    setPanelPropiedadesAbierto(false);
    pushDiagrama(idDiagrama);
  };

  // ── Gestión de Páginas ──────────────────────────────────────────────────────

  const handleCrearPagina = async () => {
    if (operacionPaginaPendiente) return;

    setOperacionPaginaPendiente("crear");
    try {
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
      setOperacionPaginaPendiente(null);
    }
  };

  const handleGuardarRenombrado = async (
    nombre: string
  ): Promise<string | null> => {
    if (!diagramaARenombrar || operacionPaginaPendiente) {
      return "No se pudo identificar la página a renombrar.";
    }

    setOperacionPaginaPendiente("renombrar");
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
      setOperacionPaginaPendiente(null);
    }
  };

  const handleConfirmarEliminacion = async () => {
    if (!diagramaAEliminar || operacionPaginaPendiente) return;

    setOperacionPaginaPendiente("eliminar");
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
      setOperacionPaginaPendiente(null);
    }
  };

  // ── Selección y Panel de Propiedades Contextual ─────────────────────────────

  const claseSeleccionada = useMemo(() => {
    if (!claseSeleccionadaId) return null;
    return clasesLocales.find((c) => c.id === claseSeleccionadaId) || null;
  }, [clasesLocales, claseSeleccionadaId]);

  const atributoSeleccionado = useMemo(() => {
    if (!claseSeleccionada || !atributoSeleccionadoId) return null;
    return (
      claseSeleccionada.atributos?.find((a) => a.id === atributoSeleccionadoId) ||
      null
    );
  }, [claseSeleccionada, atributoSeleccionadoId]);

  const handleSeleccionarClase = useCallback((idClase: string | null) => {
    setClaseSeleccionadaId(idClase);
    if (idClase) {
      setRelacionSeleccionadaId(null);
    }
  }, [setClaseSeleccionadaId, setRelacionSeleccionadaId]);

  const handleSeleccionarRelacion = useCallback((idRelacion: string | null) => {
    setRelacionSeleccionadaId(idRelacion);
    if (idRelacion) {
      setClaseSeleccionadaId(null);
      setAtributoSeleccionadoId(null);
      setPanelPropiedadesAbierto(false);
    }
  }, [setAtributoSeleccionadoId, setClaseSeleccionadaId, setPanelPropiedadesAbierto, setRelacionSeleccionadaId]);

  const handleAbrirPropiedadesClase = useCallback((idClase: string) => {
    const lock = useColaboracionStore.getState().bloqueosClases[idClase];
    const miId = useColaboracionStore.getState().miUsuarioId;
    if (lock && miId && lock.idUsuario !== miId) {
      appToast.error("Clase bloqueada", `Esta clase está siendo editada por ${lock.nombreUsuario}`);
      return;
    }
    colaboracionSocketService.solicitarBloqueoClase(idClase);

    setClaseSeleccionadaId(idClase);
    setModoPanel("clase");
    setAtributoSeleccionadoId(null);
    setRelacionSeleccionadaId(null);
    setPanelPropiedadesAbierto(true);
  }, [setAtributoSeleccionadoId, setClaseSeleccionadaId, setModoPanel, setPanelPropiedadesAbierto, setRelacionSeleccionadaId]);

  const handleAbrirPropiedadesAtributo = useCallback((atributo: Atributo) => {
    const lock = useColaboracionStore.getState().bloqueosClases[atributo.idClase];
    const miId = useColaboracionStore.getState().miUsuarioId;
    if (lock && miId && lock.idUsuario !== miId) {
      appToast.error("Clase bloqueada", `La clase contenedora está siendo editada por ${lock.nombreUsuario}`);
      return;
    }
    colaboracionSocketService.solicitarBloqueoClase(atributo.idClase);

    setClaseSeleccionadaId(atributo.idClase);
    setAtributoSeleccionadoId(atributo.id);
    setModoPanel("editar-atributo");
    setRelacionSeleccionadaId(null);
    setPanelPropiedadesAbierto(true);
  }, [setAtributoSeleccionadoId, setClaseSeleccionadaId, setModoPanel, setPanelPropiedadesAbierto, setRelacionSeleccionadaId]);

  const handleCambiarModoPanel = useCallback(
    (nuevoModo: ModoPanelPropiedades, attr?: Atributo | null) => {
      setModoPanel(nuevoModo);
      if (attr) {
        setAtributoSeleccionadoId(attr.id);
      } else if (nuevoModo === "clase" || nuevoModo === "crear-atributo") {
        setAtributoSeleccionadoId(null);
      }
    },
    []
  );

  const handleCerrarPanel = useCallback(() => {
    const idActual = useEditorDiagramaStore.getState().claseSeleccionadaId;
    if (idActual) {
      colaboracionSocketService.liberarBloqueoClase(idActual);
    }
    setClaseSeleccionadaId(null);
    setAtributoSeleccionadoId(null);
    setRelacionSeleccionadaId(null);
    setModoPanel("clase");
    setPanelPropiedadesAbierto(false);
  }, [setAtributoSeleccionadoId, setClaseSeleccionadaId, setModoPanel, setPanelPropiedadesAbierto, setRelacionSeleccionadaId]);

  // ── Gestión de Clases UML (US2 & US3) ───────────────────────────────────────

  // Creación de Clase compacta al hacer clic sobre el pane (T027)
  const handleCrearClaseEnPosicion = useCallback(
    async (x: number, y: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn(`[handleCrearClaseEnPosicion] Coordenadas inválidas ignoradas: x=${x}, y=${y}`);
        return;
      }

      const classId = crypto.randomUUID();
      const atributoInicialId = crypto.randomUUID();

      setClaseSeleccionadaId(classId);
      setModoPanel("clase");
      setAtributoSeleccionadoId(null);
      setHerramientaActiva("seleccion");
      setPanelPropiedadesAbierto(true);

      try {
        await encolarOperacion(
          "CREAR_CLASE",
          {
            idClase: classId,
            idAtributoInicial: atributoInicialId,
            nombre: "Tabla",
            posicionX: x,
            posicionY: y,
            ancho: 220,
          },
          { actionId: crypto.randomUUID() }
        );
      } catch {
        appToast.error("Error", "No se pudo registrar la creación local de la clase.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion, setClaseSeleccionadaId, setAtributoSeleccionadoId, setModoPanel, setHerramientaActiva, setPanelPropiedadesAbierto]
  );

  // Movimiento de Clase al soltar drag (onNodeDragStop): toma la posición final y ejecuta un único evento
  const handleMoverClaseStop = useCallback(
    async (idClase: string, x: number, y: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn(`[handleMoverClaseStop] Coordenadas no finitas ignoradas: idClase=${idClase}, x=${x}, y=${y}`);
        return;
      }

      const claseExiste = clasesLocalesRef.current.some((c) => c.id === idClase);
      if (!claseExiste) return;

      const posX = Math.round(x);
      const posY = Math.round(y);

      try {
        await encolarOperacion("ACTUALIZAR_CLASE", {
          idClase,
          posicionX: posX,
          posicionY: posY,
        });
      } catch {
        appToast.error("Error", "No se pudo registrar el movimiento local.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion]
  );

  // Redimensionamiento visual en el lienzo al soltar handle de resize (ancho >= 180)
  const handleRedimensionarClaseStop = useCallback(
    async (idClase: string, nuevoAncho: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      if (!Number.isFinite(nuevoAncho)) {
        console.warn(`[handleRedimensionarClaseStop] Ancho no finito ignorado: idClase=${idClase}, ancho=${nuevoAncho}`);
        return;
      }

      const anchoFinal = Math.max(180, Math.round(nuevoAncho));
      const claseAnterior = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!claseAnterior || claseAnterior.ancho === anchoFinal) return;

      try {
        await encolarOperacion("ACTUALIZAR_CLASE", {
          idClase,
          ancho: anchoFinal,
        });
      } catch {
        appToast.error("Error", "No se pudo registrar el cambio de ancho.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion]
  );

  // Renombrado de Clase (desde panel o modal)
  const handleGuardarNombreClase = useCallback(
    async (nuevoNombre: string): Promise<string | null> => {
      if (!claseSeleccionadaId || !diagramaActivoId || isPendingOperacion) {
        return "No se pudo identificar la clase a renombrar.";
      }

      const cleanNombre = nuevoNombre.trim();
      const claseActual = clasesLocalesRef.current.find((c) => c.id === claseSeleccionadaId);
      if (claseActual && claseActual.nombre === cleanNombre) {
        return null;
      }

      try {
        await encolarOperacion("ACTUALIZAR_CLASE", {
          idClase: claseSeleccionadaId,
          nombre: cleanNombre,
        });
        return null;
      } catch {
        const msg = "No se pudo registrar el cambio de nombre.";
        appToast.error("Error", msg);
        return msg;
      }
    },
    [claseSeleccionadaId, diagramaActivoId, isPendingOperacion, encolarOperacion]
  );

  // Renombrado rápido inline desde doble clic en nodo
  const handleRenombrarClaseInline = useCallback(
    async (idClase: string, nuevoNombre: string) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const cleanNombre = nuevoNombre.trim();
      const claseActual = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!claseActual || !cleanNombre || claseActual.nombre === cleanNombre) {
        return;
      }

      try {
        await encolarOperacion("ACTUALIZAR_CLASE", {
          idClase,
          nombre: cleanNombre,
        });
      } catch {
        appToast.error("Error", "No se pudo registrar el cambio de nombre.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion]
  );

  // Eliminación de Clase (Diálogo destructivo unificado por Borrador / Delete / Panel)
  const handleConfirmarEliminacionClase = async () => {
    if (!claseAEliminar || !diagramaActivoId || isPendingOperacion) return;

    const idClaseBorrar = claseAEliminar.id;
    try {
      await encolarOperacion("ELIMINAR_CLASE", {
        idClase: idClaseBorrar,
      });

      if (claseSeleccionadaId === idClaseBorrar) {
        setClaseSeleccionadaId(null);
        setAtributoSeleccionadoId(null);
        setModoPanel("clase");
        setPanelPropiedadesAbierto(false);
      }
      setClaseAEliminar(null);
    } catch {
      appToast.error("Error", "No se pudo registrar la eliminación de la clase.");
      setClaseAEliminar(null);
    }
  };

  // ── Gestión de Atributos (US4 & US5) ────────────────────────────────────────

  const handleAbrirNuevoAtributo = useCallback(
    async (idClase: string) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const clase = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!clase) return;

      const attrId = crypto.randomUUID();
      const siguienteOrden = (clase.atributos?.length || 0) + 1;
      const nombreAttr = `columna_${siguienteOrden}`;

      try {
        await encolarOperacion(
          "CREAR_ATRIBUTO",
          {
            idClase,
            idAtributo: attrId,
            nombre: nombreAttr,
            tipoDato: "integer",
            permiteNulo: true,
            esLlavePrimaria: false,
            ordenDePosicion: siguienteOrden,
          },
          { actionId: crypto.randomUUID() }
        );

        setClaseSeleccionadaId(idClase);
        setAtributoSeleccionadoId(attrId);
        setModoPanel("editar-atributo");
        setPanelPropiedadesAbierto(true);
      } catch {
        appToast.error("Error", "No se pudo crear el atributo.");
      }
    },
    [
      puedeEditar,
      diagramaActivoId,
      encolarOperacion,
      setClaseSeleccionadaId,
      setPanelPropiedadesAbierto,
    ]
  );

  const handleSeleccionarAtributo = useCallback((atributo: Atributo) => {
    setClaseSeleccionadaId(atributo.idClase);
    setAtributoSeleccionadoId(atributo.id);
    setModoPanel("editar-atributo");
  }, [setAtributoSeleccionadoId, setClaseSeleccionadaId, setModoPanel]);

  const handleGuardarAtributo = useCallback(
    async (datos: CrearAtributoData): Promise<string | null> => {
      const clasePadre = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      if (!clasePadre || !diagramaActivoId || isPendingOperacion) {
        return "No se pudo identificar la clase del atributo.";
      }

      try {
        if (modoPanel === "editar-atributo" && atributoSeleccionadoId) {
          const attrExistente = clasePadre.atributos.find(
            (a) => a.id === atributoSeleccionadoId
          );
          if (!attrExistente) return "Atributo no encontrado.";

          if (attrExistente.esLlavePrimaria) {
            // PK: solo se puede modificar el nombre
            await encolarOperacion("ACTUALIZAR_ATRIBUTO", {
              idClase: clasePadre.id,
              idAtributo: atributoSeleccionadoId,
              nombre: datos.nombre,
            });
          } else if (attrExistente.procedencia === "sistema_fk") {
            // FK: el formulario solo permite modificar su nombre.
            await encolarOperacion("ACTUALIZAR_ATRIBUTO", {
              idClase: clasePadre.id,
              idAtributo: atributoSeleccionadoId,
              nombre: datos.nombre,
            });
          } else {
            // Atributo normal
            await encolarOperacion("ACTUALIZAR_ATRIBUTO", {
              idClase: clasePadre.id,
              idAtributo: atributoSeleccionadoId,
              nombre: datos.nombre,
              tipoDato: datos.tipoDato,
              longitud: datos.longitud ?? null,
              precision: datos.precision ?? null,
              escala: datos.escala ?? null,
              permiteNulo: datos.permiteNulo ?? true,
              esUnico: datos.esUnico ?? false,
              valorPorDefecto: datos.valorPorDefecto ?? null,
            });
          }

          setModoPanel("clase");
          setAtributoSeleccionadoId(null);
          return null;
        } else {
          // Creación explícita
          const attrId = crypto.randomUUID();
          const siguienteOrden = (clasePadre.atributos?.length || 0) + 1;

          await encolarOperacion(
            "CREAR_ATRIBUTO",
            {
              idClase: clasePadre.id,
              idAtributo: attrId,
              nombre: datos.nombre,
              tipoDato: datos.tipoDato,
              longitud: datos.longitud ?? null,
              precision: datos.precision ?? null,
              escala: datos.escala ?? null,
              permiteNulo: datos.permiteNulo ?? true,
              esLlavePrimaria: false,
              esUnico: datos.esUnico ?? false,
              valorPorDefecto: datos.valorPorDefecto ?? null,
              ordenDePosicion: datos.ordenDePosicion ?? siguienteOrden,
            },
          { actionId: crypto.randomUUID() }
          );

          setModoPanel("clase");
          setAtributoSeleccionadoId(null);
          return null;
        }
      } catch {
        const msg = "No se pudo registrar el cambio del atributo.";
        appToast.error("Error", msg);
        return msg;
      }
    },
    [claseSeleccionadaId, diagramaActivoId, modoPanel, atributoSeleccionadoId, isPendingOperacion, encolarOperacion]
  );

  // Eliminación de Atributo (Diálogo destructivo)
  const handleConfirmarEliminacionAtributo = async () => {
    if (!atributoAEliminar || isPendingOperacion || !diagramaActivoId) return;

    const { idClase, id, esLlavePrimaria, procedencia } = atributoAEliminar;

    if (esLlavePrimaria) {
      appToast.error("Acción no permitida", "No se puede eliminar la clave primaria.");
      setAtributoAEliminar(null);
      return;
    }
    if (procedencia === "sistema_fk") {
      appToast.error("Acción no permitida", "No se puede eliminar la clave foránea.");
      setAtributoAEliminar(null);
      return;
    }

    try {
      await encolarOperacion("ELIMINAR_ATRIBUTO", {
        idClase,
        idAtributo: id,
      });

      if (atributoSeleccionadoId === id) {
        setAtributoSeleccionadoId(null);
        setModoPanel("clase");
      }
      setAtributoAEliminar(null);
    } catch {
      appToast.error("Error", "No se pudo registrar la eliminación del atributo.");
      setAtributoAEliminar(null);
    }
  };

  // Reordenar Atributo (T030)
  const handleReordenarAtributo = useCallback(
    async (idClase: string, idAtributo: string, nuevoOrden: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      if (!Number.isFinite(nuevoOrden)) {
        console.warn(`[handleReordenarAtributo] Orden no finito ignorado: nuevoOrden=${nuevoOrden}`);
        return;
      }

      const clase = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!clase) return;

      const attr = clase.atributos.find((a) => a.id === idAtributo);
      // La PK no se mueve (siempre fija en posición 1)
      if (!attr || attr.esLlavePrimaria) return;

      // El nuevo orden no puede sobreescribir la posición 1 reservada para la PK
      const ordenFinal = Math.min(
        clase.atributos.length,
        Math.max(2, Math.trunc(nuevoOrden))
      );
      if (ordenFinal === attr.ordenDePosicion) return;

      try {
        await encolarOperacion("ACTUALIZAR_ATRIBUTO", {
          idClase,
          idAtributo,
          ordenDePosicion: ordenFinal,
        });
      } catch {
        appToast.error("Error", "No se pudo registrar el nuevo orden.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion]
  );

  // ── Gestión de Relaciones UML y Referencias FK ──────────────────────────────

  const handleConectarRelacion = useCallback(
    async (conexion: Connection) => {
      if (
        !puedeEditar ||
        !diagramaActivoId ||
        !conexion.source ||
        !conexion.target
      ) {
        return;
      }

      // Normalizar origen y destino: asegurar que el nodo donde inició el arrastre sea el origen
      let idClaseOrigen = conexion.source;
      let idClaseDestino = conexion.target;
      let conectorOrigenRaw = conexion.sourceHandle;
      let conectorDestinoRaw = conexion.targetHandle;

      if (
        conexion.sourceHandle?.includes("-target") &&
        !conexion.targetHandle?.includes("-target")
      ) {
        idClaseOrigen = conexion.target;
        idClaseDestino = conexion.source;
        conectorOrigenRaw = conexion.targetHandle;
        conectorDestinoRaw = conexion.sourceHandle;
      }

      const conectorOrigen =
        (conectorOrigenRaw?.replace("-target", "") as ConectorRelacion) || "right-center";
      const conectorDestino =
        (conectorDestinoRaw?.replace("-target", "") as ConectorRelacion) ||
        "left-center";

      const tipo = tipoRelacionPendiente || "asociacion";
      const [cardinalidadOrigen, cardinalidadDestino] = cardinalidadesPendientes;

      const esMuchos = (valor: string) =>
        valor.trim() === "*" || /\.\.\*$/.test(valor.trim()) || Number(valor) > 1;
      if (esMuchos(cardinalidadOrigen) && esMuchos(cardinalidadDestino)) {
        const origen = clasesLocalesRef.current.find((clase) => clase.id === idClaseOrigen);
        const destino = clasesLocalesRef.current.find((clase) => clase.id === idClaseDestino);
        const atributoOrigen = origen?.atributos.find((atributo) => atributo.esLlavePrimaria || atributo.esUnico);
        const atributoDestino = destino?.atributos.find((atributo) => atributo.esLlavePrimaria || atributo.esUnico);
        if (!origen || !destino || !atributoOrigen || !atributoDestino) {
          appToast.error("No se puede crear la relación N:M", "Ambas clases deben tener un atributo PK o UNIQUE para crear la tabla intermedia.");
          return;
        }
        const posicionIntermedia = calcularPosicionIntermediaNm(origen, destino);
        setRelacionNmPendiente({
          origen,
          destino,
          atributoOrigenId: atributoOrigen.id,
          atributoDestinoId: atributoDestino.id,
          posicionX: posicionIntermedia.posicionX,
          posicionY: posicionIntermedia.posicionY,
        });
        return;
      }

      const idRelacionDefinitivo = crypto.randomUUID();

      const nuevaRelacion: Relacion = {
        id: idRelacionDefinitivo,
        idDiagrama: diagramaActivoId,
        idClaseOrigen,
        idClaseDestino,
        tipoRelacion: tipo,
        cardinalidadOrigen,
        cardinalidadDestino,
        conectorOrigen,
        conectorDestino,
        referenciasFk: [],
      };

      const necesitaFk = requiereMaterializacion(
        tipo,
        cardinalidadOrigen,
        cardinalidadDestino
      );

      if (necesitaFk) {
        setRelacionPendienteFk(nuevaRelacion);
      } else {
        setRelacionSeleccionadaId(idRelacionDefinitivo);
        setHerramientaActiva("seleccion");
        setTipoRelacionPendiente(undefined);
        setConexionPendiente(false);
        setPanelPropiedadesAbierto(false);

        try {
          await encolarOperacion(
            "CREAR_RELACION",
            {
              idRelacion: idRelacionDefinitivo,
              idClaseOrigen,
              idClaseDestino,
              tipoRelacion: tipo,
              cardinalidadOrigen,
              cardinalidadDestino,
              conectorOrigen,
              conectorDestino,
              nombre: tipo === "asociacion" ? "Asociación" : null,
              materializacionFk: [],
            },
            { actionId: crypto.randomUUID() }
          );
        } catch {
          appToast.error("Error", "No se pudo registrar la relación local.");
        }
      }
    },
    [
      puedeEditar,
      diagramaActivoId,
      tipoRelacionPendiente,
      cardinalidadesPendientes,
      encolarOperacion,
      setRelacionSeleccionadaId,
      setPanelPropiedadesAbierto,
    ]
  );

  const handleConfirmarEstructuraNm = useCallback(
    async (nombreIntermedia: string) => {
      if (!relacionNmPendiente || !diagramaActivoId) return;

      const pendiente = relacionNmPendiente;
      const atributoOrigen = pendiente.origen.atributos.find((atributo) => atributo.id === pendiente.atributoOrigenId);
      const atributoDestino = pendiente.destino.atributos.find((atributo) => atributo.id === pendiente.atributoDestinoId);
      if (!atributoOrigen || !atributoDestino) return;

      const claseIntermedia = {
        posicionX: pendiente.posicionX,
        posicionY: pendiente.posicionY,
      };
      const conectoresOrigen = resolverConectoresHacia(
        pendiente.origen,
        claseIntermedia
      );
      const conectoresDestino = resolverConectoresHacia(
        pendiente.destino,
        claseIntermedia
      );

      const ids = {
        estructura: crypto.randomUUID(),
        clase: crypto.randomUUID(),
        atributoInicial: crypto.randomUUID(),
        atributoFkOrigen: crypto.randomUUID(),
        atributoFkDestino: crypto.randomUUID(),
        relacionOrigen: crypto.randomUUID(),
        relacionDestino: crypto.randomUUID(),
        referenciaOrigen: crypto.randomUUID(),
        referenciaDestino: crypto.randomUUID(),
      };
      setRelacionNmPendiente(null);
      setHerramientaActiva("seleccion");
      setConexionPendiente(false);
      setTipoRelacionPendiente(undefined);

      try {
        await encolarOperacion("CREAR_ESTRUCTURA_NM", {
          idEstructuraNm: ids.estructura,
          idClaseOrigen: pendiente.origen.id,
          idClaseDestino: pendiente.destino.id,
          claseIntermedia: {
            idClase: ids.clase,
            nombre: nombreIntermedia,
            posicionX: pendiente.posicionX,
            posicionY: pendiente.posicionY,
            ancho: ANCHO_CLASE_INTERMEDIA_NM,
            idAtributoPk: ids.atributoInicial,
            nombreAtributoPk: "id",
          },
          relacionOrigen: {
            idRelacion: ids.relacionOrigen,
            cardinalidadOrigen: "1",
            cardinalidadDestino: "0..*",
            conectorOrigen: conectoresOrigen.conectorOrigen,
            conectorDestino: conectoresOrigen.conectorDestino,
            nombre: "Asociación",
          },
          relacionDestino: {
            idRelacion: ids.relacionDestino,
            cardinalidadOrigen: "1",
            cardinalidadDestino: "0..*",
            conectorOrigen: conectoresDestino.conectorOrigen,
            conectorDestino: conectoresDestino.conectorDestino,
            nombre: "Asociación",
          },
          referenciaFkOrigen: {
            idReferenciaFk: ids.referenciaOrigen,
            idAtributoFk: ids.atributoFkOrigen,
            idAtributoReferenciado: atributoOrigen.id,
            nombreAtributoFk: `${pendiente.origen.nombre.toLowerCase()}_id`,
            onDelete: "NO_ACTION",
            onUpdate: "NO_ACTION",
          },
          referenciaFkDestino: {
            idReferenciaFk: ids.referenciaDestino,
            idAtributoFk: ids.atributoFkDestino,
            idAtributoReferenciado: atributoDestino.id,
            nombreAtributoFk: `${pendiente.destino.nombre.toLowerCase()}_id`,
            onDelete: "NO_ACTION",
            onUpdate: "NO_ACTION",
          },
        }, { actionId: crypto.randomUUID(), grupoAtomico: ids.estructura });
      } catch {
        appToast.error("Error", "No se pudo registrar la estructura N:M local.");
      }
    },
    [diagramaActivoId, encolarOperacion, relacionNmPendiente],
  );

  const handleConfirmarPropuestaFk = useCallback(
    async (materializaciones: MaterializacionFkData[]) => {
      if (!relacionPendienteFk || !diagramaActivoId) return;

      const rel = relacionPendienteFk;
      setRelacionPendienteFk(null);
      setHerramientaActiva("seleccion");
      setTipoRelacionPendiente(undefined);
      setConexionPendiente(false);
      setPanelPropiedadesAbierto(false);
      setRelacionSeleccionadaId(rel.id);

      try {
        await encolarOperacion(
          "CREAR_RELACION",
          {
            idRelacion: rel.id,
            idClaseOrigen: rel.idClaseOrigen,
            idClaseDestino: rel.idClaseDestino,
            tipoRelacion: rel.tipoRelacion,
            cardinalidadOrigen: rel.cardinalidadOrigen,
            cardinalidadDestino: rel.cardinalidadDestino,
            conectorOrigen: rel.conectorOrigen,
            conectorDestino: rel.conectorDestino,
            nombre: rel.tipoRelacion === "asociacion" ? (rel.nombre || "Asociación") : null,
            materializacionFk: materializaciones,
        },
        { actionId: crypto.randomUUID(), grupoAtomico: rel.id }
        );
      } catch {
        appToast.error("Error", "No se pudo registrar la relación con FK.");
      }
    },
    [
      relacionPendienteFk,
      diagramaActivoId,
      encolarOperacion,
      setRelacionSeleccionadaId,
      setPanelPropiedadesAbierto,
    ]
  );

  // Renombrado inline exclusivo para relación de tipo Asociación (T038)
  const handleRenombrarRelacionInline = useCallback(
    async (idRelacion: string, nuevoNombre: string) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const cleanNombre = nuevoNombre.trim();
      const relActual = relacionesLocalesRef.current.find((r) => r.id === idRelacion);
      if (!relActual || !cleanNombre || relActual.nombre === cleanNombre) {
        return;
      }
      if (relActual.tipoRelacion !== "asociacion") return;

      try {
        await encolarOperacion(
          "RENOMBRAR_RELACION",
          {
            idRelacion,
            nombre: cleanNombre,
          },
          { actionId: crypto.randomUUID() }
        );
      } catch {
        appToast.error("Error", "No se pudo registrar el cambio de nombre de la relación.");
      }
    },
    [puedeEditar, diagramaActivoId, encolarOperacion]
  );

  // Eliminación unificada de Relacion (Borrador / Delete / Diálogo) (T039)
  const handleConfirmarEliminarRelacion = useCallback(
    async () => {
      if (!relacionAEliminar || !diagramaActivoId || isPendingOperacion) return;
      const idRelacion = relacionAEliminar.id;

      if (relacionSeleccionadaId === idRelacion) {
        setRelacionSeleccionadaId(null);
      }
      setRelacionAEliminar(null);

      try {
        await encolarOperacion(
          "ELIMINAR_RELACION",
          { idRelacion },
          { actionId: crypto.randomUUID() }
        );
      } catch {
        appToast.error("Error", "No se pudo registrar la eliminación de la relación.");
      }
    },
    [
      relacionAEliminar,
      diagramaActivoId,
      relacionSeleccionadaId,
      encolarOperacion,
      isPendingOperacion,
      setRelacionSeleccionadaId,
    ]
  );

  return (
    <ReactFlowProvider>
      <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f5f5f5] text-slate-800 select-none font-sans">
        {/* Cabecera Flotante con Selector de Páginas Integrado */}
        <EditorHeader
          proyecto={proyecto}
          diagramas={diagramas}
          diagramaActivoId={diagramaActivoId}
          creandoPagina={operacionPaginaPendiente === "crear"}
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
          puedeEditar={puedeEditar}
          cargandoDetalle={cargandoDetalle}
          herramientaActiva={herramientaActiva}
          espacioPresionado={espacioPresionado}
          viewportInicial={obtenerViewport(diagramaActivoId)}
          onViewportChange={handleViewportChange}
          onSeleccionarClase={handleSeleccionarClase}
          onAbrirPropiedadesClase={handleAbrirPropiedadesClase}
          onSeleccionarRelacion={handleSeleccionarRelacion}
          onRenombrarRelacionInline={handleRenombrarRelacionInline}
          onEliminarRelacion={(rel) => setRelacionAEliminar(rel)}
          onConectarRelacion={handleConectarRelacion}
          onCrearClaseEnPosicion={handleCrearClaseEnPosicion}
          onMoverClaseStop={handleMoverClaseStop}
          onRedimensionarClaseStop={handleRedimensionarClaseStop}
          onRenombrarClaseInline={handleRenombrarClaseInline}
          onEliminarClase={setClaseAEliminar}
          onAgregarAtributo={handleAbrirNuevoAtributo}
          onSeleccionarAtributo={handleSeleccionarAtributo}
          onAbrirPropiedadesAtributo={handleAbrirPropiedadesAtributo}
          onCopiarAtributo={handleCopiarAtributo}
          onReordenarAtributo={handleReordenarAtributo}
        />

        {/* Panel Lateral Contextual de Propiedades de Clase / Atributo */}
        {panelPropiedadesAbierto && claseSeleccionada && (
          <PanelPropiedadesDiagrama
            clase={claseSeleccionada}
            atributoSeleccionado={atributoSeleccionado}
            modo={modoPanel}
            puedeEditar={puedeEditar}
            isPending={isPendingOperacion}
            onCerrar={handleCerrarPanel}
            onCambiarModo={handleCambiarModoPanel}
            onGuardarNombreClase={handleGuardarNombreClase}
            onGuardarAtributo={handleGuardarAtributo}
            onEliminarClaseTrigger={setClaseAEliminar}
            onCopiarAtributo={handleCopiarAtributo}
            onReordenarAtributo={handleReordenarAtributo}
          />
        )}

        {/* Panel Flotante Izquierdo para Configurar Relaciones UML */}
        <PanelRelaciones
          abierto={herramientaActiva === "relacion" && puedeEditar}
          tipo={tipoRelacionPendiente}
          cardinalidades={cardinalidadesPendientes}
          conexionPendiente={conexionPendiente}
          onCerrar={() => {
            setHerramientaActiva("seleccion");
            setTipoRelacionPendiente(undefined);
            setConexionPendiente(false);
          }}
          onElegirTipo={(tipo, requiere) => {
            setTipoRelacionPendiente(tipo);
            if (!requiere) {
              setConexionPendiente(true);
            }
          }}
          onElegirCardinalidad={(origen, destino) => {
            setCardinalidadesPendientes([origen, destino]);
            setConexionPendiente(true);
          }}
          onActualizarCardinalidades={(origen, destino) => {
            setCardinalidadesPendientes([origen, destino]);
          }}
          onIntercambiar={() => {
            setCardinalidadesPendientes(([o, d]) => [d, o]);
          }}
          onCancelarConexion={() => {
            setConexionPendiente(false);
            setTipoRelacionPendiente(undefined);
            setHerramientaActiva("seleccion");
          }}
          onVolverTipos={() => {
            setTipoRelacionPendiente(undefined);
            setConexionPendiente(false);
          }}
          onVolverCardinalidad={() => {
            setConexionPendiente(false);
          }}
        />

        <PropuestaEstructuraNmForm
          open={Boolean(relacionNmPendiente)}
          origen={relacionNmPendiente?.origen ?? null}
          destino={relacionNmPendiente?.destino ?? null}
          atributoOrigenId={relacionNmPendiente?.atributoOrigenId ?? null}
          atributoDestinoId={relacionNmPendiente?.atributoDestinoId ?? null}
          onOpenChange={(open) => {
            if (!open) setRelacionNmPendiente(null);
          }}
          onConfirmar={handleConfirmarEstructuraNm}
        />

        {/* Modal de Materialización / Propuesta de Referencia FK */}
        <PropuestaReferenciaFkModal
          abierto={Boolean(relacionPendienteFk)}
          relacion={relacionPendienteFk}
          clases={clasesLocales}
          onOpenChange={(open) => {
            if (!open) {
              setRelacionPendienteFk(null);
            }
          }}
          onConfirmar={handleConfirmarPropuestaFk}
        />

        {/* Modal para eliminar relación UML */}
        <ModalEliminarRelacion
          relacion={relacionAEliminar}
          clases={clasesLocales}
          isPending={isPendingOperacion}
          onOpenChange={(open) => {
            if (!open && !isPendingOperacion) {
              setRelacionAEliminar(null);
            }
          }}
          onConfirmar={handleConfirmarEliminarRelacion}
        />

        {/* Controles de Zoom y Navegación (Inferior Izquierda) */}
        <ControlesZoom />

        {/* Barra de Herramientas Flotante (Inferior Central) */}
        <BarraHerramientas
          herramientaActiva={herramientaActiva}
          puedeEditar={puedeEditar}
          onCambiarHerramienta={setHerramientaActiva}
        />

        {/* Asistente IA DRAWI (Inferior Derecha) */}
        <AsistenteIaEditor
          diagramaId={diagramaActivoId}
          abierto={panelIaAbierto}
          onAbrir={handleAbrirIa}
          onCerrar={handleCerrarIa}
        />

        {/* Modal para compartir proyecto */}
        <ModalCompartirProyecto
          open={modalCompartirAbierto}
          onOpenChange={setModalCompartirAbierto}
          proyecto={proyecto}
          esUsuarioPropietario={esPropietario}
        />

        {/* Modal para renombrar página */}
        <ModalRenombrarPagina
          diagrama={diagramaARenombrar}
          isPending={operacionPaginaPendiente === "renombrar"}
          onOpenChange={(open) => {
            if (!open && operacionPaginaPendiente !== "renombrar") {
              setDiagramaARenombrar(null);
            }
          }}
          onGuardar={handleGuardarRenombrado}
        />

        {/* Modal para eliminar página */}
        <ModalEliminarPagina
          diagrama={diagramaAEliminar}
          isPending={operacionPaginaPendiente === "eliminar"}
          onOpenChange={(open) => {
            if (!open && operacionPaginaPendiente !== "eliminar") {
              setDiagramaAEliminar(null);
            }
          }}
          onConfirmar={handleConfirmarEliminacion}
        />

        {/* Modal de confirmación para eliminar clase UML (Destructivo) */}
        <ModalEliminarClase
          clase={claseAEliminar}
          isPending={isPendingOperacion}
          onOpenChange={(open) => {
            if (!open && !isPendingOperacion) {
              setClaseAEliminar(null);
            }
          }}
          onConfirmar={handleConfirmarEliminacionClase}
        />

        {/* Modal de confirmación para eliminar atributo (Destructivo) */}
        <ModalEliminarAtributo
          atributo={atributoAEliminar}
          isPending={isPendingOperacion}
          onOpenChange={(open) => {
            if (!open && !isPendingOperacion) {
              setAtributoAEliminar(null);
            }
          }}
          onConfirmar={handleConfirmarEliminacionAtributo}
        />
      </div>
    </ReactFlowProvider>
  );
}
