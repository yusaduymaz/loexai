import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Create account — LoexAI",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Clerk handles signup and session security. Your LoexAI profile is created on first dashboard load."
    >
      <div className="flex justify-center">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </AuthShell>
  );
}
