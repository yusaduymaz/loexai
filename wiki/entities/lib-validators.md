---
title: lib/validators/ — Zod Şemaları
tags: [entity, zod, doğrulama, güvenlik]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# lib/validators/ — Zod Şemaları

## Sorumluluk

Tüm AI JSON çıktılarını doğrular. Doğrulama başarısızsa retry veya hata fırlatılır.

## Kural

Her AI pipeline aşamasının çıktısı Zod şemasından geçer. Doğrulanmamış AI çıktısı üst katmana geçmez.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/qa-agent]]
- [[concepts/hybrid-pipeline]]
