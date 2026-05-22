# LoexAI Wiki — İndeks

## Sentezler (Genel Bakış)

- [[syntheses/mimari-genel-bakis]] — Stack, pipeline, klasör yapısı, güvenlik
- [[syntheses/mvp-kapsami]] — MVP kapsamı, faz planı, sayfalar

## Kavramlar (Pipeline Aşamaları)

- [[concepts/hybrid-pipeline]] — Deterministik önce, AI sonra. Maliyet kontrolü.
- [[concepts/lead-discovery]] — Aşama 1: Deterministik, DiscoveryProvider
- [[concepts/business-enrichment]] — Aşama 2: Deterministik website analizi
- [[concepts/digital-gap-analysis]] — Aşama 3: Hybrid, industry templates
- [[concepts/opportunity-scoring]] — Aşama 4: Deterministik skor + AI gerekçe
- [[concepts/solution-recommendation]] — Aşama 5: AI, SolutionType
- [[concepts/sales-strategy]] — Aşama 6: AI, satış varlıkları
- [[concepts/build-prompt]] — Aşama 7: AI, Claude/Cursor prompts
- [[concepts/qa-agent]] — Aşama 8: AI, hallucination kontrolü, Zod

## Entity'ler (Kod Bileşenleri)

- [[entities/lib-ai-provider]] — AIProvider interface, model seçimi
- [[entities/lib-discovery-provider]] — DiscoveryProvider interface
- [[entities/lib-scoring]] — Deterministik scoring modülü
- [[entities/lib-enrichment]] — Website analizi modülü
- [[entities/lib-templates]] — Industry gap template'leri
- [[entities/lib-validators]] — Zod şemaları
- [[entities/supabase-veri-modeli]] — Tablolar, ilişkiler, RLS

## Kararlar (Mimari)

- [[decisions/hybrid-pipeline-karar]] — Deterministik önce prensibinin kararı
- [[decisions/discovery-provider-soyutlama]] — DiscoveryProvider interface kararı
- [[decisions/ai-provider-soyutlama]] — AIProvider interface kararı
- [[decisions/veri-modeli-jsonb]] — Esnek veri jsonb'de tutma kararı
- [[decisions/migration-tek-source-of-truth]] — Migration = tek doğru kaynak
- [[decisions/cache-stratejisi]] — Upstash Redis cache kararı

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]] — CLAUDE.md proje mimarisi

## Sorunlar / Dersler

*(henüz yok)*
