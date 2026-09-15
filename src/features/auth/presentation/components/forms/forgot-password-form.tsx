"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: "/auth/reset-password",
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success(
            "Si ese email está registrado, recibirás un enlace para restablecer tu contraseña.",
          );
        },
        onError: (ctx) => {
          appToast.error(
            "Error al enviar el correo",
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
          id="email"
          name="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          type="email"
          autoComplete="email"
          hideLabel
        />
        <div className="pt-2">
          <SubmitButton
            text="Enviar enlace de recuperación"
            pendingText="Enviando..."
          />
        </div>
      </form>
    </div>
  );
}
