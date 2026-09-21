"use client";

import { useEffect, useRef, useState } from "react";
import { useAsistenteIa } from "../../hooks/use-asistente-ia";
import { useGrabacionAudio } from "../../hooks/use-grabacion-audio";
import { useHistorialInteraccionesIa } from "../../hooks/use-historial-interacciones-ia";
import { useEditorDiagramaStore } from "@/features/diagramas/presentation/stores/editor-diagrama.store";
import { MascotaDrawi } from "./mascota-drawi";
import { PanelChatDrawi } from "./panel-chat-drawi";

export interface AsistenteIaEditorProps {
  diagramaId: string | null;
  abierto: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  className?: string;
}

export function AsistenteIaEditor({
  diagramaId,
  abierto,
  onAbrir,
  onCerrar,
  className,
}: AsistenteIaEditorProps) {
  const asistente = useAsistenteIa(diagramaId);
  const historialIa = useHistorialInteraccionesIa(diagramaId);
  const grabacion = useGrabacionAudio();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modoImagen, setModoImagen] = useState(false);

  // Reset de audio al cambiar de diagrama
  useEffect(() => {
    grabacion.limpiarRecursos();
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

    // Listener para cuando la ventana recupera el foco (caso cancelar en navegadores que no emiten cancel)
    const handleWindowFocus = () => {
      setTimeout(() => {
        setModoImagen(false);
        window.removeEventListener("focus", handleWindowFocus);
      }, 300);
    };

    window.addEventListener("focus", handleWindowFocus, { once: true });
    input.click();
  };

  const handleGrabarAudioMascota = async () => {
    if (grabacion.estado === "grabando") {
      await grabacion.detenerGrabacion();
    } else {
      await grabacion.iniciarGrabacion();
    }
  };

  const handleGenerarBackend = () => {
    const estado = useEditorDiagramaStore.getState();
    const clases = estado.clases || [];
    const relaciones = estado.relaciones || [];

    let contenido = `/**\n * DRAWI - Backend Models & Schema\n * Generado automáticamente a partir del Diagrama UML\n * Fecha: ${new Date().toLocaleString()}\n */\n\n`;

    if (clases.length === 0) {
      contenido += `// No hay clases definidas en el diagrama actualmente.\nexport {};\n`;
    } else {
      for (const cls of clases) {
        const nombreClase = (cls.nombre || "Clase").replace(/[^a-zA-Z0-9_$]/g, "") || "Clase";
        contenido += `export interface ${nombreClase} {\n`;
        if (cls.atributos && cls.atributos.length > 0) {
          for (const attr of cls.atributos) {
            const tipoDato = attr.tipoDato || "varchar";
            const tipoTs =
              tipoDato === "integer" || tipoDato === "bigint" || tipoDato === "decimal"
                ? "number"
                : tipoDato === "boolean"
                ? "boolean"
                : tipoDato === "date" || tipoDato === "timestamp"
                ? "Date"
                : "string";
            const opcional = attr.permiteNulo ? "?" : "";
            const pkComment = attr.esLlavePrimaria ? " // PRIMARY KEY" : "";
            const nombreCampo = (attr.nombre || "campo").replace(/[^a-zA-Z0-9_$]/g, "") || "campo";
            contenido += `  ${nombreCampo}${opcional}: ${tipoTs};${pkComment}\n`;
          }
        } else {
          contenido += `  id: string;\n`;
        }
        contenido += `}\n\n`;
      }

      if (relaciones && relaciones.length > 0) {
        contenido += `/**\n * Relaciones UML registradas:\n`;
        for (const rel of relaciones) {
          const origen = clases.find((c) => c.id === rel.idClaseOrigen)?.nombre || rel.idClaseOrigen;
          const destino = clases.find((c) => c.id === rel.idClaseDestino)?.nombre || rel.idClaseDestino;
          contenido += ` * - ${origen} -> ${destino} (${rel.tipoRelacion})\n`;
        }
        contenido += ` */\n`;
      }
    }

    const blob = new Blob([contenido], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backend-models-${Date.now()}.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      asistente.adjuntarImagen(file);
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
        onGrabarAudio={handleGrabarAudioMascota}
        onGenerarBackend={handleGenerarBackend}
        modoAudioExterno={grabacion.estado === "grabando"}
        modoImagenExterno={modoImagen}
        className={className}
      />

      <PanelChatDrawi
        abierto={abierto}
        onCerrar={onCerrar}
        asistente={asistente}
        grabacion={grabacion}
        historialIa={historialIa}
        onEnviarMensaje={historialIa.enviarMensaje}
      />
    </div>
  );
}
