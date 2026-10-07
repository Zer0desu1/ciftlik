import { router } from 'expo-router';
import { Check, ChevronRight, Egg, Heart, PackageOpen, Plus, Sparkles, Utensils, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AnimalArt } from '@/components/art/animals';
import { ItemIcon } from '@/components/art/items';
import { Bar, Button, Card, IconBadge, Pill, Ring, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { dayOf, hourOf } from '@/game/clock';
import { HATCH_HOURS, INCUBATOR_SIZE, ITEMS, MEALS, SPECIES, type SpeciesId } from '@/game/data';
import { herdOf, productReady } from '@/game/selectors';
import { barnCapacity, currentMeal, dueAt, isAdult, isOld, levelOf, useGame, type Animal } from '@/game/store';
import { C, F, R, S } from '@/theme';

/** "İnekler" → "İnekleri", "Tavuklar" → "Tavukları": the plural's last vowel picks the ending. */
const accusative = (plural: string) => plural + (plural.endsWith('lar') ? 'ı' : 'i');

/** The one tag that matters most about an animal right now. */
function statusPill(a: Animal, minutes: number): { text: string; tone: 'green' | 'amber' | 'rose' | 'blue' | 'muted' } {
  const day = dayOf(minutes);
  if (a.health < 15) return { text: 'Çok hasta', tone: 'rose' };
  const due = dueAt(a);
  if (due !== null) return { text: `Gebe · ${Math.max(1, Math.ceil((due - minutes) / 60))} sa`, tone: 'blue' };
  if (!isAdult(a, day)) return { text: 'Yavru', tone: 'green' };
  if (a.product >= 1) return { text: 'Ürün hazır', tone: 'green' };
  if (a.fullness < 35) return { text: 'Aç', tone: 'rose' };
  if (isOld(a, day)) return { text: 'Yaşlı', tone: 'muted' };
  return { text: `Tok %${Math.round(a.fullness)}`, tone: 'amber' };
}

function Incubator() {
  const eggs = useGame((s) => s.inventory.egg ?? 0);
  const trays = useGame((s) => s.incubator);
  const minutes = useGame((s) => s.minutes);
  return (
    <Card style={{ gap: S.md }}>
      <Row gap={S.md}>
        <ItemIcon id="egg" size={40} />
        <View style={{ flex: 1 }}>
          <Txt v="label">Kuluçka makinesi</Txt>
          <Txt v="caption">
            Ambarda {eggs} yumurta · {HATCH_HOURS} saatte civciv çıkar · {trays.length}/3 tepsi dolu
          </Txt>
        </View>
      </Row>
      {trays.map((t) => {
        const left = Math.max(0, t.readyAt - minutes);
        return (
          <View key={t.id} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="caption">{t.eggs} yumurta</Txt>
              <Txt v="caption">{Math.ceil(left / 60)} saat kaldı</Txt>
            </Row>
            <Bar value={(1 - left / (HATCH_HOURS * 60)) * 100} color={C.amber} track={C.amberSoft} />
          </View>
        );
      })}
      <Button
        kind="soft"
        label={`${Math.min(eggs, INCUBATOR_SIZE)} yumurtayı kuluçkaya koy`}
        icon={<Egg size={15} color={C.green} />}
        onPress={() => useGame.getState().incubate(INCUBATOR_SIZE)}
        disabled={!eggs || trays.length >= 3}
      />
    </Card>
  );
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function FeedingTimeline() {
  const minutes = useGame((s) => s.minutes);
  const meals = useGame((s) => s.meals);
  const hour = hourOf(minutes);
  const slot = currentMeal(hour);
  const today = meals.day === dayOf(minutes) ? meals.done : [false, false, false];
  const doneCount = today.filter(Boolean).length;

  return (
    <Card style={{ gap: S.lg }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <IconBadge tint={C.amberSoft} size={36}>
            <Wheat size={18} color={C.amber} />
          </IconBadge>
          <Txt v="heading">Günlük yemleme</Txt>
        </Row>
        <Pill text={`${doneCount} / 3 tamam`} tone="muted" />
      </Row>
      <Row gap={0} style={{ alignItems: 'flex-start' }}>
        {MEALS.map((m, i) => {
          const done = today[i];
          const missed = !done && i < slot;
          const now = i === slot && !done;
          return (
            <View key={m.hour} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Row gap={0} style={{ width: '100%' }}>
                <View style={[styles.line, { opacity: i === 0 ? 0 : 1, backgroundColor: today[i - 1] && done ? C.green : C.line }]} />
                <View style={[styles.node, done && styles.nodeDone, now && styles.nodeNow, missed && styles.nodeMissed]}>
                  {done ? <Check size={14} color={C.white} strokeWidth={3} /> : null}
                </View>
                <View style={[styles.line, { opacity: i === MEALS.length - 1 ? 0 : 1, backgroundColor: done && today[i + 1] ? C.green : C.line }]} />
              </Row>
              <Txt v="label" style={{ fontFamily: F.bold }}>{String(m.hour).padStart(2, '0')}:00</Txt>
              <Txt v="caption">{m.what}</Txt>
              <Txt v="caption" style={{ color: done ? C.green : missed ? C.rose : now ? C.amber : C.muted, fontFamily: F.semibold }}>
                {done ? 'Tamam' : missed ? 'Kaçtı' : now ? 'Şimdi' : 'Sırada'}
              </Txt>
            </View>
          );
        })}
      </Row>
      <Button label="Hepsini besle" icon={<Utensils size={16} color={C.white} />} onPress={() => useGame.getState().feedAll()} />
    </Card>
  );
}

export default function LivestockScreen() {
  const state = useGame();
  const [species, setSpecies] = useState<SpeciesId>('cow');
  const herd = herdOf(state, species);
  const sp = SPECIES[species];
  const ready = productReady(state, species);
  const level = levelOf(state.xp);
  const { feedSpecies, collect, cleanBarn, buyAnimal } = useGame.getState();

  return (
    <Screen bottomGap={40} header={<TopBar title="Hayvanlar" subtitle={state.farmName} />}>
      <Card style={{ gap: S.lg }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt v="caption">TOPLAM · AHIR {barnCapacity(state)} HAYVANLIK</Txt>
            <Txt v="display">{state.animals.length} hayvan</Txt>
          </View>
          <Pill text={avg(state.animals.map((a) => a.health)) > 70 ? 'Sağlıklı' : 'İlgi istiyor'} tone={avg(state.animals.map((a) => a.health)) > 70 ? 'green' : 'rose'} />
        </Row>
        <Row style={{ justifyContent: 'space-around' }}>
          {[
            { label: 'Sağlık', value: avg(state.animals.map((a) => a.health)), color: C.green, track: C.greenSoft },
            { label: 'Tokluk', value: avg(state.animals.map((a) => a.fullness)), color: C.amber, track: C.amberSoft },
            { label: 'Üretim', value: avg(state.animals.map((a) => a.product * 100)), color: C.blue, track: C.blueSoft },
          ].map((r) => (
            <View key={r.label} style={{ alignItems: 'center', gap: 6 }}>
              <Ring value={r.value} size={70} color={r.color} track={r.track}>
                <Txt v="label" style={{ fontFamily: F.extrabold }}>%{r.value}</Txt>
              </Ring>
              <Txt v="caption">{r.label}</Txt>
            </View>
          ))}
        </Row>
      </Card>

      <FeedingTimeline />

      <Card style={{ gap: S.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label">Ahır temizliği</Txt>
          <Txt v="caption">%{Math.round(state.barnClean)}</Txt>
        </Row>
        <Bar value={state.barnClean} color={state.barnClean < 35 ? C.rose : C.greenMid} />
        <Button kind="soft" small label="Ahırı temizle" icon={<Sparkles size={14} color={C.green} />} onPress={cleanBarn} disabled={state.barnClean > 90} />
      </Card>

      <SectionHeader title="Kategoriler" subtitle="Hayvanlarını görmek için bir gruba dokun" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm, paddingVertical: 2 }}>
        {(Object.keys(SPECIES) as SpeciesId[]).map((id) => {
          const active = id === species;
          return (
            <Pressable key={id} onPress={() => setSpecies(id)} style={[styles.cat, active && styles.catActive]}>
              <AnimalArt species={id} size={58} />
              <Txt v="number" style={{ fontSize: 20, color: active ? C.green : C.ink }}>{herdOf(state, id).length}</Txt>
              <Txt v="caption" style={{ color: active ? C.ink : C.muted, fontFamily: F.semibold }}>{SPECIES[id].plural}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card style={{ gap: S.md }}>
        <Row gap={S.md}>
          <ItemIcon id={sp.feed} size={40} />
          <View style={{ flex: 1 }}>
            <Txt v="label">{ITEMS[sp.feed].name}</Txt>
            <Txt v="caption">
              Ambarda {state.inventory[sp.feed] ?? 0} {ITEMS[sp.feed].unit} · hayvan başına {sp.ration}
            </Txt>
          </View>
        </Row>
        <Row gap={S.sm}>
          <Button kind="soft" label={`${accusative(sp.plural)} besle`} icon={<Utensils size={15} color={C.green} />} onPress={() => feedSpecies(species)} style={{ flex: 1 }} />
          <Button label={`Topla (${ready})`} icon={<PackageOpen size={15} color={C.white} />} onPress={() => collect(species)} disabled={!ready} style={{ flex: 1 }} />
        </Row>
      </Card>

      {species === 'chicken' ? <Incubator /> : null}

      <SectionHeader
        title={`${sp.plural}`}
        subtitle={`${herd.length} hayvan · ${herd.filter((a) => !isAdult(a, dayOf(state.minutes))).length} yavru · ${ITEMS[sp.product].name.toLowerCase()} verir`}
        action={
          <Button
            small
            kind="ghost"
            label={sp.level > level ? `Sv. ${sp.level}` : `${sp.price} altın`}
            icon={<Plus size={14} color={C.green} />}
            onPress={() => buyAnimal(species)}
            disabled={sp.level > level}
          />
        }
      />
      {herd.map((a) => (
        <Card key={a.id} onPress={() => router.push(`/animal/${a.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md }}>
          <View style={styles.thumb}>
            <AnimalArt species={a.species} size={64} variant={a.variant} young={!isAdult(a, dayOf(state.minutes))} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="heading">{a.name}</Txt>
              <Row gap={4} style={styles.heart}>
                <Heart size={12} color={C.green} fill={C.green} />
                <Txt v="caption" style={{ color: C.green, fontFamily: F.bold }}>%{Math.round(a.health)}</Txt>
              </Row>
            </Row>
            <Txt v="caption">{a.breed}</Txt>
            <Row gap={6}>
              <Pill text={a.tag} tone="muted" />
              <Pill {...statusPill(a, state.minutes)} />
            </Row>
          </View>
          <ChevronRight size={18} color={C.muted} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flex: 1, height: 3, borderRadius: 2 },
  node: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: C.green, borderColor: C.green },
  nodeNow: { borderColor: C.amber, borderWidth: 3 },
  nodeMissed: { borderColor: C.rose },
  cat: { width: 96, alignItems: 'center', paddingVertical: S.md, borderRadius: R.lg, backgroundColor: C.card, borderWidth: 2, borderColor: 'transparent' },
  catActive: { borderColor: C.green },
  thumb: { width: 76, height: 76, borderRadius: R.md, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  heart: { backgroundColor: C.greenSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill },
});
