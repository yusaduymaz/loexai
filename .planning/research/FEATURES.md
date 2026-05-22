# Features Research — LoexAI

**Domain:** Local Business Opportunity Intelligence Platform
**Researched:** 2026-05-22
**Overall Confidence:** HIGH (cross-verified across multiple sources)

---

## Table Stakes (must have)

Features users expect. Missing = users leave immediately or never trust the product.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Business search by location + category | Core function — no search, no product | Low | Google Places API or equivalent; radius filter mandatory |
| Per-business detail report page | Users need a single "source of truth" per lead | Medium | The "magic moment" page — see section below |
| Digital presence snapshot | Has website? Mobile-friendly? SSL? Social? | Low | Deterministric checks, no AI — fast and cheap |
| Opportunity score (0–100) with priority label | Agencies need to triage dozens of leads fast | Low | Deterministic scoring; AI only for the reasoning text |
| Gap list per business | Concrete list of what's missing — anchors the pitch | Low | Rule-based; industry template-driven |
| At least one pitch asset (cold email or DM) | Users came here to reach out — give them something to send | Medium | AI-generated, grounded in observed gaps only |
| Lead list / saved leads view | Users need to manage a pipeline across sessions | Low | Table + filters; status badges (New → Won/Lost) |
| Credit visibility | Users must always know how many credits they have left | Low | Header badge or sidebar — always visible |
| Search history / scan jobs | Users re-open past scans; they do not re-run everything | Low | Scan job log with status, location, category, date |
| Empty state guidance | First-time user sees blank dashboard → they churn | Low | Pre-populate with a demo scan result OR a CTA-first empty state |
| Export (at minimum copy-to-clipboard or PDF) | Users share findings with clients or paste into CRM | Low | PDF for pitches; CSV for bulk lead lists |
| Auth + secure account | Industry standard | Low | Supabase Auth; RLS mandatory |

---

## Differentiators (competitive advantage)

Features that make LoexAI stand out. Not expected by users on arrival, but drive retention and word-of-mouth.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Industry-aware gap templates | Generic audit tools miss context — a clinic and a cafe have different digital needs | Medium | 3–5 industry templates at MVP; extensible |
| Opportunity score WITH AI reasoning | Score alone is data. Score + "why this business is urgent" is intelligence | Medium | Hybrid: deterministic score, AI-generated rationale |
| Solution recommendation tied to gaps | Tells freelancers not just WHAT is missing but WHAT TO SELL | Medium | Primary + secondary + upsell offers per business |
| Multi-channel sales asset generation | Cold email + WhatsApp DM + Instagram DM in one click | High | Tone rules enforced in prompts — not generic spam |
| Build prompt for Cursor/Claude | No competitor does this — converts opportunity into a dev-ready brief | High | Unique moat; appeals to AI-builder segment |
| Observed-fact-grounded AI output | AI explicitly separates fact vs inference vs opportunity | Medium | Eliminates hallucination risk; builds trust with power users |
| Pipeline status tracking per lead | New → Analyzed → Contacted → Proposal Sent → Won/Lost | Low | Light CRM-like UX; does not try to be HubSpot |
| QA confidence score on AI output | Shows users how confident the system is in its analysis | Medium | Reduces "is this AI making stuff up?" anxiety |
| Batch / queue-based scanning | Users want to scan 50 businesses, not one at a time | High | Upstash QStash; job progress shown in UI |

---

## Anti-Features (deliberately NOT build)

Things that would harm the product — either by diluting focus, creating legal risk, or misleading users.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social media scraping (Instagram, Facebook, TikTok) at MVP | ToS violation risk; data quality unpredictable; maintenance burden | Mark social presence as "detected / not detected" from Places data only; deep social scraping is Phase 2+ with dedicated risk assessment |
| Automated outreach / email sending | Instantly.ai does this; competing there is a distraction AND creates spam risk | Generate the copy, let users send it — own the intelligence layer, not the delivery layer |
| Full CRM (tasks, pipelines, team notes, reminders) | HubSpot and Pipedrive are not beatable here; scope creep kills focus | Provide status tags per opportunity; link out to CRM if users need more |
| Team collaboration / multi-seat at MVP | Complex auth model, support burden, pricing complexity | Single-user MVP; team features Phase 3+ |
| White-label at MVP | Premature; adds infrastructure complexity before product-market fit | Plan the architecture to allow it later; do not build the UI |
| "Score everything" premium tier locks | Locking the score itself behind a paywall creates distrust | Free tier limits scans per month, not insight depth per scan |
| Generic "AI insights" with no grounding | If AI output is not anchored to real observed data, users lose trust fast | Enforce observedFact / inference / opportunity separation in all AI prompts |
| Percentage-of-deal pricing | Misaligns incentives, confusing billing | Flat credit model only |

---

## Magic Moment Analysis

**What the "aha moment" should be:**

A user searches for "dentists in Austin, TX" — within 90 seconds they see a list of 10 businesses with opportunity scores. They click the highest-scored one and land on a Business Report page that shows: no website, 4.8 stars with 120 Google reviews, missing booking system, missing WhatsApp CTA. The page displays a recommended solution ("Build a clinic website with appointment booking — estimated $800–1,500"), a cold email ready to copy, and a build prompt ready to paste into Cursor.

The user thinks: "I just found a business that needs exactly what I can build, I know what to charge, I have the pitch, and I have the brief. I didn't have to research anything."

**That is the magic moment.** It lives entirely on `/dashboard/business/[id]`.

**How to get users there fast:**

- Onboarding must flow directly to the discovery form — no feature tour before value
- First scan should return results in under 30 seconds (Places API is fast; batch enrichment runs in background)
- The Business Report page must load with at least Opportunity Score + Gap List immediately; Sales Strategy and Build Prompt can load asynchronously below the fold
- Demo scan pre-loaded for users who do not want to enter their own location first — show the magic moment before asking for commitment

**Reference benchmarks:**
- Hunter.io: median 6 minutes from signup to first exported email
- Instantly.ai: campaign live in under 1 hour
- My Web Audit: audit generated in under 60 seconds
- LoexAI target: first Business Report with Score + Gaps + Cold Email in under 2 minutes from signup

---

## UX Patterns (from leading tools)

### Opportunity / Lead List View (reference: Apollo.io, Semrush Lead Finder)

- Table with sortable columns: Business Name, Category, Location, Opportunity Score, Priority Badge, Status
- Priority badge uses color: green (low), amber (medium), red (high/urgent) — matches LoexAI color direction
- Quick-filter by priority, category, status — no complex filter UI at MVP
- Click row → Business Report page (not a modal)
- Bulk select for export or status change

### Business Report Page (reference: My Web Audit, BrightLocal, Insites)

- Hero section: business name, address, Google rating, review count, category
- Score ring / gauge at top-right: the number is the first thing the eye lands on
- Gap list as a checklist with severity icons — each gap is a concrete, named problem
- AI sections (Solution, Sales Strategy, Build Prompt) in clearly labeled cards with a "AI generated" label and confidence badge
- Each AI text block has a one-click copy button
- Export CTA in a sticky footer or top-right: "Export PDF" and "Copy All"
- Status selector at top: New → Contacted → Won / Lost

### Credit Consumption UX (reference: AI SaaS best practices)

- Credit balance always visible in the sidebar or header — never hidden
- Before a scan is triggered, show "This scan will cost X credits" in the confirmation step
- Credit deduction happens after results arrive, not on job start — reduces "I paid and got nothing" anxiety
- Low-credit warning at 20% remaining: inline banner, not a modal interrupt
- Predictive depletion notice: "At your current rate, credits run out in ~3 days"
- Credit history page: per-scan log with business name, credits consumed, date

### Empty State (first-time user)

- Do NOT show empty charts or tables — show a CTA-first empty state
- Pattern: illustration + headline ("Find your first opportunity") + single primary button ("Start a scan")
- Alternatively: pre-load a demo scan result with a dismissible "This is sample data" banner
- Onboarding checklist in sidebar: 3 steps max — (1) Run first scan, (2) View a report, (3) Copy your first pitch

### Report Export

- PDF: full Business Report formatted for sharing with a client or keeping as a record
- CSV: lead list with core fields (name, category, location, score, priority, gaps count, status)
- Copy-to-clipboard: individual sections (cold email, DM, build prompt) — single button per block
- No auto-send integration at MVP — users copy and paste into their own tools

---

## Onboarding Critical Path

Target: signup → first actionable insight in under 5 minutes (stretch: under 2 minutes).

```
1. Signup (email + password OR Google OAuth)
   ↓
2. Redirect to /dashboard with empty state
   — Show onboarding checklist: "Step 1: Run your first scan"
   — OR: show pre-loaded demo scan with "See a live example →"
   ↓
3. Discovery form (location + category + radius)
   — 3 fields only. No advanced options at first.
   — "Start Scan" button shows credit cost: "This will use 1 credit (19 remaining)"
   ↓
4. Scan running → progress indicator (not a spinner — show: Finding businesses... Analyzing gaps... Scoring opportunities...)
   — Takes 20–45 seconds for 10 results
   ↓
5. Results list → sorted by Opportunity Score descending
   — First result is automatically the highest-scored business
   ↓
6. Click highest-scored result → Business Report page
   — Score + Gaps + Priority load immediately (deterministic, fast)
   — Solution + Cold Email loads within 3–5 seconds (AI, async)
   — Build Prompt loads last (AI, async, below fold)
   ↓
7. AHA MOMENT: User copies the cold email or build prompt
```

**What to strip from onboarding:**
- No product tour before first value
- No "set up your profile" gate
- No welcome checklist with 7+ steps
- No modal asking for use case before showing the product

Research benchmark: three-step onboarding tours have 72% completion; seven-step tours have 16% completion.

---

## Credit/Usage UX Patterns

**Core principle:** credits should feel like a resource the user manages, not a penalty they hit unexpectedly.

### Always-visible balance
- Sidebar or top navigation: "Credits: 14" with a subtle color shift below 5 (amber → red)
- Clicking the balance opens a usage history drawer, not a pricing page

### Pre-scan confirmation
- Before running a scan: "This scan costs 1 credit. You have 14 remaining. Continue?"
- Wording: confirmatory, not alarming
- Include a link: "What uses credits?" → simple tooltip or modal explaining the credit model

### Post-scan feedback
- After a scan completes: "Used 1 credit. 13 remaining."
- Inline, dismissible — not a modal

### Low-credit warning
- At 5 credits (25% of starting 20): amber banner in dashboard header — "Running low on credits. Upgrade to continue scanning."
- Not a wall — user can still run scans until 0
- At 0 credits: block scan trigger, show upgrade CTA with clear benefit framing ("Get 100 credits for $X")

### Credit history
- `/dashboard/settings` or `/dashboard/usage`: table of every credit spend — date, scan location, category, credits used, result count
- No credit expires at MVP (simplify billing logic)

### AI usage transparency (admin-side, not user-facing)
- `ai_usage` table logs model, tokens, cost per business per pipeline stage
- Admin panel shows aggregate cost per day/user — enables pricing calibration
- Users do NOT see raw token costs — they see credits only

### Free tier communication
- "20 free credits" framing on signup and landing page
- Each credit = "one full business analysis" — never expose internal complexity (8 pipeline stages, token counts)
- Upgrade page uses credit-to-result framing: "100 credits = 100 full business reports"

---

## MVP Feature Priority

**Build first (blocking everything else):**
1. Lead discovery form + Google Places integration
2. Business detail report page (the magic moment)
3. Deterministic enrichment (website check, SSL, mobile, social presence)
4. Gap analysis with industry templates (clinic, cafe, beauty salon at minimum)
5. Opportunity scoring (deterministic 0–100 + priority label)
6. AI reasoning for score + solution recommendation + cold email
7. Credit system (check before scan, deduct after, always-visible balance)
8. Lead list with sort/filter + status tags

**Build second (retention drivers):**
9. Build prompt generation (the unique differentiator for AI-builder segment)
10. QA layer with confidence score
11. PDF export of Business Report
12. CSV export of lead list
13. Scan job history

**Defer (Phase 2+):**
- Batch scanning (queue-based, 50+ businesses)
- Multi-channel outreach asset (WhatsApp DM, Instagram DM in addition to cold email)
- White-label reports
- Team/multi-seat
- Stripe billing + plan tiers
- Advanced analytics dashboard
- Social media enrichment

---

## Sources

- Apollo.io features and UX case study: https://medium.com/@porwalanubha99/ux-case-study-apollo-io-4471cb0ed3e8
- Semrush Lead Finder for agencies: https://www.semrush.com/agencies/lead-generation/
- My Web Audit audit-to-pitch workflow: https://www.mywebaudit.com/
- BrightLocal white-label reporting: https://www.brightlocal.com/white-label-seo-tools-reports/
- Instantly.ai review (what makes it work): https://www.breakcold.com/blog/instantly-ai-review
- SaaS time-to-value benchmarks: https://www.chameleon.io/blog/time-to-value-ttv
- Aha moment onboarding guide: https://www.appcues.com/blog/aha-moment-guide
- Onboarding activation research (3-step vs 7-step tours): https://foundey.com/blog/saas-onboarding-ux
- AI SaaS credit UX patterns: https://colorwhistle.com/ai-saas-credits-system/
- Enki Prospect (closest competitor): https://enkiprospect.vercel.app/
- Prospecting tools for digital agencies comparison: https://almcorp.com/blog/prospecting-tools-for-digital-agencies/
- Feature bloat avoidance: https://www.ratomir.com/blog/why-feature-bloat-kills-saas-products-and-how-to-prevent-it-without-upsetting-customers/
- LocalAuditPro (local competitor reference): https://localauditpro.com/
- Local SEO audit tools for agencies 2026: https://faithamaole.com/5-local-seo-audit-tools-every-agency-in-2026/
