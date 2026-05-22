---
title: Business Enrichment — Aşama 2
tags: [pipeline, enrichment, deterministik, website-analizi]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Business Enrichment — Aşama 2

## Sorumluluk

Ham `BusinessLead` verisini daha derin bir dijital profile çevirir. **Tamamen deterministik** — LLM kullanılmaz.

## Yapılan Kontroller

- Website varlığı (HTTP durum kodu)
- SSL durumu
- PageSpeed / performans
- Responsive meta tag varlığı
- Form varlığı
- CTA varlığı

## Örnek Çıktı

```json
{
  "hasWebsite": false,
  "hasInstagram": true,
  "hasReservationSystem": false,
  "hasWhatsAppCTA": true,
  "mobileExperience": "unknown",
  "brandQuality": "medium",
  "digitalMaturityScore": 42
}
```

Bilinmeyen alan → `null` veya `"unknown"`. Asla varsayım yapılmaz.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/digital-gap-analysis]]
- [[entities/lib-enrichment]]
