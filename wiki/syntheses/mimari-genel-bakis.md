---
title: LoexAI — Mimari Genel Bakış
tags: [sentez, mimari, pipeline, stack]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# LoexAI — Mimari Genel Bakış

## Ürün Kategorisi

Local Business Opportunity Intelligence Platform. Yerel işletmelerin dijital zayıflıklarını tespit eden ve bunları freelancer/ajanslar için satılabilir fırsatlara çeviren AI destekli SaaS.

**Temel soru:** "Hangi yerel işletmeye ulaşmalıyım, ona ne satmalıyım, neden ihtiyacı var ve nasıl inşa etmeliyim?"

## Pipeline

```
Lead Discovery → Business Enrichment → Digital Gap Analysis →
Opportunity Scoring → Solution Recommendation → Sales Strategy → Build Prompt → QA
```

Her aşama idempotent: aynı `business_id` için yeniden çalıştırıldığında mevcut sonuç güncellenir, çoğaltılmaz.

## En Kritik Prensip

[[concepts/hybrid-pipeline]] — Deterministik önce, AI sonra. Aşamalar 1-2 tamamen deterministik, 3-4 hybrid, 5-8 AI.

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 15+, TypeScript strict, Tailwind, shadcn/ui, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) + RLS |
| AI | AIProvider interface — Anthropic (prod) / OpenRouter (dev) |
| Discovery | DiscoveryProvider interface — Google Places / RapidAPI |
| Queue/Cache | Upstash QStash + Redis |
| Payments | Stripe (Phase 5) |
| Deploy | Vercel (frontend) + Supabase |

## Klasör Yapısı

```
src/
  lib/
    ai/          — AIProvider interface + implementasyonlar
    agents/      — pipeline orchestration
    discovery/   — DiscoveryProvider interface + implementasyonlar
    enrichment/  — deterministik website analizi
    scoring/     — deterministik scoring
    templates/   — industry gap template'leri
    prompts/     — AI prompt dosyaları (versiyonlanabilir)
    validators/  — Zod şemaları
    supabase/
```

## Güvenlik

- API anahtarları asla frontend'de — env'de
- Scraping/AI çağrıları yalnızca sunucu tarafında
- Supabase RLS zorunlu
- Tüm AI çıktıları Zod ile doğrulanır
- Kredi kontrolü backend'de, pipeline öncesi

## İlgili

- [[syntheses/mvp-kapsami]]
- [[entities/supabase-veri-modeli]]
- [[concepts/hybrid-pipeline]]
- [[decisions/ai-provider-soyutlama]]
- [[decisions/discovery-provider-soyutlama]]
