---
title: QA Agent — Aşama 8
tags: [pipeline, ai, qa, hallucination]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# QA Agent — Aşama 8

## Sorumluluk

Hallucination ve tutarlılık kontrolü. Önerilerin gerçek veriye dayanıp dayanmadığını doğrular, zayıf varsayımları işaretler.

## Çıktı

```json
{ "isValid": true, "warnings": [], "confidence": 0.87 }
```

## AI Kuralları

- Eksik veri asla uydurulmaz → `null` veya `"unknown"`
- Bulunamayan Instagram → `null` saklanır, var olduğu varsayılmaz
- AI çıktısı şunu ayırt eder:
  ```json
  {
    "observedFact": "İşletmenin listelenmiş bir web sitesi yok.",
    "inference": "Potansiyel müşteriler iletişime geçmeden önce daha az güven duyabilir.",
    "opportunity": "Randevu CTA'lı modern bir web sitesi inşa et."
  }
  ```
- Tüm AI JSON çıktıları Zod ile doğrulanır. Başarısızsa retry veya hata.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/hybrid-pipeline]]
- [[entities/lib-validators]]
