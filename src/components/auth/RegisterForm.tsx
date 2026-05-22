"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { registerAction, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthFormState = null;

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-stack-md" noValidate>
      <div className="flex flex-col gap-stack-xs">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state?.fieldErrors?.email) || undefined}
          aria-describedby={
            state?.fieldErrors?.email ? "register-email-error" : undefined
          }
          placeholder="you@example.com"
        />
        {state?.fieldErrors?.email ? (
          <p
            id="register-email-error"
            role="alert"
            className="text-body-sm text-error"
          >
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-stack-xs">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(state?.fieldErrors?.password) || undefined}
          aria-describedby={
            state?.fieldErrors?.password
              ? "register-password-error"
              : "register-password-help"
          }
          placeholder="At least 8 characters"
        />
        {state?.fieldErrors?.password ? (
          <p
            id="register-password-error"
            role="alert"
            className="text-body-sm text-error"
          >
            {state.fieldErrors.password}
          </p>
        ) : (
          <p
            id="register-password-help"
            className="text-body-sm text-on-surface-variant/80"
          >
            Minimum 8 characters.
          </p>
        )}
      </div>

      {state?.message ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/20 px-stack-md py-stack-sm text-body-sm text-error"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Create account" />

      <p className="text-center text-body-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
      {pending ? "Working…" : label}
    </Button>
  );
}
