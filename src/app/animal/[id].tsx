import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Baby, HandHeart, PackageOpen, Pill as PillIcon, Utensils } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AnimalArt } from '@/components/art/animals';
import { ItemIcon } from '@/components/art/items';
import { Bar, Button, Card, Meter, Pill, Row, Screen, Txt, TopBar } from '@/components/ui';
import { dayOf } from '@/game/clock';
import { ITEMS, SICK_DEATH_HOURS, SPECIES } from '@/game/data';
import { animalValue, dueAt, isAdult, isOld, useGame } from '@/game/store';
import { C, R, S } from '@/theme';

function ageLabel(days: number): string {
  if (days >= 365) return `${(days / 365).toFixed(1).replace('.', ',')} yaş`;
  if (days >= 30) return `${Math.floor(days / 30)} aylık`;
  return `${days} günlük`;
}

export default function AnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animal = useGame((s) => s.animals.find((a) => a.id === id));
  const minutes = useGame((s) => s.minutes);
  const medicine = useGame((s) => s.inventory.medicine ?? 0);
  const { pet, heal, feedSpecies, collect, sellAnimal } = useGame.getState();
  const [confirmSell, setConfirmSell] = useState(false);

  if (!animal) {
    return (
      <Screen header={<TopBar title="Hayvan" />}>
        <Card>
          <Txt v="body">Bu hayvan artık çiftlikte değil.</Txt>
        </Card>
      </Screen>
    );
  }

  const sp = SPECIES[animal.species];
  const day = dayOf(minutes);
  const value = animalValue(animal, day);
  const adult = isAdult(animal, day);
  const old = isOld(animal, day);
  const due = dueAt(animal);
  const stage = !adult ? 'Yavru' : old ? 'Yaşlı' : 'Yetişkin';

  return (
    <Screen bottomGap={40} header={<TopBar title={animal.name} subtitle={`${sp.name} · ${animal.tag}`} />}>
      <Card tint={C.greenSoft} style={{ alignItems: 'center', paddingVertical: S.xl }}>
        <AnimalArt species={animal.species} size={200} variant={animal.variant} young={!adult} />
        <Row gap={6} style={{ marginTop: S.sm }}>
          <Pill text={animal.breed} tone="green" />
          <Pill text={ageLabel(day - animal.bornDay)} tone="amber" />
          <Pill text={stage} tone={!adult ? 'green' : old ? 'muted' : 'blue'} />
        </Row>
      </Card>

      {animal.health < 15 ? (
        <Card tint={C.roseSoft} style={{ flexDirection: 'row', gap: S.md, alignItems: 'center' }}>
          <AlertTriangle size={22} color={C.rose} />
          <View style={{ flex: 1 }}>
            <Txt v="label" style={{ color: C.rose }}>{animal.name} çok hasta</Txt>
            <Txt v="caption">
              {animal.health <= 0
                ? `Yaklaşık ${Math.max(1, Math.ceil(SICK_DEATH_HOURS - animal.sickHours))} saat içinde ilaç vermez ve beslemezsen ölecek.`
                : 'Sağlığı sıfıra inerse ölüm saati başlar. Hemen besle ve ilaç ver.'}
            </Txt>
          </View>
        </Card>
      ) : null}

      {due !== null && sp.gestationHours !== null ? (
        <Card tint={C.blueSoft} style={{ gap: S.sm }}>
          <Row gap={S.sm}>
            <Baby size={18} color={C.blue} />
            <Txt v="label" style={{ flex: 1 }}>
              Gebe · {Math.max(1, Math.ceil((due - minutes) / 60))} saat sonra {sp.baby} doğacak
            </Txt>
          </Row>
          <Bar value={(1 - (due - minutes) / (sp.gestationHours * 60)) * 100} color={C.blue} track={C.white} />
        </Card>
      ) : null}

      <Card style={{ gap: S.lg }}>
        <Row gap={S.lg}>
          <Meter label="Sağlık" value={animal.health} color={C.green} track={C.greenSoft} />
          <Meter label="Tokluk" value={animal.fullness} color={C.amber} track={C.amberSoft} />
        </Row>
        <Row gap={S.lg}>
          <Meter label="Mutluluk" value={animal.happiness} color={C.rose} track={C.roseSoft} />
          <Meter label={ITEMS[sp.product].name} value={animal.product * 100} color={C.blue} track={C.blueSoft} />
        </Row>
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        <ItemIcon id={sp.product} size={44} />
        <View style={{ flex: 1 }}>
          <Txt v="label">
            Her {sp.productHours} saatte {sp.productAmount} {ITEMS[sp.product].unit} {ITEMS[sp.product].name.toLowerCase()}
          </Txt>
          <Txt v="caption">
            {!adult
              ? `Henüz yavru; ${sp.maturityDays - (day - animal.bornDay)} gün sonra büyüyüp üretmeye başlar.`
              : old
                ? 'Yaşlandı: daha az üretir ve bir gün yaşlılıktan ölebilir.'
                : 'Tok ve sağlıklıyken üretir; mutluyken daha hızlı.'}
          </Txt>
        </View>
      </Card>

      <Row gap={S.sm}>
        <Button kind="soft" label="Sev" icon={<HandHeart size={16} color={C.green} />} onPress={() => pet(animal.id)} style={{ flex: 1 }} />
        <Button kind="soft" label="Sürüyü besle" icon={<Utensils size={16} color={C.green} />} onPress={() => feedSpecies(animal.species)} style={{ flex: 1 }} />
      </Row>
      <Row gap={S.sm}>
        <Button
          kind="soft"
          label={`İlaç ver (${medicine})`}
          icon={<PillIcon size={16} color={C.green} />}
          onPress={() => heal(animal.id)}
          disabled={animal.health >= 95 || !medicine}
          style={{ flex: 1 }}
        />
        <Button label="Sürünün ürününü topla" icon={<PackageOpen size={16} color={C.white} />} onPress={() => collect(animal.species)} disabled={animal.product < 1} style={{ flex: 1 }} />
      </Row>

      <Card style={{ gap: S.sm, borderRadius: R.lg }}>
        <Txt v="label">Satış</Txt>
        <Txt v="caption">Bugün yaklaşık {value} altın eder. Satılan hayvan geri gelmez.</Txt>
        {confirmSell ? (
          <Row gap={S.sm}>
            <Button kind="ghost" label="Vazgeç" onPress={() => setConfirmSell(false)} style={{ flex: 1 }} />
            <Button
              kind="danger"
              label={`${value} altına sat`}
              onPress={() => {
                sellAnimal(animal.id);
                router.back();
              }}
              style={{ flex: 1 }}
            />
          </Row>
        ) : (
          <Button kind="ghost" label="Sat" onPress={() => setConfirmSell(true)} />
        )}
      </Card>
    </Screen>
  );
}
