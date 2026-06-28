# 🍈 Papaya v2 — Supabase Kurulumu

Gerçek hesaplar, gerçek zamanlı mesajlaşma, medya, oyun ve bildirimler için
Papaya bir **Supabase** projesine bağlanır. Frontend GitHub Pages'te statik
kalır; Supabase ayrı bir bulut servisidir ve tarayıcıdan doğrudan konuşur.
(Anahtar yoksa uygulama **mock fallback** ile çalışmaya devam eder.)

## 1) Supabase projesi oluştur
1. https://supabase.com → **New project** (ücretsiz katman yeterli).
2. **Project Settings → API**'den şunları kopyala:
   - `Project URL`  → `VITE_SUPABASE_URL`
   - `anon public`  → `VITE_SUPABASE_ANON_KEY`

> `anon key` public olacak şekilde tasarlıdır; güvenlik **RLS** ile DB'de sağlanır.

## 2) Şemayı yükle
**SQL Editor**'ı aç → `supabase/migrations/0001_init.sql` içeriğini yapıştır →
**Run**. Tüm tablolar, RLS politikaları, realtime yayını ve storage bucket'ları
oluşur.

## 3) Auth ayarı
**Authentication → URL Configuration**:
- **Site URL**: `https://myp-beep.github.io/Papaya/`
- **Redirect URLs**'e ekle: `https://myp-beep.github.io/Papaya/` ve
  `http://localhost:5173/` (yerel geliştirme).
- **Email** sağlayıcısı açık (magic link / şifre). İstersen Google OAuth ekle.

## 4) Anahtarları yere koy
### Yerel geliştirme
```bash
cp .env.example .env
# .env içine VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY yaz
npm run dev
```
### Canlı (GitHub Pages)
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Sonraki push'ta workflow bunları derlemeye gömer ve canlı sürüm gerçek backend'e bağlanır.

## 5) (Sonraki fazlar)
- **Push bildirim:** VAPID anahtar çifti + `send-push` Edge Function (Faz 6'da kurarız).
- **Görüntülü arama:** public STUN ile çalışır; katı NAT için TURN (opsiyonel).

---
Anahtarları verdiğinde haber ver — gerçek Auth + realtime'ı aktive edip
canlıda iki cihazla test ederiz.
