import { router } from 'expo-router';
import { Store } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinIcon, ItemIcon } from '@/components/art/items';
import { Button, Card, Row, SectionHeader, Txt } from '@/components/ui';
import { dayOf } from '@/game/clock';
import { ITEMS, type ItemId, type ItemKind } from '@/game/data';
import { inventoryValue } from '@/game/selectors';
import { sellPrice, useGame } from '@/game/store';
import { C, R, S } from '@/theme';

const GROUPS: { kind: ItemKind; title: string }[] = [
  { kind: 'goods', title: 'İşlenmiş ürünler' },
  { kind: 'crop', title: 'Tarla ürünleri' },
  { kind: 'produce', title: 'Hayvan ürünleri' },
  { kind: 'fish', title: 'Balıklar' },
  { kind: 'seed', title: 'Tohumlar' },
  { kind: 'supply', title: 'Yem ve malzeme' },
];

export default function StorageScreen() {
  const insets = useSafeAreaInsets();
  const state = useGame();
  const day = dayOf(state.minutes);
  const units = Object.values(state.inventory).reduce((n, v) => n + (v ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + S.md, paddingBottom: 120 + insets.bottom, paddingHorizontal: S.xl, gap: S.lg }} showsVerticalScrollIndicator={false}>
        <View>
          <Txt v="display">Ambar</Txt>
          <Txt v="caption">Hasat ettiğin ve topladığın her şey</Txt>
        </View>

        <Card tint={C.green} style={{ gap: S.sm }}>
          <Txt v="caption" style={{ color: '#CFE3D3' }}>Satılabilir ürünlerin bugünkü değeri</Txt>
          <Row gap={8}>
            <Txt v="display" style={{ color: C.white }}>{inventoryValue(state).toLocaleString('tr-TR')}</Txt>
            <CoinIcon size={24} />
          </Row>
          <Txt v="caption" style={{ color: '#CFE3D3' }}>{units} birim stok</Txt>
          <Button kind="soft" label="Pazara git" icon={<Store size={16} color={C.green} />} onPress={() => router.push('/(tabs)/market')} style={{ marginTop: S.sm }} />
        </Card>

        {GROUPS.map((g) => {
          const items = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === g.kind && (state.inventory[id] ?? 0) > 0);
          if (!items.length) return null;
          return (
            <View key={g.kind} style={{ gap: S.md }}>
              <SectionHeader title={g.title} />
              <View style={styles.grid}>
                {items.map((id) => {
                  const sellable = g.kind !== 'seed' && g.kind !== 'supply';
                  return (
                    <View key={id} style={styles.cell}>
                      <Card style={styles.item}>
                        <View style={styles.iconWrap}>
                          <ItemIcon id={id} size={52} />
                        </View>
                        <Txt v="label" numberOfLines={1}>{ITEMS[id].name}</Txt>
                        <Txt v="number" style={{ fontSize: 20 }}>
                          {state.inventory[id]} <Txt v="caption">{ITEMS[id].unit}</Txt>
                        </Txt>
                        {sellable ? (
                          <Row gap={4}>
                            <CoinIcon size={12} />
                            <Txt v="caption">{sellPrice(day, id)} / birim</Txt>
                          </Row>
                        ) : null}
                      </Card>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -S.xs },
  cell: { width: '33.333%', padding: S.xs },
  item: { padding: S.md, gap: 4, alignItems: 'flex-start' },
  iconWrap: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: C.cardSoft, borderRadius: R.md, paddingVertical: 6, marginBottom: 4 },
});
