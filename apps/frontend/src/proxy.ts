// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type User = {
  id: string;
  onboardingCompleted: boolean | null;
};

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/sign-in",
  "/auth/sign-in(.*)",
  "/auth/sign-up",
  "/auth/sign-up(.*)",
  // agrega aquí otros públicos reales (landing, pricing, etc)
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

function withNoCache(res: NextResponse): NextResponse {
  res.headers.set("x-middleware-cache", "no-cache");
  // evita que algún CDN/edge cachee redirects raros
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}

function buildSignInUrl(req: Request): URL {
  const url = new URL(req.url);
  url.pathname = "/auth/sign-in";
  url.search = "";
  url.hash = "";
  // return back donde estabas
  const returnBackUrl = new URL(req.url);
  url.searchParams.set("redirect_url", returnBackUrl.toString());
  return url;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1) Public routes: pasar sin tocar auth ni fetch externo
  if (isPublicRoute(req)) {
    return withNoCache(NextResponse.next());
  }

  // 2) Protege TODO lo que no sea público
  //    OJO: esto ya maneja redirects correctamente sin loops raros.
  await auth.protect({
    unauthenticatedUrl: buildSignInUrl(req).toString(),
  });

  // 3) Si estás autenticado, usa token Clerk para consultar tu API (NO cookies)
  //    Esto evita cross-domain cookie weirdness y “logout/login” fantasmas.
  const apiBase = process.env.API_URL;
  if (!apiBase) {
    // Si tu app depende del user backend, mejor fallar “suave” pero sin romper sesión
    return withNoCache(NextResponse.next());
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    // Raro, pero si pasa: manda a sign-in con redirect_url.
    return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
  }

  let user: User | null = null;

  try {
    const userRes = await fetch(`${apiBase}/api/v1/user`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      // Edge runtime: no uses "credentials: include" aquí; no estás usando cookies.
      cache: "no-store",
    });

    // Si tu API dice 401/403 => sesión válida en Clerk pero no válida en tu backend (o token no aceptado).
    // Mándalo a login (o muestra fallback). Esto evita loops al home "/".
    if (userRes.status === 401 || userRes.status === 403) {
      return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
    }

    if (!userRes.ok) {
      // Para 5xx / 4xx inesperados: NO fuerces logout, deja pasar.
      // Esto evita “se desconfigura todo” cuando el backend cae.
      return withNoCache(NextResponse.next());
    }

    const data: unknown = await userRes.json();

    // Validación mínima sin any
    if (
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      typeof (data as { id: unknown }).id === "string" &&
      "onboardingCompleted" in data
    ) {
      const oc = (data as { onboardingCompleted: unknown }).onboardingCompleted;
      if (oc === null || typeof oc === "boolean") {
        user = {
          id: (data as { id: string }).id,
          onboardingCompleted: oc,
        };
      }
    }
  } catch {
    // Si falla la red: NO redirigir a login (eso causa “logout fantasma”).
    return withNoCache(NextResponse.next());
  }

  // 4) Onboarding gate (solo si realmente tienes user válido)
  //    Tu código decía "=== null"; eso es frágil. Normalmente: false/null => incompleto.
  if (
    user &&
    (user.onboardingCompleted === null || user.onboardingCompleted === false)
  ) {
    if (!isOnboardingRoute(req)) {
      const onboardingUrl = new URL(req.url);
      onboardingUrl.pathname = "/onboarding";
      onboardingUrl.search = "";
      onboardingUrl.hash = "";
      return withNoCache(NextResponse.redirect(onboardingUrl));
    }
  }

  return withNoCache(NextResponse.next());
});

export const config = {
  matcher: [
    // Skips Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
