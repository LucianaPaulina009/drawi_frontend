"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider, type Viewport } from "@xyflow/react";

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
import {
  actualizarClaseAction,
  crearClaseAction,
  eliminarClaseAction,
} from "../../actions/clase.action";
import {
  actualizarAtributoAction,
  crearAtributoAction,
  eliminarAtributoAction,
} from "../../actions/atributo.action";
import { DiagramaQueryParamSchema } from "../../../infrastructure/schemas/diagrama.schemas";
import { useDiagramaActivoUrl } from "../../hooks/use-diagrama-activo-url";
import { useViewportPorDiagrama } from "../../hooks/use-viewport-por-diagrama";
import { useAtajosEditor } from "../../hooks/use-atajos-editor";
import { usePermisoEdicionDiagrama } from "../../hooks/use-permiso-edicion-diagrama";
import { BarraHerramientas, type HerramientaLienzo } from "./barra-herramientas";
import { ControlesZoom } from "./controles-zoom";
import { ControlIA } from "./control-ia";
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
import { ModalCompartirProyecto } from "@/features/gestion-colaboradores/presentation/components/elements/modal-compartir-proyecto";

export interface EditorProyectoProps {
  proyecto: Proyecto;
  diagramasIniciales: Diagrama[];
}

export function EditorProyecto({
  proyecto,
  diagramasIniciales,
}: EditorProyectoProps) {
  const router = useRouter();
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

  const [detalleActivo, setDetalleActivo] = useState<DiagramaDetalle | null>(
    null
  );
  // Estado local de trabajo para clases y atributos de la página activa
  const [clasesLocales, setClasesLocales] = useState<Clase[]>([]);
  const clasesLocalesRef = useRef<Clase[]>(clasesLocales);
  useEffect(() => {
    clasesLocalesRef.current = clasesLocales;
  }, [clasesLocales]);

  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState<string | null>(
    null
  );

  // Estado del Panel Lateral Contextual de Propiedades
  const [modoPanel, setModoPanel] = useState<ModoPanelPropiedades>("clase");
  const [atributoSeleccionadoId, setAtributoSeleccionadoId] = useState<
    string | null
  >(null);

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
  const [isPendingOperacion, setIsPendingOperacion] = useState(false);

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
      const seleccionada = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      if (seleccionada) {
        setClaseAEliminar(seleccionada);
      }
    }
  }, [puedeEditar, modoPanel, atributoSeleccionadoId, claseSeleccionadaId]);

  // Copia de Atributo (Ctrl+D o botón de fila)
  const handleCopiarAtributo = useCallback(
    async (atributo: Atributo) => {
      if (!puedeEditar || isPendingOperacion) return;

      setIsPendingOperacion(true);
      const nuevoAttrId = crypto.randomUUID();
      const claseTarget = clasesLocalesRef.current.find(
        (c) => c.id === atributo.idClase
      );
      const nuevoOrden = (claseTarget?.atributos?.length || 0) + 1;

      // Inserción optimista inmediata
      const nuevoAtributoOptimista: Atributo = {
        id: nuevoAttrId,
        idClase: atributo.idClase,
        nombre: `${atributo.nombre}_copia`,
        tipoDato: atributo.tipoDato,
        longitud: atributo.longitud,
        precision: atributo.precision,
        escala: atributo.escala,
        esLlavePrimaria: false,
        permiteNulo: atributo.permiteNulo,
        esUnico: false,
        valorPorDefecto: atributo.valorPorDefecto,
        ordenDePosicion: nuevoOrden,
      };

      setClasesLocales((actuales) =>
        actuales.map((c) =>
          c.id === atributo.idClase
            ? {
                ...c,
                atributos: [...c.atributos, nuevoAtributoOptimista],
              }
            : c
        )
      );

      try {
        const copyPayload: CrearAtributoData = {
          idAtributo: nuevoAttrId,
          nombre: `${atributo.nombre}_copia`,
          tipoDato: atributo.tipoDato,
          longitud: atributo.longitud,
          precision: atributo.precision,
          escala: atributo.escala,
          esLlavePrimaria: false,
          permiteNulo: atributo.permiteNulo,
          esUnico: false,
          valorPorDefecto: atributo.valorPorDefecto,
        };

        const res = await crearAtributoAction(atributo.idClase, copyPayload);

        if (!res.ok) {
          // Revertir ante error
          setClasesLocales((actuales) =>
            actuales.map((c) =>
              c.id === atributo.idClase
                ? {
                    ...c,
                    atributos: c.atributos.filter((a) => a.id !== nuevoAttrId),
                  }
                : c
            )
          );
          appToast.error(
            "Error al copiar",
            res.errors[0] || "No se pudo copiar el atributo."
          );
          return;
        }

        // Reconciliación con respuesta confirmada
        setClasesLocales((actuales) =>
          actuales.map((c) =>
            c.id === atributo.idClase
              ? {
                  ...c,
                  atributos: c.atributos
                    .map((a) => (a.id === nuevoAttrId ? res.data : a))
                    .sort((a, b) => a.ordenDePosicion - b.ordenDePosicion),
                }
              : c
          )
        );
        appToast.success("Atributo duplicado correctamente.");
      } catch {
        setClasesLocales((actuales) =>
          actuales.map((c) =>
            c.id === atributo.idClase
              ? {
                  ...c,
                  atributos: c.atributos.filter((a) => a.id !== nuevoAttrId),
                }
              : c
          )
        );
        appToast.error("Error", "Error inesperado al copiar el atributo.");
      } finally {
        setIsPendingOperacion(false);
      }
    },
    [puedeEditar, isPendingOperacion]
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
    deshabilitado: Boolean(
      diagramaARenombrar ||
        diagramaAEliminar ||
        modalCompartirAbierto ||
        claseAEliminar ||
        atributoAEliminar
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
            setClasesLocales(res.data.clases || []);
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
    setClaseSeleccionadaId(null);
    setAtributoSeleccionadoId(null);
    setModoPanel("clase");
    setClaseAEliminar(null);
    setAtributoAEliminar(null);
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
    setModoPanel("clase");
    setAtributoSeleccionadoId(null);
  }, []);

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
    setClaseSeleccionadaId(null);
    setAtributoSeleccionadoId(null);
    setModoPanel("clase");
  }, []);

  // ── Gestión de Clases UML (US2 & US3) ───────────────────────────────────────

  // Creación de Clase compacta al hacer clic sobre el pane (T027)
  const handleCrearClaseEnPosicion = useCallback(
    async (x: number, y: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const classId = crypto.randomUUID();
      const atributoInicialId = crypto.randomUUID();

      // Creación optimista inmediata en el estado de trabajo (ancho compacto 220px)
      const nuevaClaseOptimista: Clase = {
        id: classId,
        idDiagrama: diagramaActivoId,
        nombre: "Tabla",
        posicionX: x,
        posicionY: y,
        ancho: 220,
        atributos: [
          {
            id: atributoInicialId,
            idClase: classId,
            tipoDato: "integer",
            nombre: "id",
            longitud: null,
            precision: null,
            escala: null,
            esLlavePrimaria: true,
            permiteNulo: false,
            esUnico: false,
            valorPorDefecto: null,
            ordenDePosicion: 1,
          },
        ],
      };

      setClasesLocales((actuales) => [...actuales, nuevaClaseOptimista]);
      setClaseSeleccionadaId(classId);
      setModoPanel("clase");
      setAtributoSeleccionadoId(null);
      setHerramientaActiva("seleccion");

      try {
        const res = await crearClaseAction(diagramaActivoId, {
          idClase: classId,
          idAtributoInicial: atributoInicialId,
          nombre: "Tabla",
          posicionX: x,
          posicionY: y,
          ancho: 220,
        });

        if (res.ok) {
          // Reconciliación con la respuesta confirmada
          setClasesLocales((actuales) =>
            actuales.map((c) => (c.id === classId ? res.data : c))
          );
        } else {
          // Revertir ante error
          setClasesLocales((actuales) =>
            actuales.filter((c) => c.id !== classId)
          );
          appToast.error(
            "Error al crear clase",
            res.errors[0] || "No se pudo crear la clase."
          );
        }
      } catch {
        setClasesLocales((actuales) =>
          actuales.filter((c) => c.id !== classId)
        );
        appToast.error("Error", "Error inesperado al crear la clase UML.");
      }
    },
    [puedeEditar, diagramaActivoId]
  );

  // Movimiento de Clase al soltar drag (onNodeDragStop): toma la posición final y ejecuta un único PATCH no bloqueante
  const handleMoverClaseStop = useCallback(
    async (idClase: string, x: number, y: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const claseAnterior = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!claseAnterior) return;

      const xInicial = claseAnterior.posicionX;
      const yInicial = claseAnterior.posicionY;

      // Si la posición no cambió, no realizamos petición
      if (xInicial === x && yInicial === y) {
        return;
      }

      // Actualizar posición final en el estado local de trabajo
      setClasesLocales((actuales) =>
        actuales.map((c) =>
          c.id === idClase ? { ...c, posicionX: x, posicionY: y } : c
        )
      );

      try {
        const res = await actualizarClaseAction(diagramaActivoId, idClase, {
          posicionX: x,
          posicionY: y,
        });

        if (!res.ok) {
          // Revertir únicamente esta clase a su posición previa confirmada
          setClasesLocales((actuales) =>
            actuales.map((c) =>
              c.id === idClase
                ? {
                    ...c,
                    posicionX: xInicial,
                    posicionY: yInicial,
                  }
                : c
            )
          );
          appToast.error(
            "Error al mover clase",
            res.errors[0] || "No se pudo actualizar la posición."
          );
        }
      } catch {
        setClasesLocales((actuales) =>
          actuales.map((c) =>
            c.id === idClase
              ? {
                  ...c,
                  posicionX: xInicial,
                  posicionY: yInicial,
                }
              : c
          )
        );
        appToast.error("Error", "Error de conexión al mover la clase.");
      }
    },
    [puedeEditar, diagramaActivoId]
  );

  // Redimensionamiento visual en el lienzo al soltar handle de resize
  const handleRedimensionarClaseStop = useCallback(
    async (idClase: string, nuevoAncho: number) => {
      if (!puedeEditar || !diagramaActivoId) return;

      const claseAnterior = clasesLocalesRef.current.find((c) => c.id === idClase);
      if (!claseAnterior || claseAnterior.ancho === nuevoAncho) return;

      // Actualización local
      setClasesLocales((actuales) =>
        actuales.map((c) =>
          c.id === idClase ? { ...c, ancho: nuevoAncho } : c
        )
      );

      try {
        const res = await actualizarClaseAction(diagramaActivoId, idClase, {
          ancho: nuevoAncho,
        });

        if (!res.ok) {
          // Revertir a ancho anterior
          setClasesLocales((actuales) =>
            actuales.map((c) =>
              c.id === idClase ? { ...c, ancho: claseAnterior.ancho } : c
            )
          );
          appToast.error(
            "Error al redimensionar",
            res.errors[0] || "No se pudo actualizar el ancho."
          );
        }
      } catch {
        setClasesLocales((actuales) =>
          actuales.map((c) =>
            c.id === idClase ? { ...c, ancho: claseAnterior.ancho } : c
          )
        );
        appToast.error("Error", "Error de conexión al redimensionar clase.");
      }
    },
    [puedeEditar, diagramaActivoId]
  );

  // Renombrado de Clase (desde panel o inline)
  const handleGuardarNombreClase = useCallback(
    async (nuevoNombre: string): Promise<string | null> => {
      if (!claseSeleccionadaId || !diagramaActivoId || isPendingOperacion) {
        return "No se pudo identificar la clase a renombrar.";
      }

      setIsPendingOperacion(true);
      try {
        const res = await actualizarClaseAction(
          diagramaActivoId,
          claseSeleccionadaId,
          { nombre: nuevoNombre }
        );

        if (!res.ok) {
          const msg = res.errors[0] || "No se pudo actualizar el nombre.";
          appToast.error("Error", msg);
          return msg;
        }

        setClasesLocales((actuales) =>
          actuales.map((c) =>
            c.id === claseSeleccionadaId ? { ...c, nombre: res.data.nombre } : c
          )
        );
        appToast.success("Clase renombrada correctamente.");
        return null;
      } catch {
        const msg = "Error inesperado al renombrar la clase.";
        appToast.error("Error", msg);
        return msg;
      } finally {
        setIsPendingOperacion(false);
      }
    },
    [claseSeleccionadaId, diagramaActivoId, isPendingOperacion]
  );

  // Renombrado rápido inline desde doble clic en nodo
  const handleRenombrarClaseInline = useCallback(
    async (idClase: string, nuevoNombre: string) => {
      if (!puedeEditar || !diagramaActivoId) return;

      setClasesLocales((actuales) =>
        actuales.map((c) =>
          c.id === idClase ? { ...c, nombre: nuevoNombre } : c
        )
      );

      try {
        const res = await actualizarClaseAction(diagramaActivoId, idClase, {
          nombre: nuevoNombre,
        });

        if (!res.ok) {
          appToast.error("Error", res.errors[0] || "No se pudo renombrar.");
          // Re-cargar diagrama para consistencia
          const diagRes = await obtenerDiagramaAction(
            proyecto.id,
            diagramaActivoId
          );
          if (diagRes.ok) {
            setClasesLocales(diagRes.data.clases || []);
          }
        } else {
          appToast.success("Clase renombrada.");
        }
      } catch {
        appToast.error("Error", "Error de conexión al renombrar.");
      }
    },
    [puedeEditar, diagramaActivoId, proyecto.id]
  );

  // Eliminación de Clase (Diálogo destructivo)
  const handleConfirmarEliminacionClase = async () => {
    if (!claseAEliminar || !diagramaActivoId || isPendingOperacion) return;

    setIsPendingOperacion(true);
    const idClaseBorrar = claseAEliminar.id;

    try {
      const res = await eliminarClaseAction(diagramaActivoId, idClaseBorrar);

      if (!res.ok) {
        appToast.error(
          "Error al eliminar clase",
          res.errors[0] || "No se pudo eliminar la clase."
        );
        setClaseAEliminar(null);
        return;
      }

      setClasesLocales((actuales) =>
        actuales.filter((c) => c.id !== idClaseBorrar)
      );
      if (claseSeleccionadaId === idClaseBorrar) {
        setClaseSeleccionadaId(null);
        setAtributoSeleccionadoId(null);
        setModoPanel("clase");
      }
      setClaseAEliminar(null);
      appToast.success("Clase eliminada correctamente.");
    } catch {
      appToast.error("Error", "Error inesperado al eliminar la clase UML.");
      setClaseAEliminar(null);
    } finally {
      setIsPendingOperacion(false);
    }
  };

  // ── Gestión de Atributos (US4 & US5) ────────────────────────────────────────

  const handleAbrirNuevoAtributo = useCallback((idClase: string) => {
    setClaseSeleccionadaId(idClase);
    setAtributoSeleccionadoId(null);
    setModoPanel("crear-atributo");
  }, []);

  const handleSeleccionarAtributo = useCallback((atributo: Atributo) => {
    setClaseSeleccionadaId(atributo.idClase);
    setAtributoSeleccionadoId(atributo.id);
    setModoPanel("editar-atributo");
  }, []);

  const handleGuardarAtributo = useCallback(
    async (datos: CrearAtributoData): Promise<string | null> => {
      const clasePadre = clasesLocalesRef.current.find(
        (c) => c.id === claseSeleccionadaId
      );
      if (!clasePadre || isPendingOperacion) {
        return "No se pudo identificar la clase del atributo.";
      }

      setIsPendingOperacion(true);
      try {
        if (modoPanel === "editar-atributo" && atributoSeleccionadoId) {
          // Edición de atributo existente
          const res = await actualizarAtributoAction(
            clasePadre.id,
            atributoSeleccionadoId,
            datos
          );

          if (!res.ok) {
            const msg = res.errors[0] || "No se pudo actualizar el atributo.";
            appToast.error("Error", msg);
            return msg;
          }

          setClasesLocales((actuales) =>
            actuales.map((c) =>
              c.id === clasePadre.id
                ? {
                    ...c,
                    atributos: c.atributos.map((a) =>
                      a.id === atributoSeleccionadoId ? res.data : a
                    ),
                  }
                : c
            )
          );
          setModoPanel("clase");
          setAtributoSeleccionadoId(null);
          appToast.success("Atributo actualizado correctamente.");
          return null;
        } else {
          // Creación de nuevo atributo
          const attrId = crypto.randomUUID();
          const res = await crearAtributoAction(clasePadre.id, {
            ...datos,
            idAtributo: attrId,
          });

          if (!res.ok) {
            const msg = res.errors[0] || "No se pudo crear el atributo.";
            appToast.error("Error", msg);
            return msg;
          }

          setClasesLocales((actuales) =>
            actuales.map((c) =>
              c.id === clasePadre.id
                ? {
                    ...c,
                    atributos: [...c.atributos, res.data].sort(
                      (a, b) => a.ordenDePosicion - b.ordenDePosicion
                    ),
                  }
                : c
            )
          );
          setModoPanel("clase");
          setAtributoSeleccionadoId(null);
          appToast.success("Atributo añadido correctamente.");
          return null;
        }
      } catch {
        const msg = "Error inesperado al procesar el atributo.";
        appToast.error("Error", msg);
        return msg;
      } finally {
        setIsPendingOperacion(false);
      }
    },
    [claseSeleccionadaId, modoPanel, atributoSeleccionadoId, isPendingOperacion]
  );

  // Eliminación de Atributo (Diálogo destructivo)
  const handleConfirmarEliminacionAtributo = async () => {
    if (!atributoAEliminar || isPendingOperacion) return;

    setIsPendingOperacion(true);
    const { idClase, id } = atributoAEliminar;

    try {
      const res = await eliminarAtributoAction(idClase, id);

      if (!res.ok) {
        appToast.error(
          "Error al eliminar atributo",
          res.errors[0] || "No se pudo eliminar el atributo."
        );
        setAtributoAEliminar(null);
        return;
      }

      setClasesLocales((actuales) =>
        actuales.map((c) =>
          c.id === idClase
            ? {
                ...c,
                atributos: c.atributos.filter((a) => a.id !== id),
              }
            : c
        )
      );
      if (atributoSeleccionadoId === id) {
        setAtributoSeleccionadoId(null);
        setModoPanel("clase");
      }
      setAtributoAEliminar(null);
      appToast.success("Atributo eliminado correctamente.");
    } catch {
      appToast.error("Error", "Error inesperado al eliminar el atributo.");
      setAtributoAEliminar(null);
    } finally {
      setIsPendingOperacion(false);
    }
  };

  // Reordenar Atributo (T038, T039)
  const handleReordenarAtributo = useCallback(
    async (idClase: string, idAtributo: string, nuevoOrden: number) => {
      if (!puedeEditar) return;

      try {
        const res = await actualizarAtributoAction(idClase, idAtributo, {
          ordenDePosicion: nuevoOrden,
        });

        if (!res.ok) {
          appToast.error(
            "Error al reordenar",
            res.errors[0] || "No se pudo cambiar el orden del atributo."
          );
          return;
        }

        // Re-fetch diagrama activo para sincronizar todas las posiciones
        if (diagramaActivoId) {
          const diagRes = await obtenerDiagramaAction(
            proyecto.id,
            diagramaActivoId
          );
          if (diagRes.ok) {
            setClasesLocales(diagRes.data.clases || []);
          }
        }
      } catch {
        appToast.error("Error", "Error de conexión al reordenar atributo.");
      }
    },
    [puedeEditar, diagramaActivoId, proyecto.id]
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
          clases={clasesLocales}
          claseSeleccionadaId={claseSeleccionadaId}
          puedeEditar={puedeEditar}
          cargandoDetalle={cargandoDetalle}
          herramientaActiva={herramientaActiva}
          espacioPresionado={espacioPresionado}
          viewportInicial={obtenerViewport(diagramaActivoId)}
          onViewportChange={handleViewportChange}
          onSeleccionarClase={handleSeleccionarClase}
          onCrearClaseEnPosicion={handleCrearClaseEnPosicion}
          onMoverClaseStop={handleMoverClaseStop}
          onRedimensionarClaseStop={handleRedimensionarClaseStop}
          onRenombrarClaseInline={handleRenombrarClaseInline}
          onEliminarClase={setClaseAEliminar}
          onAgregarAtributo={handleAbrirNuevoAtributo}
          onSeleccionarAtributo={handleSeleccionarAtributo}
          onCopiarAtributo={handleCopiarAtributo}
          onReordenarAtributo={handleReordenarAtributo}
        />

        {/* Panel Lateral Contextual de Propiedades (Estilo Draw.io) */}
        {claseSeleccionada && (
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

        {/* Controles de Zoom y Navegación (Inferior Izquierda) */}
        <ControlesZoom />

        {/* Barra de Herramientas Flotante (Inferior Central) */}
        <BarraHerramientas
          herramientaActiva={herramientaActiva}
          puedeEditar={puedeEditar}
          onCambiarHerramienta={setHerramientaActiva}
        />

        {/* Asistente IA (Inferior Derecha) */}
        <ControlIA />

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
