# Credit Model & Discovery Limits — Locked Decisions

> Bu dosya bir session sırasında alınan bağlayıcı ürün/mimari kararları kaydeder.
> Tarih: 2026-05-26. Onaylayan: Yuşa.
> Implementasyon henüz başlamadı — bu sadece karar kaydı.

## 1. Locked decisions

| Karar | Değer |
|---|---|
| Free tier | 3 scan/ay, scan başına max 10 lead |
| Scan maliyeti | 0 credit (deterministik katman bedava) |
| Analiz maliyeti | 3 credit / işletme ("Tam analiz et" butonu) |
| Pro tier | $29/ay, 500 credit (~150 analiz) — Phase 5'te Stripe ile aktive |
| Mevcut 20-credit'li kullanıcılar | Dokunulmaz, beta için yeterli |
| Scan cap penceresi | Takvim ayı (her ayın 1'inde reset) |
| Pipeline hatası | Atomik refund + ai_usage'a `failed: true` log |

## 2. Pipeline split (CLAUDE.md §4 ile uyumlu)

**Scan'de otomatik & bedava (deterministik katman):**
1. Discovery — Google Places Nearby + field-masked Details
   - Fields: `place_id,name,formatted_phone_number,website,formatted_address,opening_hours,geometry,rating,user_ratings_total`
2. Enrichment — website fetch, SSL, mobil, form/CTA kontrolleri (AI'sız)
3. Gap rules — industry template matching (AI'sız)
4. Opportunity Score — deterministik 0-100 formül

→ Opportunities listesinde görünür: skor, gap sayısı, est value range, status.
→ Kullanıcı 3 credit harcamadan "hangi lead'i derin analiz etmeye değer" kararı verebilir.

**"Tam analiz et" (3 credit) açar:**

5. Gap AI summary
6. Score AI reasoning
7. Solution recommendation
8. Sales strategy (pitch + email + DM + WhatsApp + objections)
9. Build prompt
10. QA

→ `/dashboard/business/[id]` raporunun "magic moment" kısmı.

## 3. Implementation sırası (atomic commitler)

### Shipped in 2026-05-27 session

1. ✅ **DB migration:** `supabase/migrations/20260527000000_scan_caps.sql`
   - `users.monthly_scan_count` + `users.scan_count_period_start` (calendar-month window)
   - `reserve_scan_slot(p_user_id, p_cap)` RPC — atomic check + lazy reset + increment, admins bypass
   - `release_scan_slot(p_user_id)` RPC — refund on provider failure
   - `businesses.phone` zaten mevcut, ek migration gerekmedi
2. ✅ **Places Details entegrasyonu:** Zaten yapılmıştı — `searchText` v1 API tek çağrıda phone+website+hours dönüyor (`src/lib/discovery/providers/google-places.ts`)
3. ✅ **Scan cap enforcement:** `src/app/(dashboard)/dashboard/discovery/actions.ts`
   - `reserve_scan_slot` çağrısı scan job'dan önce
   - Provider hatasında `release_scan_slot` refund
   - `DiscoveryInput.maxResults` plumbing → Places `pageSize` (10 for free)
4. ✅ **Pre-scan UI:** `src/components/discovery/DiscoveryForm.tsx`
   - "Free plan · 2/3 scans left this month · up to 10 leads per scan" label
   - Cap exhausted → submit disabled + amber alert
   - Admin → "Admin · scan cap bypassed" message
5. ✅ **Opportunities scan rozeti + group-by toggle:**
   - `src/components/opportunities/OpportunityCard.tsx` — kart + "from: <scan>" rozeti
   - `src/components/opportunities/OpportunitiesView.tsx` — Flat / By scan toggle (client)
   - `loadLatestScanByBusiness` — her business için en yeni scan'i map'le

### Deferred until Phase 4 (AI Output)

6. ❌ **Credit gate refactor + "Tam analiz et" butonu:** AI pipeline (solution rec / sales / build prompt / QA) henüz inşa edilmedi. Bu PR'da kredi gate'i eklemek "para alıp boş sayfa göstermek" olurdu. Phase 4 PR'ında eklenecek:
   - `analyze_business` action: `decrement_user_credits(3)` → AI pipeline → fail ise refund
   - "Tam analiz et" butonu `/dashboard/business/[id]` sayfasında
   - Mevcut `runDeterministicIntelligenceForBusiness` (enrichment + gap + score) BEDAVA kalmaya devam eder

## 4. Açık konular (sonra)

- **Group-by scan görünümü:** Aynı işletme iki scan'de çıkarsa `(user_id, place_id)` unique olduğu için tek kayıt. Bu yüzden saf "scan altında grupla" yapısal değil — kart rozeti + filter toggle yeterli.
- **Pro tier aktivasyonu:** Stripe ile Phase 5'te. Şimdi sadece schema'da `plan` kolonu hazır olsun.
- **Cap aşımı UX:** Server action 402-equivalent error → UI'da "Upgrade to Pro" CTA'lı dialog.

## 5. Rationale (neden bu model)

User'ın ilk önerisi: 1 found = 1 credit, 20 found = 20 credit, free hesap → 1 scan.

Senior reddi: Bu model **ucuz olanı (Places API ~$0.37/scan) pahalı**, **pahalı olanı (8 katmanlı AI pipeline, ~$0.05-0.20/işletme) bedava** yapıyor. Sürdürülemez.

Doğru model: Discovery bedava (kullanıcıya değer önizlemesi) + Analysis pahalı (gerçek AI maliyeti). Bu hem CLAUDE.md §9 maliyet kontrolüyle hem de §4 "deterministik önce, AI sonra" prensibiyle birebir uyumlu.
