import { Suspense } from "react";
import { AuthLayout } from "../auth-layout";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import { ResetPasswordForm } from "@/features/auth/presentation/components/forms/reset-password-form";

function ResetPasswordShowcase() {
  return (
    <>
      {/* Illustration Layer */}
      <div
        className="relative w-full flex-1 flex items-center justify-center"
        data-purpose="illustration-area"
      >
        {/* Minimalist Doodle / Creative Architecture Vector Illustration */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center p-4">
          <svg
            className="w-full h-full max-w-[420px] max-h-[360px] overflow-visible"
            fill="none"
            viewBox="0 0 400 340"
            aria-hidden="true"
          >
            <g fill="#111827" opacity="0.15">
              <circle cx="55" cy="45" r="2" />
              <circle cx="345" cy="55" r="2.5" />
              <circle cx="330" cy="270" r="2" />
              <circle cx="65" cy="260" r="2.5" />
            </g>
            <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))">
              <rect
                fill="#ffffff"
                height="165"
                rx="24"
                stroke="#111827"
                strokeWidth="2"
                width="240"
                x="80"
                y="85"
              />
              <rect
                fill="#fbcfe8"
                height="38"
                rx="24"
                stroke="#111827"
                strokeWidth="2"
                width="240"
                x="80"
                y="85"
              />
              <rect fill="#fbcfe8" height="18" width="240" x="80" y="105" />
              <line
                stroke="#111827"
                strokeWidth="2"
                x1="80"
                x2="320"
                y1="123"
                y2="123"
              />
              <circle cx="104" cy="104" fill="#111827" r="4" />
              <circle cx="118" cy="104" fill="#111827" opacity="0.4" r="4" />
              <circle cx="132" cy="104" fill="#111827" opacity="0.2" r="4" />
              <text
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.05em"
                textAnchor="middle"
                x="200"
                y="108"
              >
                SEGURIDAD
              </text>
            </g>
            <rect
              fill="#f9fafb"
              height="40"
              rx="20"
              stroke="#111827"
              strokeWidth="1.5"
              width="196"
              x="102"
              y="145"
            />
            <g fill="#111827">
              <circle cx="145" cy="165" r="4.5" />
              <circle cx="165" cy="165" r="4.5" />
              <circle cx="185" cy="165" r="4.5" />
              <circle cx="205" cy="165" r="4.5" />
              <circle cx="225" cy="165" r="4.5" />
              <circle cx="245" cy="165" r="4.5" />
            </g>
            <line
              stroke="#111827"
              strokeLinecap="round"
              strokeWidth="1.8"
              x1="260"
              x2="260"
              y1="156"
              y2="174"
            />
            <g transform="translate(102, 198)">
              <rect fill="#111827" height="6" rx="3" width="55" x="0" y="0" />
              <rect fill="#111827" height="6" rx="3" width="55" x="62" y="0" />
              <rect fill="#111827" height="6" rx="3" width="55" x="124" y="0" />
              <rect
                fill="#111827"
                height="6"
                opacity="0.25"
                rx="3"
                width="10"
                x="186"
                y="0"
              />
            </g>
            <text
              fill="#111827"
              fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              fontSize="9"
              fontWeight="700"
              x="103"
              y="223"
            >
              Nivel de seguridad: Fuerte
            </text>
            <g filter="drop-shadow(0 6px 14px rgba(0,0,0,0.12))">
              <circle cx="286" cy="80" fill="#111827" r="26" />
              <path
                d="M280 73V70C280 66.6863 282.686 64 286 64C289.314 64 292 66.6863 292 70V73"
                stroke="#fbcfe8"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <rect
                fill="#fbcfe8"
                height="15"
                rx="4"
                width="20"
                x="276"
                y="73"
              />
              <circle cx="286" cy="79" fill="#111827" r="1.8" />
              <path
                d="M286 80.8V84"
                stroke="#111827"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </g>
            <g filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))">
              <rect
                fill="#ffffff"
                height="26"
                rx="13"
                stroke="#111827"
                strokeWidth="1.5"
                width="112"
                x="110"
                y="52"
              />
              <circle
                cx="123"
                cy="65"
                fill="#d9f99d"
                r="5"
                stroke="#111827"
                strokeWidth="1.2"
              />
              <path
                d="M121 65L122.5 66.5L125.5 63.5"
                stroke="#111827"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.2"
              />
              <text
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
                fontSize="9"
                fontWeight="700"
                x="134"
                y="68.5"
              >
                Clave verificada
              </text>
            </g>
          </svg>
        </div>

        {/* Top-Left Pencil/Draw Badge Icon */}
        <div className="absolute left-6 top-6 sm:left-8 sm:top-8 z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black text-[#fbcfe8] p-3 flex items-center justify-center shadow-md transform -rotate-6 hover:rotate-0 transition-transform duration-150">
            <svg
              className="w-full h-full fill-none stroke-current"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Paging And Tagline */}
      <div
        className="w-full text-center mt-6 z-10"
        data-purpose="carousel-and-caption"
      >
        <div
          className="flex items-center justify-center gap-1.5 mb-4"
          aria-hidden="true"
        >
          <span className="w-2 h-2 rounded-full bg-gray-400/60 transition-colors" />
          <span className="w-5 h-2 rounded-full bg-black transition-colors" />
          <span className="w-2 h-2 rounded-full bg-gray-400/60 transition-colors" />
        </div>
        <p className="text-base sm:text-lg font-medium text-gray-800 tracking-tight leading-snug">
          Haz tu trabajo más fácil y organizado<br className="hidden sm:inline" />
          con <span className="font-extrabold text-black">DRAWI</span>
        </p>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      variant="split"
      cardColor="pink"
      cardOverlay={<ResetPasswordShowcase />}
    >
      <div className="w-full flex flex-col justify-center">
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
            Restablecer contraseña
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-gray-500 max-w-[340px] leading-relaxed font-normal">
            Ingresa tu nueva contraseña para acceder a tu cuenta de{" "}
            <span className="font-semibold text-gray-700">DRAWI</span>.
          </p>
        </div>

        <div className="w-full">
          <Suspense fallback={<div className="text-center text-sm text-gray-500">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="text-center mt-8 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-700 font-medium">
            ¿Recordaste tu contraseña?{" "}
            <AuthLink href="/auth/login" label="Inicia sesión" />
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

