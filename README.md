# Çiftliğim

Kuşbakışı bir çiftliği yönettiğin bir mobil oyun: ek, sula, hasat et; hayvanları
besle ve ürünlerini topla; balık havuzunu besle ve balık tut; ürünlerini pazarda sat.

Expo (SDK 57) + React Native + TypeScript. iOS, Android ve web'de çalışır.

**Tarayıcıda oyna:** https://zer0desu1.github.io/ciftlik/ — `main`'e her push'ta yeniden yayınlanır.

## Çalıştırma

```bash
npm install
npx expo start     # telefonda Expo Go ile QR kodu okut
npm run web        # tarayıcıda aç
npm test           # oyun kurallarının testleri
```

## Nasıl çalışır

- **Zaman:** 1 gerçek dakika = 1 oyun saati; bir gün 24 dakika. Uygulama kapalıyken
  de zaman işler (en fazla 48 oyun saati telafi edilir).
- **Tarlalar:** Bitkiler toprak nemliyken büyür. Kuruyan bitki ölür, toplanmayan ürün
  çürür. Yabani ot büyümeyi yavaşlatır, gübre hızlandırır ve hasadı artırır.
- **Hayvanlar:** 06:00, 12:00 ve 18:00 öğünleri. Tok ve sağlıklı hayvan süt, yumurta,
  yün ya da keçi sütü verir. Kirli ahır ve açlık sağlığı bozar.
- **Üreme:** Tok ve sağlıklı iki yetişkin inek, koyun ya da keçi varsa zamanla biri gebe kalır
  (inek 48, koyun/keçi 36 oyun saati) ve yavru doğurur. Tavuk yumurtaları kuluçkada 24 saatte
  civcive döner. Yavrular büyüyünce (1–3 oyun günü) üretmeye başlar. Ahır sınırı 40 hayvan.
- **Ölüm:** Sağlığı sıfıra inen hayvan 12 saat içinde ilaç ve yem almazsa ölür (önce uyarı gelir).
  Yaşlanan hayvan daha az üretir ve ömrünü doldurunca ölebilir.
- **Balık havuzu:** Balıklar tok ve su temizken büyür; büyüyenler havuzda yer varsa yavrular.
  Bulanık suda balık ölebilir.
- **Büyütme:** Her tarla 8 parselden 12'ye, sonra 16'ya genişler. Ahır 40 → 60 → 80 hayvan,
  havuz 24 → 36 → 48 balık, su deposu 1000 → 1500 → 2000 litre. Her adımın altın bedeli ve
  seviye şartı var; çiftliğin dönümü büyüdükçe artar.
- **Makineler:** 10 makine ve robot (otomatik sulama, çapa, hasat ve ekim robotları, otomatik
  yemlik, toplama ve temizlik robotları, balık yemleme makinesi, havuz filtresi, güneş enerjili
  pompa) bir kez alınır ve açık kaldıkça işini kendisi yapar; yemi, tohumu ve suyu stoktan kullanır.
- **Pazar:** Fiyatlar her gün değişir. Seviye atladıkça yeni tohum, hayvan ve balıklar açılır.
- **Hava:** Her gün yeni hava; yağmur tarlaları sular, su deposunu ve havuzu doldurur.

## Kod

- `src/game/` — oyunun kuralları: veri (`data.ts`), saat ve hava (`clock.ts`),
  durum ve eylemler (`store.ts`, zustand + AsyncStorage), türetilmiş değerler (`selectors.ts`)
- `src/app/` — ekranlar (Expo Router)
- `src/components/art/` — tüm çizimler (react-native-svg)
- `src/components/farm-map.tsx` — kuşbakışı çiftlik haritası
- `src/theme.ts` — renkler, yazı tipi ve boşluklar
