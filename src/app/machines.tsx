import { Lock, Power, ShoppingCart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoinIcon } from '@/components/art/items';
import { MachineArt } from '@/components/art/machines';
import { Button, Card, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { MACHINES, type MachineId } from '@/game/data';
import { levelOf, useGame } from '@/game/store';
import { C, F, R, S } from '@/theme';

const GROUPS: { zone: 'fields' | 'animals' | 'water'; title: string; subtitle: string }[] = [
  { zone: 'fields', title: 'Tarla', subtitle: 'Sulama, çapa, hasat ve ekim' },
  { zone: 'animals', title: 'Hayvanlar', subtitle: 'Yemleme, ürün toplama ve temizlik' },
  { zone: 'water', title: 'Su ve havuz', subtitle: 'Balık yemi, filtre ve pompa' },
];

/** A two-state switch drawn to match the cards. */
function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.track, { backgroundColor: on ? C.green : C.line }]}>
      <View style={[styles.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </Pressable>
  );
}

function MachineCard({ id }: { id: MachineId }) {
  const m = MACHINES[id];
  const owned = useGame((s) => s.machines[id]);
  const coins = useGame((s) => s.coins);
  const level = levelOf(useGame((s) => s.xp));
  const { buyMachine, toggleMachine } = useGame.getState();
  const locked = m.level > level;

  return (
    <Card style={{ flexDirection: 'row', gap: S.md, alignItems: 'center', opacity: locked ? 0.6 : 1 }}>
      <View style={styles.art}>
        <MachineArt id={id} size={64} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Txt v="label">{m.name}</Txt>
          {owned ? <Pill text={owned.on ? 'Çalışıyor' : 'Kapalı'} tone={owned.on ? 'green' : 'muted'} /> : null}
        </Row>
        <Txt v="caption">{m.does}</Txt>
        {!owned ? (
          <Row gap={4}>
            <CoinIcon size={13} />
            <Txt v="caption" style={{ color: C.ink, fontFamily: F.semibold }}>{m.price}</Txt>
            {locked ? <Pill text={`Seviye ${m.level}`} tone="muted" /> : null}
          </Row>
        ) : null}
      </View>
      {owned ? (
        <Toggle on={owned.on} onPress={() => toggleMachine(id)} label={`${m.name} aç/kapat`} />
      ) : (
        <Button
          small
          label={locked ? 'Kilitli' : 'Al'}
          icon={locked ? <Lock size={14} color={C.white} /> : <ShoppingCart size={14} color={C.white} />}
          onPress={() => buyMachine(id)}
          disabled={locked || coins < m.price}
        />
      )}
    </Card>
  );
}

export default function MachinesScreen() {
  const owned = useGame((s) => Object.values(s.machines).filter(Boolean).length);
  const running = useGame((s) => Object.values(s.machines).filter((m) => m?.on).length);
  const coins = useGame((s) => s.coins);

  return (
    <Screen bottomGap={40} header={<TopBar title="Makineler" subtitle={`${owned} makine · ${running} çalışıyor`} />}>
      <Card tint={C.green} style={{ gap: S.sm }}>
        <Row gap={S.sm}>
          <Power size={18} color={C.white} />
          <Txt v="label" style={{ color: C.white }}>İşleri makinelere bırak</Txt>
        </Row>
        <Txt v="caption" style={{ color: '#CFE3D3' }}>
          Makineler bir kez alınır ve açık kaldıkları sürece işlerini kendileri yapar. Yemi, tohumu ve suyu ambardan ve depodan kullanırlar;
          bitince haber verirler. Kasada {coins.toLocaleString('tr-TR')} altın var.
        </Txt>
      </Card>
      {GROUPS.map((g) => (
        <View key={g.zone} style={{ gap: S.md }}>
          <SectionHeader title={g.title} subtitle={g.subtitle} />
          {(Object.keys(MACHINES) as MachineId[])
            .filter((id) => MACHINES[id].zone === g.zone)
            .map((id) => (
              <MachineCard key={id} id={id} />
            ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { width: 76, height: 76, borderRadius: R.md, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  track: { width: 46, height: 26, borderRadius: 13, padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
});
