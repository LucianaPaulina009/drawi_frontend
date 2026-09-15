import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { AuthLayout } from "../auth-layout";
import { ForgotPasswordForm } from "@/features/auth/presentation/components/forms/forgot-password-form";

function ForgotPasswordShowcase() {
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
            {/* Subtle background dots & sparkles */}
            <g opacity="0.18" fill="#111827">
              <circle cx="60" cy="55" r="2.5" />
              <circle cx="340" cy="55" r="2" />
              <circle cx="335" cy="265" r="2.5" />
              <circle cx="70" cy="270" r="2" />
            </g>
            {/* Decorative stars / sparkles */}
            <path
              d="M85 85 Q92 85 92 78 Q92 85 99 85 Q92 85 92 92 Q92 85 85 85Z"
              fill="#111827"
              opacity="0.6"
            />
            <path
              d="M315 190 Q320 190 320 185 Q320 190 325 190 Q320 190 320 195 Q320 190 315 190Z"
              fill="#111827"
              opacity="0.5"
            />
            <circle cx="95" cy="155" r="4" fill="#d9f99d" stroke="#111827" strokeWidth="1.5" />
            <circle cx="305" cy="225" r="5" fill="#bfdbfe" stroke="#111827" strokeWidth="1.5" />

            {/* Main Recovery Window Card */}
            <g filter="drop-shadow(0 10px 20px rgba(0,0,0,0.06))">
              <rect
                x="80"
                y="80"
                width="240"
                height="172"
                rx="24"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect
                x="80"
                y="80"
                width="240"
                height="38"
                rx="24"
                fill="#fbcfe8"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect x="80" y="100" width="240" height="18" fill="#fbcfe8" />
              <line x1="80" y1="118" x2="320" y2="118" stroke="#111827" strokeWidth="2" />
              <circle cx="104" cy="99" r="4" fill="#111827" />
              <circle cx="118" cy="99" r="4" fill="#111827" opacity="0.4" />
              <circle cx="132" cy="99" r="4" fill="#111827" opacity="0.2" />
            </g>

            {/* Central Password / Reset Graphic Elements */}
            <g>
              <rect
                x="104"
                y="136"
                width="192"
                height="44"
                rx="22"
                fill="#f9fafb"
                stroke="#111827"
                strokeWidth="1.5"
              />
              <circle cx="128" cy="158" r="13" fill="#d9f99d" stroke="#111827" strokeWidth="1.5" />
              <path
                d="M122 154L128 158.5L134 154"
                stroke="#111827"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="122"
                y="153"
                width="12"
                height="9.5"
                rx="2"
                stroke="#111827"
                strokeWidth="1.4"
                fill="none"
              />
              <circle cx="152" cy="158" r="3.5" fill="#111827" />
              <circle cx="164" cy="158" r="3.5" fill="#111827" />
              <circle cx="176" cy="158" r="3.5" fill="#111827" />
              <circle cx="188" cy="158" r="3.5" fill="#111827" />
              <path
                d="M204 158L218 158M214 154L218 158L214 162"
                stroke="#111827"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="236" cy="158" r="5" stroke="#111827" strokeWidth="1.5" fill="#bfdbfe" />
              <path
                d="M241 158H247M245 158V161"
                stroke="#111827"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Bottom Status Indicator: Enlace listo para enviar */}
            <g transform="translate(104, 196)">
              <rect
                x="0"
                y="0"
                width="126"
                height="22"
                rx="11"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="11" r="3.5" fill="#84cc16" />
              <text
                x="24"
                y="14.5"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
                fontSize="9"
                fontWeight="700"
                fill="#111827"
              >
                Enlace listo para enviar
              </text>
            </g>

            {/* Floating Stylized Key Badge (Right Side) */}
            <g filter="drop-shadow(0 8px 18px rgba(0,0,0,0.14))">
              <circle cx="286" cy="78" r="27" fill="#111827" />
              <circle
                cx="280"
                cy="73"
                r="7"
                fill="none"
                stroke="#d9f99d"
                strokeWidth="2.5"
              />
              <circle cx="280" cy="73" r="3" fill="#fbcfe8" />
              <path
                d="M285 78L297 90M292 85L295 82M295 88L298 85"
                stroke="#d9f99d"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="270" cy="88" r="1.8" fill="#fbcfe8" />
              <path
                d="M296 66 Q298 66 298 64 Q298 66 300 66 Q298 66 298 68 Q298 66 296 66Z"
                fill="#fbcfe8"
              />
            </g>

            {/* Floating Top Tag / Badge: Acceso seguro */}
            <g filter="drop-shadow(0 4px 12px rgba(0,0,0,0.06))">
              <rect
                x="104"
                y="46"
                width="132"
                height="28"
                rx="14"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="1.5"
              />
              <circle
                cx="120"
                cy="60"
                r="6"
                fill="#d9f99d"
                stroke="#111827"
                strokeWidth="1.3"
              />
              <path
                d="M117.5 60L119.5 62L123 58.5"
                stroke="#111827"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="132"
                y="63.5"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
                fontSize="9.5"
                fontWeight="700"
                fill="#111827"
              >
                Acceso seguro
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
      <div className="w-full text-center mt-6 z-10" data-purpose="carousel-and-caption">
        <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden="true">
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

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      variant="split-reverse"
      cardColor="pink"
      cardOverlay={<ForgotPasswordShowcase />}
    >
      <div className="w-full flex flex-col justify-center">
        {/* Heading & Instructions */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed font-normal">
            Ingresa tu correo electrónico registrado y te enviaremos un enlace con las instrucciones para restablecerla.
          </p>
        </div>

        {/* Password Recovery Form */}
        <div className="w-full">
          <ForgotPasswordForm />
        </div>

        {/* Return & Support Links */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3.5 w-full text-xs text-gray-500 border-t border-gray-200 pt-5 text-center">
          <Link
            href="/auth/login"
            className="font-medium text-gray-700 hover:text-black transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:underline group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span>Volver al inicio de sesión</span>
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-gray-500">
            <span>¿Necesitas ayuda?</span>
            <a
              href="mailto:support@drawi.com"
              className="font-semibold text-black hover:underline transition-colors inline-flex items-center gap-1"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-gray-700" aria-hidden="true" />
              <span>Contactar a soporte</span>
            </a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

