# Papaya Projesi — opencode Bilgileri

Papaya, Vite + React 18 + TypeScript ile build edilmis bir "super uygulama".
Mesajlasma, oyunlar (3D co-op, kart savasi, XOX, amiral batti), canli yayin,
sosyal akis ve kesfet modulleri icerir.

---

## 🚀 Komutlar

| Komut | Aciklama |
|---|---|
| 
pm run dev | Gelistirme sunucusu (port 5173) |
| 
px tsc --noEmit | TypeScript tip kontrolu |
| 
px vite build | Production build (dist/) |
| 
pm run build | tsc + vite build (ikisini birden yapar) |
| 
pm run preview | Build sonucu onizleme |
| 
pm run cap:sync | Capacitor (mobil) senkronizasyonu |

**Derleme sarti:** 	sc --noEmit 0 hata vermeli, ite build basarili olmali.

---

## 📁 Proje Yapisi

`
src/
├── App.tsx              Router + uygulama iskeleti (HashRouter)
├── main.tsx             Giris noktasi (ReactDOM.createRoot)
├── types.ts             Global TypeScript tipleri (tum moduller)
├── index.css            Tailwind + ozel animasyonlar
├── components/          Paylasilan UI bilesenleri
│   ├── AppShell.tsx     Tab bar kabugu (Outlet + TabBar)
│   ├── TabBar.tsx       Alt navigasyon
│   ├── cards/           Kart Savasi bilesenleri
│   │   ├── CardView.tsx, CardHand.tsx, CardBoard.tsx
│   │   ├── CardAnimation.tsx, HeroSelect.tsx
│   ├── AchievementToast.tsx, GameInviteListener.tsx
│   ├── Character.tsx, Enemy.tsx, Minimap.tsx  (3D)
│   ├── FishingMinigame.tsx, QuestPanel.tsx
│   └── EmoteWheel.tsx, QuickChat.tsx, PingMarker.tsx
├── pages/               Sayfa bilesenleri (22 sayfa)
│   ├── CardBattlePage.tsx  Kart Savasi ana oyun
│   ├── DeckBuilderPage.tsx  Deste olusturucu
│   ├── CardCollectionPage.tsx  Koleksiyon + paket
│   ├── CardGalleryPage.tsx  Kart galerisi
│   ├── GamesPage.tsx  Oyun listesi
│   ├── CoopQuestPage.tsx  3D Krallik (lazy)
│   └── ...diger sayfalar
├── data/                State yonetimi (localStorage)
│   ├── cardStore.ts, cardAi.ts, cardHeroes.ts
│   ├── cardProgression.ts, statsStore.ts
│   └── authStore.ts, chatStore.ts, friendsStore.ts
├── lib/                 Utility kutuphaneleri
│   ├── supabase.ts, sound.ts, haptics.ts
│   └── battleshipGame.ts
└── utils/time.ts
`

---

## 🧱 Teknoloji

| Teknoloji | Kullanim |
|---|---|
| React 18 | UI framework |
| TypeScript 5.6 | Tip guvenligi (strict, noUnusedLocals, noUnusedParameters) |
| Vite 5 | Build tool (base: ./) |
| Tailwind CSS 3 | Stil (utility-first) |
| React Router 6 | Sayfa yonlendirme (HashRouter) |
| Supabase JS v2 | Realtime chat, arkadaslik sistemi |
| Three.js / R3F | 3D co-op oyun (lazy loaded) |
| Web Audio API | Sentezlenmis sesler |
| localStorage | Tum veri kaliciligi |
| Capacitor | Mobil (opsiyonel) |

---

## 🎴 Kart Savasi Ozel Kurallar

### Dosya yapisi
- **CardBattlePage.tsx**: Ana oyun motoru
- **cardStore.ts**: 60 kart tanimi (allCards), token kartlar
- **cardAi.ts**: 3 seviyeli bot (easy/normal/hard)
- **cardHeroes.ts**: 4 kahraman (Savasci/Buyucu/Druid/Golge)
- **cardProgression.ts**: Coin, toz, paket, daily reward, mac gecmisi

### Kart efektleri
damage, heal, draw, buffAttack, buffHp, freeze, taunt, charge,
dealToAll, destroyRandom, stealLife, win, silence, poison, shield,
summon, copyTarget, transform, frenzy, deathrattle, combo,
returnToHand, reduceCost, discover, addToHand

### Veri akisi
- Koleksiyon: localStorage papaya_card_collection
- Deste: localStorage papaya.cards.deck
- Mac gecmisi: localStorage papaya_card_matches
- Oyun sonu: recordGame() + saveMatch()

### Kahramanlar
- Savasci (30 HP) +2 atak (2 mana)
- Buyucu (25 HP) 2 hasar (2 mana)
- Druid (30 HP) 3 can (2 mana)
- Golge (25 HP) 1 kart cek + 1 hasar (1 mana)

---

## 📐 Kod Kurallari

1. **0 hata**: tsc --noEmit ve vite build her zaman basarili
2. **React import**: import { useState } from 'react' (default import yok)
3. **Stil**: Tailwind utility class'lari
4. **Ses**: sound.ts sfx objesi (WebAudio sentezi)
5. **Tipler**: Global tipler types.ts'de, lokal tipler dosya icinde
6. **Yorum yok**: Kodda yorum kullanma
7. **Route ekleme**: App.tsx'e import + Route satiri
8. **Immutability**: State guncellemelerinde spread operator
9. **Dosya boyutu**: 600+ satiri gecen dosyalari bol

---

## 🌐 Deployment

- Branch: claude/naber-m9dcoi
- URL: https://myp-beep.github.io/Papaya/
- GitHub Actions ile otomatik deploy
- Build ciktisi: dist/
