import { router } from 'expo-router';
import { AlertCircle, ChevronRight, Droplets, Fish, PawPrint, Settings, Sparkles, Sprout, Trophy, Wheat } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinIcon } from '@/components/art/items';
import { FarmHero } from '@/components/art/farm-hero';
import { FarmerAvatar, WeatherIcon } from '@/components/art/weather';
import { OrderCard } from '@/components/orders';
import { Bar, Card, IconBadge, Pill, Ring, Row, SectionHeader, Txt } from '@/components/ui';
import { clockLabel, dayOf, greeting, hourOf, isNight, seasonLabel, weatherFor, weatherLabel } from '@/game/clock';
import { ACHIEVEMENTS, HAPPENINGS } from '@/game/data';
import {
  averageMoisture,
  farmHealth,
  fishCount,
  healthLabel,
  inventoryValue,
  plantedCount,
  tasks,
  type Task,
} from '@/game/selectors';
import { levelProgress, useGame } from '@/game/store';
import { C, F, R, S, shadow } from '@/theme';

const TASK_TONE: Record<Task['tone'], { tint: string; color: string }> = {
  urgent: { tint: C.roseSoft, color: C.rose },
  ready: { tint: C.greenSoft, color: C.green },
  info: { tint: C.amberSoft, color: C.amber },
};

function StatTile({
  value,
  label,
  tint,
  icon,
  onPress,
}: {
  value: string;
  label: string;
  tint: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={{ flex: 1, gap: S.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBadge tint={tint}>{icon}</IconBadge>
        <View style={styles.chev}>
          <ChevronRight size={16} color={C.inkSoft} />
        </View>
      </Row>
      <View>
        <Txt v="number">{value}</Txt>
        <Txt v="caption">{label}</Txt>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const state = useGame();
  const hour = hourOf(state.minutes);
  const day = dayOf(state.minutes);
  const weather = weatherFor(day);
  const health = farmHealth(state);
  const hl = healthLabel(health);
  const todo = tasks(state);
  const lvl = levelProgress(state.xp);
  const claimable = ACHIEVEMENTS.filter((a) => state.achievements.includes(a.id) && !state.claimed.includes(a.id)).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View>
          <FarmHero hour={hour} weather={weather.kind} height={320 + insets.top} />
          <View style={[styles.heroTop, { top: insets.top + S.md }]}>
            <FarmerAvatar size={52} />
            <View style={{ flex: 1 }}>
              <Txt v="label" style={{ color: isNight(hour) ? '#E8EEF5' : C.inkSoft }}>
                {greeting(hour)}, Çiftçi
              </Txt>
              <Txt v="title" style={{ color: isNight(hour) ? C.white : C.ink }} numberOfLines={1}>
                {state.farmName}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={styles.coin}>
                <CoinIcon size={18} />
                <Txt v="label">{state.coins.toLocaleString('tr-TR')}</Txt>
              </View>
              <Pressable accessibilityLabel="Ayarlar" onPress={() => router.push('/settings')} style={styles.gear}>
                <Settings size={18} color={C.ink} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.clock, { top: insets.top + 78 }]}>
            <Txt v="caption" style={{ color: C.ink, fontFamily: F.semibold }}>
              {seasonLabel(day)} · {clockLabel(state.minutes)}
            </Txt>
          </View>
        </View>

        <View style={{ paddingHorizontal: S.xl, marginTop: -84, gap: S.lg }}>
          <Row gap={S.md} style={{ alignItems: 'stretch' }}>
            <Card style={{ flex: 1.35, flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <Ring value={health} size={66}>
                <Txt v="label" style={{ fontFamily: F.extrabold }}>%{health}</Txt>
              </Ring>
              <View style={{ flex: 1 }}>
                <Txt v="caption">Çiftlik sağlığı</Txt>
                <Txt v="heading">{hl.label}</Txt>
                <Row gap={6} style={{ alignItems: 'flex-start' }}>
                  <View style={[styles.dot, { backgroundColor: health >= 65 ? C.greenMid : C.amber, marginTop: 5 }]} />
                  <Txt v="caption" numberOfLines={2} style={{ flex: 1 }}>{hl.note}</Txt>
                </Row>
              </View>
            </Card>
            <Card style={{ flex: 1, gap: 4 }}>
              <WeatherIcon kind={weather.kind} size={36} night={isNight(hour)} />
              <Txt v="number" style={{ fontSize: 22 }}>{weather.temp}°C</Txt>
              <Txt v="caption" numberOfLines={1}>{weatherLabel(weather.kind)}</Txt>
            </Card>
          </Row>

          <Card style={{ gap: S.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={8}>
                <IconBadge tint={C.amberSoft} size={32}>
                  <Sparkles size={16} color={C.amber} />
                </IconBadge>
                <Txt v="label">Seviye {lvl.level}</Txt>
              </Row>
              <Txt v="caption">
                {lvl.into} / {lvl.span} XP
              </Txt>
            </Row>
            <Bar value={(lvl.into / lvl.span) * 100} color={C.amber} track={C.amberSoft} />
          </Card>

          {state.happening && state.happening.day === day ? (
            <Card tint={HAPPENINGS[state.happening.kind].tone === 'good' ? C.greenSoft : C.roseSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <AlertCircle size={22} color={HAPPENINGS[state.happening.kind].tone === 'good' ? C.green : C.rose} />
              <View style={{ flex: 1 }}>
                <Txt v="label">{HAPPENINGS[state.happening.kind].name}</Txt>
                <Txt v="caption">{state.happening.note}</Txt>
              </View>
            </Card>
          ) : null}

          <SectionHeader
            title="Siparişler"
            subtitle={state.orders.length ? `${state.orders.length} müşteri bekliyor` : 'Yarın sabah yeni müşteriler gelir'}
            action={
              <Pressable onPress={() => router.push('/goals')} style={styles.goalsLink}>
                <Trophy size={14} color={C.amber} />
                <Txt v="label" style={{ color: C.amber }}>
                  Görevler{claimable ? ` · ${claimable} ödül` : ''}
                </Txt>
              </Pressable>
            }
          />
          {state.orders.slice(0, 2).map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}

          <SectionHeader title="Hızlı Bakış" />
          <Row gap={S.md}>
            <StatTile value={String(plantedCount(state))} label="Ekili parsel" tint={C.greenSoft} icon={<Sprout size={20} color={C.green} />} onPress={() => router.push('/(tabs)/farm')} />
            <StatTile value={String(state.animals.length)} label="Hayvan" tint={C.roseSoft} icon={<PawPrint size={20} color={C.rose} />} onPress={() => router.push('/livestock')} />
          </Row>
          <Row gap={S.md}>
            <StatTile value={`%${averageMoisture(state)}`} label="Toprak nemi" tint={C.blueSoft} icon={<Droplets size={20} color={C.blue} />} onPress={() => router.push('/water')} />
            <StatTile value={String(fishCount(state))} label="Balık" tint={C.blueSoft} icon={<Fish size={20} color={C.blue} />} onPress={() => router.push('/pond')} />
          </Row>
          <Card onPress={() => router.push('/(tabs)/storage')} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <IconBadge tint={C.amberSoft}>
              <Wheat size={20} color={C.amber} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="caption">Ambardaki ürünlerin değeri</Txt>
              <Row gap={6}>
                <Txt v="heading">{inventoryValue(state).toLocaleString('tr-TR')}</Txt>
                <CoinIcon size={16} />
              </Row>
            </View>
            <ChevronRight size={18} color={C.inkSoft} />
          </Card>

          <SectionHeader title="Yapılacaklar" subtitle={todo.length ? `${todo.length} iş seni bekliyor` : 'Şimdilik her şey yolunda'} />
          {todo.length === 0 ? (
            <Card tint={C.greenSoft}>
              <Txt v="label" style={{ color: C.green }}>Çiftlik sakin. Pazara uğrayıp yeni tohum alabilirsin.</Txt>
            </Card>
          ) : (
            <Card style={{ paddingVertical: S.sm }}>
              {todo.slice(0, 7).map((t, i) => (
                <Card
                  key={t.id}
                  onPress={() => router.push(t.href)}
                  style={[styles.taskRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }]}>
                  <IconBadge tint={TASK_TONE[t.tone].tint} size={30}>
                    <AlertCircle size={15} color={TASK_TONE[t.tone].color} />
                  </IconBadge>
                  <Txt v="label" style={{ flex: 1 }}>{t.text}</Txt>
                  <ChevronRight size={16} color={C.muted} />
                </Card>
              ))}
            </Card>
          )}

          <SectionHeader title="Son olaylar" />
          <Card style={{ gap: S.md }}>
            {state.events.slice(0, 5).map((e) => (
              <Row key={e.id} gap={10} style={{ alignItems: 'flex-start' }}>
                <Pill text={clockLabel(e.at)} tone={e.tone === 'good' ? 'green' : e.tone === 'bad' ? 'rose' : 'muted'} />
                <Txt v="body" style={{ flex: 1, fontSize: 13 }}>{e.text}</Txt>
              </Row>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gear: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
  },
  heroTop: { position: 'absolute', left: S.xl, right: S.xl, flexDirection: 'row', alignItems: 'center', gap: S.md },
  coin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: R.pill,
    ...shadow,
  },
  clock: {
    position: 'absolute',
    left: S.xl + 64,
    backgroundColor: '#FFFFFFD9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
  },
  chev: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: 0,
    paddingVertical: S.md,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
});
