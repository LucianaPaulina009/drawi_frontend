import React from "react";
import { cn } from "@/lib/utils";

export type AuthCardColor = "green" | "blue" | "pink";

export interface AuthCardProps {
  color: AuthCardColor;
  className?: string;
  children?: React.ReactNode;
}

const colorStyles: Record<AuthCardColor, string> = {
  green: "bg-[#c8ee90]",
  blue: "bg-[#bfdbfe]",
  pink: "bg-[#fde9f4]",
};

/**
 * AuthCard — Superficie visual pura reutilizable de Stitch.
 * Renderiza la carta con su color de variante, radio y sombra,
 * y contiene el contenido o vitrina directamente en su interior.
 */
export function AuthCard({ color, className, children }: AuthCardProps) {
  return (
    <div
      data-purpose="auth-card-surface"
      data-color={color}
      className={cn(
        "w-full rounded-[38px] border border-black/10 shadow-inner overflow-hidden relative transition-colors duration-200",
        colorStyles[color],
        className
      )}
    >
      {children}
    </div>
  );
}

export default AuthCard;

