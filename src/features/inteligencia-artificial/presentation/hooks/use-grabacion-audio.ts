"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoGrabacionAudio =
  | "inactivo"
  | "solicitando"
  | "grabando"
  | "listo"
  | "error";

export interface GrabacionAudioResult {
  estado: EstadoGrabacionAudio;
  audioUrl: string | null;
  error: string | null;
  duracionSegundos: number;
  iniciarGrabacion: () => Promise<boolean>;
  detenerGrabacion: () => Promise<string | null>;
  cancelarGrabacion: () => void;
  removerAudio: () => void;
  limpiarRecursos: () => void;
}

export function useGrabacionAudio(): GrabacionAudioResult {
  const [estado, setEstado] = useState<EstadoGrabacionAudio>("inactivo");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duracionSegundos, setDuracionSegundos] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const detenerTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const detenerPistasStream = useCallback(() => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
  }, []);

  const limpiarUrls = useCallback(() => {
    if (audioUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
  }, []);

  const limpiarRecursos = useCallback(() => {
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
    limpiarUrls();
    setAudioUrl(null);
    setEstado("inactivo");
    setError(null);
    setDuracionSegundos(0);
  }, [detenerTimer, detenerPistasStream, limpiarUrls]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      detenerTimer();
      detenerPistasStream();
      limpiarUrls();
    };
  }, [detenerTimer, detenerPistasStream, limpiarUrls]);

  const iniciarGrabacion = useCallback(async (): Promise<boolean> => {
    limpiarRecursos();

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
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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
      detenerPistasStream();
      setEstado("error");
      const errorMsg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Permiso de micrófono denegado por el usuario o el navegador."
          : "No se pudo acceder al micrófono para la grabación de audio.";
      setError(errorMsg);
      return false;
    }
  }, [limpiarRecursos, detenerPistasStream]);

  const detenerGrabacion = useCallback(async (): Promise<string | null> => {
    detenerTimer();

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      detenerPistasStream();
      return audioUrlRef.current;
    }

    return new Promise<string | null>((resolve) => {
      recorder.onstop = () => {
        detenerPistasStream();

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          setEstado("inactivo");
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setEstado("listo");
        resolve(url);
      };

      try {
        recorder.stop();
      } catch {
        detenerPistasStream();
        setEstado("inactivo");
        resolve(null);
      }
    });
  }, [detenerTimer, detenerPistasStream]);

  const cancelarGrabacion = useCallback(() => {
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

  const removerAudio = useCallback(() => {
    limpiarUrls();
    setAudioUrl(null);
    setEstado("inactivo");
    setDuracionSegundos(0);
    setError(null);
  }, [limpiarUrls]);

  return {
    estado,
    audioUrl,
    error,
    duracionSegundos,
    iniciarGrabacion,
    detenerGrabacion,
    cancelarGrabacion,
    removerAudio,
    limpiarRecursos,
  };
}
