"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowUp,
  Info,
  Loader2,
  Mic,
  Paperclip,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";
import type { useAsistenteIa } from "../../hooks/use-asistente-ia";
import type { useHistorialInteraccionesIa } from "../../hooks/use-historial-interacciones-ia";
import { AdjuntoImagenDrawi } from "./adjunto-imagen-drawi";
import { ControlAudioDrawi, type EstadoVoz } from "./control-audio-drawi";

export interface PanelChatDrawiProps {
  abierto: boolean;
  onCerrar: () => void;
  asistente: ReturnType<typeof useAsistenteIa>;
  grabacion: GrabacionAudioResult;
  historialIa?: ReturnType<typeof useHistorialInteraccionesIa>;
  estadoVoz?: EstadoVoz;
  errorVoz?: string | null;
  deshabilitadoVoz?: boolean;
  onAlternarGrabacion?: () => void;
  onDescartarGrabacion?: () => void;
  onEnviarMensaje?: (texto: string) => Promise<boolean>;
}

export function PanelChatDrawi({
  abierto,
  onCerrar,
  asistente,
  grabacion,
  historialIa,
  estadoVoz = "idle",
  errorVoz,
  deshabilitadoVoz,
  onAlternarGrabacion,
  onDescartarGrabacion,
  onEnviarMensaje,
}: PanelChatDrawiProps) {
  const {
    mensajes: mensajesLocales,
    textoEdicion,
    setTextoEdicion,
    imagenTemporal,
    errorLocal,
    avisoIndisponibilidad,
    enviarMensaje: enviarMensajeLocal,
    adjuntarImagen,
    removerImagen,
    limpiarAvisoIndisponibilidad,
    limpiarErrorLocal,
  } = asistente;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputTextoRef = useRef<HTMLInputElement | null>(null);

  const estaGrabando = estadoVoz === "grabando" || grabacion.estado === "grabando";
  const estaSolicitando = estadoVoz === "solicitando" || grabacion.estado === "solicitando";
  const estaTranscribiendo = estadoVoz === "transcribiendo";
  const estaProcesando = estadoVoz === "procesando";

  const vozBloqueada =
    estaGrabando ||
    estaSolicitando ||
    estaTranscribiendo ||
    estaProcesando;
  const interaccionEnCurso = Boolean(historialIa?.enviando || vozBloqueada);
  const deshabilitadoMic = Boolean(deshabilitadoVoz || interaccionEnCurso);

  const handleAlternarGrabacionLocal = () => {
    if (onAlternarGrabacion) {
      onAlternarGrabacion();
    } else if (estaGrabando) {
      grabacion.detenerGrabacion();
    } else {
      grabacion.iniciarGrabacion();
    }
  };

  const handleDescartarGrabacionLocal = () => {
    if (onDescartarGrabacion) {
      onDescartarGrabacion();
    } else {
      grabacion.descartarGrabacion();
    }
  };

  const interacciones = historialIa ? historialIa.interacciones : [];
  const cantidadMensajes = historialIa
    ? interacciones.length
    : mensajesLocales.length;

  // Auto-scroll al final al recibir nuevos mensajes
  useEffect(() => {
    if (abierto && cantidadMensajes > 0) {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [abierto, cantidadMensajes]);

  // Foco inicial en el input al abrir el panel
  useEffect(() => {
    if (abierto) {
      setTimeout(() => {
        inputTextoRef.current?.focus();
      }, 100);
    }
  }, [abierto]);

  const handleEnviar = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    const texto = textoEdicion.trim();
    if (!texto || interaccionEnCurso) return;

    setTextoEdicion("");

    if (onEnviarMensaje) {
      await onEnviarMensaje(texto);
    } else if (historialIa) {
      await historialIa.enviarMensaje(texto);
    } else {
      enviarMensajeLocal(texto);
    }

    inputTextoRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
    }
  };

  const handleSeleccionarArchivo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (historialIa) {
        await historialIa.enviarImagen(file, { nombreArchivo: file.name });
      } else {
        adjuntarImagen(file);
      }
    }
    e.target.value = "";
  };

  const errorChat = historialIa?.error || errorLocal;
  const errorVozActivo = errorVoz || grabacion.error;

  return (
    <AnimatePresence>
      {abierto && (
        <motion.aside
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed top-[84px] bottom-6 right-6 w-[390px] max-w-[calc(100vw-3rem)] z-50 flex flex-col rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden select-text pointer-events-auto"
          data-testid="panel-chat-drawi"
          aria-label="Panel de Asistente IA DRAWI"
        >
          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 select-none">
            <div className="flex items-center gap-3">
              {/* Mini Celestial Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#53c7f9] via-[#38bdf8] to-[#0284c7] flex items-center justify-center shadow-md shadow-sky-400/25 relative">
                <div className="w-1.5 h-3 bg-white rounded-full -mr-0.5" />
                <div className="w-1.5 h-3 bg-white rounded-full ml-0.5" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    DRAWI - Asistente IA
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Modelado colaborativo con IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón de Cierre */}
              <motion.button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar panel de asistente IA"
                title="Cerrar panel"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer outline-none"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* ── Banner Informativo de Contexto ────────────────────────── */}
          <div className="border-b border-sky-100 bg-sky-50/60 px-4 py-2 text-xs text-sky-800">
            <div className="flex items-center space-x-2">
              <Info className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />
              <p className="text-[11px] leading-relaxed">
                Historial persistente y compartido para esta página del diagrama.
              </p>
            </div>
          </div>

          {/* ── Avisos y Errores de Chat ─────────────────────────────────── */}
          {avisoIndisponibilidad && (
            <div
              role="status"
              className="mx-4 mt-3 flex items-start justify-between rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-sm"
            >
              <p className="flex-1 text-[11px] leading-relaxed">
                {avisoIndisponibilidad}
              </p>
              <button
                type="button"
                onClick={limpiarAvisoIndisponibilidad}
                aria-label="Cerrar aviso de generación de backend"
                className="ml-2 text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {errorChat && (
            <div
              role="alert"
              className="mx-4 mt-3 flex items-start justify-between rounded-2xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 shadow-sm"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-600" />
                <p className="text-[11px]">{errorChat}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  limpiarErrorLocal();
                  historialIa?.limpiarError();
                }}
                aria-label="Cerrar mensaje de error"
                className="ml-2 text-red-700 hover:text-red-900 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Historial de Mensajes ──────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-thin scrollbar-thumb-slate-200"
            data-testid="historial-mensajes"
          >
            {historialIa?.cargando && interacciones.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                <p className="text-xs text-slate-500">Cargando conversación...</p>
              </div>
            ) : cantidadMensajes === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 px-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-sky-500 mb-3 shadow-sm">
                  <Sparkles className="h-6 w-6 text-sky-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Comienza a conversar con DRAWI
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-normal max-w-xs">
                  Pregunta sobre modelado UML o solicita crear clases, atributos y
                  relaciones en lenguaje natural.
                </p>
              </div>
            ) : historialIa ? (
              interacciones.map((item) => {
                const hora = new Date(item.creadoEn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={item.id} className="space-y-3">
                    {/* Mensaje de usuario */}
                    {item.entradaUsuario && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col items-end"
                      >
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-xs bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-tr-xs">
                          <p className="whitespace-pre-wrap">{item.entradaUsuario}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400">
                          {item.idUsuario && item.idUsuario !== "yo" && (
                            <span className="flex items-center gap-0.5 font-medium text-slate-500">
                              <User className="w-2.5 h-2.5" />
                              {item.idUsuario.slice(0, 8)}
                            </span>
                          )}
                          <span>{hora}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Respuesta IA o Estado de Procesamiento */}
                    {(item.estado === "PROCESANDO" || item.estado === "PENDIENTE") &&
                    !item.respuestaIa ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="w-3 h-3 animate-spin" />
                        </div>
                        <div className="max-w-[85%] px-4 py-3 rounded-2xl text-[13px] bg-slate-50 border border-slate-200/80 text-slate-600 rounded-tl-xs shadow-2xs flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" />
                          <span className="text-xs text-slate-400 ml-1">DRAWI pensando...</span>
                        </div>
                      </motion.div>
                    ) : item.respuestaIa ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col items-start max-w-[85%]">
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-2xs rounded-tl-xs",
                              item.estado === "ERROR"
                                ? "bg-red-50 border border-red-200 text-red-800"
                                : "bg-slate-50 border border-slate-200/80 text-slate-800"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{item.respuestaIa}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            DRAWI • {hora}
                          </span>
                        </div>
                      </motion.div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              mensajesLocales.map((msg) => {
                const hora = new Date(msg.creadoEn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-end"
                  >
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-xs bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-tr-xs">
                      <p className="whitespace-pre-wrap">{msg.contenido}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {hora}
                    </span>
                  </motion.div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Adjuntos Activos / Estados de Voz ─────────────────────────── */}
          {(imagenTemporal ||
            estaSolicitando ||
            estaTranscribiendo ||
            estaProcesando ||
            Boolean(errorVozActivo)) && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 space-y-2">
              {imagenTemporal && (
                <AdjuntoImagenDrawi
                  imagen={imagenTemporal}
                  onRemover={removerImagen}
                />
              )}
              {(estaSolicitando ||
                estaTranscribiendo ||
                estaProcesando ||
                Boolean(errorVozActivo)) && (
                <ControlAudioDrawi
                  grabacion={grabacion}
                  estadoVoz={estadoVoz}
                  errorVoz={errorVoz}
                  deshabilitado={deshabilitadoMic}
                  onAlternarGrabacion={onAlternarGrabacion}
                  onDescartarGrabacion={onDescartarGrabacion}
                />
              )}
            </div>
          )}

          {/* ── Input Footer ──────────────────────────────────────────── */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80">
            <form
              onSubmit={handleEnviar}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-3 pr-1.5 py-1.5 shadow-xs focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all"
            >
              {/* Botón para adjuntar imagen */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSeleccionarArchivo}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                data-testid="input-adjunto-imagen"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={interaccionEnCurso}
                aria-label="Adjuntar imagen de referencia"
                title="Adjuntar imagen (JPEG, PNG, WebP)"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Botón de micrófono: 1er clic inicia grabación; 2do clic finaliza, transcribe y envía */}
              <button
                type="button"
                onClick={handleAlternarGrabacionLocal}
                disabled={deshabilitadoMic && !estaGrabando}
                aria-label={estaGrabando ? "Detener y enviar grabación" : "Grabar audio"}
                title={
                  estaGrabando
                    ? "Detener y enviar grabación (segundo clic para transcribir y enviar)"
                    : "Grabar audio"
                }
                className={cn(
                  "rounded-full p-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 shrink-0",
                  estaGrabando
                    ? "bg-red-500 text-white animate-pulse hover:bg-red-600 focus:ring-red-400 shadow-xs"
                    : "text-slate-400 hover:bg-slate-100 hover:text-sky-600 focus:ring-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Botón pequeño de Descartar JUNTO AL MICRÓFONO - Visible ÚNICAMENTE cuando recording = true */}
              {estaGrabando && (
                <button
                  type="button"
                  onClick={handleDescartarGrabacionLocal}
                  aria-label="Descartar grabación"
                  title="Descartar grabación"
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 shadow-2xs transition-all hover:bg-red-100 hover:text-red-700 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 cursor-pointer select-none shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Descartar</span>
                </button>
              )}

              {/* Campo de texto */}
              <input
                type="text"
                ref={inputTextoRef}
                value={textoEdicion}
                onChange={(e) => setTextoEdicion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  estaGrabando
                    ? `Grabando audio... (clic en mic para enviar)`
                    : "Escribe un mensaje o consulta..."
                }
                aria-label="Consulta para el asistente IA"
                disabled={interaccionEnCurso}
                className="flex-1 bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none disabled:opacity-50 min-w-0"
              />

              {/* Botón de Enviar con flecha hacia arriba */}
              <button
                type="submit"
                disabled={!textoEdicion.trim() || interaccionEnCurso}
                aria-label="Enviar consulta"
                title="Enviar"
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 shrink-0",
                  textoEdicion.trim() && !interaccionEnCurso
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/25 cursor-pointer hover:from-sky-600 hover:to-sky-700 hover:scale-105 active:scale-95"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                {interaccionEnCurso ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
