# Requirements — LoexAI

**Version:** v1 (MVP)
**Date:** 2026-05-22
**Source:** CLAUDE.md + Research synthesis

---

## v1 Requirements

### FOUNDATION — Auth & Infrastructure

- [ ] **FOUND-01**: Kullanıcı email + şifre ile kayıt olabilir
- [ ] **FOUND-02**: Kullanıcı email + şifre ile giriş yapabilir ve oturum sayfalar arası korunur
- [ ] **FOUND-03**: Kullanıcı herhangi bir sayfadan çıkış yapabilir
- [ ] **FOUND-04**: Kimliği doğrulanmamış kullanıcılar dashboard'dan login sayfasına yönlendirilir
- [ ] **FOUND-05**: Her yeni kullanıcı 20 kredi ile başlar (backend'de default olarak)
- [ ] **FOUND-06**: Her AI pipeline çağrısından önce backend kredi kontrolü yapılır
- [ ] **FOUND-07**: Her AI çağrısının token & maliyet kullanımı `ai_usage` tablosuna kaydedilir
- [ ] **FOUND-08**: Supabase veritabanı RLS politikaları zorunludur — kullanıcı yalnızca kendi verisini görür

### LANDING — Public Pages

- [ ] **LAND-01**: Landing page: Hero ("Find local businesses that actually need your services"), Problem, How It Works, Pricing, FAQ, CTA bölümleri içerir
- [ ] **LAND-02**: Pricing sayfası mevcuttur
- [ ] **LAND-03**: Login ve register sayfaları mevcuttur

### DASHBOARD — Core Layout

- [ ] **DASH-01**: Dashboard sidebar: Overview, Lead Discovery, Opportunities, Business Reports, Settings bölümleri içerir
- [ ] **DASH-02**: Dashboard overview kartları: Total Leads, High Opportunity Leads, Average Opportunity Score, AI Strategies Generated, Build Prompts Generated
- [ ] **DASH-03**: Kredi bakiyesi her zaman görünür (sidebar veya header'da)
- [ ] **DASH-04**: İlk kez giriş yapan kullanıcı için boş durum + "Start a scan" CTA gösterilir

### DISCOVERY — Lead Finding

- [ ] **DISC-01**: Kullanıcı konum + kategori + radius girerek yerel işletme taraması başlatabilir
- [ ] **DISC-02**: Tarama başlamadan önce kredi maliyeti gösterilir: "This scan will use X credit(s)"
- [ ] **DISC-03**: Tarama sonuçları `businesses` tablosuna kaydedilir; aynı `place_id` iki kez kaydedilmez (deduplication)
- [ ] **DISC-04**: Tarama ilerleme durumu UI'da gösterilir (spinner/progress değil — "Finding businesses... Analyzing gaps... Scoring...")
- [ ] **DISC-05**: Google Places API 60 sonuç sınırına ulaşıldığında UI bunu açıkça belirtir
- [ ] **DISC-06**: Tarama tamamlandıktan sonra kredi düşümü gerçekleşir (öncesinde değil)
- [ ] **DISC-07**: Tarama geçmişi (`scan_jobs`) listelenebilir: konum, kategori, tarih, sonuç sayısı, durum

### LEADS — Lead Management

- [ ] **LEAD-01**: Kullanıcı tarama sonuçlarını opportunity skoru azalan sırada listede görebilir
- [ ] **LEAD-02**: Liste filtrelenebilir: priority (low/medium/high/urgent), kategori, durum
- [ ] **LEAD-03**: Her lead için durum güncellenebilir: New → Analyzed → Saved → Contacted → Proposal Sent → Won → Lost
- [ ] **LEAD-04**: Lead listesi CSV olarak export edilebilir

### ENRICHMENT — Digital Profile

- [ ] **ENRICH-01**: Her işletme için deterministik website analizi yapılır: website varlığı, SSL, viewport meta (mobile), form varlığı, WhatsApp CTA, CTA varlığı
- [ ] **ENRICH-02**: Bilinemeyen alanlar `null` veya `"unknown"` olarak saklanır — asla varsayım yapılmaz
- [ ] **ENRICH-03**: `digital_maturity_score` hesaplanır (0-100, deterministik)
- [ ] **ENRICH-04**: Enrichment sonuçları `business_enrichments` tablosuna idempotent olarak kaydedilir

### GAP ANALYSIS — Digital Gaps

- [ ] **GAP-01**: Her işletme için industry template (klinik, kafe/restoran, güzellik salonu/berber) kullanılarak rule-based gap tespiti yapılır
- [ ] **GAP-02**: Gap kategorileri: No website, no online booking, no QR menu, no WhatsApp CTA, no review funnel, weak SEO, poor mobile, no lead capture, no analytics
- [ ] **GAP-03**: Gap analizi `gap_analyses` tablosuna idempotent olarak kaydedilir
- [ ] **GAP-04**: AI, gap listesini kısa bir özet olarak açıklar (AI çağrısı yalnızca özet için)
- [ ] **GAP-05**: Upstream enrichment alanları `null` ise gap analizi çalıştırılmaz — kısmi sonuç kaydedilir

### SCORING — Opportunity Score

- [ ] **SCORE-01**: Her işletme için 0-100 opportunity skoru deterministik olarak hesaplanır (AI kullanılmaz)
- [ ] **SCORE-02**: Priority label atanır: low / medium / high / urgent
- [ ] **SCORE-03**: Close probability hesaplanır
- [ ] **SCORE-04**: Estimated deal value (min/max/currency) hesaplanır
- [ ] **SCORE-05**: AI, skora `reasoning` metni üretir (tek AI çağrısı, yalnızca açıklama)
- [ ] **SCORE-06**: Skor sonuçları `opportunities` tablosuna idempotent olarak kaydedilir

### SOLUTION — Recommendation

- [ ] **SOL-01**: Her işletme için primary offer, secondary offers ve upsell offers üretilir (AI)
- [ ] **SOL-02**: Her AI çıktısı `observedFact` / `inference` / `opportunity` üçlüsünü içerir
- [ ] **SOL-03**: Tüm AI çıktıları Zod ile doğrulanır; doğrulama başarısızsa max 2 retry
- [ ] **SOL-04**: Sonuçlar `solution_recommendations` tablosuna idempotent olarak kaydedilir

### SALES — Strategy Generation

- [ ] **SALES-01**: Her işletme için cold email üretilir (AI, gözlemlenen eksiklere dayalı)
- [ ] **SALES-02**: Short pitch ve value proposition üretilir
- [ ] **SALES-03**: Objection handling ve proposal summary üretilir
- [ ] **SALES-04**: Ton kuralları uygulanır: spesifik, profesyonel, spam değil
- [ ] **SALES-05**: Sonuçlar `sales_strategies` tablosuna idempotent olarak kaydedilir

### BUILD PROMPT — Dev Brief

- [ ] **BUILD-01**: Seçilen çözüm için Claude/Cursor uyumlu build prompt üretilir (AI)
- [ ] **BUILD-02**: Prompt: business context, önerilen çözüm, tech stack, sayfa yapısı, component'ler içerir
- [ ] **BUILD-03**: Prompt target tool seçilebilir (Claude / Cursor)
- [ ] **BUILD-04**: Sonuçlar `build_prompts` tablosuna idempotent olarak kaydedilir

### QA — Quality Assurance

- [ ] **QA-01**: Her pipeline çıktısı için hallucination ve tutarlılık kontrolü yapılır (AI)
- [ ] **QA-02**: QA çıktısı: `isValid`, `warnings[]`, `confidence` (0-1) içerir
- [ ] **QA-03**: `confidence` < 0.7 ise Business Report uyarı banner'ı ile gösterilir, gizlenmez
- [ ] **QA-04**: QA, AI çıktısını ham enrichment alanlarıyla karşılaştırır (sadece internal consistency değil)

### REPORT — Business Report Page

- [ ] **REP-01**: `/dashboard/business/[id]` sayfası: Business Summary, Digital Presence, Gap Analysis, Opportunity Score, Recommended Solution, Sales Strategy, Build Prompt bölümlerini içerir
- [ ] **REP-02**: Deterministik bölümler (Score, Gaps) hemen yüklenir; AI bölümleri async yüklenir
- [ ] **REP-03**: Her metin bloğunun yanında bir tıkla kopyala butonu vardır
- [ ] **REP-04**: Business Report PDF olarak export edilebilir
- [ ] **REP-05**: Durum değişikliği (New → Contacted vb.) rapor sayfasından yapılabilir

### COST — Cost Control

- [ ] **COST-01**: Pipeline başlamadan önce `ai_usage` tablosu mid-job cost kontrolü için sorgulanır
- [ ] **COST-02**: Her pipeline stage'i için max 2 retry uygulanır (cost explosion önlemi)
- [ ] **COST-03**: Kullanıcının kredisi 5'in altına düştüğünde dashboard'da uyarı gösterilir
- [ ] **COST-04**: Kullanıcının kredisi 0 olduğunda tarama engellenir ve upgrade CTA gösterilir

### ADMIN — Admin Panel

- [ ] **ADM-01**: `/admin` paneli: kullanıcı listesi, kredi yönetimi, scan job monitoring içerir
- [ ] **ADM-02**: Admin `ai_usage` tablosunu tarih/kullanıcı bazında görebilir
- [ ] **ADM-03**: Admin industry template'lerini yönetebilir (görüntüleme en azından)

---

## v2 Requirements (Deferred)

- Batch scanning (50+ işletme, queue-based progress tracking)
- WhatsApp DM + Instagram DM varlık üretimi
- Stripe faturalama + plan katmanları
- Takım çalışması / multi-seat
- White-label raporlar
- Gelişmiş analytics dashboard
- Sosyal medya scraping (Instagram, Facebook, Yelp)
- Google Places geographic subdivision (60-cap bypass)
- Headless browser enrichment (JS-rendered siteler için)
- Predictive credit depletion notice

---

## Out of Scope

- Tam CRM (görev takibi, hatırlatıcı, ekip notları) — HubSpot ile rekabet edilmez
- Otomatik outreach / email gönderimi — spam riski; sadece copy üretilir
- Percentage-of-deal pricing — kredi modeli daha temiz
- Sosyal medya hesap otomasyonu — MVP'de ToS riski
- Çoklu scraping kaynağı — bir provider çalışıyor, diğerleri riski yüksek

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| FOUND-01..08 | Phase 1 |
| LAND-01..03 | Phase 1 |
| DASH-01..04 | Phase 1 |
| ADM-01..03 | Phase 1 |
| DISC-01..07 | Phase 2 |
| LEAD-01..04 | Phase 2 |
| ENRICH-01..04 | Phase 3 |
| GAP-01..05 | Phase 3 |
| SCORE-01..06 | Phase 3 |
| COST-01..04 | Phase 3 |
| SOL-01..04 | Phase 4 |
| SALES-01..05 | Phase 4 |
| BUILD-01..04 | Phase 4 |
| QA-01..04 | Phase 4 |
| REP-01..05 | Phase 4 |
