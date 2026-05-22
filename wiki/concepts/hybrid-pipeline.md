---
title: Hybrid Pipeline — Deterministik Önce, AI Sonra
tags: [mimari, pipeline, ai-kuralları, maliyet]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Hybrid Pipeline — Deterministik Önce, AI Sonra

## Kural

Bir veri kod ile elde edilebiliyorsa AI çağrısı yazılmaz. AI'nın görevi karar vermek değil — deterministik bulguları açıklamak ve satışa dönüştürmek.

## Katmanlar

| Katman | Araç | LLM? |
|---|---|---|
| Rules engine | Saf kod | Hayır |
| Scoring engine | Saf kod | Hayır |
| AI reasoning | Claude API | Sadece yorum/strateji/metin |

## Pipeline Aşamaları

1. **Lead Discovery** — deterministik (Google Places / RapidAPI)
2. **Business Enrichment** — deterministik (HTTP, SSL, PageSpeed, form varlığı)
3. **Digital Gap Analysis** — hybrid: kural-tabanlı tespit + AI kısa özet
4. **Opportunity Scoring** — deterministik hesaplama + AI gerekçe metni
5. **Solution Recommendation** — AI
6. **Sales Strategy** — AI
7. **Build Prompt** — AI
8. **QA** — AI (hallucination kontrolü)

## Maliyet Kontrolü İlkeleri

- AI çağrısından önce Upstash Redis cache kontrolü
- Aynı `business_id` için DB'de sonuç varsa yeniden üretme
- `reasoning/üretim` → `claude-sonnet`, `sınıflandırma/QA` → `claude-haiku`
- Her AI çağrısı `ai_usage` tablosuna loglanır
- Kredi kontrolü pipeline çağrısından ÖNCE backend'de yapılır
- Toplu tarama HTTP'de bloklama yok — queue üzerinden, batch halinde

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[decisions/hybrid-pipeline-karar]]
- [[entities/lib-ai-provider]]
- [[entities/lib-scoring]]
