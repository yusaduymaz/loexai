---
title: Opportunity Scoring — Aşama 4
tags: [pipeline, scoring, deterministik]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Opportunity Scoring — Aşama 4

## Sorumluluk

Her işletmeyi ticari fırsata göre puanlar (0-100). Skor deterministik hesaplanır, `reasoning` alanı AI ile üretilir.

## Input / Output Tipleri

```ts
type OpportunityScoreInput = {
  hasWebsite: boolean; websiteQualityScore?: number;
  rating?: number; reviewCount?: number; category: string;
  hasPhone?: boolean; hasSocialMedia?: boolean;
  digitalGapCount: number; highIntentGapCount: number;
  estimatedTicketSize: number;
  competitionLevel?: "low" | "medium" | "high";
};

type OpportunityScore = {
  score: number;                 // 0-100, DETERMİNİSTİK
  priority: "low" | "medium" | "high" | "urgent";
  closeProbability: number;
  estimatedDealValue: { min: number; max: number; currency: "USD" | "EUR" | "TRY" };
  reasoning: string;             // AI üretimi
};
```

## Yüksek Skor Kriterleri

Güçlü Google yorumları, yüksek yorum sayısı, eksik/zayıf website, iletişim verisi mevcut, yüksek dönüşüm potansiyelli kategori, net dijital eksikler.

## Düşük Skor Kriterleri

Düşük aktivite, iletişim yok, zaten güçlü dijital varlık, zayıf talep.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/lib-scoring]]
- [[concepts/solution-recommendation]]
