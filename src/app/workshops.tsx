import { ArrowRight, Lock, Zap } from 'lucide-react-native';
import { View } from 'react-native';

import { CoinIcon, ItemIcon } from '@/components/art/items';
import { WorkshopArt } from '@/components/art/workshops';
import { Bar, Button, Card, Pill, Row, Screen, Txt, TopBar } from '@/components/ui';
import { dayOf } from '@/game/clock';
import { ITEMS, WORKSHOP_SLOTS, WORKSHOPS, type WorkshopId } from '@/game/data';
import { levelOf, sellPrice, useGame } from '@/game/store';
import { C, R, S } from '@/theme';

function WorkshopCard({ id }: { id: WorkshopId }) {
  const w = WORKSHOPS[id];
  const shop = useGame((s) => s.workshops[id]);
  const inventory = useGame((s) => s.inventory);
  const minutes = useGame((s) => s.minutes);
  const coins = useGame((s) => s.coins);
  const unpaid = useGame((s) => s.power.unpaid);
  const level = levelOf(useGame((s) => s.xp));
  const { buyWorkshop, craft } = useGame.getState();
  const locked = w.level > level;
  const canMake = w.inputs.every((i) => (inventory[i.item] ?? 0) >= i.qty);
  const inValue = w.inputs.reduce((n, i) => n + sellPrice(dayOf(minutes), i.item) * i.qty, 0);
  const outValue = sellPrice(dayOf(minutes), w.output);

  return (
    <Card style={{ gap: S.md, opacity: locked ? 0.65 : 1 }}>
      <Row gap={S.md}>
        <View style={{ width: 76, height: 76, borderRadius: R.md, backgroundColor: C.page, alignItems: 'center', justifyContent: 'center' }}>
          <WorkshopArt id={id} size={68} busy={!!shop?.jobs.length} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="heading">{w.name}</Txt>
          {/* The recipe: what goes in, what comes out. */}
          <Row gap={4} style={{ flexWrap: 'wrap' }}>
            {w.inputs.map((i, k) => (
              <Row key={i.item} gap={2}>
                {k > 0 ? <Txt v="caption">+</Txt> : null}
                <ItemIcon id={i.item} size={22} />
                <Txt v="caption">{i.qty}</Txt>
              </Row>
            ))}
            <ArrowRight size={14} color={C.muted} />
            <ItemIcon id={w.output} size={22} />
            <Txt v="caption">1 {ITEMS[w.output].name.toLowerCase()}</Txt>
          </Row>
          <Txt v="caption">
            {w.hours} saat · {w.power} kWh/sa · bugün {inValue} altınlık malzeme → {outValue} altın
          </Txt>
        </View>
      </Row>

      {!shop ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={4}>
            <CoinIcon size={14} />
            <Txt v="label">{w.price}</Txt>
            {locked ? <Pill text={`Seviye ${w.level}`} tone="muted" /> : null}
          </Row>
          <Button
            small
            label={locked ? 'Kilitli' : 'Kur'}
            icon={locked ? <Lock size={14} color={C.white} /> : undefined}
            onPress={() => buyWorkshop(id)}
            disabled={locked || coins < w.price}
          />
        </Row>
      ) : (
        <View style={{ gap: S.sm }}>
          {shop.jobs.map((readyAt, k) => {
            const start = k === 0 ? readyAt - w.hours * 60 : shop.jobs[k - 1];
            const done = Math.max(0, Math.min(1, (minutes - start) / (w.hours * 60)));
            const left = Math.max(0, Math.ceil((readyAt - minutes) / 60));
            return (
              <View key={k} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt v="caption">{k === 0 || done > 0 ? `${k + 1}. parti` : `${k + 1}. parti · sırada`}</Txt>
                  <Txt v="caption">{unpaid > 0 ? 'elektrik yok, bekliyor' : `${left} saat`}</Txt>
                </Row>
                <Bar value={done * 100} color={C.amber} track={C.amberSoft} />
              </View>
            );
          })}
          <Button
            label={shop.jobs.length >= WORKSHOP_SLOTS ? 'Sıra dolu' : canMake ? `Üret (${shop.jobs.length}/${WORKSHOP_SLOTS})` : 'Malzeme yetmiyor'}
            icon={<Zap size={16} color={C.white} />}
            onPress={() => craft(id)}
            disabled={!canMake || shop.jobs.length >= WORKSHOP_SLOTS}
          />
        </View>
      )}
    </Card>
  );
}

/** Workshops: raw goods from the farm made into dearer ones. */
export default function WorkshopsScreen() {
  const built = useGame((s) => Object.keys(s.workshops).length);
  return (
    <Screen bottomGap={40} header={<TopBar title="Atölyeler" subtitle={`${built} / ${Object.keys(WORKSHOPS).length} atölye kurulu`} />}>
      <Card tint={C.amberSoft}>
        <Txt v="body">
          Ham ürünleri işle, daha pahalıya sat ya da siparişlere yetiştir. Her atölye aynı anda {WORKSHOP_SLOTS} parti sıraya alır ve
          çalışırken elektrik harcar.
        </Txt>
      </Card>
      {(Object.keys(WORKSHOPS) as WorkshopId[]).map((id) => (
        <WorkshopCard key={id} id={id} />
      ))}
    </Screen>
  );
}
