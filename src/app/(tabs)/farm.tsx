import { router, type Href } from 'expo-router';
import { ArrowRight, Bot, Droplets, Fish, Hand, Home, Lock, Map, Maximize2, Move, Package, PawPrint, Sprout, Sun, Wheat, Zap } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeatherIcon } from '@/components/art/weather';
import { FarmMap, type ZoneId } from '@/components/farm-map';
import { Button, Card, Chip, IconBadge, Meter, Row, SectionHeader, Txt } from '@/components/ui';
import { dayOf, hourOf, isNight, weatherFor } from '@/game/clock';
import { BASE_PLOTS, CROPS, FIELDS, LAND_AREA, LAND_USES, SPECIES, landName, type FieldId, type LandUse, type SpeciesId } from '@/game/data';
import { fishCount, herdOf, inventoryValue, plantedCount, summarizeField } from '@/game/selectors';
import { barnCapacity, farmArea, landPrice, levelOf, levelProgress, ownedFields, ownedLand, ownsLand, pondCapacity, powerBalance, powerMade, tankCapacity, useGame, type GameState } from '@/game/store';
import { C, S } from '@/theme';

const CHIP_LABEL = {
  house: 'Çiftlik Evi',
  animals: 'Hayvanlar',
  water: 'Su & Havuz',
  storage: 'Ambar',
  ...Object.fromEntries(FIELDS.map((f) => [f.id, f.name])),
} as Record<ZoneId, string>;

const isLand = (z: ZoneId): z is FieldId => FIELDS.some((f) => f.id === z);
const defOf = (id: FieldId) => FIELDS.find((f) => f.id === id)!;
const USES = Object.keys(LAND_USES) as LandUse[];

/** A zone's name as things stand: land is called after what is on it. */
function zoneName(state: GameState, z: ZoneId): string {
  return isLand(z) && state.land[z] ? landName(defOf(z), state.land[z]) : CHIP_LABEL[z];
}

/** Land around the farm not bought yet: what it costs and what it brings. */
function LandCard({ field, state }: { field: FieldId; state: GameState }) {
  const def = defOf(field);
  const land = def.land!;
  const level = levelOf(state.xp);
  const locked = land.level > level;
  const { buyLand } = useGame.getState();
  return (
    <Card style={{ gap: S.md }}>
      <Row>
        <IconBadge tint={C.amberSoft}>{locked ? <Lock size={20} color={C.amber} /> : <Map size={20} color={C.amber} />}</IconBadge>
        <View style={{ flex: 1 }}>
          <Txt v="heading">{def.name}</Txt>
          <Txt v="caption">Satılık arazi · +{LAND_AREA.toLocaleString('tr-TR')} dönüm</Txt>
        </View>
      </Row>
      <Txt v="body">
        Ne olacağını sen seç: {BASE_PLOTS} parsellik tarla, ahır ve mera, balık havuzu ya da su deposu. Sonra da istediğin zaman
        değiştirebilirsin.
      </Txt>
      {locked ? (
        <Button label={`Seviye ${land.level} gerekli`} icon={<Lock size={16} color={C.white} />} onPress={() => {}} disabled />
      ) : (
        <View style={{ gap: S.sm }}>
          {USES.map((use, i) => {
            const price = landPrice(field, use);
            const needs = LAND_USES[use].level > level;
            return (
              <Button
                key={use}
                kind={i === 0 ? 'primary' : 'soft'}
                label={needs ? `${LAND_USES[use].name} · seviye ${LAND_USES[use].level}` : `${LAND_USES[use].name} olarak al · ${price} altın`}
                icon={<UseIcon use={use} color={i === 0 ? C.white : C.green} />}
                onPress={() => buyLand(field, use)}
                disabled={needs || state.coins < price}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

function UseIcon({ use, color }: { use: LandUse; color: string }) {
  if (use === 'field') return <Sprout size={16} color={color} />;
  if (use === 'barn') return <PawPrint size={16} color={color} />;
  if (use === 'pond') return <Fish size={16} color={color} />;
  if (use === 'solar') return <Sun size={16} color={color} />;
  return <Droplets size={16} color={color} />;
}

/** Turning a piece of land into something else, or picking it up to move it. */
function ConvertCard({ field, state, onMove }: { field: FieldId; state: GameState; onMove: () => void }) {
  const use = state.land[field]!;
  const level = levelOf(state.xp);
  const { convertLand } = useGame.getState();
  return (
    <Card style={{ gap: S.sm }}>
      <Txt v="label">Bu araziyi değiştir</Txt>
      <Txt v="caption">Ekin, hayvan ya da balık varsa önce onlara yer açılması gerekir.</Txt>
      <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
        {USES.filter((u) => u !== use).map((u) => {
          const needs = LAND_USES[u].level > level;
          return (
            <Button
              key={u}
              small
              kind="soft"
              label={needs ? `${LAND_USES[u].name} · Sv. ${LAND_USES[u].level}` : `${LAND_USES[u].name} · ${LAND_USES[u].cost}`}
              icon={<UseIcon use={u} color={C.green} />}
              onPress={() => convertLand(field, u)}
              disabled={needs || state.coins < LAND_USES[u].cost}
              style={{ flexGrow: 1 }}
            />
          );
        })}
      </Row>
      <Button small kind="ghost" label="Yerini değiştir" icon={<Move size={14} color={C.green} />} onPress={onMove} />
    </Card>
  );
}

/** Land used for something other than a field: what it adds to the farm. */
function UseCard({ field, state }: { field: FieldId; state: GameState }) {
  const use = state.land[field]!;
  const go: Record<Exclude<LandUse, 'field'>, { label: string; href: Href; now: string }> = {
    barn: { label: 'Hayvanlara git', href: '/livestock', now: `Ahırda ${state.animals.length} / ${barnCapacity(state)} hayvan` },
    pond: { label: 'Havuza git', href: '/pond', now: `Havuzda ${state.pond.batches.reduce((n, b) => n + b.count, 0)} / ${pondCapacity(state)} balık` },
    tank: { label: 'Suya git', href: '/water', now: `Depoda ${Math.round(state.tank)} / ${tankCapacity(state)} L su` },
    solar: { label: 'Elektriğe git', href: '/power', now: `Çiftlik şu an ${powerMade(state).toFixed(1)} kWh/sa üretiyor` },
  };
  const g = go[use as Exclude<LandUse, 'field'>];
  return (
    <Card style={{ gap: S.md }}>
      <Row>
        <IconBadge tint={C.greenSoft}><UseIcon use={use} color={C.green} /></IconBadge>
        <View style={{ flex: 1 }}>
          <Txt v="heading">{landName(defOf(field), use)}</Txt>
          <Txt v="caption">{LAND_USES[use].blurb} · {g.now}</Txt>
        </View>
      </Row>
      <Button label={g.label} icon={<ArrowRight size={16} color={C.white} />} onPress={() => router.push(g.href)} />
    </Card>
  );
}

function ZoneCard({ zone, state, onMove }: { zone: ZoneId; state: GameState; onMove: (f: FieldId) => void }) {
  if (isLand(zone)) {
    if (!ownsLand(state, zone)) return <LandCard field={zone} state={state} />;
    return (
      <>
        {state.land[zone] === 'field' ? <PlaceCard zone={zone} state={state} /> : <UseCard field={zone} state={state} />}
        <ConvertCard field={zone} state={state} onMove={() => onMove(zone)} />
      </>
    );
  }
  return <PlaceCard zone={zone} state={state} />;
}

function PlaceCard({ zone, state }: { zone: ZoneId; state: GameState }) {
  let icon: ReactNode;
  let tint: string;
  let title = CHIP_LABEL[zone];
  let subtitle = '';
  let body: ReactNode = null;
  let go: { label: string; href: Href }[] = [];

  if (isLand(zone)) {
    const s = summarizeField(state.fields[zone]);
    const crops = Array.from(new Set(state.fields[zone].filter((p) => p.crop).map((p) => CROPS[p.crop!].name)));
    icon = <Sprout size={20} color={C.green} />;
    tint = C.greenSoft;
    title = defOf(zone).name;
    subtitle = crops.length ? crops.join(', ') : 'Boş, ekim bekliyor';
    body = (
      <>
        <Row gap={S.lg}>
          <Mini value={s.planted} label="Ekili" />
          <Mini value={s.ripe} label="Hasada hazır" />
          <Mini value={s.empty} label="Boş parsel" />
        </Row>
        <Meter label="Ortalama nem" value={s.moisture} color={C.blue} track={C.blueSoft} />
      </>
    );
    go = [{ label: 'Tarlaya git', href: `/field/${zone}` }];
  } else if (zone === 'animals') {
    icon = <PawPrint size={20} color={C.rose} />;
    tint = C.roseSoft;
    subtitle = `${state.animals.length} / ${barnCapacity(state)} hayvan · ahır %${Math.round(state.barnClean)} temiz`;
    const avgFull = state.animals.length ? state.animals.reduce((n, a) => n + a.fullness, 0) / state.animals.length : 0;
    body = (
      <>
        <Row gap={S.lg}>
          {(Object.keys(SPECIES) as SpeciesId[]).map((sp) => (
            <Mini key={sp} value={herdOf(state, sp).length} label={SPECIES[sp].plural} />
          ))}
        </Row>
        <Meter label="Tokluk" value={avgFull} color={C.amber} track={C.amberSoft} />
      </>
    );
    go = [{ label: 'Hayvanlara git', href: '/livestock' }];
  } else if (zone === 'water') {
    icon = <Droplets size={20} color={C.blue} />;
    tint = C.blueSoft;
    subtitle = `Depo ${Math.round(state.tank)} L · ${fishCount(state)} balık`;
    body = (
      <Row gap={S.lg}>
        <Meter label="Su deposu" value={(state.tank / tankCapacity(state)) * 100} color={C.blue} track={C.blueSoft} />
        <Meter label="Havuz suyu" value={state.pond.quality} color={C.greenMid} track={C.greenSoft} />
      </Row>
    );
    go = [
      { label: 'Su deposu', href: '/water' },
      { label: 'Balık havuzu', href: '/pond' },
    ];
  } else if (zone === 'house') {
    const lvl = levelProgress(state.xp);
    icon = <Home size={20} color={C.amber} />;
    tint = C.amberSoft;
    subtitle = `Seviye ${lvl.level} · ${state.coins} altın`;
    body = <Txt v="body">Dinlen, sabaha kadar uyu ya da çiftliğini baştan kur.</Txt>;
    go = [{ label: 'Eve gir', href: '/house' }];
  } else {
    icon = <Package size={20} color={C.inkSoft} />;
    tint = '#EFEBE1';
    const units = Object.values(state.inventory).reduce((n, v) => n + (v ?? 0), 0);
    subtitle = `${units} birim · ${inventoryValue(state)} altın değerinde ürün`;
    body = <Txt v="body">Hasat ve hayvan ürünleri burada birikir. Pazarda satabilirsin.</Txt>;
    go = [{ label: 'Ambara git', href: '/(tabs)/storage' }];
  }

  return (
    <Card style={{ gap: S.md }}>
      <Row>
        <IconBadge tint={tint}>{icon}</IconBadge>
        <View style={{ flex: 1 }}>
          <Txt v="heading">{title}</Txt>
          <Txt v="caption" numberOfLines={1}>{subtitle}</Txt>
        </View>
      </Row>
      {body}
      <Row gap={S.sm}>
        {go.map((g, i) => (
          <Button
            key={g.label}
            label={g.label}
            kind={i === 0 ? 'primary' : 'soft'}
            icon={i === 0 ? <ArrowRight size={16} color={C.white} /> : undefined}
            onPress={() => router.push(g.href)}
            style={{ flex: 1 }}
          />
        ))}
      </Row>
    </Card>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Txt v="heading">{value}</Txt>
      <Txt v="caption" numberOfLines={1}>{label}</Txt>
    </View>
  );
}

function ExploreTile({ title, sub, tint, icon, href }: { title: string; sub: string; tint: string; icon: ReactNode; href: Href }) {
  return (
    <Card onPress={() => router.push(href)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md }}>
      <IconBadge tint={tint} size={38}>{icon}</IconBadge>
      <View style={{ flex: 1 }}>
        <Txt v="label">{title}</Txt>
        <Txt v="caption" numberOfLines={1}>{sub}</Txt>
      </View>
    </Card>
  );
}

export default function FarmScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const state = useGame();
  const [zone, setZone] = useState<ZoneId | null>(null);
  const weather = weatherFor(dayOf(state.minutes));
  const mapSize = Math.min(width, 520) - S.xl * 2 - S.md * 2;
  const [moving, setMoving] = useState<FieldId | null>(null);
  const order: (ZoneId | null)[] = [null, 'house', ...ownedLand(state).map((f) => f.id), 'animals', 'water', 'storage'];
  const forSale = FIELDS.filter((f) => f.land && !ownsLand(state, f.id)).length;
  const firstField = ownedFields(state)[0]?.id ?? 'tomatoes';
  const pickUp = (f: FieldId) => {
    setMoving(f);
    setZone(null);
  };
  const tap = (z: ZoneId) => {
    if (moving) {
      // Put down: on other land of ours, the two swap places; anywhere else, nothing moves.
      if (isLand(z) && z !== moving && ownsLand(state, z)) useGame.getState().swapLand(moving, z);
      setMoving(null);
      return;
    }
    setZone(zone === z ? null : z);
  };
  const hold = (z: ZoneId) => {
    if (isLand(z) && ownsLand(state, z)) pickUp(z);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + S.md, paddingBottom: 120 + insets.bottom, gap: S.lg }} showsVerticalScrollIndicator={false}>
        <Row style={{ paddingHorizontal: S.xl, justifyContent: 'space-between' }}>
          <View>
            <Txt v="display">Çiftliğim</Txt>
            <Txt v="caption">📍 {state.farmName} · {farmArea(state).toLocaleString('tr-TR')} dönüm</Txt>
          </View>
          <View style={styles.weatherBtn}>
            <WeatherIcon kind={weather.kind} size={26} night={isNight(hourOf(state.minutes))} />
          </View>
        </Row>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.xl, gap: S.sm, paddingVertical: 4 }}>
          {order.map((z) => (
            <Chip
              key={z ?? 'all'}
              label={z ? zoneName(state, z) : 'Genel Bakış'}
              active={zone === z}
              icon={z ? undefined : <Map size={14} color={zone === null ? C.white : C.ink} />}
              onPress={() => setZone(z)}
            />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: S.xl, gap: S.lg }}>
          <Card style={{ padding: S.md, alignItems: 'center' }}>
            <FarmMap state={state} selected={zone} onSelect={tap} onHold={hold} moving={moving} size={mapSize} />
          </Card>

          {moving ? (
            <Card tint={C.amberSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <Move size={22} color={C.amber} />
              <View style={{ flex: 1 }}>
                <Txt v="label">{zoneName(state, moving)} taşınıyor</Txt>
                <Txt v="caption">Yer değiştirmek için başka bir arazine dokun</Txt>
              </View>
              <Button small kind="ghost" label="Vazgeç" onPress={() => setMoving(null)} />
            </Card>
          ) : zone ? (
            <ZoneCard zone={zone} state={state} onMove={pickUp} />
          ) : (
            <Card tint={C.greenSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <Hand size={22} color={C.green} />
              <View style={{ flex: 1 }}>
                <Txt v="label">Bir bölgeye dokun; taşımak için basılı tut</Txt>
                <Txt v="caption">
                  {plantedCount(state)} ekili parsel · {state.animals.length} hayvan
                  {forSale ? ` · ${forSale} satılık arazi` : ''}
                </Txt>
              </View>
            </Card>
          )}

          <SectionHeader title="Keşfet" />
          <Row gap={S.md}>
            <ExploreTile title="Tarlalarım" sub={`${plantedCount(state)} ekili parsel`} tint={C.greenSoft} icon={<Wheat size={18} color={C.green} />} href={`/field/${firstField}`} />
            <ExploreTile title="Hayvanlar" sub={`${state.animals.length} hayvan`} tint={C.roseSoft} icon={<PawPrint size={18} color={C.rose} />} href="/livestock" />
          </Row>
          <Row gap={S.md}>
            <ExploreTile title="Sulama" sub={`Depo ${Math.round(state.tank)} L`} tint={C.blueSoft} icon={<Droplets size={18} color={C.blue} />} href="/water" />
            <ExploreTile title="Balık havuzu" sub={`${fishCount(state)} balık`} tint={C.blueSoft} icon={<Fish size={18} color={C.blue} />} href="/pond" />
          </Row>
          <Card onPress={() => router.push('/upgrades')} tint={C.amberSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <IconBadge tint={C.white}>
              <Maximize2 size={20} color={C.amber} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="label">Çiftliği büyüt</Txt>
              <Txt v="caption">Yeni arazi al, tarlaları genişlet, binaları büyüt</Txt>
            </View>
            <ArrowRight size={18} color={C.amber} />
          </Card>
          <Card onPress={() => router.push('/power')} tint={state.power.unpaid ? C.roseSoft : C.amberSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <IconBadge tint={C.white}>
              <Zap size={20} color={state.power.unpaid ? C.rose : C.amber} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="label">Elektrik</Txt>
              <Txt v="caption">
                {state.power.unpaid
                  ? `${state.power.unpaid} altın fatura ödenmedi · makineler durdu`
                  : powerBalance(state) > 0
                    ? `Bugünkü fatura şimdilik ${powerBalance(state)} altın · panel kur, kendin üret`
                    : `Bugün ${-powerBalance(state)} altınlık elektrik satıyorsun`}
              </Txt>
            </View>
            <ArrowRight size={18} color={state.power.unpaid ? C.rose : C.amber} />
          </Card>
          <Card onPress={() => router.push('/machines')} tint={C.blueSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <IconBadge tint={C.white}>
              <Bot size={20} color={C.blue} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="label">Makineler ve robotlar</Txt>
              <Txt v="caption">
                {Object.values(state.machines).filter((m) => m?.on).length} makine çalışıyor · işleri otomatikleştir
              </Txt>
            </View>
            <ArrowRight size={18} color={C.blue} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  weatherBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
