import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Excluir rutas de autenticación, api, internas de Next.js y recursos estáticos
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Ruta pública de bienvenida / landing
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 3. Obtener la sesión activa de Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session;

  // 4. Proteger rutas privadas: usuarios no autenticados van al login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 5. Redirección de /home a /proyectos
  if (pathname === "/home" || pathname.startsWith("/home/")) {
    return NextResponse.redirect(new URL("/proyectos", request.url));
  }

  // 6. Permitir rutas del espacio de proyectos y lienzo temporal por slug
  const esRutaProyectoValida =
    pathname === "/proyectos" ||
    pathname === "/proyectos/favoritos" ||
    pathname === "/proyecto" ||
    pathname.startsWith("/proyecto/");

  if (esRutaProyectoValida) {
    return NextResponse.next();
  }

  // 7. Redirigir cualquier otra ruta desconocida autenticada a /proyectos
  return NextResponse.redirect(new URL("/proyectos", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
