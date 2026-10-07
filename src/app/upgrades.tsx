import { Droplets, Egg, Fish, Lock, Map, Maximize2, Sprout, Warehouse } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { CoinIcon } from '@/components/art/items';
import { ConvertCard, UseIcon } from '@/components/land-convert';
import { Button, Card, IconBadge, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { FACILITIES, FIELD_EXPANSIONS, FIELDS, LAND_AREA, LAND_USES, landName, type FacilityId, type FieldId } from '@/game/data';
import { capacity, farmArea, fieldLevel, levelOf, ownsField, ownsLand, useGame } from '@/game/store';
import { C, S } from '@/theme';

const FACILITY_LOOK: Record<FacilityId, { icon: ReactNode; tint: string }> = {
  barn: { icon: <Warehouse size={20} color={C.rose} />, tint: C.roseSoft },
  coop: { icon: <Egg size={20} color={C.amber} />, tint: C.amberSoft },
  pond: { icon: <Fish size={20} color={C.blue} />, tint: C.blueSoft },
  tank: { icon: <Droplets size={20} color={C.blue} />, tint: C.blueSoft },
};

/** Filled dots for the steps taken, hollow for the ones left. */
function Steps({ done, total }: { done: number; total: number }) {
  return (
    <Row gap={5}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: i < done ? C.green : C.line }}
        />
      ))}
    </Row>
  );
}

/** One thing that can be made bigger: what it is now, what the next step gives, and the button. */
function UpgradeCard({
  icon,
  tint,
  title,
  now,
  next,
  done,
  total,
  step,
  onPress,
  action = 'Büyüt',
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  now: string;
  next: string | null;
  done: number;
  total: number;
  step: { cost: number; level: number } | undefined;
  onPress: () => void;
  action?: string;
}) {
  const coins = useGame((s) => s.coins);
  const level = levelOf(useGame((s) => s.xp));
  const locked = !!step && step.level > level;
  return (
    <Card style={{ gap: S.md }}>
      <Row>
        <IconBadge tint={tint}>{icon}</IconBadge>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="heading">{title}</Txt>
          <Txt v="caption">{now}</Txt>
        </View>
        <Steps done={done} total={total} />
      </Row>
      {step && next ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Txt v="label">{next}</Txt>
            <Row gap={4}>
              <CoinIcon size={13} />
              <Txt v="caption">{step.cost} altın</Txt>
              {locked ? <Pill text={`Seviye ${step.level}`} tone="muted" /> : null}
            </Row>
          </View>
          <Button
            small
            label={locked ? 'Kilitli' : action}
            icon={locked ? <Lock size={14} color={C.white} /> : <Maximize2 size={14} color={C.white} />}
            onPress={onPress}
            disabled={locked || coins < step.cost}
          />
        </Row>
      ) : (
        <Pill text="En büyük hâlinde" tone="green" />
      )}
    </Card>
  );
}

/** The land owned, each with what it is now; tapping one opens its converter. */
function MyLand() {
  const land = useGame((s) => s.land);
  const [open, setOpen] = useState<FieldId | null>(null);
  return (
    <>
      {FIELDS.filter((f) => land[f.id]).map((f) => {
        const use = land[f.id]!;
        return open === f.id ? (
          <View key={f.id} style={{ gap: S.sm }}>
            <ConvertCard field={f.id} title={landName(f, use)} />
            <Button small kind="ghost" label="Kapat" onPress={() => setOpen(null)} />
          </View>
        ) : (
          <Card key={f.id} onPress={() => setOpen(f.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md }}>
            <IconBadge tint={use === 'empty' ? C.amberSoft : C.greenSoft} size={38}>
              <UseIcon use={use} color={use === 'empty' ? C.amber : C.green} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="label">{landName(f, use)}</Txt>
              <Txt v="caption">{LAND_USES[use].name}</Txt>
            </View>
            <Pill text="Dönüştür" tone={use === 'empty' ? 'amber' : 'muted'} />
          </Card>
        );
      })}
    </>
  );
}

export default function UpgradesScreen() {
  const state = useGame();
  const { expandField, upgrade, buyLand } = useGame.getState();

  return (
    <Screen bottomGap={40} header={<TopBar title="Çiftliği Büyüt" subtitle={`${farmArea(state).toLocaleString('tr-TR')} dönüm`} />}>
      <Card tint={C.green} style={{ gap: S.sm }}>
        <Txt v="caption" style={{ color: '#CFE3D3' }}>Kasadaki altın</Txt>
        <Row gap={8}>
          <Txt v="display" style={{ color: C.white }}>{state.coins.toLocaleString('tr-TR')}</Txt>
          <CoinIcon size={24} />
        </Row>
        <Txt v="caption" style={{ color: '#CFE3D3' }}>
          Her büyütme çiftliğine arazi ve 10 XP katar. Bazı adımlar için seviye gerekir.
        </Txt>
      </Card>

      <SectionHeader title="Arazilerim" subtitle="Dokun, ne olacağını seç: tarla, ahır, balık havuzu, su deposu, güneş tarlası" />
      <MyLand />

      <SectionHeader title="Arazi" subtitle="Boş gelir; haritada araziye dokunup tarla, ahır, havuz, su deposu ya da güneş tarlası yap" />
      {FIELDS.filter((f) => f.land && !ownsLand(state, f.id)).map((f) => (
        <UpgradeCard
          key={f.id}
          icon={<Map size={20} color={C.amber} />}
          tint={C.amberSoft}
          title={f.name}
          now="Satılık arazi"
          next={`Boş arazi · +${LAND_AREA.toLocaleString('tr-TR')} dönüm`}
          done={0}
          total={1}
          step={{ cost: f.land!.price, level: f.land!.level }}
          onPress={() => buyLand(f.id)}
          action="Satın al"
        />
      ))}
      {FIELDS.every((f) => !f.land || ownsLand(state, f.id)) ? (
        <Card>
          <Txt v="body">Çevredeki bütün araziyi aldın.</Txt>
        </Card>
      ) : null}

      <SectionHeader title="Tarlalar" subtitle="Her genişletme dört yeni parsel ekler" />
      {FIELDS.filter((f) => ownsField(state, f.id)).map((f) => {
        const id: FieldId = f.id;
        const lvl = fieldLevel(state, id);
        const step = FIELD_EXPANSIONS[lvl];
        return (
          <UpgradeCard
            key={id}
            icon={<Sprout size={20} color={C.green} />}
            tint={C.greenSoft}
            title={f.name}
            now={`${state.fields[id].length} parsel`}
            next={step ? `+${step.plots} parsel → ${state.fields[id].length + step.plots}` : null}
            done={lvl}
            total={FIELD_EXPANSIONS.length}
            step={step}
            onPress={() => expandField(id)}
          />
        );
      })}

      <SectionHeader title="Binalar" subtitle="Daha çok hayvan, balık ve su için" />
      {(Object.keys(FACILITIES) as FacilityId[]).map((id) => {
        const f = FACILITIES[id];
        const lvl = state.upgrades[id];
        const step = f.steps[lvl];
        return (
          <UpgradeCard
            key={id}
            icon={FACILITY_LOOK[id].icon}
            tint={FACILITY_LOOK[id].tint}
            title={f.name}
            now={`${capacity(state, id).toLocaleString('tr-TR')} ${f.unit} kapasite`}
            next={step ? `${step.capacity.toLocaleString('tr-TR')} ${f.unit} kapasite` : null}
            done={lvl}
            total={f.steps.length}
            step={step}
            onPress={() => upgrade(id)}
          />
        );
      })}
    </Screen>
  );
}
