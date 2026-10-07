import { Droplets, Fish, Lock, Maximize2, Sprout, Warehouse } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CoinIcon } from '@/components/art/items';
import { Button, Card, IconBadge, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { FACILITIES, FIELD_EXPANSIONS, FIELDS, type FacilityId, type FieldId } from '@/game/data';
import { capacity, farmArea, fieldLevel, levelOf, useGame } from '@/game/store';
import { C, S } from '@/theme';

const FACILITY_LOOK: Record<FacilityId, { icon: ReactNode; tint: string }> = {
  barn: { icon: <Warehouse size={20} color={C.rose} />, tint: C.roseSoft },
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
            label={locked ? 'Kilitli' : 'Büyüt'}
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

export default function UpgradesScreen() {
  const state = useGame();
  const { expandField, upgrade } = useGame.getState();

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

      <SectionHeader title="Tarlalar" subtitle="Her genişletme dört yeni parsel ekler" />
      {FIELDS.map((f) => {
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
