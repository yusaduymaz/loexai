/**
 * Landing page placeholder.
 *
 * Full landing (Hero / Problem / How It Works / Pricing / FAQ / CTA) is
 * implemented in PLAN-1C. This placeholder exists so that the dev server
 * has a 200 response at `/` immediately after PLAN-1A.
 */
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-margin-mobile md:px-margin-desktop">
      <div className="max-w-2xl text-center space-y-stack-md">
        <p className="font-label-caps text-xs uppercase tracking-wider text-primary">
          LoexAI · Phase 1 Foundation
        </p>
        <h1 className="font-headline-lg text-4xl md:text-5xl font-semibold text-on-surface">
          Find local businesses that actually need your services.
        </h1>
        <p className="font-body-lg text-on-surface-variant">
          Landing page PLAN-1C&apos;de tamamlanacak. Şu an iskelet hazır: Next.js
          15 + Tailwind + DESIGN.md token&apos;ları + Supabase SSR auth.
        </p>
      </div>
    </main>
  );
}
