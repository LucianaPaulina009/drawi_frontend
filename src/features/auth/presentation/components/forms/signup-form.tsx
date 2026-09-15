"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: "/proyectos",
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success("¡Registro exitoso! Por favor verifica tu email.");
          router.push("/auth/verify-email");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al registrarse",
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
          id="name"
          name="name"
          label="Nombre completo"
          placeholder="Nombre completo"
          type="text"
          autoComplete="name"
          hideLabel
        />
        <TextFormField
          id="email"
          name="email"
          label="Correo electrónico"
          placeholder="Correo electrónico"
          type="email"
          autoComplete="email"
          hideLabel
        />
        <TextFormField
          id="password"
          name="password"
          label="Contraseña"
          placeholder="Contraseña (mínimo 8 caracteres)"
          type="password"
          autoComplete="new-password"
          hideLabel
        />
        <div className="pt-2">
          <SubmitButton text="Crear cuenta" pendingText="Creando cuenta..." />
        </div>
      </form>
    </div>
  );
}
