---
title: Solution Recommendation — Aşama 5
tags: [pipeline, ai, solution, recommendation]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Solution Recommendation — Aşama 5

## Sorumluluk

Satılabilir dijital çözüm teklifleri üretir. Tamamen AI.

## SolutionType

```ts
type SolutionType =
  | "business_website" | "landing_page" | "qr_menu" | "booking_system"
  | "whatsapp_automation" | "review_funnel" | "seo_pages" | "ai_chatbot"
  | "crm_setup" | "analytics_tracking" | "social_media_landing_page";
```

## Çıktı Yapısı

```ts
type SolutionRecommendation = {
  primaryOffer: {
    title: string; description: string; whyThisBusinessNeedsIt: string;
    expectedImpact: string; estimatedBuildTime: string; estimatedPriceRange: string;
  };
  secondaryOffers: Array<{ title: string; description: string }>;
  upsellOffers: Array<{ title: string; description: string }>;
};
```

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/sales-strategy]]
- [[concepts/opportunity-scoring]]
