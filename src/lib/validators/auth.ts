import { z } from "zod";

/**
 * Zod schemas for auth flows.
 *
 * Password policy: min 8 chars — matches Supabase default. We can tighten
 * later (uppercase, digit, symbol) once the UI design accommodates the
 * helper text.
 */

export const LoginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  name: z.string().min(1).max(80).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
