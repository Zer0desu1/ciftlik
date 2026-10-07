import { BedDouble, Bot, Maximize2, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FarmerAvatar } from '@/components/art/weather';
import { Bar, Button, Card, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { clockLabel, dayOf } from '@/game/clock';
import { levelProgress, useGame } from '@/game/store';
import { C, S } from '@/theme';

const TIPS = [
  'Bir oyun saati gerçekte bir dakikadır; bir gün 24 dakika sürer. Uygulama kapalıyken de zaman işler.',
  'Bitkiler toprak nemliyken büyür. Nem %15’in altına inerse büyüme durur, uzun süre kuru kalırsa bitki ölür.',
  'Olgunlaşan ürünü 36 saat içinde topla; yoksa çürür. Gübre hem büyümeyi hızlandırır hem hasadı artırır.',
  'Hayvanlar günde üç öğün (06:00, 12:00, 18:00) yer. Tok ve sağlıklı hayvan süt, yumurta ya da yün verir.',
  'Ahır kirlenirse hayvanların sağlığı bozulur. Sağlığı sıfıra inen hayvan 12 saat içinde ilaç ve yem almazsa ölür.',
  'Tok ve sağlıklı iki yetişkin inek, koyun ya da keçi varsa zamanla biri gebe kalır ve yavru doğurur. Yavrular büyüyünce üretmeye başlar.',
  'Tavuk yumurtalarını kuluçkaya koyarsan 24 saat sonra civciv çıkar. Hayvanlar yaşlandıkça daha az üretir ve bir gün ölür.',
  'Balıklar ancak tok ve su temizken büyür. Büyüyen balıklar havuzda yer varsa yavrular; tutup pazarda da satabilirsin.',
  'Pazar fiyatları her gün değişir. Ok yukarıyı gösteriyorsa bugün satmak için iyi gün.',
  'Seviye atladıkça yeni tohumlar, hayvanlar ve balıklar açılır.',
  'Elektrik faturası her gece kesilir. Güneş paneli ve rüzgâr türbini kurarsan faturan düşer, fazlasını satarsın.',
  'Haritada bir araziye basılı tut, sonra başka bir araziye dokun: ikisi yer değiştirir.',
  'Makineler ve robotlar işleri senin yerine yapar: sulama, çapa, hasat, ekim, yemleme, ürün toplama, temizlik ve su. Açıp kapatabilirsin.',
];

export default function HouseScreen() {
  const state = useGame();
  const lvl = levelProgress(state.xp);
  const [confirmReset, setConfirmReset] = useState(false);
  const { sleep, reset } = useGame.getState();

  return (
    <Screen bottomGap={40} header={<TopBar title="Çiftlik Evi" subtitle={`${dayOf(state.minutes)}. gün · ${clockLabel(state.minutes)}`} />}>
      <Card style={{ alignItems: 'center', gap: S.md }}>
        <FarmerAvatar size={96} />
        <Txt v="title">{state.farmName}</Txt>
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label">Seviye {lvl.level}</Txt>
            <Txt v="caption">
              {lvl.into} / {lvl.span} XP
            </Txt>
          </Row>
          <Bar value={(lvl.into / lvl.span) * 100} color={C.amber} track={C.amberSoft} />
        </View>
        <Row gap={S.xl}>
          <View style={{ alignItems: 'center' }}>
            <Txt v="heading">{state.coins}</Txt>
            <Txt v="caption">Altın</Txt>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt v="heading">{state.animals.length}</Txt>
            <Txt v="caption">Hayvan</Txt>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt v="heading">{dayOf(state.minutes)}</Txt>
            <Txt v="caption">Gün</Txt>
          </View>
        </Row>
      </Card>

      <Card style={{ gap: S.md }}>
        <Txt v="heading">Dinlen</Txt>
        <Txt v="body">Sabah 06:00’ya kadar uyu. Bu arada tarlalar büyür, hayvanlar acıkır ve su buharlaşır; uyumadan önce herkesi besle ve tarlaları sula.</Txt>
        <Button label="Sabaha kadar uyu" icon={<BedDouble size={16} color={C.white} />} onPress={sleep} />
      </Card>

      <Button kind="soft" label="Çiftliği büyüt" icon={<Maximize2 size={16} color={C.green} />} onPress={() => router.push('/upgrades')} />
      <Button kind="soft" label="Makineler ve robotlar" icon={<Bot size={16} color={C.green} />} onPress={() => router.push('/machines')} />

      <SectionHeader title="Nasıl oynanır" />
      <Card style={{ gap: S.md }}>
        {TIPS.map((tip, i) => (
          <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
            <Txt v="label" style={{ color: C.green, width: 18 }}>{i + 1}.</Txt>
            <Txt v="body" style={{ flex: 1 }}>{tip}</Txt>
          </Row>
        ))}
      </Card>

      <Card style={{ gap: S.sm }}>
        <Txt v="label">Baştan başla</Txt>
        <Txt v="caption">Tüm ilerleme silinir ve çiftlik ilk günkü hâline döner.</Txt>
        {confirmReset ? (
          <Row gap={S.sm}>
            <Button kind="ghost" label="Vazgeç" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Button
              kind="danger"
              label="Evet, sıfırla"
              onPress={() => {
                reset();
                setConfirmReset(false);
              }}
              style={{ flex: 1 }}
            />
          </Row>
        ) : (
          <Button kind="ghost" label="Çiftliği sıfırla" icon={<RotateCcw size={15} color={C.green} />} onPress={() => setConfirmReset(true)} />
        )}
      </Card>
    </Screen>
  );
}
