"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AccionAsistenteIa = "chat" | "imagen" | "audio" | "generar-backend";

export interface MensajeLocalIa {
  id: string;
  contenido: string;
  creadoEn: number;
}

export interface AdjuntoImagenTemporal {
  nombre: string;
  tipo: string;
  tamano: number;
  vistaPrevia: string;
}

export interface AdjuntoAudioTemporal {
  referencia: string;
  duracionVisible?: string;
  estado: "inactivo" | "solicitando" | "grabando" | "listo" | "error";
}

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_TAMANO_IMAGEN_BYTES = 10 * 1024 * 1024; // 10 MiB

export function useAsistenteIa(diagramaId: string | null) {
  const [accionActiva, setAccionActiva] = useState<AccionAsistenteIa>("chat");
  const [mensajes, setMensajes] = useState<MensajeLocalIa[]>([]);
  const [textoEdicion, setTextoEdicion] = useState("");
  const [imagenTemporal, setImagenTemporal] = useState<AdjuntoImagenTemporal | null>(null);
  const [audioTemporal, setAudioTemporal] = useState<AdjuntoAudioTemporal | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [avisoIndisponibilidad, setAvisoIndisponibilidad] = useState<string | null>(null);

  const imagenTemporalRef = useRef<AdjuntoImagenTemporal | null>(null);
  const audioTemporalRef = useRef<AdjuntoAudioTemporal | null>(null);

  useEffect(() => {
    imagenTemporalRef.current = imagenTemporal;
    audioTemporalRef.current = audioTemporal;
  }, [imagenTemporal, audioTemporal]);

  const limpiarUrlsBlob = useCallback(() => {
    if (imagenTemporalRef.current?.vistaPrevia?.startsWith("blob:")) {
      URL.revokeObjectURL(imagenTemporalRef.current.vistaPrevia);
    }
    if (audioTemporalRef.current?.referencia?.startsWith("blob:")) {
      URL.revokeObjectURL(audioTemporalRef.current.referencia);
    }
  }, []);

  const limpiarSesion = useCallback(() => {
    limpiarUrlsBlob();
    setMensajes([]);
    setTextoEdicion("");
    setImagenTemporal(null);
    setAudioTemporal(null);
    setErrorLocal(null);
    setAvisoIndisponibilidad(null);
    setAccionActiva("chat");
  }, [limpiarUrlsBlob]);

  // Reset determinista por diagramaId
  const diagramaPrevioRef = useRef<string | null>(diagramaId);
  useEffect(() => {
    if (diagramaPrevioRef.current !== diagramaId) {
      diagramaPrevioRef.current = diagramaId;
      limpiarSesion();
    }
  }, [diagramaId, limpiarSesion]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      limpiarUrlsBlob();
    };
  }, [limpiarUrlsBlob]);

  const enviarMensaje = useCallback((textoExplicito?: string): boolean => {
    const textoAEnviar = typeof textoExplicito === "string" ? textoExplicito : textoEdicion;
    const contenidoLimpio = textoAEnviar.trim();
    if (!contenidoLimpio) {
      return false;
    }

    const nuevoMensaje: MensajeLocalIa = {
      id: crypto.randomUUID(),
      contenido: contenidoLimpio,
      creadoEn: Date.now(),
    };

    setMensajes((prev) => [...prev, nuevoMensaje]);
    setTextoEdicion("");
    setErrorLocal(null);
    return true;
  }, [textoEdicion]);

  const adjuntarImagen = useCallback((archivo: File): boolean => {
    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      setErrorLocal("Formato de imagen no compatible. Usa JPEG, PNG o WebP.");
      return false;
    }

    if (archivo.size > MAX_TAMANO_IMAGEN_BYTES) {
      setErrorLocal("La imagen no puede superar los 10 MiB.");
      return false;
    }

    if (imagenTemporalRef.current?.vistaPrevia?.startsWith("blob:")) {
      URL.revokeObjectURL(imagenTemporalRef.current.vistaPrevia);
    }

    const vistaPrevia = URL.createObjectURL(archivo);
    setImagenTemporal({
      nombre: archivo.name,
      tipo: archivo.type,
      tamano: archivo.size,
      vistaPrevia,
    });
    setErrorLocal(null);
    return true;
  }, []);

  const removerImagen = useCallback(() => {
    if (imagenTemporalRef.current?.vistaPrevia?.startsWith("blob:")) {
      URL.revokeObjectURL(imagenTemporalRef.current.vistaPrevia);
    }
    setImagenTemporal(null);
  }, []);

  const fijarAudioTemporal = useCallback((audio: AdjuntoAudioTemporal | null) => {
    if (audioTemporalRef.current?.referencia?.startsWith("blob:") && audioTemporalRef.current.referencia !== audio?.referencia) {
      URL.revokeObjectURL(audioTemporalRef.current.referencia);
    }
    setAudioTemporal(audio);
  }, []);

  const removerAudio = useCallback(() => {
    if (audioTemporalRef.current?.referencia?.startsWith("blob:")) {
      URL.revokeObjectURL(audioTemporalRef.current.referencia);
    }
    setAudioTemporal(null);
  }, []);

  const activarGenerarBackend = useCallback(() => {
    setAvisoIndisponibilidad(
      "La generación de backend estará disponible en próximas fases de integración con Inteligencia Artificial."
    );
  }, []);

  const limpiarAvisoIndisponibilidad = useCallback(() => {
    setAvisoIndisponibilidad(null);
  }, []);

  const limpiarErrorLocal = useCallback(() => {
    setErrorLocal(null);
  }, []);

  return {
    accionActiva,
    setAccionActiva,
    mensajes,
    textoEdicion,
    setTextoEdicion,
    imagenTemporal,
    audioTemporal,
    errorLocal,
    avisoIndisponibilidad,
    enviarMensaje,
    adjuntarImagen,
    removerImagen,
    fijarAudioTemporal,
    removerAudio,
    activarGenerarBackend,
    limpiarAvisoIndisponibilidad,
    limpiarErrorLocal,
    limpiarSesion,
  };
}
