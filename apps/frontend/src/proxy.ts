import { clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { User } from "./lib/backend";

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/sign-in",
  "/auth/sign-in(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Use req.nextUrl.clone() for url manipulation
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/auth/sign-in";
  loginUrl.search = "";
  loginUrl.hash = "";

  await auth.protect({
    unauthenticatedUrl: loginUrl.href,
  });

  const pathname = req.nextUrl.pathname;
  // Prevent infinite loop: don't refetch user info if already on onboarding or login
  if (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/sign-in")
  ) {
    return NextResponse.next();
  }

  // cookies() is not async
  const headersStore = await headers();

  const userResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user`,
    {
      headers: {
        Cookie: headersStore.get("Cookie") ?? "",
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
    const onboardingUrl = req.nextUrl.clone();
    onboardingUrl.pathname = "/onboarding";
    onboardingUrl.search = "";
    onboardingUrl.hash = "";
    return NextResponse.redirect(onboardingUrl);
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
