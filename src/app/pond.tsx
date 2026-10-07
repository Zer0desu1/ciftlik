import { Check, Droplet, Fish as FishIcon, Heart, Plus, Sparkles, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { FishArt } from '@/components/art/animals';
import { ItemIcon } from '@/components/art/items';
import { PondView } from '@/components/pond-view';
import { Bar, Button, Card, Meter, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { FISH, type FishSpeciesId } from '@/game/data';
import { fishCount } from '@/game/selectors';
import { canSpawn, levelOf, pondCapacity, SPAWN_FULLNESS, SPAWN_QUALITY, useGame, type FishBatch } from '@/game/store';
import { C, R, S } from '@/theme';

/** Spawning, laid out as a checklist: which conditions hold right now and which don't. */
function Breeding() {
  const pond = useGame((s) => s.pond);
  const total = pond.batches.reduce((n, b) => n + b.count, 0);
  const room = useGame(pondCapacity) - total;
  const pairs = pond.batches.filter((b) => b.growth >= 1 && b.count >= 2);
  const ready = pond.batches.some((b) => canSpawn(b, pond, room));
  const rows = [
    { ok: pairs.length > 0, text: 'Aynı türden en az iki büyümüş balık' },
    { ok: pond.fullness > SPAWN_FULLNESS, text: `Tokluk %${SPAWN_FULLNESS}'nin üstünde` },
    { ok: pond.quality > SPAWN_QUALITY, text: `Su kalitesi %${SPAWN_QUALITY}'ın üstünde` },
    { ok: room > 0, text: `Havuzda yer var (${room} boş)` },
  ];
  return (
    <Card tint={ready ? C.greenSoft : undefined} style={{ gap: S.md }}>
      <Row gap={S.sm}>
        <Heart size={18} color={ready ? C.green : C.muted} fill={ready ? C.green : 'none'} />
        <Txt v="heading" style={{ flex: 1 }}>Üreme</Txt>
        <Pill text={ready ? 'Yavrulayabilir' : 'Şartlar eksik'} tone={ready ? 'green' : 'muted'} />
      </Row>
      {rows.map((r) => (
        <Row key={r.text} gap={S.sm}>
          {r.ok ? <Check size={16} color={C.green} strokeWidth={3} /> : <X size={16} color={C.rose} strokeWidth={3} />}
          <Txt v="body" style={{ flex: 1, fontSize: 13, color: r.ok ? C.ink : C.inkSoft }}>{r.text}</Txt>
        </Row>
      ))}
      <Txt v="caption">
        {ready
          ? 'Şartlar sağlandığı sürece büyümüş balıklar birkaç saatte bir yavrular. Yavrular havuzda yeni bir grup olarak büyür.'
          : 'Büyüyen balıkları hemen tutmazsan ve havuzu tok, temiz tutarsan çoğalırlar.'}
      </Txt>
    </Card>
  );
}

function BatchRow({ batch }: { batch: FishBatch }) {
  const f = FISH[batch.species];
  const ready = batch.growth >= 1;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md }}>
      <View style={styles.fishThumb}>
        <FishArt species={batch.species} size={52} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label">
            {batch.count} {f.name.toLowerCase()}
          </Txt>
          <Pill text={ready ? 'Tutulmaya hazır' : `%${Math.round(batch.growth * 100)} büyüdü`} tone={ready ? 'green' : 'blue'} />
        </Row>
        <Bar value={batch.growth * 100} color={C.blue} track={C.blueSoft} />
      </View>
      {ready ? (
        <View style={{ gap: 6 }}>
          <Txt v="caption" style={{ textAlign: 'center' }}>Tut</Txt>
          <Row gap={4}>
            <Button small kind="soft" label="1" onPress={() => useGame.getState().catchFish(batch.id, 1)} />
            {batch.count > 5 ? <Button small kind="soft" label="5" onPress={() => useGame.getState().catchFish(batch.id, 5)} /> : null}
            <Button small label="Hepsi" onPress={() => useGame.getState().catchFish(batch.id)} />
          </Row>
        </View>
      ) : null}
    </Card>
  );
}

export default function PondScreen() {
  const pond = useGame((s) => s.pond);
  const feed = useGame((s) => s.inventory.fish_feed ?? 0);
  const coins = useGame((s) => s.coins);
  const level = levelOf(useGame((s) => s.xp));
  const total = useGame((s) => fishCount(s));
  const cap = useGame(pondCapacity);
  const { feedFish, cleanPond, stockFish } = useGame.getState();

  return (
    <Screen bottomGap={40} header={<TopBar title="Balık Havuzu" subtitle={`${total} / ${cap} balık`} />}>
      <PondView batches={pond.batches} quality={pond.quality} feedKey={pond.feeds ?? 0} />

      <Card style={{ gap: S.lg }}>
        <Row gap={S.lg}>
          <Meter label="Tokluk" value={pond.fullness} color={C.amber} track={C.amberSoft} />
          <Meter label="Su kalitesi" value={pond.quality} color={C.blue} track={C.blueSoft} />
        </Row>
        <Row gap={S.sm}>
          <Button kind="soft" label={`Yem at (${feed})`} icon={<FishIcon size={16} color={C.green} />} onPress={feedFish} disabled={pond.fullness > 90} style={{ flex: 1 }} />
          <Button kind="soft" label="Suyu temizle" icon={<Sparkles size={16} color={C.green} />} onPress={cleanPond} disabled={pond.quality > 90} style={{ flex: 1 }} />
        </Row>
        <Txt v="caption">
          Balıklar ancak tok ve su temizken büyür; büyüyen balıklar yer varsa kendiliğinden yavrular. Bulanık suda balık kaybedebilirsin. Temizlik 12 altın.
        </Txt>
      </Card>

      <Breeding />

      <SectionHeader title="Havuzdakiler" subtitle="Büyüyen balıkları tutup ambara at ya da çoğalmaya bırak" />
      {pond.batches.length ? pond.batches.map((b) => <BatchRow key={b.id} batch={b} />) : (
        <Card>
          <Txt v="body">Havuzda balık yok.</Txt>
        </Card>
      )}

      <SectionHeader title="Yavru balık bırak" subtitle={`${cap - total} yer var · ${coins} altının var`} />
      {(Object.keys(FISH) as FishSpeciesId[]).map((id) => {
        const f = FISH[id];
        const locked = f.level > level;
        return (
          <Card key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, opacity: locked ? 0.55 : 1 }}>
            <ItemIcon id={f.catch} size={44} />
            <View style={{ flex: 1 }}>
              <Txt v="label">{f.name}</Txt>
              <Txt v="caption">
                {f.growHours} saatte büyür · yavru {f.price} altın
              </Txt>
            </View>
            <Button
              small
              label={locked ? `Sv. ${f.level}` : '+5'}
              icon={locked ? undefined : <Plus size={14} color={C.white} />}
              onPress={() => stockFish(id, 5)}
              disabled={locked || total >= cap}
            />
          </Card>
        );
      })}
      <Row gap={6} style={{ justifyContent: 'center' }}>
        <Droplet size={14} color={C.muted} />
        <Txt v="caption">Yağmur havuzun suyunu tazeler.</Txt>
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fishThumb: { width: 64, height: 64, borderRadius: R.md, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
});
