import "server-only";

import type { WebsiteProbe } from "@/lib/intelligence/types";

const FETCH_TIMEOUT_MS = 8000;

export async function probeWebsite(website: string | null): Promise<WebsiteProbe> {
  if (!website) {
    return emptyProbe("unknown", null, null);
  }

  const normalizedUrl = normalizeUrl(website);
  const started = Date.now();

  try {
    const response = await fetch(normalizedUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": "LoexAI/0.1 deterministic-intelligence",
        accept: "text/html,application/xhtml+xml",
      },
    });

    const responseTimeMs = Date.now() - started;
    const finalUrl = response.url || normalizedUrl;
    const html = response.ok ? await response.text() : "";
    const lower = html.toLowerCase();

    if (!response.ok) {
      return {
        ...emptyProbe(response.status === 403 ? "blocked" : "fetch_failed", finalUrl, response.status),
        responseTimeMs,
      };
    }

    return {
      status: "ok",
      finalUrl,
      statusCode: response.status,
      hasSsl: finalUrl.startsWith("https://"),
      title: matchMeta(html, /<title[^>]*>(.*?)<\/title>/is),
      description: matchMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/is),
      hasViewportMeta: /<meta[^>]+name=["']viewport["']/i.test(html),
      hasContactSignal: containsAny(lower, ["contact", "iletisim", "iletişim", "phone", "tel:"]),
      hasBookingSignal: containsAny(lower, ["book", "reserve", "reservation", "randevu", "appointment"]),
      hasWhatsappSignal: containsAny(lower, ["whatsapp", "wa.me", "api.whatsapp.com"]),
      hasSocialSignal: containsAny(lower, ["instagram.com", "facebook.com", "linkedin.com", "tiktok.com"]),
      responseTimeMs,
      evidence: [
        { type: "website_fetch", url: finalUrl, statusCode: response.status, responseTimeMs },
      ],
    };
  } catch (error) {
    const status = error instanceof DOMException && error.name === "TimeoutError"
      ? "timeout"
      : "fetch_failed";

    return emptyProbe(status, normalizedUrl, null);
  }
}

function emptyProbe(
  status: WebsiteProbe["status"],
  finalUrl: string | null,
  statusCode: number | null,
): WebsiteProbe {
  return {
    status,
    finalUrl,
    statusCode,
    hasSsl: finalUrl ? finalUrl.startsWith("https://") : null,
    title: null,
    description: null,
    hasViewportMeta: false,
    hasContactSignal: false,
    hasBookingSignal: false,
    hasWhatsappSignal: false,
    hasSocialSignal: false,
    responseTimeMs: null,
    evidence: [{ type: "website_fetch", url: finalUrl, status }],
  };
}

function normalizeUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function containsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function matchMeta(html: string, regex: RegExp) {
  const match = html.match(regex);
  return match?.[1]?.replace(/\s+/g, " ").trim() || null;
}
