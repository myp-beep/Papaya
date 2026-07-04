# Papaya Projesi — opencode Bilgileri

Papaya, Vite + React 18 + TypeScript ile build edilmis bir super uygulama.
Mesajlasma, oyunlar (3D co-op, kart savasi, XOX, amiral batti), canli yayin,
sosyal akis ve kesfet modulleri icerir.

---

## Komutlar

- npm run dev — Gelistirme sunucusu (port 5173)
- npx tsc --noEmit — TypeScript tip kontrolu
- npx vite build — Production build (dist/)
- npm run build — tsc + vite build (ikisini birden yapar)
- npm run preview — Build sonucu onizleme

**Derleme sarti:** tsc --noEmit 0 hata vermeli, vite build basarili olmali.

---

## Proje Yapisi

src/
  App.tsx              Router + uygulama iskeleti (HashRouter)
  main.tsx             Giris noktasi
  types.ts             Global TypeScript tipleri
  index.css            Tailwind + ozel animasyonlar

  components/          Paylasilan UI bilesenleri
    AppShell.tsx       Tab bar kabugu (Outlet + TabBar)
    TabBar.tsx         Alt navigasyon
    cards/             Kart Savasi bilesenleri
      CardView.tsx, CardHand.tsx, CardBoard.tsx
      CardAnimation.tsx, HeroSelect.tsx
    AchievementToast.tsx, GameInviteListener.tsx
    Character.tsx, Enemy.tsx, Minimap.tsx (3D)
    FishingMinigame.tsx, QuestPanel.tsx
    EmoteWheel.tsx, QuickChat.tsx, PingMarker.tsx

  pages/               Sayfa bilesenleri (22 sayfa)
    CardBattlePage.tsx     Kart Savasi ana oyun
    DeckBuilderPage.tsx    Deste olusturucu
    CardCollectionPage.tsx Koleksiyon + paket
    CardGalleryPage.tsx    Kart galerisi
    GamesPage.tsx          Oyun listesi
    CoopQuestPage.tsx      3D Krallik (lazy)
    + 16 diger sayfa

  data/                State yonetimi (localStorage)
    cardStore.ts, cardAi.ts, cardHeroes.ts
    cardProgression.ts, statsStore.ts
    authStore.ts, chatStore.ts, friendsStore.ts

  lib/                 Utility kutuphaneleri
    supabase.ts, sound.ts, haptics.ts
    battleshipGame.ts

  utils/time.ts

---

## Teknoloji

React 18, TypeScript 5.6 (strict), Vite 5 (base ./),
Tailwind CSS 3, React Router 6 (HashRouter),
Supabase JS v2 (realtime chat, arkadaslik),
Three.js / R3F (3D co-op, lazy loaded),
Web Audio API (sentezlenmis sesler),
localStorage (tum veri kaliciligi),
Capacitor (mobil, opsiyonel).

---

## Kart Savasi Ozel Kurallar

### Ana dosyalar
- CardBattlePage.tsx — Ana oyun motoru
- cardStore.ts — 60 kart tanimi + token kartlar
- cardAi.ts — 3 seviyeli bot (easy/normal/hard)
- cardHeroes.ts — 4 kahraman
- cardProgression.ts — Coin, toz, paket, daily reward, mac gecmisi

### Kart efektleri
damage, heal, draw, buffAttack, buffHp, freeze, taunt, charge,
dealToAll, destroyRandom, stealLife, win, silence, poison, shield,
summon, copyTarget, transform, frenzy, deathrattle, combo,
returnToHand, reduceCost, discover, addToHand

### Veri akisi
- Koleksiyon: localStorage papaya_card_collection
- Deste: localStorage papaya.cards.deck
- Mac gecmisi: localStorage papaya_card_matches
- Oyun sonu: recordGame() (statsStore) + saveMatch() (cardProgression)

### Kahramanlar
- Savasci (30 HP, +2 atak, 2 mana)
- Buyucu (25 HP, 2 hasar, 2 mana)
- Druid (30 HP, 3 can, 2 mana)
- Golge (25 HP, 1 kart cek + 1 hasar al, 1 mana)

### Bot seviyeleri
- easy: rastgele kart oyna + saldir
- normal: mana egrisi + board kontrolu
- hard: skor tabanli secim, kombo onceligi

---

## Kod Kurallari

1. 0 hata: tsc --noEmit ve vite build her zaman basarili
2. React import: import { useState } from 'react' (default import yok)
3. Stil: Tailwind utility class'lari
4. Ses: sound.ts sfx objesi (WebAudio sentezi)
5. Tipler: global types.ts'de, lokal dosya icinde
6. Yorum yok: kodda yorum kullanma
7. Route ekleme: App.tsx'e import + Route satiri
8. State: spread operator veya map/filter ile guncelle
9. Dosya boyutu: 600+ satiri gecen dosyalari bol

---

## Deployment

- Branch: claude/naber-m9dcoi
- URL: https://myp-beep.github.io/Papaya/
- GitHub Actions ile otomatik deploy
- Build ciktisi: dist/
