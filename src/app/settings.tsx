import { router } from 'expo-router';
import { BookOpen, Pencil, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, IconBadge, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { seasonLabel, dayOf } from '@/game/clock';
import { SEASON_DAYS } from '@/game/data';
import { useGame } from '@/game/store';
import { C, F, R, S } from '@/theme';

/** Settings: the farm's name, how the game keeps time, and starting over. */
export default function SettingsScreen() {
  const farmName = useGame((s) => s.farmName);
  const minutes = useGame((s) => s.minutes);
  const { rename, reset } = useGame.getState();
  const [name, setName] = useState(farmName);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Screen bottomGap={40} header={<TopBar title="Ayarlar" subtitle={farmName} />}>
      <SectionHeader title="Çiftlik" />
      <Card style={{ gap: S.md }}>
        <Row gap={S.md}>
          <IconBadge tint={C.greenSoft}>
            <Pencil size={18} color={C.green} />
          </IconBadge>
          <View style={{ flex: 1 }}>
            <Txt v="label">Çiftliğin adı</Txt>
            <Txt v="caption">Ana sayfada ve haritada görünür</Txt>
          </View>
        </Row>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={32}
          placeholder="Çiftliğin adı"
          placeholderTextColor={C.muted}
          style={styles.input}
          accessibilityLabel="Çiftliğin adı"
        />
        <Button label="Adı kaydet" onPress={() => rename(name)} disabled={!name.trim() || name.trim() === farmName} />
      </Card>

      <SectionHeader title="Oyun" />
      <Card style={{ gap: S.sm }}>
        <Txt v="body">
          Gerçek 1 saniye oyunda 1 dakika: bir gün 24 dakika sürer. Her mevsim {SEASON_DAYS} gün, bir yıl 4 mevsim. Şu an:{' '}
          {seasonLabel(dayOf(minutes))}.
        </Txt>
        <Txt v="caption">Uygulama kapalıyken de zaman işler (en fazla 48 oyun saati).</Txt>
        <Button small kind="soft" label="Nasıl oynanır?" icon={<BookOpen size={14} color={C.green} />} onPress={() => router.push('/house')} />
      </Card>

      <SectionHeader title="Sıfırlama" />
      <Card tint={C.roseSoft} style={{ gap: S.md }}>
        <Row gap={S.md}>
          <IconBadge tint={C.white}>
            <RotateCcw size={18} color={C.rose} />
          </IconBadge>
          <View style={{ flex: 1 }}>
            <Txt v="label">Çiftliği sıfırla</Txt>
            <Txt v="caption">Altın, hayvanlar, tarlalar, araziler ve başarımlar silinir; oyun baştan başlar. Geri alınamaz.</Txt>
          </View>
        </Row>
        {done ? (
          <Txt v="label" style={{ color: C.green }}>Çiftlik baştan kuruldu.</Txt>
        ) : confirm ? (
          <Row gap={S.sm}>
            <Button kind="ghost" label="Vazgeç" onPress={() => setConfirm(false)} style={{ flex: 1 }} />
            <Button
              kind="danger"
              label="Evet, sıfırla"
              onPress={() => {
                reset();
                setConfirm(false);
                setDone(true);
              }}
              style={{ flex: 1 }}
            />
          </Row>
        ) : (
          <Button kind="danger" label="Çiftliği sıfırla" onPress={() => setConfirm(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    fontFamily: F.semibold,
    fontSize: 16,
    color: C.ink,
    backgroundColor: C.white,
  },
});
