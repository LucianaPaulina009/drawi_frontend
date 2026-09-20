"use client";

import { memo, useEffect, useState } from "react";
import { useViewport } from "@xyflow/react";
import { useColaboracionStore } from "../../stores/colaboracion.store";

export const CapaCursoresRemotos = memo(function CapaCursoresRemotos() {
  const { x: vpX, y: vpY, zoom } = useViewport();
  const cursores = useColaboracionStore((s) => s.cursoresRemotos);
  const miUsuarioId = useColaboracionStore((s) => s.miUsuarioId);

  // Tick periódico para limpiar visualmente cursores que no se hayan movido en >4s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  const ahora = Date.now();
  const cursoresActivos = Object.values(cursores).filter(
    (c) => c.idUsuario !== miUsuarioId && ahora - c.actualizadoEn < 4000
  );

  if (cursoresActivos.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-30 select-none"
      aria-hidden="true"
    >
      {cursoresActivos.map((cursor) => {
        const posX = cursor.x * zoom + vpX;
        const posY = cursor.y * zoom + vpY;

        return (
          <div
            key={cursor.idUsuario}
            className="absolute top-0 left-0 will-change-transform transition-transform duration-75 ease-out flex items-start gap-1"
            style={{
              transform: `translate(${posX}px, ${posY}px)`,
            }}
          >
            {/* Puntero SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-sm shrink-0"
              style={{ color: cursor.color }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={cursor.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </svg>

            {/* Etiqueta con el nombre del colaborador */}
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-xs whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.nombreUsuario}
            </span>
          </div>
        );
      })}
    </div>
  );
});
