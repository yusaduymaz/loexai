---
title: Lead Discovery — Aşama 1
tags: [pipeline, discovery, google-places, deterministik]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Lead Discovery — Aşama 1

## Sorumluluk

Seçilen kategori + konum + radius için yerel işletmeleri bulur. Tamamen deterministik.

## BusinessLead Tipi

```ts
type BusinessLead = {
  id: string;
  name: string;
  category: string;
  address?: string; city?: string; country?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  photos?: string[];
  socialLinks?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
  source: "google_maps" | "manual" | "import";
  createdAt: string;
};
```

## Tekilleştirme

`(user_id, place_id)` çifti unique — aynı işletme iki kez kaydedilmez.

## DiscoveryProvider Interface

```ts
interface DiscoveryProvider {
  search(input: DiscoveryInput): Promise<RawBusiness[]>;
}
```

Varsayılan: Google Places API. Fallback: RapidAPI Maps scraper (ToS riski var). Provider `DISCOVERY_PROVIDER` env ile seçilir.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/lib-discovery-provider]]
- [[decisions/discovery-provider-soyutlama]]
- [[concepts/business-enrichment]]
