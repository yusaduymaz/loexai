import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Log in — LoexAI",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue building your pipeline."
    >
      <div className="flex justify-center">
        <SignIn
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
