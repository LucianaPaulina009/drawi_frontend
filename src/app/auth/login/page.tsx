import { Suspense } from "react";
import { AuthLayout } from "../auth-layout";
import { LoginForm } from "@/features/auth/presentation/components/forms/login-form";
import { FieldSeparator } from "@/components/ui/field";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import AuthErrorNotifier from "@/features/auth/presentation/components/elements/auth-error-notifier";
import { BotonAyudaFlotante } from "@/features/manual-usuario/presentation/components/elements/boton-ayuda-flotante";

function LoginShowcase() {
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
            stroke="#111827"
            viewBox="0 0 400 360"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dbTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3fce3" />
                <stop offset="100%" stopColor="#d9f99d" />
              </linearGradient>
              <linearGradient id="dbBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8ee90" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
              <linearGradient id="dbAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e4f9b8" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
              <filter id="subtleGlow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.06" />
              </filter>
            </defs>
            <g fill="#111827" opacity="0.22">
              <circle cx="60" cy="55" r="2" />
              <circle cx="145" cy="35" r="2" />
              <circle cx="260" cy="45" r="2" />
              <circle cx="345" cy="85" r="2" />
              <circle cx="80" cy="225" r="2" />
              <circle cx="335" cy="250" r="2" />
              <circle cx="190" cy="280" r="2" />
            </g>
            <g stroke="#111827" strokeDasharray="3.5 3.5" strokeWidth="1.4" opacity="0.45">
              <path d="M 140 120 L 210 160" />
              <path d="M 210 160 L 285 110" />
              <path d="M 210 215 L 285 215" />
              <path d="M 140 160 L 210 200" />
            </g>
            <g stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 140 135 L 180 155" />
              <path d="M 235 155 L 275 130" />
              <circle cx="160" cy="145" r="3" fill="#111827" />
              <circle cx="255" cy="142" r="3" fill="#111827" />
            </g>
            <g filter="url(#subtleGlow)" stroke="#111827" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 70 100 C 70 92, 120 92, 120 100 C 120 108, 70 108, 70 100 Z" fill="url(#dbTop)" />
              <path d="M 70 100 L 70 145 C 70 153, 120 153, 120 145 L 120 100" fill="url(#dbBody)" />
              <path d="M 70 115 C 70 123, 120 123, 120 115" fill="none" opacity="0.65" />
              <path d="M 70 130 C 70 138, 120 138, 120 130" fill="none" opacity="0.65" />
              <circle cx="95" cy="100" r="2.5" fill="#111827" />
            </g>
            <g filter="url(#subtleGlow)" stroke="#111827" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 175 140 C 175 128, 245 128, 245 140 C 245 152, 175 152, 175 140 Z" fill="url(#dbTop)" />
              <path d="M 175 140 L 175 220 C 175 232, 245 232, 245 220 L 245 140" fill="url(#dbAccent)" />
              <path d="M 175 165 C 175 177, 245 177, 245 165" fill="none" opacity="0.75" strokeWidth="1.5" />
              <path d="M 175 190 C 175 202, 245 202, 245 190" fill="none" opacity="0.75" strokeWidth="1.5" />
              <line x1="210" y1="146" x2="210" y2="226" stroke="#111827" strokeWidth="1.3" opacity="0.35" strokeDasharray="2 2" />
              <circle cx="210" cy="140" r="3.5" fill="#111827" />
              <circle cx="210" cy="165" r="2.5" fill="#111827" />
              <circle cx="210" cy="190" r="2.5" fill="#111827" />
              <circle cx="210" cy="226" r="3" fill="#111827" />
            </g>
            <g filter="url(#subtleGlow)" stroke="#111827" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 265 95 C 265 88, 315 88, 315 95 C 315 102, 265 102, 265 95 Z" fill="url(#dbTop)" />
              <path d="M 265 95 L 265 142 C 265 149, 315 149, 315 142 L 315 95" fill="url(#dbBody)" />
              <path d="M 265 110 C 265 117, 315 117, 315 110" fill="none" opacity="0.65" />
              <path d="M 265 126 C 265 133, 315 133, 315 126" fill="none" opacity="0.65" />
              <circle cx="290" cy="95" r="2.5" fill="#111827" />
            </g>
            <g transform="translate(235, 175)">
              <rect x="0" y="0" width="138" height="28" rx="14" fill="#ffffff" fillOpacity="0.95" stroke="#111827" strokeWidth="1.2" filter="url(#subtleGlow)" />
              <circle cx="14" cy="14" r="3.5" fill="#84cc16" />
              <text x="26" y="18" fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)" fontSize="10.5" fontWeight="700" fill="#111827" stroke="none" letterSpacing="-0.2">Postgres Cluster</text>
            </g>
            <g transform="translate(50, 64)">
              <rect x="0" y="0" width="104" height="24" rx="12" fill="#ffffff" fillOpacity="0.9" stroke="#111827" strokeWidth="1.1" filter="url(#subtleGlow)" />
              <circle cx="12" cy="12" r="2.5" fill="#111827" />
              <text x="22" y="15.5" fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)" fontSize="9.5" fontWeight="600" fill="#111827" stroke="none">Read Replica</text>
            </g>
          </svg>
        </div>

        {/* Top-Left Pencil/Draw Badge Icon */}
        <div className="absolute left-6 top-6 sm:left-8 sm:top-8 z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black text-[#c8ee90] p-3 flex items-center justify-center shadow-md transform -rotate-6 hover:rotate-0 transition-transform duration-150">
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

        {/* Collaborator Avatar 1 (Top Right) */}
        <div className="absolute right-8 top-6 z-10 animate-bounce pointer-events-none select-none flex items-center gap-1.5" style={{ animationDuration: "5s" }} aria-hidden="true">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md border border-black/15 flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border border-amber-200">
              <svg className="w-6 h-6 text-amber-900 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <span className="bg-white/95 backdrop-blur-xs text-[10px] font-bold text-gray-800 px-2 py-0.5 rounded-full border border-black/10 shadow-xs hidden sm:inline-block">Elena</span>
        </div>

        {/* Collaborator Avatar 2 (Mid Right, near cluster) */}
        <div className="absolute right-4 bottom-24 sm:right-6 sm:bottom-28 z-10 animate-bounce pointer-events-none select-none flex items-center gap-1.5" style={{ animationDuration: "6s" }} aria-hidden="true">
          <div className="w-9 h-9 rounded-full bg-white p-0.5 shadow-md border border-black/15 flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-sky-100 flex items-center justify-center overflow-hidden border border-sky-200">
              <svg className="w-5 h-5 text-sky-900 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <span className="bg-white/95 backdrop-blur-xs text-[10px] font-bold text-gray-800 px-2 py-0.5 rounded-full border border-black/10 shadow-xs hidden sm:inline-block">Lucas</span>
        </div>

        {/* Collaborator Avatar 3 (Top Center) */}
        <div className="absolute left-36 top-4 sm:left-48 sm:top-5 z-10 pointer-events-none select-none flex items-center gap-1.5" aria-hidden="true">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-md border border-black/15 flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-rose-100 flex items-center justify-center overflow-hidden border border-rose-200">
              <svg className="w-5 h-5 text-rose-800 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
        </div>

        {/* Floating Database Task Card */}
        <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-black/10 w-56 sm:w-64 z-20" data-purpose="floating-task-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
                <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">Base de datos</h4>
              </div>
              <p className="text-xs text-gray-500 font-medium">Cluster sincronizado</p>
            </div>
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#f1f3ff" strokeWidth="3.5" />
                <circle cx="18" cy="18" fill="none" r="14" stroke="#111827" strokeDasharray="88" strokeDashoffset="7" strokeLinecap="round" strokeWidth="3.5" />
              </svg>
              <span className="absolute text-[10px] font-bold text-gray-900">99%</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-900 bg-[#c8ee90] rounded-full border border-black/10">Multi-Región</span>
            <span className="text-[11px] font-bold text-gray-500">En vivo</span>
          </div>
        </div>
      </div>

      {/* Bottom Paging And Tagline */}
      <div
        className="w-full mt-6 text-center z-10"
        data-purpose="carousel-and-caption"
      >
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

export default function LoginPage() {
  return (
    <AuthLayout
      variant="split"
      cardColor="green"
      cardOverlay={<LoginShowcase />}
    >
      <div className="w-full flex flex-col justify-center">
        {/* Lee ?error= en la URL y muestra el toast correspondiente */}
        <Suspense>
          <AuthErrorNotifier />
        </Suspense>

        {/* Header Text Block */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
            ¡Bienvenido de nuevo!
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-gray-500 max-w-[320px] mx-auto leading-relaxed font-normal">
            Simplifica tu flujo de trabajo y aumenta tu productividad con{" "}
            <span className="font-semibold text-gray-700">DRAWI</span>. Comienza gratis.
          </p>
        </div>

        {/* Form Elements */}
        <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-gray-400">Cargando formulario...</div>}>
          <LoginForm />
        </Suspense>

        {/* Divider with Text */}
        <FieldSeparator>o continuar con</FieldSeparator>

        {/* Social Login Circular Buttons */}
        <Suspense fallback={<div className="h-12" />}>
          <SocialSignInButtons />
        </Suspense>

        {/* Registration Link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700 font-medium">
            ¿Aún no eres miembro?{" "}
            <AuthLink href="/auth/signup" label="Regístrate ahora" />
          </p>
        </div>
      </div>

      {/* Burbujita flotante de ayuda en la esquina inferior derecha */}
      <BotonAyudaFlotante />
    </AuthLayout>
  );
}
