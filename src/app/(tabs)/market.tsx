import { router } from 'expo-router';
import { Lock, PawPrint, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinIcon, ItemIcon } from '@/components/art/items';
import { Button, Card, Chip, Pill, Row, SectionHeader, Txt } from '@/components/ui';
import { dayOf, seasonOf } from '@/game/clock';
import { CROPS, ITEMS, SEASONS, type ItemId, type ItemKind } from '@/game/data';
import { buyPrice, happeningFor, levelOf, priceMultiplier, sellPrice, useGame } from '@/game/store';
import { C, F, R, S } from '@/theme';

const SUPPLIES: ItemId[] = ['hay', 'grain', 'fish_feed', 'fertilizer', 'medicine'];
const SELL_GROUPS: { kind: ItemKind; title: string }[] = [
  { kind: 'goods', title: 'İşlenmiş ürünler' },
  { kind: 'crop', title: 'Tarla ürünleri' },
  { kind: 'produce', title: 'Hayvan ürünleri' },
  { kind: 'fish', title: 'Balıklar' },
];

/** The seasons a seed can go in, for the seed rows. */
function seasonsOf(id: ItemId): string | null {
  const crop = Object.values(CROPS).find((c) => c.seed === id);
  return crop ? crop.seasons.map((x) => SEASONS[x].name).join(', ') : null;
}

function seedLevel(id: ItemId): number {
  return Object.values(CROPS).find((c) => c.seed === id)?.level ?? 1;
}

function BuyRow({ id, locked }: { id: ItemId; locked: boolean }) {
  const have = useGame((s) => s.inventory[id] ?? 0);
  const season = useGame((s) => seasonOf(dayOf(s.minutes)));
  const crop = Object.values(CROPS).find((c) => c.seed === id);
  const inSeason = !crop || crop.seasons.includes(season);
  const coins = useGame((s) => s.coins);
  const item = ITEMS[id];
  const price = buyPrice(id);
  const buy = useGame.getState().buy;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, opacity: locked ? 0.55 : 1 }}>
      <ItemIcon id={id} size={44} />
      <View style={{ flex: 1 }}>
        <Txt v="label">{item.name}</Txt>
        <Row gap={4}>
          <CoinIcon size={13} />
          <Txt v="caption">
            {price} / {item.unit} · elinde {have}
          </Txt>
        </Row>
        {crop ? (
          <Txt v="caption" style={{ color: inSeason ? C.green : C.amber }} numberOfLines={1}>
            {inSeason ? 'Mevsimi' : 'Mevsim dışı, yavaş büyür'} · {seasonsOf(id)}
          </Txt>
        ) : null}
      </View>
      {locked ? (
        <Row gap={4}>
          <Lock size={14} color={C.muted} />
          <Txt v="caption">Sv. {seedLevel(id)}</Txt>
        </Row>
      ) : (
        <Row gap={6}>
          <Button small kind="soft" label="+1" onPress={() => buy(id, 1)} disabled={coins < price} />
          <Button small label="+5" onPress={() => buy(id, 5)} disabled={coins < price * 5} />
        </Row>
      )}
    </Card>
  );
}

function SellRow({ id }: { id: ItemId }) {
  const have = useGame((s) => s.inventory[id] ?? 0);
  const day = useGame((s) => dayOf(s.minutes));
  const mult = priceMultiplier(day, id);
  const price = sellPrice(day, id);
  const sell = useGame.getState().sell;
  const up = mult >= 1;
  const h = happeningFor(day);
  const boom = h?.kind === 'boom' && h.item === id;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md }}>
      <ItemIcon id={id} size={44} />
      <View style={{ flex: 1 }}>
        <Txt v="label">{ITEMS[id].name}</Txt>
        <Row gap={6}>
          <CoinIcon size={13} />
          <Txt v="caption" style={{ color: C.ink, fontFamily: F.semibold }}>{price}</Txt>
          {up ? <TrendingUp size={14} color={C.greenMid} /> : <TrendingDown size={14} color={C.rose} />}
          <Txt v="caption">× {have}</Txt>
          {boom ? <Pill text="Bugün 2 kat!" tone="green" /> : null}
        </Row>
      </View>
      <Row gap={6}>
        <Button small kind="soft" label="1" onPress={() => sell(id, 1)} disabled={!have} />
        <Button small label="Hepsi" onPress={() => sell(id, have)} disabled={!have} />
      </Row>
    </Card>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'buy' | 'sell'>('sell');
  const coins = useGame((s) => s.coins);
  const inventory = useGame((s) => s.inventory);
  const level = levelOf(useGame((s) => s.xp));
  const day = useGame((s) => dayOf(s.minutes));
  const sellKind = useGame.getState().sellKind;
  const seeds = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'seed').sort((a, b) => seedLevel(a) - seedLevel(b));

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + S.md, paddingBottom: 120 + insets.bottom, paddingHorizontal: S.xl, gap: S.lg }} showsVerticalScrollIndicator={false}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt v="display">Pazar</Txt>
            <Txt v="caption">
              {day}. günün fiyatları · {SEASONS[seasonOf(day)].name}
            </Txt>
          </View>
          <Row gap={6} style={{ backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill }}>
            <CoinIcon size={18} />
            <Txt v="label">{coins.toLocaleString('tr-TR')}</Txt>
          </Row>
        </Row>

        <Row gap={S.sm}>
          <Chip label="Sat" active={tab === 'sell'} onPress={() => setTab('sell')} />
          <Chip label="Al" active={tab === 'buy'} onPress={() => setTab('buy')} />
        </Row>

        {(() => {
          const h = happeningFor(day);
          return h?.kind === 'boom' && h.item ? (
            <Card tint={C.greenSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <ItemIcon id={h.item} size={36} />
              <Txt v="label" style={{ flex: 1, color: C.green }}>
                Fiyat patlaması: {ITEMS[h.item].name} bugün iki katına satılıyor!
              </Txt>
            </Card>
          ) : null;
        })()}
        <Card tint={C.amberSoft}>
          <Txt v="caption">Mevsim dışındaki tarla ürünleri %40 daha pahalıya satılır.</Txt>
        </Card>

        {tab === 'buy' ? (
          <>
            <SectionHeader title="Tohum ve fideler" subtitle={`Seviye ${level}`} />
            {seeds.map((id) => (
              <BuyRow key={id} id={id} locked={seedLevel(id) > level} />
            ))}
            <SectionHeader title="Yem ve malzeme" />
            {SUPPLIES.map((id) => (
              <BuyRow key={id} id={id} locked={false} />
            ))}
            <Card onPress={() => router.push('/livestock')} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <PawPrint size={20} color={C.rose} />
              <Txt v="label" style={{ flex: 1 }}>Hayvan almak için Hayvanlar ekranına git</Txt>
            </Card>
          </>
        ) : (
          <>
            {SELL_GROUPS.map((g) => {
              const items = (Object.keys(inventory) as ItemId[]).filter((id) => ITEMS[id].kind === g.kind && (inventory[id] ?? 0) > 0);
              const total = items.reduce((n, id) => n + sellPrice(day, id) * (inventory[id] ?? 0), 0);
              return (
                <View key={g.kind} style={{ gap: S.md }}>
                  <SectionHeader
                    title={g.title}
                    subtitle={items.length ? `Hepsi ${total} altın eder` : 'Satacak bir şey yok'}
                    action={items.length ? <Button small label="Hepsini sat" onPress={() => sellKind(g.kind)} /> : <Pill text="Boş" tone="muted" />}
                  />
                  {items.map((id) => (
                    <SellRow key={id} id={id} />
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
