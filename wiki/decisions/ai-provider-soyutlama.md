---
title: Karar — AIProvider Soyutlaması
tags: [karar, mimari, ai, soyutlama, maliyet]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — AIProvider Soyutlaması

**Karar:** `lib/ai/` altında `AIProvider` interface'i. `AI_PROVIDER` env ile seçim. Üretimde Anthropic, dev/test'te OpenRouter ücretsiz modeller.

**Neden:** Ücretsiz modeller haber vermeden kapanabilir. Rate limit düşük. Yapılandırılmış JSON üretimi zayıf olabilir. Kilitlenme riski yüksek.

**Nasıl uygulanır:** Hiçbir model adı (claude-sonnet, llama vb.) `lib/ai/` dışında geçmez. Provider değişimi = tek env değişikliği.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/lib-ai-provider]]
