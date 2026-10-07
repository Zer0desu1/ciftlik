import { router, type Href } from 'expo-router';
import { ArrowRight, Bot, Droplets, Fish, Hand, Home, Lock, Map, Maximize2, Package, PawPrint, Sprout, Wheat } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeatherIcon } from '@/components/art/weather';
import { FarmMap, type ZoneId } from '@/components/farm-map';
import { CoinIcon } from '@/components/art/items';
import { Button, Card, Chip, IconBadge, Meter, Row, SectionHeader, Txt } from '@/components/ui';
import { dayOf, hourOf, isNight, weatherFor } from '@/game/clock';
import { BASE_PLOTS, CROPS, FIELDS, LAND_AREA, SPECIES, type FieldId, type SpeciesId } from '@/game/data';
import { fishCount, herdOf, inventoryValue, plantedCount, summarizeField } from '@/game/selectors';
import { barnCapacity, farmArea, levelOf, levelProgress, ownedFields, ownsField, tankCapacity, useGame, type GameState } from '@/game/store';
import { C, S } from '@/theme';

const CHIP_LABEL = {
  house: 'Çiftlik Evi',
  animals: 'Hayvanlar',
  water: 'Su & Havuz',
  storage: 'Ambar',
  ...Object.fromEntries(FIELDS.map((f) => [f.id, f.name])),
} as Record<ZoneId, string>;

const isField = (z: ZoneId): z is FieldId => FIELDS.some((f) => f.id === z);

/** Land around the farm not bought yet: what it costs and what it brings. */
function LandCard({ field, state }: { field: FieldId; state: GameState }) {
  const def = FIELDS.find((f) => f.id === field)!;
  const land = def.land!;
  const locked = land.level > levelOf(state.xp);
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
        Satın alınca {BASE_PLOTS} parsellik yeni bir tarla olur. {def.suggested.map((c) => CROPS[c].name).join(' ve ')} için çok uygun.
      </Txt>
      <Button
        label={locked ? `Seviye ${land.level} gerekli` : `Satın al · ${land.price} altın`}
        icon={locked ? <Lock size={16} color={C.white} /> : <CoinIcon size={16} />}
        onPress={() => buyLand(field)}
        disabled={locked || state.coins < land.price}
      />
    </Card>
  );
}

function ZoneCard({ zone, state }: { zone: ZoneId; state: GameState }) {
  if (isField(zone) && !ownsField(state, zone)) return <LandCard field={zone} state={state} />;
  let icon: ReactNode;
  let tint: string;
  let title = CHIP_LABEL[zone];
  let subtitle = '';
  let body: ReactNode = null;
  let go: { label: string; href: Href }[] = [];

  if (isField(zone)) {
    const s = summarizeField(state.fields[zone]);
    const crops = Array.from(new Set(state.fields[zone].filter((p) => p.crop).map((p) => CROPS[p.crop!].name)));
    icon = <Sprout size={20} color={C.green} />;
    tint = C.greenSoft;
    title = FIELDS.find((f) => f.id === zone)!.name;
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
  const order: (ZoneId | null)[] = [null, 'house', ...ownedFields(state).map((f) => f.id), 'animals', 'water', 'storage'];
  const forSale = FIELDS.filter((f) => f.land && !ownsField(state, f.id)).length;

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
              label={z ? CHIP_LABEL[z] : 'Genel Bakış'}
              active={zone === z}
              icon={z ? undefined : <Map size={14} color={zone === null ? C.white : C.ink} />}
              onPress={() => setZone(z)}
            />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: S.xl, gap: S.lg }}>
          <Card style={{ padding: S.md, alignItems: 'center' }}>
            <FarmMap state={state} selected={zone} onSelect={(z) => setZone(zone === z ? null : z)} size={mapSize} />
          </Card>

          {zone ? (
            <ZoneCard zone={zone} state={state} />
          ) : (
            <Card tint={C.greenSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
              <Hand size={22} color={C.green} />
              <View style={{ flex: 1 }}>
                <Txt v="label">Bir bölgeye dokun, haritayı sürükle ya da yakınlaştır</Txt>
                <Txt v="caption">
                  {plantedCount(state)} ekili parsel · {state.animals.length} hayvan
                  {forSale ? ` · ${forSale} satılık arazi` : ''}
                </Txt>
              </View>
            </Card>
          )}

          <SectionHeader title="Keşfet" />
          <Row gap={S.md}>
            <ExploreTile title="Tarlalarım" sub={`${plantedCount(state)} ekili parsel`} tint={C.greenSoft} icon={<Wheat size={18} color={C.green} />} href="/field/tomatoes" />
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
