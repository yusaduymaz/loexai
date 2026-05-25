// Auth is handled by Clerk prebuilt components in /login and /register.
// These no-op actions keep the old custom form components type-safe while
// they are no longer rendered by the auth pages.
export type AuthFormState = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<"email" | "password" | "name", string>>;
} | null;

export async function loginAction(): Promise<AuthFormState> {
  return {
    ok: false,
    message: "Login is handled by Clerk.",
  };
}

export async function registerAction(): Promise<AuthFormState> {
  return {
    ok: false,
    message: "Signup is handled by Clerk.",
  };
}
