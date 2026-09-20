"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useSpring, AnimatePresence } from "motion/react";
import { Mic, Image as ImageIcon, MessageSquare, Camera, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionOption {
  id: "backend" | "chat" | "image" | "audio";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
}

const ACTION_BUTTONS: ActionOption[] = [
  {
    id: "backend",
    label: "Generar backend",
    icon: Code2,
    x: 8,
    y: -116,
  },
  {
    id: "chat",
    label: "Chatear",
    icon: MessageSquare,
    x: -45,
    y: -106,
  },
  {
    id: "image",
    label: "Subir imagen",
    icon: ImageIcon,
    x: -86,
    y: -76,
  },
  {
    id: "audio",
    label: "Grabar audio",
    icon: Mic,
    x: -112,
    y: -24,
  },
];

export interface MascotaDrawiProps {
  abierto: boolean;
  onToggle: () => void;
  onAbrirChat?: () => void;
  onSubirImagen?: () => void;
  onGrabarAudio?: () => void;
  onGenerarBackend?: () => void;
  modoAudioExterno?: boolean;
  modoImagenExterno?: boolean;
  className?: string;
}

export function MascotaDrawi({
  abierto,
  onToggle,
  onAbrirChat,
  onSubirImagen,
  onGrabarAudio,
  onGenerarBackend,
  modoAudioExterno = false,
  modoImagenExterno = false,
  className,
}: MascotaDrawiProps) {
  const [isRetreated, setIsRetreated] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "audio" | "image">("idle");
  const [activeActionToast, setActiveActionToast] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const petRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modo activo efectivo (derivado de props o estado interno)
  const activeMode = modoAudioExterno ? "audio" : modoImagenExterno ? "image" : mode;

  // Gaze tracking springs: (0, 0) = mirando al frente
  const lookX = useSpring(-0.55, { stiffness: 240, damping: 22 });
  const lookY = useSpring(-0.55, { stiffness: 240, damping: 22 });
  const blinkSpring = useSpring(1, { stiffness: 550, damping: 28 });

  // State to re-render SVG paths smoothly as springs animate (batched via RAF)
  const [renderState, setRenderState] = useState({
    lx: -0.55,
    ly: -0.55,
    blink: 1,
  });

  // Listener de proximidad del cursor para seguimiento de mirada y desplazamiento
  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const cornerX = window.innerWidth;
        const cornerY = window.innerHeight;
        const distToCorner = Math.hypot(cornerX - e.clientX, cornerY - e.clientY);

        // Umbral de proximidad: se desplaza al acercarse a 380px, con menú abierto, panel abierto o modo activo
        const near = distToCorner < 380 || isMenuOpen || abierto || activeMode !== "idle";
        setIsRetreated(near);

        if (petRef.current) {
          const rect = petRef.current.getBoundingClientRect();
          const petCenterX = rect.left + rect.width / 2;
          const petCenterY = rect.top + rect.height / 2;

          const deltaX = e.clientX - petCenterX;
          const deltaY = e.clientY - petCenterY;
          const dist = Math.hypot(deltaX, deltaY);

          if (dist > 10) {
            const maxReach = 450;
            const clampedX = Math.max(-1, Math.min(1, deltaX / maxReach));
            const clampedY = Math.max(-1, Math.min(1, deltaY / maxReach));

            lookX.set(clampedX);
            lookY.set(clampedY);
          } else {
            lookX.set(0);
            lookY.set(0);
          }
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [lookX, lookY, isMenuOpen, abierto, activeMode]);

  // Parpadeo natural aleatorio con probabilidad de doble parpadeo
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 3200 + 2400;
      blinkTimeout = setTimeout(() => {
        blinkSpring.set(0.08);

        setTimeout(() => {
          blinkSpring.set(1);

          // 25% de probabilidad de doble parpadeo rápido
          if (Math.random() < 0.25) {
            setTimeout(() => {
              blinkSpring.set(0.08);
              setTimeout(() => {
                blinkSpring.set(1);
                scheduleNextBlink();
              }, 100);
            }, 130);
          } else {
            scheduleNextBlink();
          }
        }, 110);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, [blinkSpring]);

  // Clic fuera del contenedor para cerrar el menú flotante
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      window.addEventListener("pointerdown", handlePointerDown);
    }
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isMenuOpen]);

  // Clic en la mascota: activa animación feliz en los ojos y alterna el menú de opciones
  const handlePetClick = useCallback(() => {
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 900);
    if (!abierto) {
      setIsMenuOpen((prev) => !prev);
    }
  }, [abierto]);

  // Clic en botones de acción rápida con soporte de toast y modos
  const handleActionClick = (id: "backend" | "chat" | "image" | "audio") => {
    if (id === "backend") {
      setIsMenuOpen(false);
      setMode("idle");
      setActiveActionToast("Generando archivo backend...");
      setTimeout(() => setActiveActionToast(null), 2500);
      if (onGenerarBackend) {
        onGenerarBackend();
      }
    } else if (id === "chat") {
      setIsMenuOpen(false);
      setMode("idle");
      if (onAbrirChat) {
        onAbrirChat();
      } else {
        onToggle();
      }
    } else if (id === "audio") {
      if (onGrabarAudio) {
        onGrabarAudio();
      }
      setMode((prev) => (prev === "audio" ? "idle" : "audio"));
      setActiveActionToast(activeMode === "audio" ? "Grabación finalizada" : "Escuchando audio...");
      setTimeout(() => setActiveActionToast(null), 2000);
    } else if (id === "image") {
      if (onSubirImagen) {
        onSubirImagen();
      }
      setMode("idle");
    }
  };

  // Suscripción batched a springs vía RAF
  useEffect(() => {
    let rafId: number | null = null;

    const updateRenderState = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setRenderState({
          lx: lookX.get(),
          ly: lookY.get(),
          blink: blinkSpring.get(),
        });
      });
    };

    const unsubX = lookX.on("change", updateRenderState);
    const unsubY = lookY.on("change", updateRenderState);
    const unsubBlink = blinkSpring.on("change", updateRenderState);

    return () => {
      unsubX();
      unsubY();
      unsubBlink();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [lookX, lookY, blinkSpring]);

  // =========================================================================
  // Geometría de ojos pseudo-3D sobre esfera compacta intermedia (viewBox 140x140)
  // =========================================================================
  const { lx, ly, blink } = renderState;
  const radius = 58;
  const centerX = 70;
  const centerY = 54;

  const baseEyeDist = 20;
  const eyeShiftX = Math.max(-15, Math.min(15, lx * 17));
  const eyeShiftY = Math.max(-14, Math.min(15, ly * 14));

  const leftX = centerX - baseEyeDist + eyeShiftX;
  const leftY = centerY + eyeShiftY;

  const rightX = centerX + baseEyeDist + eyeShiftX;
  const rightY = centerY + eyeShiftY;

  const rawTilt = lx * ly * 42 + lx * 7;
  const clampedTiltDeg = Math.max(-30, Math.min(30, rawTilt));
  const tiltRadLeft = clampedTiltDeg * (Math.PI / 180);
  const tiltRadRight = (clampedTiltDeg + (lx < 0 ? 2 : -2)) * (Math.PI / 180);

  const baseLen = 26;
  const eyeLen = Math.max(4, baseLen * blink);

  const leftDistRatio = Math.min(0.85, Math.abs(leftX - centerX) / radius);
  const rightDistRatio = Math.min(0.85, Math.abs(rightX - centerX) / radius);

  const leftWidth = Math.max(7, 12.5 * Math.sqrt(1 - leftDistRatio * leftDistRatio * 0.7));
  const rightWidth = Math.max(7, 12.5 * Math.sqrt(1 - rightDistRatio * rightDistRatio * 0.7));

  const upCurvature = Math.max(0, -ly * 5.5);
  const leftCurve = Math.min(5.5, upCurvature + Math.abs(lx) * 2);
  const rightCurve = Math.min(6.0, upCurvature + Math.abs(lx) * 2.4);

  const sideSign = lx < 0 ? -1 : 1;

  const ldx = Math.sin(tiltRadLeft) * (eyeLen / 2);
  const ldy = Math.cos(tiltRadLeft) * (eyeLen / 2);
  const lnx = sideSign * Math.cos(tiltRadLeft);
  const lny = sideSign * Math.sin(tiltRadLeft);

  const l_bot = { x: leftX - ldx, y: leftY + ldy };
  const l_top = { x: leftX + ldx, y: leftY - ldy };
  const l_ctrl = { x: leftX + lnx * leftCurve, y: leftY + lny * leftCurve };
  const leftEyePath = `M ${l_bot.x.toFixed(1)} ${l_bot.y.toFixed(1)} Q ${l_ctrl.x.toFixed(1)} ${l_ctrl.y.toFixed(1)} ${l_top.x.toFixed(1)} ${l_top.y.toFixed(1)}`;

  const rdx = Math.sin(tiltRadRight) * (eyeLen / 2);
  const rdy = Math.cos(tiltRadRight) * (eyeLen / 2);
  const rnx = sideSign * Math.cos(tiltRadRight);
  const rny = sideSign * Math.sin(tiltRadRight);

  const r_bot = { x: rightX - rdx, y: rightY + rdy };
  const r_top = { x: rightX + rdx, y: rightY - rdy };
  const r_ctrl = { x: rightX + rnx * rightCurve, y: rightY + rny * rightCurve };
  const rightEyePath = `M ${r_bot.x.toFixed(1)} ${r_bot.y.toFixed(1)} Q ${r_ctrl.x.toFixed(1)} ${r_ctrl.y.toFixed(1)} ${r_top.x.toFixed(1)} ${r_top.y.toFixed(1)}`;

  // Cálculo de posición y escala con tamaño intermedio calibrado
  const targetX = abierto ? 30 : isRetreated ? -24 : 14;
  const targetY = isHappy
    ? (isRetreated ? -34 : 2)
    : abierto
    ? 140
    : isRetreated
    ? -24
    : 14;
  const targetScale = isHappy
    ? (isRetreated ? 0.98 : 1.25)
    : abierto
    ? 0.75
    : isRetreated
    ? 0.88
    : 1.18;
  const targetOpacity = abierto ? 0 : 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-0 right-0 z-50 pointer-events-none select-none",
        className
      )}
    >
      {/* Contenedor interactivo */}
      <div
        ref={petRef}
        className="relative pointer-events-auto flex items-end justify-end"
      >
        {/* Sombra de piso suave 2D con perspectiva 3D */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/25 blur-md pointer-events-none"
          initial={false}
          animate={{
            opacity: abierto ? 0.0 : isRetreated ? 0.35 : 0.0,
            x: isRetreated ? -lx * 8 : 0,
            scaleX: isRetreated ? 1 + Math.abs(lx) * 0.15 : 1.3,
            scaleY: isRetreated ? 1 : 0.6,
            width: isRetreated ? 80 : 108,
            height: isRetreated ? 14 : 16,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 22,
            mass: 0.8,
          }}
        />

        {/* 3 Botones de acción flotantes (Arco orbital medialuna superior-izquierda) */}
        <AnimatePresence>
          {isMenuOpen && !abierto && (
            <div
              role="menu"
              aria-label="Acciones de asistente DRAWI"
              className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center"
            >
              {ACTION_BUTTONS.map((btn, idx) => {
                const IconComponent = btn.icon;
                const isHovered = hoveredButton === btn.id;
                const isActive =
                  (btn.id === "audio" && activeMode === "audio") ||
                  (btn.id === "image" && activeMode === "image");

                return (
                  <motion.div
                    key={btn.id}
                    role="none"
                    className="absolute pointer-events-auto"
                    initial={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                    }}
                    animate={{
                      x: isRetreated ? btn.x - 20 : btn.x + 8,
                      y: isRetreated ? btn.y - 20 : btn.y + 8,
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                      transition: {
                        duration: 0.2,
                        ease: "easeIn",
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 20,
                      delay: idx * 0.05,
                    }}
                    style={{ willChange: "transform" }}
                  >
                    {/* Tooltip accesible en Hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-xs font-medium backdrop-blur-md shadow-lg border border-sky-400/30 pointer-events-none"
                        >
                          {btn.label}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Botón de acción */}
                    <motion.button
                      type="button"
                      role="menuitem"
                      aria-label={btn.label}
                      title={btn.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(btn.id);
                      }}
                      onMouseEnter={() => setHoveredButton(btn.id)}
                      onMouseLeave={() => setHoveredButton(null)}
                      whileHover={{ scale: 1.15, rotate: 4 }}
                      whileTap={{ scale: 0.92 }}
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center text-white relative cursor-pointer outline-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                        isActive && "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105"
                      )}
                      style={{
                        backgroundColor: isActive ? "#2563eb" : "#91bcfb",
                        backgroundImage: isActive
                          ? "linear-gradient(145deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)"
                          : "linear-gradient(145deg, #dbeafe 0%, #91bcfb 45%, #6da6fa 100%)",
                        boxShadow: isActive
                          ? "inset 0 2px 4px rgba(255, 255, 255, 0.45), inset 0 -2px 6px rgba(29, 78, 216, 0.45), 0 8px 20px rgba(37, 99, 235, 0.35)"
                          : "inset 0 2.5px 5px rgba(255, 255, 255, 0.65), inset 0 -2px 5px rgba(37, 99, 235, 0.3), 0 8px 18px rgba(145, 188, 251, 0.3)",
                      }}
                    >
                      <IconComponent className="w-5 h-5 text-white drop-shadow-[0_1px_1px_rgba(29,78,216,0.35)]" />
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-400 rounded-full border border-white shadow-xs" />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Toast Feedback */}
              <AnimatePresence>
                {activeActionToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-36 -left-20 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-sky-950/95 text-sky-200 text-xs font-semibold backdrop-blur-md border border-sky-400/40 shadow-xl pointer-events-none"
                  >
                    ✨ {activeActionToast}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>

        {/* ── Bolita Principal de DRAWI ── */}
        <motion.button
          type="button"
          onClick={handlePetClick}
          aria-label={abierto ? "Cerrar asistente de IA DRAWI" : "Abrir asistente de IA DRAWI"}
          aria-expanded={abierto || isMenuOpen}
          aria-haspopup="menu"
          title="Asistente DRAWI (Prototipo interactivo de IA)"
          className="relative flex items-center justify-center cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none rounded-full border-none bg-transparent"
          initial={false}
          whileTap={{ scale: abierto ? 0.7 : isRetreated ? 0.78 : 1.15 }}
          animate={{
            scale: targetScale,
            x: targetX,
            y: targetY,
            opacity: targetOpacity,
          }}
          transition={{
            type: "spring",
            stiffness: isHappy ? 350 : 220,
            damping: isHappy ? 14 : 20,
            mass: 0.8,
          }}
          style={{ willChange: "transform" }}
        >
          {/* Animación de flotación suave y rotación 3D */}
          <motion.div
            style={{
              perspective: 750,
              transformStyle: "preserve-3d",
            }}
            animate={{
              y: isRetreated || abierto ? [0, -3.5, 0] : [0, -2, 0],
              rotateX: -ly * 14,
              rotateY: lx * 16,
              rotateZ:
                activeMode === "audio"
                  ? [-3, 3, -3]
                  : isRetreated || abierto
                  ? lx * 8
                  : lx * ly * 20 + lx * 5,
            }}
            transition={{
              y: {
                duration: isRetreated || abierto ? 3.2 : 4.0,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotateZ:
                activeMode === "audio"
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : undefined,
              rotateX: { type: "spring", stiffness: 220, damping: 22 },
              rotateY: { type: "spring", stiffness: 220, damping: 22 },
            }}
            className="relative"
          >
            {/* Visualizador de audio (Waveform Equalizer) */}
            <AnimatePresence>
              {activeMode === "audio" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.8 }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-400/50 backdrop-blur-md shadow-lg pointer-events-none z-30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-0.5" />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ height: [5, 15 + (i % 2) * 5, 7, 18 - (i % 2) * 3, 5] }}
                      transition={{
                        duration: 0.6 + i * 0.12,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-0.5 bg-sky-300 rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Esfera con Color de Muestra (#91bcfb) de Tamaño Intermedio Calibrado (104x104 px = w-26 h-26) */}
            <div
              className="w-26 h-26 rounded-full relative flex items-center justify-center overflow-visible"
              style={{
                backgroundColor: "#91bcfb",
                backgroundImage:
                  "linear-gradient(145deg, #cbe2fe 0%, #91bcfb 35%, #6da6fa 70%, #4b8ef7 100%)",
                boxShadow:
                  "inset 0 3px 6px rgba(255, 255, 255, 0.65), inset 0 -3px 8px rgba(37, 99, 235, 0.35), 0 10px 25px rgba(145, 188, 251, 0.35)",
              }}
            >
              {/* Modo Audio: Auriculares 2D */}
              <AnimatePresence>
                {activeMode === "audio" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    className="absolute inset-0 pointer-events-none z-20"
                  >
                    <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full">
                      <path
                        d="M 14 66 A 56 56 0 0 1 126 66"
                        stroke="#0f172a"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-4 h-10 bg-slate-900 border-2 border-white rounded-full shadow-md"
                      style={{ transform: "rotate(-10deg)" }}
                    />
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-4 h-10 bg-slate-900 border-2 border-white rounded-full shadow-md"
                      style={{ transform: "rotate(10deg)" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modo Imagen: Cámara Fotográfica Ilustrada y Foto Polaroid */}
              <AnimatePresence>
                {activeMode === "image" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 6 }}
                    transition={{ type: "spring", stiffness: 360, damping: 22 }}
                    className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Botón obturador rojo en la parte superior izquierda */}
                      <div className="absolute -top-1.5 left-3.5 w-4 h-2 bg-[#ef4444] rounded-t-sm shadow-xs" />

                      {/* Chasis de la Cámara */}
                      <div className="w-[78px] h-[52px] bg-[#0f172a] border-[2px] border-white/95 rounded-[14px] shadow-2xl relative flex items-center justify-center">
                        {/* Sensor / Luz amarilla en la esquina superior derecha */}
                        <div className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-[#facc15] rounded-full shadow-[0_0_4px_rgba(251,191,36,0.9)]" />

                        {/* Lente concéntrico azul/celeste */}
                        <div className="w-8 h-8 rounded-full bg-[#0284c7] border-[3px] border-[#38bdf8] flex items-center justify-center shadow-inner">
                          <div className="w-4 h-4 rounded-full bg-[#082f49] border border-white/40 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-white/80" />
                          </div>
                        </div>
                      </div>

                      {/* Foto Polaroid deslizándose hacia abajo */}
                      <motion.div
                        initial={{ y: -6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 20 }}
                        className="absolute -bottom-6 w-10 h-13 bg-white rounded-lg shadow-xl border border-slate-200/90 p-1 flex flex-col items-center justify-between z-10"
                      >
                        <div className="w-8 h-7 bg-sky-100/90 rounded-sm flex items-center justify-center">
                          <Camera className="w-4 h-4 text-[#0284c7] stroke-[2.2]" />
                        </div>
                        <div className="w-5 h-1 bg-slate-200 rounded-full mb-0.5" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Efecto Flash Shutter */}
              <AnimatePresence>
                {activeMode === "image" && (
                  <motion.div
                    key="camera-flash"
                    initial={{ opacity: 0.85, scale: 0.95 }}
                    animate={{ opacity: 0, scale: 1.25 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-white pointer-events-none z-30"
                  />
                )}
              </AnimatePresence>

              {/* Brillo de luz de cuerpo (sheen) */}
              <div
                className="absolute top-2 left-5 w-11 h-6 rounded-full bg-white/20 blur-[3px] pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${-lx * 5}px, ${-ly * 5}px)`,
                }}
              />

              {/* SVG de ojos dinámicos (ocultos cuando la cámara está activa) */}
              {activeMode !== "image" && (
                <svg
                  viewBox="0 0 140 140"
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                >
                  {isHappy ? (
                    <>
                      <path
                        d="M 40 56 Q 50 42 60 56"
                        stroke="#ffffff"
                        strokeWidth="11.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 80 56 Q 90 42 100 56"
                        stroke="#ffffff"
                        strokeWidth="11.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d={leftEyePath}
                        stroke="#ffffff"
                        strokeWidth={leftWidth}
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d={rightEyePath}
                        stroke="#ffffff"
                        strokeWidth={rightWidth}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </>
                  )}
                </svg>
              )}
            </div>
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
