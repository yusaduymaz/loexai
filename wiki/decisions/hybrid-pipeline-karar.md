---
title: Karar — Hybrid Pipeline (Deterministik Önce)
tags: [karar, mimari, pipeline, maliyet]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — Hybrid Pipeline (Deterministik Önce)

**Karar:** Kod ile çözülebilen hiçbir şey için AI çağrısı yazılmaz. AI yalnızca deterministik bulguları açıklamak ve satışa dönüştürmek için kullanılır.

**Neden:** 8 katmanlı pipeline her lead için ciddi token yakar. AI'sız çözülebilir işlemler AI'a yıkılırsa maliyet katlanır ve sonuçlar tekrarlanamaz hale gelir.

**Nasıl uygulanır:** Her yeni özellik yazılmadan önce sor: "Bu deterministik olarak çözülebilir mi?" Cevap evetse AI çağrısı yazılmaz.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[concepts/hybrid-pipeline]]
