/**
 * /admin/templates — ADM-03 view-only minimum.
 *
 * Phase 1 ships a static list mirroring the industry templates documented in
 * CLAUDE.md §7.3 (klinik / kafe / güzellik salonu). Real DB-backed templates
 * with editing land in Phase 5.
 *
 * Source of truth for these gap definitions: CLAUDE.md §7.3. If a template
 * lands in code (Phase 3 `lib/templates/`), THAT becomes the source — this
 * page should switch to reading from there, not from this constant.
 */
const TEMPLATES: Array<{
  industry: string;
  description: string;
  gaps: string[];
}> = [
  {
    industry: "Klinik",
    description: "Medical and dental clinics — trust-driven local SEO.",
    gaps: [
      "Modern website",
      "Online appointment form",
      "WhatsApp CTA",
      "Doctor profiles",
      "Treatment pages",
      "Trust signals (reviews, accreditations)",
      "Google Maps embed",
      "Local SEO landing pages",
    ],
  },
  {
    industry: "Kafe / Restoran",
    description: "Cafes and restaurants — discovery + reservation funnel.",
    gaps: [
      "QR menu",
      "Mobile-friendly online menu",
      "Website with hours and location",
      "Instagram gallery integration",
      "Review funnel (Google + TripAdvisor)",
      "Reservation CTA",
    ],
  },
  {
    industry: "Güzellik Salonu / Berber",
    description: "Beauty salons and barbers — appointment booking + portfolio.",
    gaps: [
      "Booking system",
      "Service list with prices",
      "Before/after photo gallery",
      "WhatsApp booking",
      "Staff profiles",
      "Instagram-to-booking conversion path",
    ],
  },
];

export default function AdminTemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <h1 className="text-2xl font-semibold text-on-background">Industry Templates</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gap detection templates per industry (read-only in Phase 1; editing lands in Phase 5).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => (
          <article
            key={t.industry}
            className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg"
          >
            <h2 className="text-lg font-semibold text-on-surface">{t.industry}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t.description}</p>
            <ul className="mt-stack-md flex flex-col gap-1.5">
              {t.gaps.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2 text-sm text-on-surface"
                >
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {g}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
