import { NextResponse } from "next/server";
import { getHealthSnapshot } from "@/lib/observability/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = getHealthSnapshot();

  return NextResponse.json(
    snapshot,
    {
      status: snapshot.status === "ok" ? 200 : 503,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
