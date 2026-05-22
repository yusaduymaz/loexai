---
title: lib/ai/ — AIProvider Interface
tags: [entity, ai, interface, soyutlama]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# lib/ai/ — AIProvider Interface

## Sorumluluk

AI sağlayıcı soyutlaması. Üst katmanlar hangi sağlayıcının kullanıldığını bilmez.

## Seçim

`AI_PROVIDER` env değişkeni ile yapılır:
- `openrouter_free` → geliştirme/test (ücretsiz modeller, düşük rate limit, JSON üretimi zayıf olabilir)
- `anthropic` → üretim

## Model Seçimi (Anthropic)

- `claude-sonnet` → reasoning ve metin üretimi
- `claude-haiku` → ucuz sınıflandırma ve QA

## Uyarılar

- Ücretsiz modeller haber vermeden kapanabilir → soyutlama zorunlu
- Provider değişimi = tek env değişikliği, kod değişmez

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[decisions/ai-provider-soyutlama]]
- [[concepts/hybrid-pipeline]]
