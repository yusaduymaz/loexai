---
title: Supabase Veri Modeli
tags: [entity, supabase, database, schema, rls]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Supabase Veri Modeli

## Genel Kurallar

- Her tabloda `id` (uuid, primary key) ve `created_at` (timestamptz)
- Tüm tablolarda RLS açık — kullanıcı yalnızca kendi `user_id` verisini görür
- Alt kayıtlar üst kayda `ON DELETE CASCADE` ile bağlı
- Esnek veriler `jsonb` alanında — schema katılığı yaratmaz
- Pipeline çıktıları idempotent: aynı `business_id` için en güncel sonuç tutulur

## Tablolar

| Tablo | Sorumluluk |
|---|---|
| `users` | Hesap, rol, plan (free default), credits (default 20) |
| `businesses` | Ham işletme. `(user_id, place_id)` unique. `raw_data` jsonb |
| `business_enrichments` | Deterministik dijital profil. `enrichment_data` jsonb |
| `gap_analyses` | Dijital eksikler. `gaps` jsonb + `severity_score` + `summary` |
| `opportunities` | Fırsat skoru, priority, deal aralığı, `close_probability`, `status` |
| `solution_recommendations` | primary/secondary/upsell teklifler jsonb |
| `sales_strategies` | pitch, cold email, DM, WhatsApp, objection handling, proposal |
| `build_prompts` | `prompt_body`, `target_tool`, `tech_stack` jsonb |
| `scan_jobs` | Tarama işi takibi: konum/kategori/radius, status, sayılar, hata |
| `ai_usage` | Token & maliyet logu: stage, model, input/output token, cost_usd |

## İlişki Haritası

```
users 1──* businesses 1──1 business_enrichments
                      1──1 gap_analyses
                      1──1 opportunities 1──1 solution_recommendations
                                         1──1 sales_strategies
                                         1──1 build_prompts
users 1──* scan_jobs
users 1──* ai_usage
```

## Opportunity Statuses

`new` → `analyzed` → `saved` → `contacted` → `proposal_sent` → `won` / `lost`

## Önemli Not

Şemanın tek doğru kaynağı: `supabase/migrations/`. Bu sayfa kavramsal modeldir.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[decisions/migration-tek-source-of-truth]]
- [[decisions/veri-modeli-jsonb]]
