# İlk Admin Promote

LoexAI'da admin yetkisi `public.users.role = 'admin'` ile belirlenir
(`CONTEXT.md` D-01). Yeni proje kurulduğunda `users` tablosu boş olduğu için
otomatik bir admin yoktur. **İlk admin'i manuel olarak Supabase Dashboard
üzerinden promote etmek** zorundayız (D-03).

## Neden seeder kullanmıyoruz?

Seeder/env-var ile otomatik admin promote etmek kulağa hoş gelir ama:

- Production'da bir kez çalışır, sonra ölü kod olarak kalır.
- Env değişkenine admin email koymak, repo veya CI sızıntısında hesap kaçırma anlamına gelir.
- Phase 1'de tek geliştirici tek admin promote eder; karmaşıklık değer üretmiyor.

Bu yüzden CONTEXT.md D-03 manuel SQL yöntemini sabitledi.

## Adımlar

1. Supabase projeyi aç → **Authentication → Users**.
2. Eğer email/password sağlayıcısını henüz açmadıysan:
   **Authentication → Providers → Email** → enable.
3. **Site URL** ve **Redirect URLs** ayarlarını yap:
   - Site URL: `http://localhost:3000` (dev) — production'da Vercel domain'i ile değiştir.
   - Redirect URLs: `http://localhost:3000` + Vercel preview URL'in.
4. **Add user (Email)** ile bir kullanıcı oluştur (örn. `myduymaz1980@gmail.com`).
5. Birkaç saniye içinde `public.users` tablosunda satır oluşmalı (PLAN-1A trigger).
   **Table Editor → public.users** sekmesinden doğrula:
   - `email` doğru
   - `role` = `'user'`
   - `credits` = `20`
6. **SQL Editor**'a git ve şu sorguyu çalıştır:
   ```sql
   update public.users
   set role = 'admin'
   where email = 'myduymaz1980@gmail.com';
   ```
7. `select * from public.users where email = 'myduymaz1980@gmail.com';` ile
   `role = 'admin'` olduğunu doğrula.
8. (İsteğe bağlı) Bu adımı projedeki bir log dosyasına not düş — kim, ne zaman
   admin yetkisi aldı sorusu denetim için faydalı.

## Sonraki admin'ler

İlk admin oluştuktan sonra `/admin/users` sayfası (Phase 5'te tam interaktif,
Phase 1'de read-only) kullanılarak başka kullanıcılar promote edilebilir.
Şimdilik aynı SQL update'i tekrar çalıştır.
