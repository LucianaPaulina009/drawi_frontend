"use client";

import { ComponentProps, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TextFormFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  hideLabel?: boolean;
} & ComponentProps<typeof Input>;

export default function TextFormField({
  id,
  name,
  label,
  placeholder,
  type,
  autoComplete,
  required = true,
  hideLabel = false,
  className,
  ...props
}: TextFormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Field className="space-y-1" data-purpose={`input-field-${name || id}`}>
      <FieldLabel
        htmlFor={id}
        className={cn(
          "block text-xs font-semibold text-gray-700 px-1 mb-1",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "w-full h-12 rounded-full border border-gray-400/80 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#222] focus:ring-1 focus:ring-[#222] transition duration-200 px-6",
            isPassword && "pl-6 pr-12",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none p-1 cursor-pointer flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </Field>
  );
}
