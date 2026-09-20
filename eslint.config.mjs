import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/features/diagramas/**/*.{ts,tsx}"],
    rules: {
      // Los payloads de eventos discriminados se validan en el borde con Zod;
      // internamente se permiten adaptaciones legacy durante la migración 015/016.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
