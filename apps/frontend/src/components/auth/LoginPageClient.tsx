"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export function LoginPageClient() {
  const searchParams = useSearchParams();
  // Clerk usa redirect_url de la query cuando vienes del middleware; fallback si entras directo a sign-in
  const redirectUrl = searchParams.get("redirect_url");
  const fallback = redirectUrl ?? "/";

  return (
    <div className="w-full max-w-sm">
      <SignIn
        path="/auth/sign-in"
        withSignUp
        fallbackRedirectUrl={fallback}
      />
    </div>
  );
}
  