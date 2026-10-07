import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGame, type FarmEvent } from '@/game/store';
import { C, F, R, shadow } from '@/theme';

const DOT: Record<FarmEvent['tone'], string> = { good: C.greenMid, bad: C.danger, info: C.amber };

/**
 * The newest farm event, slid in from the top for a moment. Events are how
 * the simulation talks back - a crop rotted, a level was reached - and they
 * happen while you are on some other screen, so this lives above all of them.
 */
export function EventToast() {
  const latest = useGame((s) => s.events[0]);
  const [shown, setShown] = useState<FarmEvent | null>(null);
  const seen = useRef(latest?.id ?? 0);
  const y = useState(() => new Animated.Value(-120))[0];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!latest || latest.id <= seen.current) return;
    seen.current = latest.id;
    setShown(latest);
    Animated.sequence([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.delay(2600),
      Animated.timing(y, { toValue: -120, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [latest, y]);

  if (!shown) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 6, transform: [{ translateY: y }] }]}>
      <View style={styles.toast}>
        <View style={[styles.dot, { backgroundColor: DOT[shown.tone] }]} />
        <Text style={styles.text} numberOfLines={2}>
          {shown.text}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.ink,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    maxWidth: 420,
    ...shadow,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: C.white, fontFamily: F.semibold, fontSize: 13, flexShrink: 1 },
});
