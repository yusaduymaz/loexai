import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

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
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#102034",
              colorInputBackground: "#0b1c30",
              colorText: "#d3e4fe",
              colorTextSecondary: "#c2c6d8",
              colorPrimary: "#0066ff",
              colorInputText: "#d3e4fe",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "shadow-none bg-transparent",
              rootBox: "w-full",
            },
          }}
        />
      </div>
    </AuthShell>
  );
}
