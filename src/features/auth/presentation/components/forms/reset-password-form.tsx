"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      appToast.error("Error", "Las contraseñas no coinciden.");
      return;
    }

    const token = searchParams.get("token");

    if (!token) {
      appToast.error(
        "Enlace inválido",
        "El enlace de recuperación no es válido o ha expirado.",
      );
      return;
    }

    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success(
            "¡Contraseña actualizada! Ya puedes iniciar sesión.",
          );
          router.push("/auth/login");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al restablecer",
            getAuthErrorMessage(ctx.error.code),
          );
        },
      },
    );
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <TextFormField
          id="newPassword"
          name="newPassword"
          label="Nueva contraseña"
          placeholder="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          hideLabel
        />
        <TextFormField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          placeholder="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          hideLabel
        />
        <div className="px-2">
          <p className="text-xs text-gray-500 font-normal leading-relaxed flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
            Debe contener al menos 8 caracteres, una letra mayúscula y un número
          </p>
        </div>
        <div className="pt-2">
          <SubmitButton
            text="Restablecer contraseña"
            pendingText="Restableciendo..."
          />
        </div>
      </form>
    </div>
  );
}
