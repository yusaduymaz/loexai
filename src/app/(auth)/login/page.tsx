import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Log in — LoexAI",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with Clerk to continue building your pipeline."
    >
      <div className="flex justify-center">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </AuthShell>
  );
}
