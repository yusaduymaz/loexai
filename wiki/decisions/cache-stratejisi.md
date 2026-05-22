---
title: Karar — Cache Stratejisi (Upstash Redis)
tags: [karar, cache, upstash, redis, maliyet]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — Cache Stratejisi (Upstash Redis)

**Karar:** Upstash Redis kullanılır. AI çağrısından önce cache kontrol edilir. Aynı `business_id` için DB'de sonuç varsa yeniden üretilmez.

**Neden:** 8 katmanlı pipeline her lead için ciddi token maliyeti yaratır. Aynı işletme için tekrar analiz talep edildiğinde mevcut sonuç dönülür.

**Nasıl uygulanır:** `business_id` → cache key. Pipeline başında cache hit kontrolü. Cache miss → pipeline çalışır → sonuç kaydedilir + cache'e yazılır.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/hybrid-pipeline]]
- [[entities/lib-ai-provider]]
