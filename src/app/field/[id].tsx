import { router, useLocalSearchParams } from 'expo-router';
import { Droplets, Maximize2, Scissors, Sparkles, Sprout, Trash2, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropArt } from '@/components/art/crops';
import { ItemIcon } from '@/components/art/items';
import { Bar, Button, Card, Chip, Pill, Row, Screen, Txt, TopBar } from '@/components/ui';
import { CROPS, FIELD_EXPANSIONS, FIELDS, type CropId, type FieldId } from '@/game/data';
import { plotStage, summarizeField } from '@/game/selectors';
import { fieldLevel, levelOf, tankCapacity, useGame, type Plot } from '@/game/store';
import { C, F, R, S } from '@/theme';

function hoursLeft(p: Plot): string {
  if (!p.crop) return '';
  const h = Math.ceil((1 - p.growth) * CROPS[p.crop].growHours);
  return h <= 1 ? '1 saatten az' : `~${h} saat`;
}

function status(p: Plot): { text: string; tone: 'green' | 'amber' | 'rose' | 'blue' | 'muted' } {
  if (!p.crop) return { text: 'Boş', tone: 'muted' };
  if (p.dead) return { text: 'Öldü', tone: 'rose' };
  if (p.growth >= 1) return { text: 'Hasada hazır', tone: 'green' };
  if (p.moisture <= 15) return { text: 'Kurumak üzere', tone: 'rose' };
  if (p.moisture < 30) return { text: 'Susuz', tone: 'amber' };
  if (p.weeds) return { text: 'Yabani ot', tone: 'amber' };
  return { text: 'Büyüyor', tone: 'blue' };
}

function PlotCard({ field, index, plot, onPlant }: { field: FieldId; index: number; plot: Plot; onPlant: () => void }) {
  const { water, fertilize, weed, harvest, clearPlot } = useGame.getState();
  const st = status(plot);
  const stage = plotStage(plot);
  return (
    <Card style={styles.plot}>
      <View style={styles.art}>
        {plot.crop ? (
          <CropArt crop={plot.crop} stage={stage} size={92} dry={plot.dead || plot.moisture < 30} weeds={plot.weeds && !plot.dead} />
        ) : (
          <CropArt crop="lettuce" stage={0} size={92} />
        )}
        <View style={styles.badge}>
          <Txt v="caption" style={{ color: C.ink, fontFamily: F.bold }}>{index + 1}</Txt>
        </View>
      </View>
      <Txt v="label" numberOfLines={1}>{plot.crop ? CROPS[plot.crop].name : 'Boş parsel'}</Txt>
      <Pill text={st.text} tone={st.tone} />
      {plot.crop && !plot.dead ? (
        <View style={{ gap: 6 }}>
          <Bar value={plot.growth * 100} />
          <Bar value={plot.moisture} color={C.blue} track={C.blueSoft} height={5} />
          <Txt v="caption">{plot.growth >= 1 ? 'Topla, yoksa çürür' : `Olgunluk: ${hoursLeft(plot)}`}</Txt>
        </View>
      ) : null}

      {!plot.crop ? (
        <Button small label="Ek" icon={<Sprout size={14} color={C.white} />} onPress={onPlant} />
      ) : plot.dead ? (
        <Button small kind="danger" label="Temizle" icon={<Trash2 size={14} color={C.rose} />} onPress={() => clearPlot(field, index)} />
      ) : plot.growth >= 1 ? (
        <Button small label="Hasat et" icon={<Wheat size={14} color={C.white} />} onPress={() => harvest(field, index)} />
      ) : (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Button small kind="soft" label="Sula" icon={<Droplets size={14} color={C.green} />} onPress={() => water(field, index)} disabled={plot.moisture > 90} style={{ flex: 1 }} />
          {plot.weeds ? (
            <Button small kind="soft" label="Ot al" icon={<Scissors size={14} color={C.green} />} onPress={() => weed(field, index)} style={{ flex: 1 }} />
          ) : !plot.fertilized ? (
            <Button small kind="soft" label="Gübre" icon={<Sparkles size={14} color={C.green} />} onPress={() => fertilize(field, index)} style={{ flex: 1 }} />
          ) : null}
        </Row>
      )}
    </Card>
  );
}

function SeedPicker({ field, onPick, onClose }: { field: FieldId; onPick: (crop: CropId) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const inventory = useGame((s) => s.inventory);
  const level = levelOf(useGame((s) => s.xp));
  const def = FIELDS.find((f) => f.id === field)!;
  const crops = (Object.keys(CROPS) as CropId[]).sort(
    (a, b) => Number(def.suggested.includes(b)) - Number(def.suggested.includes(a)) || CROPS[a].level - CROPS[b].level,
  );
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + S.lg }]}>
        <View style={styles.grip} />
        <Txt v="title">Ne ekelim?</Txt>
        <Txt v="caption" style={{ marginBottom: S.md }}>Bu tarlaya en uygun olanlar başta.</Txt>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: S.sm }}>
          {crops.map((id) => {
            const crop = CROPS[id];
            const have = inventory[crop.seed] ?? 0;
            const locked = crop.level > level;
            return (
              <Pressable
                key={id}
                disabled={!have || locked}
                onPress={() => onPick(id)}
                style={[styles.seedRow, (!have || locked) && { opacity: 0.5 }]}>
                <ItemIcon id={crop.seed} size={40} />
                <View style={{ flex: 1 }}>
                  <Row gap={6}>
                    <Txt v="label">{crop.name}</Txt>
                    {def.suggested.includes(id) ? <Pill text="Uygun" tone="green" /> : null}
                  </Row>
                  <Txt v="caption">
                    {crop.growHours} saatte büyür · {crop.yield} birim verir
                  </Txt>
                </View>
                <Txt v="label" style={{ color: have ? C.green : C.muted }}>
                  {locked ? `Sv. ${crop.level}` : `${have} tohum`}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
        <Button
          kind="ghost"
          label="Pazardan tohum al"
          onPress={() => {
            onClose();
            router.push('/(tabs)/market');
          }}
          style={{ marginTop: S.md }}
        />
      </View>
    </Modal>
  );
}

export default function FieldScreen() {
  const { id } = useLocalSearchParams<{ id: FieldId }>();
  const field: FieldId = FIELDS.some((f) => f.id === id) ? id : 'tomatoes';
  const plots = useGame((s) => s.fields[field]);
  const tank = useGame((s) => s.tank);
  const cap = useGame(tankCapacity);
  const step = FIELD_EXPANSIONS[useGame((s) => fieldLevel(s, field))];
  const level = levelOf(useGame((s) => s.xp));
  const coins = useGame((s) => s.coins);
  const { waterField, harvestField, plant, expandField, tidyField } = useGame.getState();
  const [picking, setPicking] = useState<number | null>(null);
  const def = FIELDS.find((f) => f.id === field)!;
  const sum = summarizeField(plots);

  return (
    <Screen bottomGap={40} header={<TopBar title={def.name} subtitle={`${sum.planted} ekili · ${sum.ripe} hasada hazır`} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
        {FIELDS.map((f) => (
          <Chip key={f.id} label={f.name} active={f.id === field} onPress={() => router.setParams({ id: f.id })} />
        ))}
      </ScrollView>

      <Card style={{ gap: S.md }}>
        <Row gap={S.lg}>
          <View style={{ flex: 1, gap: 6 }}>
            <Txt v="caption">Ortalama nem</Txt>
            <Txt v="number">%{sum.moisture}</Txt>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Txt v="caption">Su deposu</Txt>
            <Txt v="number">{Math.round(tank)} L</Txt>
          </View>
        </Row>
        <Bar value={(tank / cap) * 100} color={C.blue} track={C.blueSoft} />
        <Row gap={S.sm}>
          <Button label="Hepsini sula" kind="soft" icon={<Droplets size={16} color={C.green} />} onPress={() => waterField(field)} style={{ flex: 1 }} />
          <Button label={`Hasat (${sum.ripe})`} icon={<Wheat size={16} color={C.white} />} onPress={() => harvestField(field)} disabled={!sum.ripe} style={{ flex: 1 }} />
        </Row>
        {sum.dead + sum.weeds > 0 ? (
          <Button
            kind="danger"
            label={`Hepsini temizle (${sum.dead + sum.weeds})`}
            icon={<Trash2 size={16} color={C.rose} />}
            onPress={() => tidyField(field)}
          />
        ) : null}
      </Card>

      <View style={styles.grid}>
        {plots.map((p, i) => (
          <View key={i} style={styles.cell}>
            <PlotCard field={field} index={i} plot={p} onPlant={() => setPicking(i)} />
          </View>
        ))}
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        <View style={{ flex: 1 }}>
          <Txt v="label">{step ? 'Tarlayı genişlet' : 'Tarla en büyük hâlinde'}</Txt>
          <Txt v="caption">
            {step
              ? step.level > level
                ? `+${step.plots} parsel · seviye ${step.level} gerekli`
                : `+${step.plots} parsel · ${step.cost} altın`
              : `${plots.length} parsel`}
          </Txt>
        </View>
        {step ? (
          <Button
            small
            label="Genişlet"
            icon={<Maximize2 size={14} color={C.white} />}
            onPress={() => expandField(field)}
            disabled={step.level > level || coins < step.cost}
          />
        ) : null}
      </Card>

      {picking !== null ? (
        <SeedPicker
          field={field}
          onClose={() => setPicking(null)}
          onPick={(crop) => {
            plant(field, picking, crop);
            setPicking(null);
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -S.xs },
  cell: { width: '50%', padding: S.xs },
  plot: { gap: S.sm, padding: S.md },
  art: { alignItems: 'center', backgroundColor: C.cardSoft, borderRadius: R.md, paddingVertical: S.xs },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  backdrop: { flex: 1, backgroundColor: '#1C2A2055' },
  sheet: { backgroundColor: C.page, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: S.md },
  seedRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.md, padding: S.md },
});
