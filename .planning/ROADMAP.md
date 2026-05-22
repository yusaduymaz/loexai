# Roadmap — LoexAI

**Version:** v1 (MVP)
**Date:** 2026-05-22
**Mode:** Vertical MVP — her faz çalışan bir kullanıcı değeri teslim eder

---

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Çalışan auth + DB altyapısı + landing | FOUND-01..08, LAND-01..03, DASH-01..04, ADM-01..03 | 5 |
| 2 | Lead Discovery | İlk işletme taraması + lead listesi | DISC-01..07, LEAD-01..04 | 5 |
| 3 | Intelligence Pipeline | Tam deterministik pipeline (enrichment → gap → score) | ENRICH-01..04, GAP-01..05, SCORE-01..06, COST-01..04 | 6 |
| 4 | AI Output | Satış varlıkları + build prompt + tam Business Report | SOL-01..04, SALES-01..05, BUILD-01..04, QA-01..04, REP-01..05 | 6 |
| 5 | SaaS Layer | Stripe + admin monitoring + production hardening | — (v2 scope) | 4 |

**Toplam:** 47 v1 gereksinimi, 5 faz

---

### Phase 1: Foundation — Auth, DB, Layout
**Goal:** Kullanıcı kayıt olup, giriş yapıp, korumalı dashboard'u görebilir. Tüm veritabanı tabloları ve RLS politikaları yerindedir. Upstash Workflow ve ai_usage altyapısı hazırdır.
**Mode:** mvp

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, LAND-01, LAND-02, LAND-03, DASH-01, DASH-02, DASH-03, DASH-04, ADM-01, ADM-02, ADM-03

**Success Criteria:**
1. Yeni bir kullanıcı `/register`'dan kayıt olabilir, email/şifre ile `/login`'den giriş yapabilir ve `/dashboard`'u görebilir
2. Kimliği doğrulanmamış kullanıcı `/dashboard` URL'sini açınca `/login`'e yönlendirilir
3. `users`, `businesses`, `business_enrichments`, `gap_analyses`, `opportunities`, `solution_recommendations`, `sales_strategies`, `build_prompts`, `scan_jobs`, `ai_usage` tabloları migration ile oluşturulmuştur ve RLS politikaları aktiftir
4. Yeni kullanıcının kredisi DB'de 20 olarak görünür; sidebar/header'da kredi bakiyesi görünür
5. `/admin` sayfası admin kullanıcı için açılır; `ai_usage` tablosu görüntülenebilir

**Plans:**
- PLAN-1A: Next.js 15 proje kurulumu, Supabase bağlantısı, `@supabase/ssr` auth middleware (FOUND-01..04, FOUND-08)
- PLAN-1B: Supabase migrations — tüm tablolar + RLS politikaları (FOUND-05..07 altyapısı, FOUND-08)
- PLAN-1C: Landing page + auth sayfaları (LAND-01..03)
- PLAN-1D: Dashboard layout + admin layout + Upstash Workflow provisioning (DASH-01..04, ADM-01..03, FOUND-06..07)

---

### Phase 2: Lead Discovery — Scan & Lead List
**Goal:** Kullanıcı konum + kategori + radius girerek Google Places üzerinden yerel işletme taraması yapabilir; sonuçlar kaydedilir, listelenir ve durumları yönetilebilir.
**Mode:** mvp

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, LEAD-01, LEAD-02, LEAD-03, LEAD-04

**Success Criteria:**
1. Kullanıcı "dentists in Istanbul, radius 2km" gibi bir arama yapabilir ve sonuçlar listede görünür
2. Aynı `place_id` + `user_id` kombinasyonu için ikinci tarama yeni kayıt oluşturmaz (deduplication)
3. Liste opportunity skoruna göre sıralanır; priority, kategori ve duruma göre filtre uygulanabilir
4. Tarama sırasında UI "Finding businesses... Analyzing gaps... Scoring..." gibi aşama bilgisi gösterir
5. Google Places 60 sonuç sınırına ulaşıldığında UI bunu açıkça belirtir; scan_job tablosunda log vardır

**Plans:**
- PLAN-2A: DiscoveryProvider interface + Google Places API implementasyonu (DISC-01, DISC-03)
- PLAN-2B: Scan form UI + kredi kontrolü + scan job yönetimi (DISC-02, DISC-04, DISC-05, DISC-06, DISC-07)
- PLAN-2C: Lead list sayfası + filtreler + durum yönetimi + CSV export (LEAD-01..04)

---

### Phase 3: Intelligence Pipeline — Enrichment → Gap → Score
**Goal:** Keşfedilen her işletme için deterministik enrichment, industry-template tabanlı gap analizi ve 0-100 opportunity skoru hesaplanır. Null-propagation kuralı ve cost circuit breaker aktiftir.
**Mode:** mvp

**Requirements:** ENRICH-01, ENRICH-02, ENRICH-03, ENRICH-04, GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06, COST-01, COST-02, COST-03, COST-04

**Success Criteria:**
1. Bir işletme için enrichment çalışınca `business_enrichments` tablosu dolar; aynı işletme için yeniden çalıştırıldığında kayıt güncellenir (idempotent)
2. Enrichment başarısız olduğunda (website erişilemiyor) ilgili alanlar `null`/`"unknown"` olarak kaydedilir; gap analizi null upstream fields ile çalıştırılmaz
3. Klinik, kafe/restoran ve güzellik salonu/berber için industry template'leri çalışır; doğru gap kategorileri tespit edilir
4. Her işletme için 0-100 opportunity skoru ve priority label (`low`/`medium`/`high`/`urgent`) hesaplanır
5. Bir pipeline aşaması hata verdiğinde diğer aşamalar devam eder (kısmi sonuç kaydedilir); pipeline tümden çökmez
6. Max 2 AI retry per stage uygulanır; kullanıcı kredisi 5'e düşünce uyarı gösterilir, 0'da tarama engellenir

**Plans:**
- PLAN-3A: Upstash Workflow pipeline iskeleti + null-propagation kuralı + error-classifier (ENRICH-01..04, GAP-05, COST-01..02)
- PLAN-3B: Deterministik enrichment implementasyonu (website fetch, SSL, mobile, form, CTA kontrolü) (ENRICH-01..04)
- PLAN-3C: Industry gap templates (klinik, kafe, güzellik) + gap analysis runner (GAP-01..04)
- PLAN-3D: Deterministik opportunity scoring engine + AIProvider interface + AI reasoning için OpenRouter implementasyonu (SCORE-01..06, COST-03..04)

---

### Phase 4: AI Output — Sales Strategy, Build Prompt, Report
**Goal:** Her analiz edilmiş işletme için AI-üretilen satış varlıkları (cold email, pitch, build prompt) ve tam Business Report sayfası teslim edilir. QA katmanı aktiftir.
**Mode:** mvp

**Requirements:** SOL-01, SOL-02, SOL-03, SOL-04, SALES-01, SALES-02, SALES-03, SALES-04, SALES-05, BUILD-01, BUILD-02, BUILD-03, BUILD-04, QA-01, QA-02, QA-03, QA-04, REP-01, REP-02, REP-03, REP-04, REP-05

**Success Criteria:**
1. Bir işletme için `/dashboard/business/[id]` sayfası açıldığında Score + Gaps hemen yüklenir; Solution + Cold Email 3-5 saniye içinde async yüklenir; Build Prompt fold altında yüklenir
2. Cold email'in içeriği yalnızca gerçek enrichment verisine dayanır; hallucinate edilmiş gap içermez
3. Build prompt Claude/Cursor'a yapıştırıldığında işletme bağlamını doğru aktarır
4. QA katmanı `confidence < 0.7` durumunda rapor sayfasında uyarı banner'ı gösterir; raporu gizlemez
5. Her metin bloğu (cold email, pitch, build prompt) için tek tıkla kopyala çalışır
6. Business Report PDF olarak export edilebilir

**Plans:**
- PLAN-4A: AIProvider interface + Anthropic implementasyonu + solution recommendation (SOL-01..04)
- PLAN-4B: Sales strategy generation (cold email, pitch, value proposition, objection handling) (SALES-01..05)
- PLAN-4C: Build prompt generation (Claude/Cursor target) (BUILD-01..04)
- PLAN-4D: QA layer (hallucination check, confidence score) (QA-01..04)
- PLAN-4E: Business Report sayfası (tam UI assembly, async loading, copy, PDF export, status) (REP-01..05)

---

### Phase 5: SaaS Layer — Stripe, Admin, Monitoring
**Goal:** Stripe faturalama + plan katmanları aktif edilir. Admin paneli AI maliyet takibi ve scan job monitoring ile tamamlanır. Production hardening yapılır.
**Mode:** mvp

**Requirements:** (v2 scope — Stripe entegrasyonu, plan katmanları, gelişmiş admin)

**Success Criteria:**
1. Kullanıcı Stripe üzerinden ödeme yaparak kredi satın alabilir
2. Admin paneli günlük/kullanıcı bazında AI token maliyetini gösterir
3. Scan job monitoring: çalışan, tamamlanan, hata veren job'lar admin'de görünür
4. Error logging: kritik pipeline hataları (DLQ'ya düşen step'ler) admin'e raporlanır

**Plans:**
- PLAN-5A: Stripe webhook + kredi satın alma akışı
- PLAN-5B: Admin monitoring dashboard (ai_usage, scan_jobs, error log)

---

## Milestone Map

| Milestone | End of Phase | What Works |
|-----------|-------------|------------|
| M1: Foundation | Phase 1 | Auth + DB + layout |
| M2: First Lead | Phase 2 | Scan yapılabilir, lead listesi görünür |
| M3: Intelligence | Phase 3 | Enrichment + Gap + Score çalışır |
| **M4: MVP** | Phase 4 | Tam magic moment: scan → score → cold email → build prompt |
| M5: SaaS | Phase 5 | Stripe fatura, admin monitoring |

---

## Dependency Map

```
Phase 1 (Foundation)
  └─ Phase 2 (Discovery) — DB + auth olmadan scan kaydedilemez
       └─ Phase 3 (Pipeline) — Scan'sız enrichment çalıştırılacak işletme yok
            └─ Phase 4 (AI Output) — Score + gaps olmadan AI çıktı üretemez
                 └─ Phase 5 (SaaS) — Çalışan ürün olmadan faturalandırma anlamsız
```
