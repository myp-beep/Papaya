# 🍈 Papaya

Tek uygulamada **mesajlaşma, oyun ve sosyal** — hem **web** hem **mobil**.
WePlay tarzı sosyal bir "süper uygulama" için genişletilebilir bir temel.

> **Durum:** MVP. Şu an **Sohbet/Mesajlaşma modülü çalışıyor** (mock veri +
> `localStorage` kalıcılığı). Oyun, Keşfet ve Profil sekmeleri tasarımlı
> placeholder olarak hazır, sonraki sürümlerde işlevsel hale gelecek.

## Teknoloji

- **Vite + React + TypeScript** — hızlı, tek kod tabanı
- **Tailwind CSS** — mobil-öncelikli, koyu/canlı (papaya) tema
- **react-router-dom** — sekme bazlı navigasyon
- **Capacitor** — aynı web kodunu iOS/Android'e sarmalar (mobil)
- Veri: React Context + `localStorage` (backend yok, demo/mock)

## Canlı demo

`claude/naber-m9dcoi` dalına her push'ta GitHub Actions otomatik derleyip
GitHub Pages'e deploy eder:

**https://myp-beep.github.io/Papaya/**

> İlk seferde repo ayarlarından **Settings → Pages → Source: GitHub Actions**
> seçili olmalı (workflow bunu otomatik etkinleştirmeyi dener).

## Çalıştırma (web)

```bash
npm install
npm run dev        # http://localhost:5173
```

Üretim derlemesi:

```bash
npm run build      # dist/ üretir
npm run preview    # derlemeyi yerelde önizle
```

## Mobil (Capacitor)

Web kodu doğrudan mobil uygulama olur — yeniden yazım yok.

```bash
npm run build                 # dist/ hazırla
npx cap add android           # (veya ios) native projeyi oluştur
npx cap sync                  # web çıktısını native'e kopyala
npx cap open android          # Android Studio'da aç / çalıştır
```

Capacitor ayarları `capacitor.config.ts` içinde (`webDir: 'dist'`).

## Proje yapısı

```
src/
  App.tsx                 # router + telefon çerçevesi kabuğu
  components/             # AppShell, TabBar, Avatar, EmptyState
  pages/                  # ChatList, ChatRoom (çalışır) + Games/Discover/Profile (placeholder)
  data/                   # mockData (sahte veri) + chatStore (Context + localStorage)
  utils/                  # zaman biçimleme
  types.ts                # User / Conversation / Message tipleri
```

## Çalışan sohbet özellikleri

- Konuşma listesi: son mesaj önizleme, okunmadı rozeti, arama
- Mesajlaşma ekranı: balonlar, gönderme, zaman damgası
- Otomatik sahte cevap ("yazıyor…" animasyonu + bot yanıtı)
- Tüm mesajlar `localStorage`'da kalıcı (yenileyince korunur)

## Yol haritası

1. ✅ İskelet + çalışan Sohbet (mevcut)
2. ⏳ Oyun modülü (WePlay tarzı mini oyunlar)
3. ⏳ Sosyal akış (gönderi / beğeni / yorum)
4. ⏳ Gerçek backend (kimlik doğrulama + realtime mesajlaşma)
5. ⏳ Native build & mağaza yayını

---

Veriler yalnızca tarayıcıda/cihazda saklanır. Sıfırlamak için tarayıcı
deposunu (`papaya.chat.v1`) temizle.
