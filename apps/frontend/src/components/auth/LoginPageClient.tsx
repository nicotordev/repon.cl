"use client";

import { SignIn } from "@clerk/nextjs";

export function LoginPageClient() {
  return (
    <div className="w-full max-w-sm">
      <SignIn path="/auth/sign-in" withSignUp />
    </div>
  );
}
