---
title: Karar — DiscoveryProvider Soyutlaması
tags: [karar, mimari, discovery, soyutlama]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — DiscoveryProvider Soyutlaması

**Karar:** Tek bir scraper'a bağlı kalma. `DiscoveryProvider` interface'i yaz; provider env ile seçilir, üst katmanlar hangisinin kullanıldığını bilmez.

**Neden:** RapidAPI gibi ucuz alternatiflerin ToS'u değişebilir, servis kapanabilir. Google Places API daha güvenilir ama daha pahalı. Soyutlama olmadan provider değişimi proje çöküşü anlamına gelir.

**Nasıl uygulanır:** `DISCOVERY_PROVIDER=google_places` veya `rapidapi`. Yeni provider eklemek = interface implementasyonu + env değeri, başka bir şey değişmez.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/lib-discovery-provider]]
