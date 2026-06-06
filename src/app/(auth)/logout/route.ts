import { redirect } from "next/navigation";

// POST: legacy form-based logout (no longer used by UI, kept for safety)
export async function POST() {
  redirect("/login");
}

// GET: handles Clerk handshake redirect-back after a sign-out attempt
export async function GET() {
  redirect("/login");
}
