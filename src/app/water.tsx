import { router } from 'expo-router';
import { Droplets, Zap } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { WeatherIcon } from '@/components/art/weather';
import { Button, Card, Meter, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { dayOf, weatherFor, weatherLabel } from '@/game/clock';
import { FIELDS, WATER_PER_PLOT, WEATHER } from '@/game/data';
import { summarizeField } from '@/game/selectors';
import { tankCapacity, useGame } from '@/game/store';
import { C, F, R, S } from '@/theme';

export default function WaterScreen() {
  const tank = useGame((s) => s.tank);
  const fields = useGame((s) => s.fields);
  const minutes = useGame((s) => s.minutes);
  const cap = useGame(tankCapacity);
  const { pump, waterField } = useGame.getState();
  const level = tank / cap;
  const day = dayOf(minutes);

  return (
    <Screen bottomGap={40} header={<TopBar title="Su Deposu" subtitle={`${Math.round(tank)} / ${cap.toLocaleString('tr-TR')} litre`} />}>
      <Card style={{ alignItems: 'center', gap: S.lg, paddingVertical: S.xl }}>
        <View style={styles.tank}>
          <View style={[styles.water, { height: `${Math.max(4, level * 100)}%` }]} />
          <View style={styles.tankLabel}>
            <Txt v="number" style={{ color: level > 0.5 ? C.white : C.ink }}>%{Math.round(level * 100)}</Txt>
          </View>
        </View>
        <Txt v="body" style={{ textAlign: 'center' }}>
          Bir parseli sulamak {WATER_PER_PLOT} litre su harcar. Yağmurlu günlerde depo kendiliğinden dolar.
        </Txt>
        <Button label="Pompayı çalıştır (+300 L · 8 altın)" icon={<Zap size={16} color={C.white} />} onPress={pump} disabled={tank >= cap} style={{ alignSelf: 'stretch' }} />
      </Card>

      <SectionHeader title="Tarlalar" subtitle="Susuz kalan parselleri tek dokunuşla sula" />
      {FIELDS.every((f) => !fields[f.id].length) ? (
        <Card>
          <Txt v="body">Hiç tarlan yok. Haritada bir araziye dokunup tarla yapabilirsin.</Txt>
        </Card>
      ) : null}
      {FIELDS.filter((f) => fields[f.id].length).map((f) => {
        const s = summarizeField(fields[f.id]);
        return (
          <Card key={f.id} onPress={() => router.push(`/field/${f.id}`)} style={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="label">{f.name}</Txt>
              {s.thirsty ? <Pill text={`${s.thirsty} susuz`} tone="rose" /> : <Pill text="Nemli" tone="blue" />}
            </Row>
            <Meter label="Ortalama nem" value={s.moisture} color={C.blue} track={C.blueSoft} />
            <Button small kind="soft" label="Bu tarlayı sula" icon={<Droplets size={14} color={C.green} />} onPress={() => waterField(f.id)} disabled={!s.planted} />
          </Card>
        );
      })}

      <SectionHeader title="Hava tahmini" subtitle="Yağmur yağarsa sulamaya gerek kalmaz" />
      <Row gap={S.sm}>
        {[0, 1, 2].map((offset) => {
          const w = weatherFor(day + offset);
          return (
            <Card key={offset} style={{ flex: 1, alignItems: 'center', gap: 4, padding: S.md }}>
              <Txt v="caption" style={{ fontFamily: F.semibold }}>{offset === 0 ? 'Bugün' : offset === 1 ? 'Yarın' : `${day + offset}. gün`}</Txt>
              <WeatherIcon kind={w.kind} size={38} />
              <Txt v="heading">{w.temp}°</Txt>
              <Txt v="caption" numberOfLines={1}>{weatherLabel(w.kind)}</Txt>
              {WEATHER[w.kind].rain ? <Pill text="Yağmur" tone="blue" /> : null}
            </Card>
          );
        })}
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tank: {
    width: 150,
    height: 190,
    borderRadius: R.xl,
    borderWidth: 6,
    borderColor: '#CBD6DE',
    backgroundColor: '#EEF3F6',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  water: { width: '100%', backgroundColor: C.blue },
  tankLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
