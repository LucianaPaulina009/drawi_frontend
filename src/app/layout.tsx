import type { Metadata } from "next";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sileo";
import { appFontVariables } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "DRAWI",
  description:
    "HERRAMIENTA WEB COLABORATIVA PARA MODELADO UML, DISEÑO DE BASES DE DATOS Y GENERACIÓN DE BACKEND ASISTIDA POR INTELIGENCIA ARTIFICIAL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        appFontVariables,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" theme="light" />
      </body>
    </html>
  );
}
