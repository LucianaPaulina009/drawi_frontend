"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoGrabacionAudio =
  | "inactivo"
  | "solicitando"
  | "grabando"
  | "error";

export interface GrabacionAudioMetadata {
  blob: Blob;
  duracionSegundos: number;
  mimeType: string;
}

export interface GrabacionAudioResult {
  estado: EstadoGrabacionAudio;
  error: string | null;
  duracionSegundos: number;
  iniciarGrabacion: () => Promise<boolean>;
  detenerGrabacion: () => Promise<GrabacionAudioMetadata | null>;
  descartarGrabacion: () => void;
  cancelarGrabacion: () => void;
  limpiarRecursos: () => void;
}

export function useGrabacionAudio(): GrabacionAudioResult {
  const [estado, setEstado] = useState<EstadoGrabacionAudio>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [duracionSegundos, setDuracionSegundos] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sesionGeneracionRef = useRef<number>(0);

  const detenerTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const detenerPistasStream = useCallback(() => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // Ignorar error al detener pista
        }
      }
      mediaStreamRef.current = null;
    }
  }, []);

  const limpiarRecursos = useCallback(() => {
    sesionGeneracionRef.current += 1;
    detenerTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar si ya estaba inactivo
      }
    }
    mediaRecorderRef.current = null;
    detenerPistasStream();
    audioChunksRef.current = [];
    setEstado("inactivo");
    setError(null);
    setDuracionSegundos(0);
  }, [detenerTimer, detenerPistasStream]);

  // Limpieza total al desmontar el componente
  useEffect(() => {
    return () => {
      sesionGeneracionRef.current += 1;
      detenerTimer();
      detenerPistasStream();
      audioChunksRef.current = [];
    };
  }, [detenerTimer, detenerPistasStream]);

  const iniciarGrabacion = useCallback(async (): Promise<boolean> => {
    limpiarRecursos();
    const generacionActual = sesionGeneracionRef.current;

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function" ||
      typeof window.MediaRecorder !== "function"
    ) {
      setEstado("error");
      setError("Tu navegador no admite la grabación de audio o el contexto no es seguro.");
      return false;
    }

    setEstado("solicitando");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (sesionGeneracionRef.current !== generacionActual) {
        // La sesión fue cancelada mientras se solicitaba el permiso
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return false;
      }

      mediaStreamRef.current = stream;

      // Detectar formato preferido
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (sesionGeneracionRef.current === generacionActual && event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (sesionGeneracionRef.current === generacionActual) {
          detenerPistasStream();
          setEstado("error");
          setError("Ocurrió un error en la captura de audio.");
        }
      };

      recorder.start(100);
      setEstado("grabando");
      setDuracionSegundos(0);

      timerRef.current = setInterval(() => {
        setDuracionSegundos((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err: unknown) {
      if (sesionGeneracionRef.current === generacionActual) {
        detenerPistasStream();
        setEstado("error");
        const errorMsg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Permiso de micrófono denegado por el usuario o el navegador."
            : "No se pudo acceder al micrófono para la grabación de audio.";
        setError(errorMsg);
      }
      return false;
    }
  }, [limpiarRecursos, detenerPistasStream]);

  const detenerGrabacion = useCallback(async (): Promise<GrabacionAudioMetadata | null> => {
    detenerTimer();
    const generacionActual = sesionGeneracionRef.current;

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      detenerPistasStream();
      setEstado("inactivo");
      return null;
    }

    return new Promise<GrabacionAudioMetadata | null>((resolve) => {
      recorder.onstop = () => {
        detenerPistasStream();

        if (sesionGeneracionRef.current !== generacionActual) {
          resolve(null);
          return;
        }

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        setEstado("inactivo");

        if (audioBlob.size === 0) {
          resolve(null);
          return;
        }

        resolve({
          blob: audioBlob,
          duracionSegundos,
          mimeType,
        });
      };

      try {
        recorder.stop();
      } catch {
        detenerPistasStream();
        setEstado("inactivo");
        resolve(null);
      }
    });
  }, [detenerTimer, detenerPistasStream, duracionSegundos]);

  const descartarGrabacion = useCallback(() => {
    sesionGeneracionRef.current += 1;
    detenerTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    mediaRecorderRef.current = null;
    detenerPistasStream();
    audioChunksRef.current = [];
    setEstado("inactivo");
    setDuracionSegundos(0);
  }, [detenerTimer, detenerPistasStream]);

  return {
    estado,
    error,
    duracionSegundos,
    iniciarGrabacion,
    detenerGrabacion,
    descartarGrabacion,
    cancelarGrabacion: descartarGrabacion,
    limpiarRecursos,
  };
}
