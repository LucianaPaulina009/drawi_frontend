import { AuthLayout } from "../auth-layout";
import { FieldSeparator } from "@/components/ui/field";
import { SignupForm } from "@/features/auth/presentation/components/forms/signup-form";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";

function SignupShowcase() {
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
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#111827" />
              </marker>
              <marker
                id="diamond"
                viewBox="0 0 12 12"
                refX="6"
                refY="6"
                markerWidth="7"
                markerHeight="7"
              >
                <polygon
                  points="6,0 12,6 6,12 0,6"
                  fill="#bfdbfe"
                  stroke="#111827"
                  strokeWidth="1.5"
                />
              </marker>
            </defs>
            <g fill="#111827" opacity="0.15">
              <circle cx="60" cy="50" r="2" />
              <circle cx="140" cy="40" r="2" />
              <circle cx="260" cy="45" r="2" />
              <circle cx="340" cy="70" r="2" />
              <circle cx="70" cy="280" r="2" />
              <circle cx="330" cy="290" r="2" />
            </g>
            <g stroke="#111827" strokeWidth="1.8" opacity="0.65">
              <path
                d="M 200 115 V 155"
                markerStart="url(#diamond)"
                strokeDasharray="4 4"
              />
              <path d="M 200 155 H 125 V 195" markerEnd="url(#arrow)" />
              <path d="M 200 155 H 275 V 195" markerEnd="url(#arrow)" />
            </g>
            <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))">
              <rect
                x="135"
                y="45"
                width="130"
                height="70"
                rx="10"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect
                x="135"
                y="45"
                width="130"
                height="24"
                rx="10"
                fill="#60a5fa"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect x="135" y="58" width="130" height="11" fill="#60a5fa" />
              <text
                x="200"
                y="62"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                AuthController
              </text>
              <circle cx="150" cy="83" r="2.5" fill="#0060ac" />
              <text
                x="160"
                y="86"
                fontSize="9"
                fontWeight="600"
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + login(): Token
              </text>
              <circle cx="150" cy="98" r="2.5" fill="#0060ac" />
              <text
                x="160"
                y="101"
                fontSize="9"
                fontWeight="600"
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + register(): User
              </text>
            </g>
            <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))">
              <rect
                x="60"
                y="195"
                width="130"
                height="80"
                rx="10"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect
                x="60"
                y="195"
                width="130"
                height="24"
                rx="10"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect x="60" y="208" width="130" height="11" fill="#ffffff" />
              <text
                x="125"
                y="212"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                &lt;&lt;Service&gt;&gt;
              </text>
              <line
                x1="60"
                y1="219"
                x2="190"
                y2="219"
                stroke="#111827"
                strokeWidth="1.5"
              />
              <text
                x="75"
                y="235"
                fontSize="9"
                fontWeight="500"
                fill="#424936"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                - jwtSecret: string
              </text>
              <line
                x1="60"
                y1="244"
                x2="190"
                y2="244"
                stroke="#111827"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <text
                x="75"
                y="260"
                fontSize="9"
                fontWeight="600"
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + hashPwd()
              </text>
            </g>
            <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))">
              <rect
                x="210"
                y="195"
                width="130"
                height="80"
                rx="10"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect
                x="210"
                y="195"
                width="130"
                height="24"
                rx="10"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
              />
              <rect x="210" y="208" width="130" height="11" fill="#ffffff" />
              <text
                x="275"
                y="212"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#111827"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                UserModel
              </text>
              <line
                x1="210"
                y1="219"
                x2="340"
                y2="219"
                stroke="#111827"
                strokeWidth="1.5"
              />
              <text
                x="225"
                y="235"
                fontSize="9"
                fontWeight="500"
                fill="#424936"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + id: UUID
              </text>
              <text
                x="225"
                y="250"
                fontSize="9"
                fontWeight="500"
                fill="#424936"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + email: string
              </text>
              <text
                x="225"
                y="265"
                fontSize="9"
                fontWeight="500"
                fill="#424936"
                fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
              >
                + role: Role
              </text>
            </g>
            <g fill="#0060ac">
              <circle cx="125" cy="155" r="3.5" />
              <circle cx="275" cy="155" r="3.5" />
              <circle cx="200" cy="155" r="3.5" />
            </g>
          </svg>
        </div>

        {/* Top-Left Pencil/Draw Badge Icon */}
        <div className="absolute left-6 top-6 sm:left-8 sm:top-8 z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black text-[#bfdbfe] p-3 flex items-center justify-center shadow-md transform -rotate-6 hover:rotate-0 transition-transform duration-150">
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

        {/* Floating Design Status Card */}
        <div
          className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-black/10 w-56 sm:w-64 z-20"
          data-purpose="floating-task-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-[#0060ac]" />
                <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                  Diseño en DRAWI
                </h4>
              </div>
              <p className="text-xs text-gray-500 font-medium">10 tareas</p>
            </div>
            {/* Circular Progress Ring (84%) */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#f1f3ff"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#111827"
                  strokeDasharray="88"
                  strokeDashoffset="14"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-gray-900">
                84%
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-900 bg-[#bfdbfe] rounded-full border border-black/10">
              Diseño
            </span>
            <span className="text-[11px] font-bold text-gray-500">+4 hoy</span>
          </div>
        </div>
      </div>

      {/* Bottom Paging And Tagline */}
      <div
        className="w-full text-center mt-6 z-10"
        data-purpose="carousel-and-caption"
      >
        <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden="true">
          <span className="w-5 h-2 rounded-full bg-black transition-colors" />
          <span className="w-2 h-2 rounded-full bg-gray-400/60 transition-colors" />
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

export default function SignupPage() {
  return (
    <AuthLayout
      variant="split-reverse"
      cardColor="blue"
      cardOverlay={<SignupShowcase />}
    >
      <div className="w-full flex flex-col justify-center">
        {/* Header Text Block */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
            ¡Crea tu cuenta!
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-gray-500 max-w-[320px] mx-auto leading-relaxed font-normal">
            Comienza a diseñar y organizar tus ideas con{" "}
            <span className="font-semibold text-gray-700">DRAWI</span> gratis.
          </p>
        </div>

        {/* Form Elements */}
        <SignupForm />

        {/* Divider with Text */}
        <FieldSeparator>o registrarte con</FieldSeparator>

        {/* Social Login Circular Buttons */}
        <SocialSignInButtons />

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700 font-medium">
            ¿Ya tienes una cuenta?{" "}
            <AuthLink href="/auth/login" label="Inicia sesión" />
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

