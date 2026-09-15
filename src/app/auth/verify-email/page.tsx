import Link from "next/link";
import { AuthLayout } from "../auth-layout";

export default function VerificationPage() {
  return (
    <AuthLayout variant="centered" cardColor="green">
      {/* Top Illustration Area */}
      <div className="relative w-full flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
        {/* Minimalist Doodle / Creative Architecture Vector Illustration */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center p-4">
          <svg
            className="w-full h-full max-w-[380px] max-h-[290px] overflow-visible"
            fill="none"
            stroke="#111827"
            viewBox="0 0 380 280"
            aria-hidden="true"
          >
            <g fill="#111827" opacity="0.2">
              <circle cx="60" cy="50" r="2" />
              <circle cx="120" cy="35" r="2" />
              <circle cx="280" cy="40" r="2" />
              <circle cx="330" cy="90" r="2" />
              <circle cx="70" cy="210" r="2" />
              <circle cx="320" cy="230" r="2" />
            </g>
            <g opacity="0.4" stroke="#111827" strokeDasharray="4 4" strokeWidth="1.8">
              <path d="M80 160 Q 140 70 200 90" />
              <path d="M200 90 Q 260 110 300 60" />
              <path d="M190 190 V 230" />
            </g>
            <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <rect
                fill="#ffffff"
                fillOpacity="0.9"
                height="125"
                rx="16"
                stroke="#111827"
                width="180"
                x="100"
                y="85"
              />
              <path d="M100 95 L190 155 L280 95" stroke="#111827" strokeWidth="2" />
              <path d="M100 200 L155 145" opacity="0.5" stroke="#111827" strokeWidth="1.8" />
              <path d="M280 200 L225 145" opacity="0.5" stroke="#111827" strokeWidth="1.8" />
              <ellipse cx="190" cy="85" fill="#d9f99d" rx="24" ry="12" stroke="#111827" strokeWidth="1.8" />
              <path d="M183 85 L188 90 L198 80" stroke="#111827" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </g>
            <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" transform="translate(250, 45) rotate(18)">
              <path d="M0 0 L40 16 L12 24 Z" fill="#ffffff" stroke="#111827" />
              <path d="M12 24 L20 38 L24 22" fill="#bbf7d0" stroke="#111827" />
              <path d="M40 16 L12 24" stroke="#111827" />
            </g>
            <g fill="#111827">
              <circle cx="80" cy="160" r="3" />
              <circle cx="200" cy="90" r="3.5" />
              <circle cx="300" cy="60" r="3" />
            </g>
          </svg>
        </div>

        {/* Top-Left Mail Badge Icon */}
        <div className="absolute left-2 top-0 sm:left-4 sm:top-2 z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-black text-[#c8ee90] p-3 flex items-center justify-center shadow-md transform -rotate-6 hover:rotate-0 transition-transform duration-150">
            <svg
              className="w-6 h-6 fill-none stroke-current"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Heading, Description, Button & Slogan */}
      <div className="w-full text-center mt-5 z-10 flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mb-3 leading-tight">
          ¡Revisa tu correo!
        </h2>
        <p className="text-xs sm:text-sm text-gray-800 max-w-[340px] mx-auto leading-relaxed mb-6 font-medium block">
          Hemos enviado las instrucciones para activar tu cuenta. Revisa tu bandeja de entrada o carpeta de spam.
        </p>
        <Link
          href="/auth/login"
          className="w-full max-w-[300px] bg-black hover:bg-neutral-900 active:scale-[0.99] text-white font-medium py-3.5 px-6 rounded-full transition duration-150 shadow-sm text-sm inline-block text-center mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          Volver a iniciar sesión
        </Link>
        <p className="text-xs sm:text-sm text-gray-800 tracking-tight leading-snug">
          Haz tu trabajo más fácil y organizado con <span className="font-extrabold text-black">DRAWI</span>
        </p>
      </div>
    </AuthLayout>
  );
}

