import { Baby, Fish, HeartCrack, PawPrint, Wheat } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Card, IconBadge, Ring, Row, SectionHeader, Txt } from '@/components/ui';
import { dayOf } from '@/game/clock';
import { farmHealth, healthLabel } from '@/game/selectors';
import { useGame, type DayLog } from '@/game/store';
import { C, F, S } from '@/theme';

/** Income and spending side by side for each of the last seven days. */
function MoneyChart({ log, width }: { log: DayLog[]; width: number }) {
  const height = 170;
  const top = 12;
  const bottom = 26;
  const max = Math.max(50, ...log.flatMap((d) => [d.income, d.expense]));
  const slot = width / Math.max(log.length, 1);
  const bar = Math.min(16, slot / 3.2);
  const y = (v: number) => top + (height - top - bottom) * (1 - v / max);
  return (
    <Svg width={width} height={height}>
      {[0, 0.5, 1].map((f) => (
        <Line key={f} x1={0} x2={width} y1={y(max * f)} y2={y(max * f)} stroke={C.line} strokeDasharray="3 4" />
      ))}
      {log.map((d, i) => {
        const cx = slot * i + slot / 2;
        return (
          <G key={d.day}>
            <Rect x={cx - bar - 2} y={y(d.income)} width={bar} height={Math.max(2, y(0) - y(d.income))} rx={4} fill={C.green} />
            <Rect x={cx + 2} y={y(d.expense)} width={bar} height={Math.max(2, y(0) - y(d.expense))} rx={4} fill={C.amber} />
            <SvgText x={cx} y={height - 8} fontSize={11} fontFamily={F.medium} fill={C.muted} textAnchor="middle">
              {`${d.day}. gün`}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const state = useGame();
  const today = dayOf(state.minutes);
  const days = Array.from({ length: 7 }, (_, i) => today - 6 + i).filter((d) => d >= 1);
  const log = days.map((d) => state.log.find((l) => l.day === d) ?? { day: d, income: 0, expense: 0, crops: 0, produce: 0, fish: 0, births: 0, deaths: 0 });
  const totals = log.reduce(
    (t, d) => ({
      income: t.income + d.income,
      expense: t.expense + d.expense,
      crops: t.crops + d.crops,
      produce: t.produce + d.produce,
      fish: t.fish + d.fish,
      births: t.births + d.births,
      deaths: t.deaths + d.deaths,
    }),
    { income: 0, expense: 0, crops: 0, produce: 0, fish: 0, births: 0, deaths: 0 },
  );
  const health = farmHealth(state);
  const chartWidth = Math.min(width, 520) - S.xl * 2 - S.lg * 2;

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + S.md, paddingBottom: 120 + insets.bottom, paddingHorizontal: S.xl, gap: S.lg }} showsVerticalScrollIndicator={false}>
        <View>
          <Txt v="display">Analiz</Txt>
          <Txt v="caption">Son {log.length} günün özeti</Txt>
        </View>

        <Row gap={S.md}>
          <Card style={{ flex: 1, gap: 4 }}>
            <Txt v="caption">Gelir</Txt>
            <Txt v="number" numberOfLines={1} style={{ color: C.green, fontSize: 20 }}>{totals.income ? `+${totals.income.toLocaleString('tr-TR')}` : 0}</Txt>
          </Card>
          <Card style={{ flex: 1, gap: 4 }}>
            <Txt v="caption">Gider</Txt>
            <Txt v="number" numberOfLines={1} style={{ color: C.amber, fontSize: 20 }}>{totals.expense ? `−${totals.expense.toLocaleString('tr-TR')}` : 0}</Txt>
          </Card>
          <Card style={{ flex: 1, gap: 4 }}>
            <Txt v="caption">Net</Txt>
            <Txt v="number" numberOfLines={1} style={{ color: totals.income - totals.expense >= 0 ? C.ink : C.rose, fontSize: 20 }}>
              {totals.income - totals.expense < 0 ? `−${(totals.expense - totals.income).toLocaleString('tr-TR')}` : (totals.income - totals.expense).toLocaleString('tr-TR')}
            </Txt>
          </Card>
        </Row>

        <Card style={{ gap: S.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="heading">Gelir ve gider</Txt>
            <Row gap={S.md}>
              <Row gap={6}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.green }} />
                <Txt v="caption">Gelir</Txt>
              </Row>
              <Row gap={6}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.amber }} />
                <Txt v="caption">Gider</Txt>
              </Row>
            </Row>
          </Row>
          <MoneyChart log={log} width={chartWidth} />
        </Card>

        <SectionHeader title="Üretim" />
        {[
          { label: 'Hasat edilen ürün', value: totals.crops, tint: C.greenSoft, icon: <Wheat size={20} color={C.green} /> },
          { label: 'Hayvan ürünü', value: totals.produce, tint: C.roseSoft, icon: <PawPrint size={20} color={C.rose} /> },
          { label: 'Tutulan balık', value: totals.fish, tint: C.blueSoft, icon: <Fish size={20} color={C.blue} /> },
          { label: 'Doğan hayvan ve balık', value: totals.births, tint: C.greenSoft, icon: <Baby size={20} color={C.green} /> },
          { label: 'Ölen hayvan ve balık', value: totals.deaths, tint: '#EFEBE1', icon: <HeartCrack size={20} color={C.inkSoft} /> },
        ].map((r) => (
          <Card key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <IconBadge tint={r.tint}>{r.icon}</IconBadge>
            <Txt v="label" style={{ flex: 1 }}>{r.label}</Txt>
            <Txt v="heading">{r.value}</Txt>
          </Card>
        ))}

        <SectionHeader title="Çiftlik sağlığı" />
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.lg }}>
          <Ring value={health} size={84} stroke={9}>
            <Txt v="heading">%{health}</Txt>
          </Ring>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="heading">{healthLabel(health).label}</Txt>
            <Txt v="body">Toprak nemi, hayvanların sağlığı ve tokluğu, ahır temizliği ve havuz suyunun ortalaması.</Txt>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
