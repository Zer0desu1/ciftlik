import { Clock3 } from 'lucide-react-native';
import { View } from 'react-native';

import { CoinIcon, ItemIcon } from '@/components/art/items';
import { Button, Card, Pill, Row, Txt } from '@/components/ui';
import { dayOf } from '@/game/clock';
import { ITEMS } from '@/game/data';
import { useGame, type Order } from '@/game/store';
import { C, R, S } from '@/theme';

/** One customer's order: what they want, what is in the barn, and the reward. */
export function OrderCard({ order }: { order: Order }) {
  const have = useGame((s) => s.inventory[order.item] ?? 0);
  const today = useGame((s) => dayOf(s.minutes));
  const left = order.dueDay - today;
  const ready = have >= order.qty;
  const item = ITEMS[order.item];
  return (
    <Card style={{ gap: S.sm, padding: S.md }}>
      <Row gap={S.md}>
        <View style={{ width: 52, height: 52, borderRadius: R.md, backgroundColor: C.page, alignItems: 'center', justifyContent: 'center' }}>
          <ItemIcon id={order.item} size={40} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="label" numberOfLines={1}>{order.who}</Txt>
          <Txt v="body" numberOfLines={1}>
            {order.qty} {item.unit} {item.name.toLowerCase()} istiyor
          </Txt>
          <Row gap={6}>
            <Clock3 size={12} color={left <= 0 ? C.rose : C.muted} />
            <Txt v="caption" style={{ color: left <= 0 ? C.rose : C.muted }}>
              {left <= 0 ? 'Bugün son gün' : `${left + 1} gün içinde`}
            </Txt>
          </Row>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Row gap={4}>
            <CoinIcon size={14} />
            <Txt v="label">{order.reward}</Txt>
          </Row>
          <Pill text={`+${order.xp} XP`} tone="amber" />
        </View>
      </Row>
      <Row gap={S.sm}>
        <Txt v="caption" style={{ flex: 1, color: ready ? C.green : C.muted }}>
          Ambarda {have} / {order.qty}
        </Txt>
        <Button small label={ready ? 'Teslim et' : 'Yetmiyor'} onPress={() => useGame.getState().deliver(order.id)} disabled={!ready} />
      </Row>
    </Card>
  );
}
