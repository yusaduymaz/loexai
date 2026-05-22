# LoexAI — Local Opportunity Engine AI

## What This Is

LoexAI, yerel işletmeleri keşfeden, dijital zayıflıklarını analiz eden, satış stratejisi üreten ve geliştiriciler/ajanslar için uygulamaya hazır build planları oluşturan bir **opportunity intelligence platform**'udur. Hedef kullanıcılar freelancer'lar, dijital pazarlama ajansları, AI automation builder'lar ve yerel işletme danışmanlarıdır. Platform, ham yerel işletme verisini → eyleme dönüştürülebilir dijital servis fırsatlarına çevirir.

## Core Value

"Hangi yerel işletmeye ulaşmalıyım, ona ne satmalıyım, neden ihtiyacı var ve nasıl inşa etmeliyim?" sorusunu tek platformda yanıtlamak — doğru işletme, doğru problem, doğru teklif, doğru pitch, doğru build planı.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page: Hero, Problem, How It Works, Pricing, FAQ, CTA
- [ ] Auth: Supabase auth, register/login/logout
- [ ] Dashboard layout: sidebar, overview kartları
- [ ] Admin panel: kullanıcı yönetimi, AI usage takibi
- [ ] Lead Discovery: konum + kategori + radius formu, DiscoveryProvider entegrasyonu
- [ ] Business Enrichment: deterministik website analizi (SSL, mobile, forms, CTA)
- [ ] Digital Gap Analysis: industry template + rule-based + AI özet
- [ ] Opportunity Scoring: deterministik 0-100 skoru + AI gerekçe
- [ ] Solution Recommendation: AI-üretilen satılabilir çözüm teklifleri
- [ ] Sales Strategy: pitch, cold email, DM, WhatsApp mesajı üretimi
- [ ] Build Prompt: Claude/Cursor için uygulamaya hazır prompt üretimi
- [ ] QA: hallucination ve tutarlılık kontrolü
- [ ] Business Report sayfası: pipeline çıktılarının tek sayfada sunumu
- [ ] Kredi sistemi: kullanıcı başına 20 kredi varsayılan, backend kontrolü
- [ ] AI usage logging: ai_usage tablosuna token & maliyet kaydı

### Out of Scope

- Tam CRM otomasyonu — Phase 2+ eklenir
- Otomatik outreach / email gönderimi — MVP dışı
- Takım çalışması / white-label — Phase 5+ sonrası
- Stripe katmanlı faturalama — Phase 5 (Stripe entegrasyonu)
- Sosyal medya scraping (Instagram, Facebook, Yelp) — ToS riski, Phase 2+ opsiyonel
- Gelişmiş analytics dashboard — MVP sonrası

## Context

- **Mimari:** Hybrid system — deterministik önce, AI sonra. Hiçbir şeyi gereksiz LLM'e yükleme.
- **AI soyutlaması:** `AIProvider` interface ile: dev/test'te OpenRouter ücretsiz modeller, prod'da Anthropic Claude API.
- **Discovery soyutlaması:** `DiscoveryProvider` interface ile: Google Places API (öncelikli), RapidAPI Maps (fallback).
- **Background jobs:** Upstash QStash (queue) + Redis (cache + rate limit).
- **Maliyet kontrolü:** Cache-first (Upstash Redis), token usage logu (ai_usage tablosu), kredi kontrolü pipeline öncesi.
- **Veri modeli:** Supabase PostgreSQL + RLS. Migration'lar `supabase/migrations/` klasöründe.
- **Wiki:** `wiki/` dizininde kavramsal notlar, kararlar ve entity açıklamaları mevcuttur.

## Constraints

- **Tech Stack**: Next.js 15+ (App Router), TypeScript strict, Tailwind, shadcn/ui, Framer Motion — kesin seçildi
- **Backend**: Supabase (Auth, DB, Storage, Edge Functions) — kesin seçildi
- **AI Provider**: OpenRouter (dev) / Anthropic Claude API (prod) — interface ile soyutlanmış
- **MVP Kapsamı**: 8 katmanlı pipeline tamamen çalışır olmalı; Stripe ve takım özellikleri sonraya
- **Güvenlik**: API anahtarları sadece sunucu tarafında; Supabase RLS zorunlu; tüm AI çıktıları Zod ile doğrulanır

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid system (deterministik önce, AI sonra) | Token maliyeti ve tutarlılık — deterministik veri AI çağrısı gerektirmez | — Pending |
| AIProvider interface soyutlaması | Dev'de ücretsiz, prod'da premium; tek env değişikliği ile geçiş | — Pending |
| DiscoveryProvider interface soyutlaması | Google Places öncelikli, RapidAPI fallback; provider çökmesi projeyi çökmez | — Pending |
| Supabase RLS zorunlu | Kullanıcılar sadece kendi verisini görür | — Pending |
| JSON çıktılar Zod ile doğrulanır | AI hallucination kontrolü; doğrulama başarısızsa retry | — Pending |
| `supabase/migrations/` tek source of truth | Şema yalnızca migration'lardan çalışır | — Pending |
| Upstash Redis cache + QStash queue | Pipeline maliyetini düşürür; HTTP request içinde bloklama yok | — Pending |

## Evolution

Bu belge faz geçişlerinde ve milestone sınırlarında güncellenir.

**Her faz geçişinden sonra** (`/gsd-transition` ile):
1. Geçersizleşen gereksinimler → Out of Scope'a taşı (neden ile)
2. Doğrulanan gereksinimler → Validated'a taşı (faz referansı ile)
3. Yeni gereksinimler ortaya çıktıysa → Active'e ekle
4. Kararlar loglandı mı → Key Decisions'a ekle
5. "What This Is" hâlâ doğru mu → Güncelle

**Her milestoneden sonra** (`/gsd-complete-milestone` ile):
1. Tüm bölümlerin tam incelemesi
2. Core Value kontrolü — hâlâ doğru öncelik mi?
3. Out of Scope denetimi — gerekçeler hâlâ geçerli mi?
4. Context'i mevcut durumla güncelle

---
*Last updated: 2026-05-22 after initialization*
