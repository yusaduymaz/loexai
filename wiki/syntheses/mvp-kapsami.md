---
title: LoexAI — MVP Kapsamı ve Faz Planı
tags: [sentez, mvp, fazlar, kapsam]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# LoexAI — MVP Kapsamı ve Faz Planı

## MVP'de OLAN

- Landing page
- Auth (Supabase)
- Dashboard
- Lead discovery formu
- Discovery provider entegrasyonu
- Business tablosu
- Business detay raporu (`/dashboard/business/[id]`)
- Digital gap analizi
- Opportunity score
- Solution recommendation
- Sales pitch üretimi
- Build prompt üretimi
- Kredi sistemi (20 kredi default)
- Admin panel temelleri
- 8 katmanlı pipeline

## MVP'de OLMAYAN

- Tam CRM otomasyonu
- Otomatik outreach / email gönderimi
- Takım çalışması / white-label
- Stripe katmanlı faturalama (Phase 5)
- Çoklu kaynak scraping (sosyal medya)
- Gelişmiş analytics

## Faz Planı

| Faz | Kapsam |
|---|---|
| 1. Foundation | Next.js, Supabase, auth, ilk migration'lar, landing, dashboard & admin layout |
| 2. Lead Discovery | Scan formu, DiscoveryProvider entegrasyonu, business kaydı, dedup, lead tablosu |
| 3. Intelligence Pipeline | Enrichment, gap analysis, industry template'ler, scoring, recommendation |
| 4. AI Output | Sales strategy, build prompt, QA, rapor export |
| 5. SaaS Layer | Stripe, usage log UI, admin yönetim, error monitoring |

## Sayfalar

```
/  /pricing  /login  /register
/dashboard  /dashboard/discovery  /dashboard/opportunities
/dashboard/business/[id]  /dashboard/prompt-studio
/dashboard/campaigns  /dashboard/settings
/admin  /admin/users  /admin/templates  /admin/jobs  /admin/usage
```

## Business Report — Magic Moment

`/dashboard/business/[id]` sayfası ürünün "aha moment" sayfası:
Business Summary → Digital Presence → Gap Analysis → Opportunity Score → Recommended Solution → Sales Strategy → Build Prompt → Notes → Export

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[syntheses/mimari-genel-bakis]]
