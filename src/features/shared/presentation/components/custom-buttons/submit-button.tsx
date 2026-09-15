"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  text: string;
  pendingText: string;
  className?: string;
  disabled?: boolean;
};

/**
 * SubmitButton — Botón de envío fiel a Stitch (login2.html).
 * Fondo oscuro con borde acentuado, hover refinado, tipografía seminegrita y flecha animada.
 * Maneja el estado pendiente automáticamente mediante useFormStatus.
 */
export function SubmitButton({
  text,
  pendingText,
  className,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "w-full h-12 rounded-full bg-slate-950 hover:bg-black text-white font-semibold text-sm tracking-wide transition-all duration-200 border border-slate-700/80 hover:border-slate-500 shadow-md flex items-center justify-center gap-2 group hover:shadow-app-primary/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50",
        className
      )}
    >
      <span>{pending ? pendingText : text}</span>
      {pending ? (
        <Spinner className="size-4 text-slate-400" />
      ) : (
        <svg
          className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M14 5l7 7m0 0l-7 7m7-7H3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  );
}

export default SubmitButton;
