# LoexAI — Proje Özeti

**Hazırlayan:** Yuşa Duymaz  
**Tarih:** Haziran 2026  
**Durum:** Aktif geliştirme — Faz 6/7 tamamlandı, Faz 7 (Monetizasyon) başlamak üzere

---

## Proje Nedir?

**LoexAI**, freelancer'lar, dijital pazarlama ajansları ve yerel işletme danışmanları için geliştirilmiş bir **AI destekli fırsat zekası platformu**dur. Temel amacı şu soruyu yanıtlamaktır:

> "Hangi yerel işletmeye ulaşmalıyım, ona ne satmalıyım, neden ihtiyacı var ve nasıl inşa etmeliyim?"

Platform ham yerel işletme verisini → eyleme dönüştürülebilir dijital servis fırsatlarına çevirir. Bir lead scraper değil; bir **fırsat analiz ve satış zekası sistemi**dir.

---

## Problem

Bir freelancer veya ajans yeni müşteri arayışına girdiğinde şu sorularla boğuşur:

- Hangi işletmenin dijital ihtiyacı var?
- Bu işletmeye ne teklif etmeliyim?
- Neden bana ihtiyaçları olduğunu nasıl ispatlayabilirim?
- Teklife hazır bir pitch nasıl yazarım?
- Teklif kabul edilirse uygulamayı nasıl geliştiririm?

Bu süreç saatler alır, elle araştırma gerektirir ve genellikle yanlış hedeflere ulaşmakla sonuçlanır. LoexAI bu süreci otomatik ve AI destekli hale getirir.

---

## Çözüm: 8 Katmanlı Pipeline

```
Lead Discovery → Business Enrichment → Digital Gap Analysis →
Opportunity Scoring → Solution Recommendation → Sales Strategy → Build Prompt → QA
```

| Katman | Ne Yapar | Teknoloji |
|--------|----------|-----------|
| Lead Discovery | Google Places üzerinden yerel işletme taraması | Google Places API |
| Business Enrichment | Website SSL, mobil uyumluluk, form, CTA kontrolü | Deterministik (AI yok) |
| Digital Gap Analysis | Sektör şablonlarına göre eksik tespiti | Kural tabanlı + AI özet |
| Opportunity Scoring | 0-100 puanlama ve öncelik etiketi | Deterministik formül |
| Solution Recommendation | Satılabilir dijital ürün önerileri | Claude API |
| Sales Strategy | Cold email, pitch, WhatsApp mesajı üretimi | Claude API |
| Build Prompt | Claude/Cursor için hazır geliştirme promptu | Claude API |
| QA | Hallucination ve tutarlılık kontrolü | Claude API |

**Kritik mimari prensip:** Deterministik hesaplanabilecek hiçbir şeye AI çağrısı yapılmaz. AI yalnızca yorum, strateji ve metin üretimi için kullanılır.

---

## Teknik Altyapı

| Katman | Seçilen Teknoloji |
|--------|------------------|
| Frontend | Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui |
| Backend / DB | Supabase (PostgreSQL, Row Level Security, Auth) |
| Kimlik Doğrulama | Clerk |
| AI Sağlayıcı | OpenRouter (dev/test) / Anthropic Claude API (production) |
| Background Jobs | Upstash Workflow (step-level retry, Vercel timeout bypass) |
| Cache & Rate Limit | Upstash Redis |
| Ödeme (yakında) | Stripe |
| Hata İzleme | Sentry |
| Analitik | PostHog |
| Deploy | Vercel |

**AI soyutlaması:** `AIProvider` interface ile sağlayıcı bağımsız çalışır. Tek env değişkeni ile OpenRouter ↔ Anthropic geçişi yapılır.

**Discovery soyutlaması:** `DiscoveryProvider` interface ile Google Places öncelikli, RapidAPI fallback.

---

## Mevcut Durum (Tamamlanan Fazlar)

| Faz | İçerik | Durum |
|-----|--------|-------|
| P1: Veri Modeli | DB tabloları, migration'lar, RLS politikaları, pipeline veri altyapısı | ✅ Tamamlandı |
| P2: Keşif MVP | Google Places entegrasyonu, iş kaydetme, deduplication, tarama job'ları | ✅ Tamamlandı |
| P3: Zeka Pipeline | Website probe'ları, sektör şablonları, gap analizi, deterministik puanlama | ✅ Tamamlandı |
| P4: AI Katmanı | AIProvider interface, OpenRouter/Anthropic adaptörleri, Zod doğrulama, kullanım logu | ✅ Tamamlandı |
| P5: Ürün Anı | Business Report sayfası, fırsat paneli, AI output panelleri, export | ✅ Tamamlandı |
| P6: Admin Paneli | AI kullanım analitiği, pipeline hata takibi, canlı şablon görüntüleyici | ✅ Tamamlandı |
| P7: Monetizasyon | Stripe entegrasyonu, plan katmanları, kredi satın alma | 🔜 Sıradaki |

---

## Ekranlar / Sayfalar

- `/` — Landing page (Hero, Problem, Nasıl Çalışır, Fiyatlandırma, SSS)
- `/dashboard` — Genel bakış (toplam lead, fırsat skoru ortalaması, tahmini gelir)
- `/dashboard/discovery` — Tarama formu (konum + kategori + radius)
- `/dashboard/opportunities` — Fırsat listesi (filtreli, sıralanabilir)
- `/dashboard/business/[id]` — Business Report (tam pipeline çıktısı)
- `/dashboard/prompt-studio` — Build prompt yönetimi
- `/admin/usage` — AI token maliyet analitiği
- `/admin/failures` — Pipeline hata izleme
- `/admin/templates` — Sektör şablonları canlı görüntüleyici

---

## Kredi Sistemi

- Her kullanıcı kayıt olduğunda **20 kredi** alır.
- Her pipeline çalıştırması 1 kredi tüketir.
- Kredi 5'e düşünce uyarı gösterilir; 0'da tarama engellenir.
- Kredi satın alma **P7 (Stripe)** ile açılacak.

---

## Güvenlik Önlemleri

- Tüm API anahtarları yalnızca sunucu tarafında; frontend'de asla.
- Supabase RLS politikaları aktif — kullanıcı yalnızca kendi verisini görür.
- AI'dan gelen tüm JSON çıktıları Zod ile doğrulanır; doğrulama başarısızsa retry.
- Null-propagation kuralı: enrichment başarısızsa alanlar `null` kaydedilir, asla tahmin yapılmaz.
- Max 2 AI retry per stage; cost circuit breaker aktif.

---

## Kullanım Senaryosu (Örnek)

1. Freelancer "İstanbul/Bakırköy — berber" araması yapar.
2. Platform 20 berber bulur, hepsini analiz eder.
3. "Goldcuts Berber" için sonuçlar:
   - Website yok ama Google'da 87 yorum ve 4.6 yıldız → **Urgent** fırsat
   - Eksikler: website, online randevu, WhatsApp CTA
   - Teklif: "Before/after galerili, WhatsApp CTA'lı landing page"
   - Cold email hazır, kopyala-yapıştır
   - Build prompt: Claude'a yapıştırınca proje çerçevesi çıkar

---

## Hedef Kullanıcı

- Freelancer web geliştiriciler
- Dijital pazarlama ajansları
- AI automation builder'lar
- Yerel işletme danışmanları / SaaS satış ekipleri

---

## Açık Sorular / Danışmak İstediklerim

1. **Fiyatlandırma modeli:** Kredi tabanlı mı (pay-per-scan) yoksa aylık abonelik mi daha sürdürülebilir?
2. **Go-to-market:** İlk 10 kullanıcıyı nereden kazanmak doğru olur?
3. **Pipeline maliyeti:** 8 katmanlı pipeline her tarama için ~$0.05–0.15 maliyet öngörüyorum. Bu fiyat-değer dengesi makul mu?
4. **MVP önceliği:** Stripe entegrasyonu önce mi yoksa kullanıcı edinimi önce mi?

---

*Bu döküman Kadir Can hoca ile danışma görüşmesi için hazırlanmıştır.*
