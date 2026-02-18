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
  "/api(.*)",
]);

function withNoCache(res: NextResponse): NextResponse {
  res.headers.set("x-middleware-cache", "no-cache");
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}

function buildSignInUrl(req: Request): URL {
  const url = new URL(req.url);
  url.pathname = "/auth/sign-in";
  url.search = "";
  url.hash = "";

  const returnBackUrl = new URL(req.url);
  const pathname = returnBackUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const redirectTo = isApiRoute
    ? new URL("/onboarding", returnBackUrl.origin).toString()
    : returnBackUrl.toString();

  url.searchParams.set("redirect_url", redirectTo);
  return url;
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return withNoCache(NextResponse.next());
  }

  let protectedRoute;
  try {
    protectedRoute = await auth.protect({
      unauthenticatedUrl: buildSignInUrl(req).toString(),
    });
  } catch {
    // if protect throws, fallback to a safe redirect
    return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
  }

  if (!protectedRoute?.userId) {
    return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
  }

  const { getToken } = protectedRoute;

  let token: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      token = await getToken();
      break;
    } catch {
      if (attempt === 1) {
        return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  if (!token) {
    return withNoCache(NextResponse.redirect(buildSignInUrl(req)));
  }

  return withNoCache(NextResponse.next());
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
