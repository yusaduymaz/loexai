"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthFormState = null;

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);

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
            state?.fieldErrors?.email ? "login-email-error" : undefined
          }
          placeholder="you@example.com"
        />
        {state?.fieldErrors?.email ? (
          <p
            id="login-email-error"
            role="alert"
            className="text-body-sm text-error"
          >
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-stack-xs">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <span
            aria-disabled="true"
            className="cursor-not-allowed text-body-sm text-on-surface-variant/60"
            title="Password reset will be available in Phase 2"
          >
            Forgot password?
          </span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          aria-invalid={Boolean(state?.fieldErrors?.password) || undefined}
          aria-describedby={
            state?.fieldErrors?.password ? "login-password-error" : undefined
          }
          placeholder="At least 8 characters"
        />
        {state?.fieldErrors?.password ? (
          <p
            id="login-password-error"
            role="alert"
            className="text-body-sm text-error"
          >
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state?.message ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/20 px-stack-md py-stack-sm text-body-sm text-error"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Log in" />

      <p className="text-center text-body-sm text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
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
