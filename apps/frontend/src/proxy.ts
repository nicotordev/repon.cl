import { clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "./lib/backend";

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/sign-in",
  "/auth/sign-in(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/sign-in", request.url).href;
  await auth.protect({
    unauthenticatedUrl: loginUrl,
  });

  const pathname = new URL(request.url).pathname;

  // API/trpc routes: no redirects, no user fetch. Handlers use getToken() and return JSON (e.g. 401).
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    return NextResponse.next();
  }

  // Prevent infinite loop: don't refetch user info if already on onboarding or login
  if (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/sign-in")
  ) {
    return NextResponse.next();
  }

  // cookies() is not async
  const cookiesStore = await cookies();

  const cookieHeader = Array.from(cookiesStore.getAll())
    .map(
      ({ name, value }: { name: string; value: string }) => `${name}=${value}`,
    )
    .join("; ");

  const userResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user`,
    {
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  // Defensive against errors and infinite loops
  if (!userResponse.ok) {
    // Not authenticated, redirect to login (if not already going there)
    return NextResponse.redirect(loginUrl);
  }

  const user = (await userResponse.json()) as User;

  // If onboarding not complete, and not already on onboarding page, redirect once
  if (user && user.onboardingCompleted === null) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
