---
title: lib/discovery/ — DiscoveryProvider Interface
tags: [entity, discovery, interface, google-places]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# lib/discovery/ — DiscoveryProvider Interface

## Interface

```ts
interface DiscoveryProvider {
  search(input: DiscoveryInput): Promise<RawBusiness[]>;
}
```

## Sağlayıcılar

| Sağlayıcı | Durum | Not |
|---|---|---|
| Google Places API | Varsayılan/önerilen | Resmi, kalıcı, öngörülebilir maliyet |
| RapidAPI Maps scraper | Fallback | Ucuz ama ToS riski, kapanabilir |

`DISCOVERY_PROVIDER` env ile seçilir. Bir provider çökerse proje çökmez.

## MVP Dışı

Sosyal medya kaynakları (Instagram, Facebook, Yelp, TripAdvisor, LinkedIn) MVP'de yok — Phase 2+ opsiyonel. ToS açısından riskli; eklenirken ayrı değerlendirilir.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[decisions/discovery-provider-soyutlama]]
- [[concepts/lead-discovery]]
