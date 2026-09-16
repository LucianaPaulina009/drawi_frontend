"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const rawCallback =
    searchParams.get("callbackURL") || searchParams.get("redirect");
  const safeCallback =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/proyectos";

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: safeCallback,
        rememberMe: false,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success("¡Bienvenido de vuelta!");
          router.push(safeCallback);
        },
        onError: (ctx) => {
          appToast.error(
            "Error al iniciar sesión",
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
          id="username"
          name="email"
          label="Usuario o correo electrónico"
          placeholder="Usuario o correo electrónico"
          type="email"
          autoComplete="email"
          hideLabel
        />
        <TextFormField
          id="password"
          name="password"
          label="Contraseña"
          placeholder="Contraseña"
          type="password"
          autoComplete="current-password"
          hideLabel
        />

        <div className="flex justify-end pt-0.5">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-gray-700 hover:text-black font-medium transition-colors focus-visible:outline-none focus-visible:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="pt-2">
          <SubmitButton
            text="Iniciar sesión"
            pendingText="Iniciando sesión..."
          />
        </div>
      </form>
    </div>
  );
}
