import { Droplets, Egg, Fish, Move, PawPrint, Shovel, Sprout, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Pill, Row, Txt } from '@/components/ui';
import { FIELDS, LAND_USES, type FieldId, type LandUse } from '@/game/data';
import { levelOf, useGame } from '@/game/store';
import { C, S } from '@/theme';

const USES = Object.keys(LAND_USES) as LandUse[];
const defOf = (id: FieldId) => FIELDS.find((f) => f.id === id)!;

export function UseIcon({ use, color }: { use: LandUse; color: string }) {
  if (use === 'field') return <Sprout size={16} color={color} />;
  if (use === 'barn') return <PawPrint size={16} color={color} />;
  if (use === 'coop') return <Egg size={16} color={color} />;
  if (use === 'pond') return <Fish size={16} color={color} />;
  if (use === 'solar') return <Sun size={16} color={color} />;
  if (use === 'empty') return <Shovel size={16} color={color} />;
  return <Droplets size={16} color={color} />;
}

/** Turning a piece of land into something else, or picking it up to move it. */
export function ConvertCard({ field, onMove, title }: { field: FieldId; onMove?: () => void; title?: string }) {
  const state = useGame();
  // A field with crops on it asks once before digging them up.
  const [asking, setAsking] = useState<LandUse | null>(null);
  const use = state.land[field];
  if (!use) return null;
  const level = levelOf(state.xp);
  const { convertLand } = useGame.getState();
  const growing = use === 'field' ? state.fields[field].filter((p) => p.crop && !p.dead).length : 0;
  const pick = (u: LandUse) => (growing ? setAsking(u) : convertLand(field, u));
  return (
    <Card style={{ gap: S.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="label">{title ?? (use === 'empty' ? 'Bu arazi ne olsun?' : 'Dönüştür')}</Txt>
        <Pill text={`Şu an: ${LAND_USES[use].name}`} tone={use === 'empty' ? 'amber' : 'green'} />
      </Row>
      <Txt v="caption">
        {use === 'field'
          ? 'Tarlayı bozup başka bir şey yapabilirsin. Üzerindeki ekinler sökülür.'
          : 'Hayvanlar ya da balıklar varsa önce kalan yere sığmaları gerekir.'}
      </Txt>
      {asking ? (
        <View style={{ gap: S.sm }}>
          <Txt v="body" style={{ color: C.rose }}>
            {growing} ekin sökülecek ve kaybolacak. {defOf(field).name}, {LAND_USES[asking].name.toLowerCase()} olsun mu?
          </Txt>
          <Row gap={S.sm}>
            <Button small kind="ghost" label="Vazgeç" onPress={() => setAsking(null)} style={{ flex: 1 }} />
            <Button
              small
              kind="danger"
              label="Tarlayı boz"
              onPress={() => {
                convertLand(field, asking, true);
                setAsking(null);
              }}
              style={{ flex: 1 }}
            />
          </Row>
        </View>
      ) : (
        <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
          {USES.filter((u) => u !== use).map((u) => {
            const needs = LAND_USES[u].level > level;
            const cost = LAND_USES[u].cost;
            return (
              <Button
                key={u}
                small
                kind="soft"
                label={needs ? `${LAND_USES[u].name} · Sv. ${LAND_USES[u].level}` : u === 'empty' ? (use === 'field' ? 'Tarlayı boz' : 'Boşalt') : `${LAND_USES[u].name} · ${cost}`}
                icon={<UseIcon use={u} color={C.green} />}
                onPress={() => pick(u)}
                disabled={needs || state.coins < cost}
                style={{ flexGrow: 1 }}
              />
            );
          })}
        </Row>
      )}
      {onMove ? <Button small kind="ghost" label="Yerini değiştir" icon={<Move size={14} color={C.green} />} onPress={onMove} /> : null}
    </Card>
  );
}
