"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowUp,
  Info,
  Mic,
  Paperclip,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrabacionAudioResult } from "../../hooks/use-grabacion-audio";
import type { useAsistenteIa } from "../../hooks/use-asistente-ia";
import { AdjuntoImagenDrawi } from "./adjunto-imagen-drawi";
import { ControlAudioDrawi } from "./control-audio-drawi";

export interface PanelChatDrawiProps {
  abierto: boolean;
  onCerrar: () => void;
  asistente: ReturnType<typeof useAsistenteIa>;
  grabacion: GrabacionAudioResult;
}

export function PanelChatDrawi({
  abierto,
  onCerrar,
  asistente,
  grabacion,
}: PanelChatDrawiProps) {
  const {
    mensajes,
    textoEdicion,
    setTextoEdicion,
    imagenTemporal,
    errorLocal,
    avisoIndisponibilidad,
    enviarMensaje,
    adjuntarImagen,
    removerImagen,
    limpiarAvisoIndisponibilidad,
    limpiarErrorLocal,
  } = asistente;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputTextoRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll al final al recibir nuevos mensajes
  useEffect(() => {
    if (abierto && mensajes.length > 0) {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [abierto, mensajes.length]);

  // Foco inicial en el input al abrir el panel
  useEffect(() => {
    if (abierto) {
      setTimeout(() => {
        inputTextoRef.current?.focus();
      }, 100);
    }
  }, [abierto]);

  const handleEnviar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enviado = enviarMensaje();
    if (enviado) {
      inputTextoRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      adjuntarImagen(file);
    }
    e.target.value = "";
  };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.aside
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed top-[84px] bottom-6 right-6 w-[390px] max-w-[calc(100vw-3rem)] z-40 flex flex-col rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden select-text pointer-events-auto"
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
                <p className="text-[10.5px] text-slate-400 font-medium">Asistente de modelado UML</p>
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

          {/* ── Banner Informativo de Sesión Local ────────────────────── */}
          <div className="border-b border-sky-100 bg-sky-50/60 px-4 py-2 text-xs text-sky-800">
            <div className="flex items-center space-x-2">
              <Info className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />
              <p className="text-[11px] leading-relaxed">
                Las consultas y adjuntos son temporales para esta sesión. Sin llamadas externas.
              </p>
            </div>
          </div>

          {/* ── Avisos y Errores ──────────────────────────────────────── */}
          {avisoIndisponibilidad && (
            <div
              role="status"
              className="mx-4 mt-3 flex items-start justify-between rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-sm"
            >
              <p className="flex-1 text-[11px] leading-relaxed">{avisoIndisponibilidad}</p>
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

          {errorLocal && (
            <div
              role="alert"
              className="mx-4 mt-3 flex items-start justify-between rounded-2xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 shadow-sm"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-600" />
                <p className="text-[11px]">{errorLocal}</p>
              </div>
              <button
                type="button"
                onClick={limpiarErrorLocal}
                aria-label="Cerrar mensaje de error"
                className="ml-2 text-red-700 hover:text-red-900 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Historial de Mensajes ──────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white scrollbar-thin scrollbar-thumb-slate-200"
            data-testid="historial-mensajes"
          >
            {mensajes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 px-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-sky-500 mb-3 shadow-sm">
                  <Sparkles className="h-6 w-6 text-sky-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  No hay consultas en esta sesión
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-normal max-w-xs">
                  Escribe un mensaje, sube una imagen o graba una nota de voz para preparar el
                  contexto de tu diagrama.
                </p>
              </div>
            ) : (
              mensajes.map((msg) => {
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
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{hora}</span>
                  </motion.div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Adjuntos Activos ──────────────────────────────────────── */}
          {(imagenTemporal || grabacion.estado !== "inactivo") && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 space-y-2">
              {imagenTemporal && (
                <AdjuntoImagenDrawi imagen={imagenTemporal} onRemover={removerImagen} />
              )}
              <ControlAudioDrawi grabacion={grabacion} />
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
                aria-label="Adjuntar imagen de referencia"
                title="Adjuntar imagen (JPEG, PNG, WebP)"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Botón de micrófono rápido */}
              {grabacion.estado === "inactivo" && (
                <button
                  type="button"
                  onClick={() => grabacion.iniciarGrabacion()}
                  aria-label="Grabar audio"
                  title="Grabar audio"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}

              {/* Campo de texto */}
              <input
                type="text"
                ref={inputTextoRef}
                value={textoEdicion}
                onChange={(e) => setTextoEdicion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje o consulta..."
                aria-label="Consulta para el asistente IA"
                className="flex-1 bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none"
              />

              {/* Botón de Enviar con flecha hacia arriba */}
              <motion.button
                type="submit"
                disabled={!textoEdicion.trim()}
                aria-label="Enviar consulta"
                title="Enviar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  textoEdicion.trim()
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/25 cursor-pointer hover:from-sky-600 hover:to-sky-700"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
