import { Tabs } from 'expo-router/js-tabs';
import { BarChart3, Home, Package, Sprout, Store } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '@/theme';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number; fill?: string }>;

const TABS: { name: string; label: string; Icon: IconType }[] = [
  { name: 'index', label: 'Ana Sayfa', Icon: Home },
  { name: 'farm', label: 'Çiftlik', Icon: Sprout },
  { name: 'market', label: 'Pazar', Icon: Store },
  { name: 'storage', label: 'Ambar', Icon: Package },
  { name: 'analytics', label: 'Analiz', Icon: BarChart3 },
];

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
};

/** The reference's bar: white, hairline on top, outline icons, the current one in deep green. */
function TabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const active = state.index === i;
        const color = active ? C.green : C.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            }}>
            <tab.Icon size={22} color={color} strokeWidth={active ? 2.4 : 1.8} />
            <Text style={[styles.label, { color: active ? C.ink : C.muted, fontFamily: active ? F.bold : F.medium }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.page } }}
      tabBar={(props) => <TabBar {...(props as unknown as BarProps)} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 11 },
});
