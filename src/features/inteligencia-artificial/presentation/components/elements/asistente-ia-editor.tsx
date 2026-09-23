"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAsistenteIa } from "../../hooks/use-asistente-ia";
import { useGrabacionAudio } from "../../hooks/use-grabacion-audio";
import { useHistorialInteraccionesIa } from "../../hooks/use-historial-interacciones-ia";
import { useGeneracionBackend } from "@/features/generacion-backend/presentation/hooks/use-generacion-backend";
import { MascotaDrawi } from "./mascota-drawi";
import { PanelChatDrawi } from "./panel-chat-drawi";
import type { EstadoVoz } from "./control-audio-drawi";

export interface AsistenteIaEditorProps {
  diagramaId: string | null;
  abierto: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onInteraccionIaEnCursoChange?: (enCurso: boolean) => void;
  className?: string;
}

export function AsistenteIaEditor({
  diagramaId,
  abierto,
  onAbrir,
  onCerrar,
  onInteraccionIaEnCursoChange,
  className,
}: AsistenteIaEditorProps) {
  const asistente = useAsistenteIa(diagramaId);
  const historialIa = useHistorialInteraccionesIa(diagramaId);
  const generacionBackend = useGeneracionBackend({
    onResultado: ({ ok, mensajeChat, interaccionId }) => {
      if (diagramaId && mensajeChat) {
        historialIa.agregarInteraccion({
          id: interaccionId || crypto.randomUUID(),
          idDiagrama: diagramaId,
          idUsuario: "drawi-ia",
          tipo: "GENERACION_BACKEND",
          estado: ok ? "COMPLETADO" : "ERROR",
          entradaUsuario: "",
          respuestaIa: mensajeChat,
          claveIdempotencia: crypto.randomUUID(),
          creadoEn: new Date().toISOString(),
        });
      }
    },
  });
  const grabacion = useGrabacionAudio();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modoImagen, setModoImagen] = useState(false);

  const [estadoVoz, setEstadoVoz] = useState<EstadoVoz>("idle");
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const claveIdempotenciaVozRef = useRef<string>(crypto.randomUUID());
  const diagramaActivoRef = useRef<string | null>(diagramaId);

  useEffect(() => {
    diagramaActivoRef.current = diagramaId;
  }, [diagramaId]);

  // Bloqueo derivado de voz
  const vozBloqueada = useMemo(
    () =>
      estadoVoz === "grabando" ||
      estadoVoz === "transcribiendo" ||
      estadoVoz === "procesando",
    [estadoVoz]
  );

  // Guardia única combinada
  const interaccionIaEnCurso = Boolean(historialIa.enviando || vozBloqueada);

  useEffect(() => {
    onInteraccionIaEnCursoChange?.(interaccionIaEnCurso);
  }, [interaccionIaEnCurso, onInteraccionIaEnCursoChange]);

  // Reset de audio y estado de voz al cambiar de diagrama
  useEffect(() => {
    grabacion.limpiarRecursos();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstadoVoz("idle");
    setErrorVoz(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramaId]);

  // Manejo de tecla Escape para cerrar panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && abierto) {
        onCerrar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto, onCerrar]);

  const handleToggle = () => {
    if (abierto) {
      onCerrar();
    } else {
      onAbrir();
    }
  };

  const handleSubirImagenMascota = () => {
    setModoImagen(true);

    const input = fileInputRef.current;
    if (!input) return;

    const handleCancel = () => {
      setModoImagen(false);
    };

    input.addEventListener("cancel", handleCancel, { once: true });

    // Listener para cuando la ventana recupera el foco
    const handleWindowFocus = () => {
      setTimeout(() => {
        setModoImagen(false);
        window.removeEventListener("focus", handleWindowFocus);
      }, 300);
    };

    window.addEventListener("focus", handleWindowFocus, { once: true });
    input.click();
  };

  const handleAlternarGrabacion = async () => {
    if (!diagramaId) return;
    const currentDiagramId = diagramaId;

    // Si ya está grabando, segundo clic detiene y procesa el audio en una sola interacción de voz
    if (grabacion.estado === "grabando" || estadoVoz === "grabando") {
      const resultado = await grabacion.detenerGrabacion();
      if (!resultado || !resultado.blob || resultado.blob.size === 0) {
        setEstadoVoz("idle");
        return;
      }

      setEstadoVoz("procesando");
      setErrorVoz(null);

      try {
        const ok = await historialIa.enviarAudio(resultado.blob, {
          claveIdempotencia: claveIdempotenciaVozRef.current,
          duracionSegundos: resultado.duracionSegundos,
          mimeType: resultado.mimeType,
        });

        if (diagramaActivoRef.current !== currentDiagramId) {
          setEstadoVoz("idle");
          return;
        }

        if (!ok) {
          setEstadoVoz("error");
          setErrorVoz(
            historialIa.error || "No se pudo procesar la grabación de voz."
          );
        } else {
          setEstadoVoz("idle");
        }
      } catch {
        if (diagramaActivoRef.current === currentDiagramId) {
          setEstadoVoz("error");
          setErrorVoz("Error de red al procesar la grabación de voz.");
        }
      } finally {
        if (diagramaActivoRef.current === currentDiagramId) {
          setEstadoVoz((prev) => (prev === "procesando" ? "idle" : prev));
        }
      }
    } else {
      // Iniciar nueva sesión de grabación
      if (interaccionIaEnCurso) return;

      claveIdempotenciaVozRef.current = crypto.randomUUID();
      setEstadoVoz("solicitando");
      setErrorVoz(null);

      const ok = await grabacion.iniciarGrabacion();
      if (ok) {
        setEstadoVoz("grabando");
      } else {
        setEstadoVoz("error");
      }
    }
  };

  const handleDescartarGrabacion = () => {
    grabacion.descartarGrabacion();
    setEstadoVoz("idle");
    setErrorVoz(null);
  };

  const handleGenerarBackend = async (): Promise<boolean> => {
    if (!diagramaId) return false;
    if (!abierto) {
      onAbrir();
    }
    try {
      const ok = await generacionBackend.generarBackend(diagramaId);
      return ok;
    } catch {
      historialIa.agregarInteraccion({
        id: crypto.randomUUID(),
        idDiagrama: diagramaId,
        idUsuario: "yo",
        tipo: "GENERACION_BACKEND",
        estado: "ERROR",
        entradaUsuario: "",
        respuestaIa:
          "No se pudo generar el backend por un error técnico. Inténtalo nuevamente.",
        claveIdempotencia: crypto.randomUUID(),
        creadoEn: new Date().toISOString(),
      });
      return false;
    }
  };

  const handleSeleccionarArchivo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && diagramaId) {
      if (!abierto) {
        onAbrir();
      }
      await historialIa.enviarImagen(file, { nombreArchivo: file.name });
    }
    setModoImagen(false);
    e.target.value = "";
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      data-testid="asistente-ia-editor-root"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSeleccionarArchivo}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <MascotaDrawi
        abierto={abierto}
        onToggle={handleToggle}
        onAbrirChat={onAbrir}
        onSubirImagen={handleSubirImagenMascota}
        onGrabarAudio={handleAlternarGrabacion}
        onDescartarAudio={handleDescartarGrabacion}
        onGenerarBackend={handleGenerarBackend}
        modoAudioExterno={grabacion.estado === "grabando" || estadoVoz === "grabando"}
        modoImagenExterno={modoImagen}
        className={className}
      />

      <PanelChatDrawi
        abierto={abierto}
        onCerrar={onCerrar}
        asistente={asistente}
        grabacion={grabacion}
        historialIa={historialIa}
        generacionBackend={generacionBackend}
        estadoVoz={estadoVoz}
        errorVoz={errorVoz}
        deshabilitadoVoz={historialIa.enviando}
        onAlternarGrabacion={handleAlternarGrabacion}
        onDescartarGrabacion={handleDescartarGrabacion}
        onEnviarMensaje={historialIa.enviarMensaje}
      />
    </div>
  );
}
