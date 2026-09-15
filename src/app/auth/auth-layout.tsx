import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AuthCard,
  type AuthCardColor,
} from "@/features/auth/presentation/components/elements/auth-card";

export interface AuthLayoutProps {
  variant: "split" | "split-reverse" | "centered";
  children: React.ReactNode;
  cardColor?: AuthCardColor;
  cardOverlay?: React.ReactNode;
  className?: string;
}

export function AuthLayout({
  variant,
  children,
  cardColor = "green",
  cardOverlay,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-[#c8ee90] selection:text-black relative">
      {/* Main Content Area */}
      <main
        className="w-full max-w-6xl mx-auto my-auto py-6 sm:py-10 flex items-center justify-center"
        data-purpose="auth-container"
      >
        {variant === "split" && (
          <div
            className={cn(
              "w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center",
              className
            )}
          >
            {/* Form Column (Left on desktop) */}
            <section
              className="w-full max-w-[430px] mx-auto flex flex-col justify-center order-1"
              data-purpose="auth-main-section"
            >
              {children}
            </section>

            {/* Showcase Card Column (Right on desktop, hidden on mobile) */}
            <section
              className="w-full hidden lg:flex justify-center items-center order-2"
              data-purpose="auth-card-section"
            >
              <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[1/1.1] max-w-[530px] mx-auto flex items-center justify-center">
                <AuthCard
                  color={cardColor}
                  className="w-full h-full p-6 sm:p-8 flex flex-col justify-between items-center"
                >
                  {cardOverlay}
                </AuthCard>
              </div>
            </section>
          </div>
        )}

        {variant === "split-reverse" && (
          <div
            className={cn(
              "w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center",
              className
            )}
          >
            {/* Form Column: On mobile order-1 (first), on desktop order-2 (right) */}
            <section
              className="w-full max-w-[430px] mx-auto flex flex-col justify-center order-1 lg:order-2"
              data-purpose="auth-main-section"
            >
              {children}
            </section>

            {/* Showcase Card Column: On mobile hidden, on desktop order-1 (left) */}
            <section
              className="w-full hidden lg:flex justify-center items-center order-2 lg:order-1"
              data-purpose="auth-card-section"
            >
              <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[1/1.1] max-w-[530px] mx-auto flex items-center justify-center">
                <AuthCard
                  color={cardColor}
                  className="w-full h-full p-6 sm:p-8 flex flex-col justify-between items-center"
                >
                  {cardOverlay}
                </AuthCard>
              </div>
            </section>
          </div>
        )}

        {variant === "centered" && (
          <div
            className={cn(
              "w-full max-w-xl mx-auto py-4 sm:py-6 flex flex-col items-center justify-center",
              className
            )}
            data-purpose="auth-main-section"
          >
            <AuthCard
              color={cardColor}
              className="w-full max-w-[500px] p-6 sm:p-8 flex flex-col justify-between items-center"
            >
              {children}
            </AuthCard>
          </div>
        )}
      </main>

      {/* Page Footer */}
      <footer
        className="w-full max-w-6xl mx-auto py-3 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2"
        data-purpose="site-footer"
      >
        <p>© {new Date().getFullYear()} DRAWI Studio Inc. Todos los derechos reservados.</p>
        <div className="flex items-center space-x-4 text-xs">
          <Link
            href="#"
            className="hover:text-black transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Privacidad
          </Link>
          <span className="text-gray-300" aria-hidden="true">
            •
          </span>
          <Link
            href="#"
            className="hover:text-black transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Términos del servicio
          </Link>
          <span className="text-gray-300" aria-hidden="true">
            •
          </span>
          <Link
            href="#"
            className="hover:text-black transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Centro de soporte
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default AuthLayout;
