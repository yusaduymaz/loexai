# CLAUDE.md — LoexAI (Local Opportunity Engine AI)

> Bu dosya Cursor / Claude Code gibi AI araçlarının projeyi doğru anlaması içindir.
> Kod yazmadan önce bütünüyle oku. Buradaki mimari kararlar BAĞLAYICIDIR.
> Çelişki gördüğünde varsayım yapma — sor.

---

## 1. Proje Kimliği

| | |
|---|---|
| **Proje** | LoexAI |
| **Tam ad** | Local Opportunity Engine AI |
| **Domain** | loexai.com |
| **Tür** | AI-powered SaaS — Local Business Opportunity Intelligence Platform |
| **Kullanıcılar** | Freelancer'lar, web/dijital pazarlama ajansları, AI automation builder'lar, SaaS danışmanları, yerel işletme danışmanları |

---

## 2. Çekirdek Vizyon

LoexAI bir lead scraper DEĞİLDİR.

LoexAI yerel işletmeleri keşfeden, dijital zayıflıklarını analiz eden, onlara ne
satılabileceğini belirleyen, satış stratejisi üreten ve geliştiriciler/ajanslar için
uygulamaya hazır build planları oluşturan bir **opportunity intelligence platform**'udur.

Yanıtladığı tek soru:

> "Hangi yerel işletmeye ulaşmalıyım, ona ne satmalıyım, neden ihtiyacı var ve nasıl inşa etmeliyim?"

LoexAI ham yerel işletme verisini → eyleme dönüştürülebilir dijital servis fırsatlarına çevirir.

**Ürün kategorisi:** Local Business Opportunity Intelligence Platform
**Konumlandırma:** "AI-powered local business opportunity intelligence for agencies and freelancers."
LoexAI bir lead scraper, generic chatbot tool veya yalnızca bir CRM DEĞİLDİR.

---

## 3. Çekirdek Ürün Akışı

```text
Lead Discovery → Business Enrichment → Digital Gap Analysis →
Opportunity Scoring → Solution Recommendation → Sales Strategy → Build Prompt
```

Her aşama bir önceki aşamanın çıktısını girdi alır. Akış idempotent olmalı —
aynı işletme için yeniden çalıştırıldığında mevcut sonuç güncellenir, çoğaltılmaz.

---

## 4. EN KRİTİK MİMARİ PRENSİP — Hybrid System

> Bu projenin en sık yapılan hatası: her şeyi LLM'e yıkmak. YAPMA.

Pipeline kuralı her zaman: **deterministik önce, AI sonra.**

| Katman | Araç | Açıklama |
|---|---|---|
| Rules engine | Saf kod | Website var mı, SSL var mı, mobil mi, randevu sistemi var mı |
| Scoring engine | Saf kod | Sayısal, tekrarlanabilir, AI'sız puanlama |
| AI reasoning | Claude API | Sadece yorum, strateji ve metin üretimi |

AI'nın görevi karar VERMEK değil — deterministik bulguları **açıklamak ve satışa
dönüştürmek**. Bir veri kod ile elde edilebiliyorsa AI çağrısı YAZMA.

---

## 5. "Agent" Terminolojisi — DİKKAT

Bu dosyada "Agent" kelimesi geçer ama hepsi LLM agent DEĞİLDİR. Her katmanı doğru
araçla yaz:

| Katman | Tip | LLM kullanır mı? |
|---|---|---|
| 1. Discovery | Deterministik servis | Hayır |
| 2. Enrichment | Deterministik servis | Hayır |
| 3. Gap Analysis | Hybrid (kural + AI özet) | Kısmen |
| 4. Opportunity Scoring | Deterministik + AI gerekçe | Kısmen |
| 5. Solution Recommendation | AI | Evet |
| 6. Sales Strategy | AI | Evet |
| 7. Build Prompt | AI | Evet |
| 8. QA | AI | Evet |

`lib/agents/` klasörü orchestration içindir; deterministik mantık `lib/scoring/`,
`lib/discovery/`, `lib/enrichment/` altında ayrı durur.

---

## 6. Veri Toplama Stratejisi

> KARAR: Provider soyutlaması yaz. Tek bir scraper'a bağlı kalma.

`lib/discovery/` altında bir `DiscoveryProvider` interface'i tanımla:

```ts
interface DiscoveryProvider {
  search(input: DiscoveryInput): Promise<RawBusiness[]>;
}
```

- **Varsayılan / önerilen:** Google Places API (resmi, kalıcı, öngörülebilir maliyet)
- **Fallback:** RapidAPI tabanlı Maps scraper (ucuz ama ToS-riskli, kapanabilir)

Provider seçimi env veya config ile yapılır; üst katmanlar hangi provider'ın
kullanıldığını bilmez. Bir provider çökerse proje çökmez.

> NOT: Yuşa farklı bir provider stratejisi belirtirse bu bölüm güncellenecek.

Sosyal medya kaynakları (Instagram, Facebook, Yelp, TripAdvisor, LinkedIn) MVP'de
YOK — Phase 2+ opsiyonel. Bunlar ToS açısından riskli; eklenirken ayrı değerlendirilir.

---

## 7. Modül Detayları

### 7.1 Lead Discovery

Seçilen kategori + konum + radius için yerel işletmeleri bulur.

```ts
type BusinessLead = {
  id: string;
  name: string;
  category: string;
  address?: string; city?: string; country?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  photos?: string[];
  socialLinks?: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
  source: "google_maps" | "manual" | "import";
  createdAt: string;
};
```

Sonuçlar `place_id` / kaynak ID üzerinden tekilleştirilir — aynı işletme iki kez kaydedilmez.

### 7.2 Business Enrichment

Ham veriyi daha derin bir işletme profiline çevirir. **Bu katman deterministiktir** —
website fetch + teknik kontroller (HTTP durum, SSL, PageSpeed, responsive meta, form
varlığı, CTA varlığı). LLM kullanma.

Örnek çıktı (yalnızca biçimi gösterir — birebir kopyalanacak gerçek değerler değildir):

```json
{
  "hasWebsite": false,
  "hasInstagram": true,
  "hasReservationSystem": false,
  "hasWhatsAppCTA": true,
  "mobileExperience": "unknown",
  "brandQuality": "medium",
  "digitalMaturityScore": 42
}
```

Bilinmeyen alan → `null` veya `"unknown"`. Asla varsayma.

### 7.3 Digital Gap Analysis

Dijital zayıflıkları satış fırsatına çevirir. Önce industry template ile kural-tabanlı
eksik tespiti, sonra AI ile kısa özet.

**Gap kategorileri:** No website, outdated website, no online booking, no QR menu,
no WhatsApp CTA, no review funnel, weak SEO, poor mobile, no landing page, no lead
capture, no automation, no AI assistant, no analytics, weak branding, no service
pages, no pricing/menu page.

**Industry templates** (`lib/templates/` altında):

- **Klinik:** website, doktor profilleri, randevu formu, WhatsApp CTA, tedavi
  sayfaları, hasta güven sinyalleri, harita, yerel SEO
- **Kafe/Restoran:** QR menü, online menü, website, Instagram galeri, review funnel,
  rezervasyon CTA, mobil menü deneyimi
- **Güzellik salonu/Berber:** booking sistemi, hizmet listesi, before/after galeri,
  WhatsApp booking, personel profilleri, Instagram dönüşümü

### 7.4 Opportunity Scoring

Her işletmeyi ticari fırsata göre puanlar. Her işletme eşit değildir.

```ts
type OpportunityScoreInput = {
  hasWebsite: boolean; websiteQualityScore?: number;
  rating?: number; reviewCount?: number; category: string;
  hasPhone?: boolean; hasSocialMedia?: boolean;
  digitalGapCount: number; highIntentGapCount: number;
  estimatedTicketSize: number;
  competitionLevel?: "low" | "medium" | "high";
};

type OpportunityScore = {
  score: number;                 // 0-100, DETERMİNİSTİK hesaplanır
  priority: "low" | "medium" | "high" | "urgent";
  closeProbability: number;
  estimatedDealValue: { min: number; max: number; currency: "USD" | "EUR" | "TRY" };
  reasoning: string;             // AI ile üretilir
};
```

Yüksek skor: güçlü Google yorumları, yüksek yorum sayısı, eksik/zayıf website,
iletişim verisi var, yüksek dönüşüm potansiyelli kategori, net dijital eksikler.
Düşük skor: düşük aktivite, iletişim yok, zaten güçlü dijital varlık, zayıf talep.

### 7.5 Solution Recommendation

Satılabilir dijital çözüm teklifleri üretir.

```ts
type SolutionType =
  | "business_website" | "landing_page" | "qr_menu" | "booking_system"
  | "whatsapp_automation" | "review_funnel" | "seo_pages" | "ai_chatbot"
  | "crm_setup" | "analytics_tracking" | "social_media_landing_page";

type SolutionRecommendation = {
  primaryOffer: {
    title: string; description: string; whyThisBusinessNeedsIt: string;
    expectedImpact: string; estimatedBuildTime: string; estimatedPriceRange: string;
  };
  secondaryOffers: Array<{ title: string; description: string }>;
  upsellOffers: Array<{ title: string; description: string }>;
};
```

### 7.6 Sales Strategy Generation

Freelancer/ajanslar için pratik satış varlıkları üretir: short pitch, cold email,
Instagram DM, WhatsApp mesajı, discovery call opener, objection handling, proposal
summary, value proposition.

**Ton kuralları:** spesifik, profesyonel, agresif değil, spam değil, gerçek
gözlemlenen eksiklere dayalı, işletme değerine odaklı, kısa ve anlaşılır.

### 7.7 Build Prompt Generation

Claude/Cursor için uygulamaya hazır prompt üretir: business context, önerilen çözüm,
tech stack, sayfa yapısı, gerekirse DB şeması, component'ler, admin paneli, user
flow, stil yönü, deployment notları.

### 7.8 QA

Hallucination ve tutarlılık kontrolü. Önerilerin gerçek veriye dayanıp dayanmadığını
doğrular, zayıf varsayımları işaretler.

Örnek çıktı (yalnızca biçimi gösterir):

```json
{ "isValid": true, "warnings": [], "confidence": 0.87 }
```

---

## 8. AI Kuralları (Bağlayıcı)

- Claude eksik veriyi ASLA uydurmaz. Website durumu bilinmiyorsa "unknown" der.
- Instagram bulunamadıysa var olduğunu varsaymaz. Scraper alanı vermiyorsa `null` saklanır.
- AI çıktısı her zaman şu üçlüyü ayırır (örnek — yalnızca biçimi gösterir):

```json
{
  "observedFact": "İşletmenin listelenmiş bir web sitesi yok.",
  "inference": "Potansiyel müşteriler iletişime geçmeden önce daha az güven duyabilir.",
  "opportunity": "Randevu CTA'lı modern bir web sitesi inşa et."
}
```

- Tüm AI JSON çıktıları Zod ile doğrulanır. Doğrulama başarısızsa retry veya hata.

---

## 9. Maliyet Kontrolü (Bağlayıcı)

> 8 katmanlı bir pipeline her lead için ciddi token yakar. Bu kurallar zorunludur.

- AI çağrısından önce sonuç cache'te mi bak (Upstash Redis). Aynı `business_id`
  için sonuç DB'de varsa onu kullan, yeniden üretme.
- AI sağlayıcı soyutlanır: `lib/ai/` altında bir `AIProvider` interface'i tanımla.
  Env ile seçilir (`AI_PROVIDER`): geliştirme/test için `openrouter_free` (ücretsiz
  modeller), üretim için `anthropic`. Üst katmanlar hangi sağlayıcının kullanıldığını
  bilmez — sağlayıcı değişimi tek env değişikliğidir, kod değişmez.
- Model seçimi (anthropic kullanılırken): reasoning/üretim için `claude-sonnet`,
  ucuz sınıflandırma/QA için `claude-haiku`.
- DİKKAT: Ücretsiz modeller düşük rate limit'e sahiptir ve haber vermeden kapanabilir;
  yapılandırılmış JSON üretimi zayıf olabilir. Bu yüzden `AIProvider` soyutlaması
  zorunludur — hiçbir modele kilitlenme.
- Deterministik çözülebilen hiçbir şey için AI çağrısı yazma (bkz. Bölüm 4).
- Toplu tarama her zaman queue üzerinden, batch halinde — HTTP request içinde bloklama yok.
- Her AI çağrısının token kullanımı `ai_usage` tablosuna loglanır; admin panelde izlenir.
- Kullanıcı kredisi her pipeline çağrısından ÖNCE backend'de kontrol edilir.

---

## 10. Teknoloji Stack'i

**Frontend:** Next.js 14 (App Router, ESM `next.config.mjs`), TypeScript (strict), Tailwind CSS,
shadcn/ui, Framer Motion, Lucide Icons, Recharts

**Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions), Row Level Security

**AI:** Sağlayıcı `AIProvider` interface'i ile soyutlanır (bkz. Bölüm 9). Üretimde
Anthropic Claude API, geliştirme/test'te OpenRouter ücretsiz modeller. Prompt
template'leri `lib/prompts/` altında dosya olarak (DB'de değil — versiyonlanabilir
ve diff'lenebilir olsun). Yapılandırılmış JSON çıktı + Zod doğrulama.

**Background jobs:** Upstash QStash (queue) + Upstash Redis (cache + rate limit).
Alternatif: Inngest / Trigger.dev. Tek seçim yap, proje boyunca tutarlı kal.

**Payments:** Stripe (Phase 5).

**Deployment:** Vercel (frontend), Supabase (db/auth/storage). Uzun scraping
işleri için opsiyonel ayrı worker.

---

## 11. Veri Modeli

> Bu bölüm kavramsal modeldir, çalıştırılabilir şema DEĞİLDİR.
> Şemanın tek doğru kaynağı (source of truth) `supabase/migrations/` altındaki
> migration dosyalarıdır. Tablo/alan ihtiyaç oldukça gelişebilir — yeni bir alan
> veya tablo gerektiğinde bir migration yaz, sonra bu bölümdeki kavramsal modeli
> güncelle. Aşağıdaki yapı bağlayıcı bir başlangıç noktası ve ilişki haritasıdır.

### Genel kurallar

- Her tabloda `id` (uuid, primary key) ve `created_at` (timestamptz) bulunur.
- Tüm tablolarda Supabase RLS açık — kullanıcı yalnızca kendi `user_id` verisini görür.
- Alt kayıtlar üst kayda `... on delete cascade` ile bağlanır.
- Esnek/şekli değişebilen veriler (`gaps`, `raw_data`, `enrichment_data`,
  çözüm teklifleri) `jsonb` alanlarda tutulur — şema katılığı yaratmaz, kolay evrilir.
- Pipeline çıktıları AI üretimi olduğundan, bir aşama tablosu yeniden yazılabilir
  (idempotent) — `business_id` başına en güncel sonuç tutulur.

### Varlıklar ve sorumlulukları

| Tablo | Sorumluluk | Önemli alanlar / ilişkiler |
|---|---|---|
| `users` | Hesap, rol, plan, kredi | `plan` (free varsayılan), `credits` (varsayılan 20). `credits` MVP'de aktif; `plan` katmanları Phase 5'te Stripe'a bağlanır |
| `businesses` | Keşfedilen ham işletme | `user_id`'ye bağlı. `place_id` taşır; `(user_id, place_id)` tekil — aynı işletme iki kez kaydedilmez. Ham sağlayıcı verisi `raw_data` jsonb |
| `business_enrichments` | Deterministik dijital profil | `business_id`'ye bağlı. Boolean teknik sinyaller + `digital_maturity_score`. Ham detay `enrichment_data` jsonb |
| `gap_analyses` | Dijital eksikler | `business_id`'ye bağlı. `gaps` jsonb + `severity_score` + kısa `summary` |
| `opportunities` | Fırsat skoru ve durumu | `business_id`'ye bağlı. `opportunity_score`, `priority`, tahmini deal aralığı, `close_probability`, `status` (bkz. Bölüm 12 statüleri) |
| `solution_recommendations` | Önerilen çözümler | `business_id` + `opportunity_id`'ye bağlı. primary / secondary / upsell teklifler jsonb |
| `sales_strategies` | Üretilen satış varlıkları | `business_id` + `opportunity_id`'ye bağlı. pitch, cold email, DM, WhatsApp mesajı, objection handling, proposal summary |
| `build_prompts` | Üretilen build prompt'ları | `business_id` + `opportunity_id`'ye bağlı. `prompt_body`, `target_tool`, `tech_stack` jsonb |
| `scan_jobs` | Tarama işi takibi | `user_id`'ye bağlı. konum/kategori/radius, `status`, bulunan/analiz edilen sayıları, hata mesajı, tamamlanma zamanı |
| `ai_usage` | Token & maliyet logu | `user_id`'ye bağlı (opsiyonel `business_id`). `stage`, `model`, input/output token, `cost_usd`. Maliyet kontrolü ve admin paneli için (bkz. Bölüm 9) |

### İlişki haritası

```text
users 1──* businesses 1──1 business_enrichments
                      1──1 gap_analyses
                      1──1 opportunities 1──1 solution_recommendations
                                         1──1 sales_strategies
                                         1──1 build_prompts
users 1──* scan_jobs
users 1──* ai_usage
```

---

## 12. SaaS Yapısı

**Landing (`/`):** Hero, Problem, Product Demo, How It Works, Use Cases, Dashboard
Preview, Pricing, FAQ, CTA. Hero: "Find local businesses that actually need your services."

**User Dashboard (`/dashboard`):** Overview, Lead Discovery, Opportunities, Business
Reports, Campaigns, Prompt Studio, Saved Leads, CRM, Analytics, Settings.
Overview kartları: Total Leads, High Opportunity Leads, Average Opportunity Score,
Estimated Revenue Potential, AI Strategies Generated, Build Prompts Generated.

**Business Report (`/dashboard/business/[id]`)** — ürünün "magic moment" sayfası:
Business Summary, Digital Presence, Gap Analysis, Opportunity Score, Recommended
Solution, Sales Strategy, Build Prompt, Notes, Export Options.

**Opportunity statuses:** New, Analyzed, Saved, Contacted, Proposal Sent, Won, Lost.

**Admin (`/admin`):** user/subscription/credit yönetimi, AI usage & token cost
takibi, scan job monitoring, prompt & industry template & scoring rule yönetimi,
system analytics, error logs.

---

## 13. Uygulama Route'ları

```text
/  /pricing  /login  /register
/dashboard  /dashboard/discovery  /dashboard/opportunities
/dashboard/business/[id]  /dashboard/prompt-studio
/dashboard/campaigns  /dashboard/settings
/admin  /admin/users  /admin/templates  /admin/jobs  /admin/usage
```

---

## 14. UI/UX Yönü

Modern AI SaaS görünümü: premium, dark/light hazır, temiz, analitik, profesyonel-
fütüristik, dashboard-first, yüksek kontrast, "data intelligence" hissi.

**Renk:** Deep navy + electric blue + cyan aksanlar, white/slate arka plan.
Opportunity skoru için yeşil, orta öncelik amber, sadece kritik eksikler için kırmızı.

**Component'ler:** yuvarlak kartlar, yumuşak gölgeler, veri tabloları, skor rozetleri,
durum pill'leri, temiz empty state'ler, AI insight kutuları, export butonları,
adım-tabanlı workflow UI.

---

## 15. Klasör Yapısı

```text
src/
  app/
  components/
  lib/
    ai/            # AIProvider interface + anthropic/openrouter implementasyonları, model seçimi, JSON parse
    agents/        # pipeline orchestration
    discovery/     # DiscoveryProvider interface + Places/RapidAPI implementasyonları
    enrichment/    # deterministik website analizi
    scoring/       # deterministik opportunity scoring
    templates/     # industry gap template'leri
    prompts/       # AI prompt dosyaları (versiyonlanabilir)
    validators/    # Zod şemaları
    supabase/
  types/
  hooks/
  server/
```

---

## 16. Güvenlik Kuralları

- API anahtarları asla frontend'de olmaz; env'de saklanır.
- Scraping/discovery ve AI çağrıları yalnızca sunucu tarafında (route handler /
  edge function).
- Supabase RLS politikaları zorunlu — kullanıcılar başka kullanıcının kaydını göremez.
- Tüm AI JSON çıktıları doğrulanır (Zod).
- Scan job'lar rate-limit'lenir. Kredi takibi backend'de.
- AI kullanımı ve scraper maliyeti loglanır (`ai_usage`).

---

## 17. Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://loexai.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI sağlayıcı — bkz. Bölüm 9
AI_PROVIDER=openrouter_free          # openrouter_free | anthropic
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=

# Discovery providers — en az biri
GOOGLE_PLACES_API_KEY=
RAPIDAPI_KEY=
DISCOVERY_PROVIDER=google_places   # google_places | rapidapi

# Phase 5
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_QSTASH_TOKEN=
```

`.env.local` asla commit edilmez. `.env.example` güncel tutulur.

---

## 18. MVP Kapsamı

**MVP'de OLACAK:** Landing, auth, dashboard, lead discovery formu, discovery
provider entegrasyonu, business tablosu, business detay raporu, digital gap
analizi, opportunity score, solution recommendation, sales pitch üretimi, build
prompt üretimi, kredi sistemi, admin panel temelleri, 8 katmanlı pipeline.

**MVP'de OLMAYACAK:** Tam CRM otomasyonu, otomatik outreach, email gönderimi,
takım çalışması, white-label, Stripe katmanlı faturalama, çoklu kaynak scraping
(sosyal medya), gelişmiş analytics. Bunlar ilk çalışan versiyondan sonra eklenir.

---

## 19. Geliştirme Fazları

1. **Foundation** — Next.js, Supabase, auth, ilk migration'lar (Bölüm 11 modeli), landing, dashboard & admin layout
2. **Lead Discovery** — scan formu, DiscoveryProvider entegrasyonu, business kaydı, dedup, lead tablosu
3. **Intelligence Pipeline** — enrichment, gap analysis, industry template'ler, scoring, recommendation
4. **AI Output** — sales strategy, build prompt, QA, rapor export
5. **SaaS Layer** — Stripe faturalama & plan katmanları, usage log UI, admin yönetim, error monitoring

---

## 20. Kod Kalitesi Kuralları

- Her yerde TypeScript strict. Gerekçesiz `any` yok.
- Hassas işlemler server action / route handler'da.
- AI prompt'ları ayrı dosyalarda (`lib/prompts/`).
- Doğrulama için Zod.
- UI component'leri içine iş mantığı gömme. Şu katmanlar ayrı durur:
  data fetching / AI generation / scoring logic / UI rendering.
- Dış API çağrıları `lib/` altında izole wrapper'larda.
- Hata yönetimi: bir pipeline aşaması patlarsa kısmi sonuç kaydedilir, akış tümden çökmez.

---

## 21. AI Asistanına Çalışma Talimatı

1. Önce ilgili mevcut dosyaları oku; mimariyi bozma.
2. Deterministik çözüm mümkünse AI çağrısı ekleme (Bölüm 4 & 9).
3. MVP kapsamı dışındaki özellikleri kendiliğinden ekleme — sor (Bölüm 18).
4. Belirsizlikte varsayım yapıp ilerlemek yerine net soru sor.
5. Her yeni dış servisi `lib/` deseni içinde, soyutlama ile ekle.
6. Maliyet/kredi etkisi olan her değişikliği açıkça belirt.
7. Bu dosyayla çelişen bir şey görürsen, sessizce karar verme — işaretle.

---

## 22. Nihai Ürün Prensibi

> Doğru işletmeyi bul, doğru problemi tespit et, doğru teklifi öner, doğru pitch'i
> üret, doğru build planını oluştur.

Her özellik bu döngüyü desteklemelidir.

**Uzun vadeli vizyon:** agency operating system, AI sales intelligence platform,
local business digital transformation marketplace, otomatik proposal generator,
white-label platform. (Hiçbiri MVP'yi etkilemez.)
