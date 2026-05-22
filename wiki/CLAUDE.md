# LoexAI Wiki — Şema ve Operasyon Rehberi

> Bu dosya wiki'nin kurallarını tanımlar. Wiki'ye her erişimde önce bu dosyayı oku.

---

## Amaç

LoexAI projesinin kalıcı bilgi arşivi. Mimari kararlar, teknik kavramlar, sistem bileşenleri, geliştirme sürecindeki öğrenmeler ve çözülen sorunlar burada birikirsin. Her yeni konuşmada CLAUDE.md'yi baştan anlatmak yerine bu wiki'den bağlam çekilerek token harcaması azaltılır.

---

## Dil ve Format Kuralları

- Tüm wiki sayfaları **Türkçe**. Teknik terimler (TypeScript, Supabase, RLS, vb.) İngilizce kalabilir.
- Dosya adları: `kebab-case.md`
- Her sayfa şu yapıyı takip eder:

```yaml
---
title: Sayfa Başlığı
tags: [tag1, tag2]
source: sources/docs/2025-05-22-claude-md.md
date: 2025-05-22
status: active  # active | outdated | archived
---
```

Sonrasında: `# Başlık` + içerik + `## Kaynaklar` + `## İlgili`

---

## Klasör Yapısı

```
wiki/
  raw/docs/      — ham dökümanlar (CLAUDE.md gibi). DOKUNULMAZ.
  raw/code/      — kod anlık görüntüleri. DOKUNULMAZ.
  sources/docs/  — her ham doküman için özet sayfası
  sources/code/  — her kod dosyası/modülü için özet sayfası
  entities/      — dosyalar, fonksiyonlar, servisler, API'ler, interface'ler
  concepts/      — soyut kavramlar (pipeline aşamaları, scoring mantığı, vb.)
  decisions/     — atomik mimari kararlar (her karar = tek sayfa)
  issues/        — çözülen sorunlar (kök neden + fix)
  syntheses/     — üst düzey sentez ve genel bakış sayfaları
  archive/       — eskimiş sayfalar (asla silinmez)
```

---

## INGEST Workflow

Yeni bir kaynak (doküman veya kod) eklendiğinde:

1. `raw/docs/` veya `raw/code/` içine kaydet (orijinal, değiştirilmeden)
2. Kaynağı oku, çıkar: ana konu, anahtar bulgular, bahsedilen entity'ler, kararlar, sorunlar
3. `sources/<kategori>/YYYY-MM-DD-<slug>.md` yaz:
   - Frontmatter + H1
   - **Amaç:** Bu kaynağın amacı
   - **İçerik özeti:** Ne anlatıyor
   - **Kararlar:** Alınan mimari/ürün kararları
   - **Bileşenler:** Bahsedilen dosyalar, servisler, tipler
   - **Açık konular:** Belirsiz veya eksik noktalar
   - `## Kaynaklar` + `## İlgili`
4. Her **entity** (dosya yolu, interface, servis, API) için `entities/` altında sayfa — varsa güncelle
5. Her **karar** için `decisions/` altında atomik sayfa
6. Her **sorun/ders** için `issues/` altında sayfa
7. Her **soyut kavram** için `concepts/` altında sayfa — varsa güncelle
8. `index.md` güncelle
9. `log.md`'ye giriş ekle: `## [YYYY-MM-DD] ingest | <slug>`

---

## QUERY Workflow

Wiki'den bilgi çekerken:

1. `index.md`'yi oku, ilgili kategorileri belirle
2. Alakalı sayfaları oku (sources, entities, concepts, decisions, syntheses)
3. Cevabı sentezle — **her iddia kaynak referansı içersin**
4. Cevap yeni bir sentez/analiz içeriyorsa `syntheses/` veya `concepts/`'e geri dosyala
5. `log.md`'ye giriş ekle

---

## LINT Workflow

Periyodik sağlık kontrolü:

1. `raw/` hariç tüm `.md` dosyaları tara
2. Ara: çelişkiler, eskimiş iddialar, yetim sayfalar, eksik kavram sayfaları, tek-yönlü linkler
3. `lint-report.md`'ye yaz (otomatik düzeltme YAPMA, sadece raporla)
4. `log.md`'ye giriş ekle

---

## Hard Rules

- `raw/` klasörüne **asla yazma** — sadece oku
- Kaynaksız iddia yazma — her bulgu ilgili kaynağa referans versin
- Sayfa silme yok — eskiyenler `archive/`'a taşınır
- Çelişkiler `## ÇELİŞKİ` başlığıyla işaretlenir, silinmez
- Pipeline aşamaları: deterministik mantık AI'dan önce gelir (bkz. `concepts/hybrid-pipeline.md`)
