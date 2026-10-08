import { Trophy } from 'lucide-react-native';
import { View } from 'react-native';

import { CoinIcon } from '@/components/art/items';
import { OrderCard } from '@/components/orders';
import { Bar, Button, Card, IconBadge, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { ACHIEVEMENTS, MAX_ORDERS } from '@/game/data';
import { achievementProgress, useGame } from '@/game/store';
import { C, S } from '@/theme';

/**
 * Goals: the customers' orders to fill before they give up, and the
 * achievements, each with how far along the farm is and its reward to take.
 */
export default function GoalsScreen() {
  const state = useGame();
  const claimable = ACHIEVEMENTS.filter((a) => state.achievements.includes(a.id) && !state.claimed.includes(a.id)).length;
  // Rewards to take first, then the nearest to done, then the rest; taken ones last.
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const rank = (x: (typeof ACHIEVEMENTS)[number]) =>
      state.claimed.includes(x.id) ? 3 : state.achievements.includes(x.id) ? 0 : 1 + (1 - Math.min(1, achievementProgress(state, x) / x.target));
    return rank(a) - rank(b);
  });

  return (
    <Screen bottomGap={40} header={<TopBar title="Görevler" subtitle={`${state.stats.orders} sipariş teslim edildi · ${state.achievements.length}/${ACHIEVEMENTS.length} başarım`} />}>
      <SectionHeader title="Siparişler" subtitle={`Her sabah yeni müşteri gelir · en fazla ${MAX_ORDERS} sipariş`} />
      {state.orders.length ? (
        state.orders.map((o) => <OrderCard key={o.id} order={o} />)
      ) : (
        <Card>
          <Txt v="body">Şu an sipariş yok. Yarın sabah yeni müşteriler gelecek.</Txt>
        </Card>
      )}

      <SectionHeader title="Başarımlar" subtitle={claimable ? `${claimable} ödül seni bekliyor` : 'Hedeflere ulaştıkça ödül kazan'} />
      {sorted.map((a) => {
        const done = state.achievements.includes(a.id);
        const taken = state.claimed.includes(a.id);
        const at = Math.min(a.target, achievementProgress(state, a));
        return (
          <Card key={a.id} style={{ gap: S.sm, padding: S.md, opacity: taken ? 0.6 : 1 }}>
            <Row gap={S.md}>
              <IconBadge tint={done ? C.amberSoft : C.page} size={40}>
                <Trophy size={18} color={done ? C.amber : C.muted} />
              </IconBadge>
              <View style={{ flex: 1 }}>
                <Txt v="label">{a.name}</Txt>
                <Txt v="caption">{a.goal}</Txt>
              </View>
              <Row gap={4}>
                <CoinIcon size={14} />
                <Txt v="label">{a.reward}</Txt>
              </Row>
            </Row>
            {done && !taken ? (
              <Button small label={`Ödülü al · ${a.reward} altın`} onPress={() => useGame.getState().claim(a.id)} />
            ) : taken ? (
              <Pill text="Ödül alındı" tone="green" />
            ) : (
              <Row gap={S.sm}>
                <View style={{ flex: 1 }}>
                  <Bar value={(at / a.target) * 100} color={C.amber} track={C.amberSoft} />
                </View>
                <Txt v="caption">
                  {at.toLocaleString('tr-TR')} / {a.target.toLocaleString('tr-TR')}
                </Txt>
              </Row>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
