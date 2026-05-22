"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterSchema } from "@/lib/validators/auth";

/**
 * Server Action return shape consumed by `useFormState` in the client forms.
 *
 * `ok` is `false` on validation or auth failure; the message is safe to
 * surface inline. On success we `redirect()` and the action never returns.
 */
export type AuthFormState = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<"email" | "password" | "name", string>>;
} | null;

function readForm(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    name: (() => {
      const raw = formData.get("name");
      if (typeof raw !== "string") return undefined;
      const trimmed = raw.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    })(),
  };
}

type FieldErrors = Partial<Record<"email" | "password" | "name", string>>;

function zodFieldErrors(flat: {
  fieldErrors: Record<string, string[] | undefined>;
}): FieldErrors {
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(flat.fieldErrors)) {
    if (v && v.length > 0 && v[0] && (k === "email" || k === "password" || k === "name")) {
      out[k] = v[0];
    }
  }
  return out;
}

/**
 * Register a new user. On success: Supabase Auth fires `auth.users` insert,
 * the `handle_new_user` trigger (PLAN-1A migration) creates the matching
 * `public.users` row with `credits=20, role='user'`, then we redirect to
 * `/dashboard`.
 */
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = readForm(formData);
  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Lütfen formdaki hataları düzeltin.",
      fieldErrors: zodFieldErrors(parsed.error.flatten()),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Map Supabase errors to user-safe messages.
    const msg = error.message.toLowerCase();
    if (msg.includes("registered")) {
      return {
        ok: false,
        message: "Bu email adresi zaten kayıtlı. Giriş yapmayı dene.",
      };
    }
    return {
      ok: false,
      message: "Kayıt başarısız oldu. Lütfen tekrar dene.",
    };
  }

  redirect("/dashboard");
}

/**
 * Sign an existing user in via email+password. Generic error message on
 * failure — never leak whether the email exists.
 */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = readForm(formData);
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Lütfen formdaki hataları düzeltin.",
      fieldErrors: zodFieldErrors(parsed.error.flatten()),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "Geçersiz email veya şifre." };
  }

  redirect("/dashboard");
}
