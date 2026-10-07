import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { FishArt } from '@/components/art/animals';
import { FeedPellet } from '@/components/art/machines';
import { Txt } from '@/components/ui';
import type { FishSpeciesId } from '@/game/data';
import type { FishBatch } from '@/game/store';
import { C, R } from '@/theme';

/** More fish than this and the pond turns to noise; the count still shows above. */
const MAX_SHOWN = 16;
const PELLETS = 9;
const FISH_W = 40;

/** `landed` once it has sunk to its spot; fish only go for food they can reach. */
type Pellet = { id: number; x: number; y: number; fall: Animated.Value; eaten: boolean; landed: boolean };
type Point = { x: number; y: number };

/** Which fish to draw: every batch gets its share of the slots, grown fish drawn larger. */
function swimmersFor(batches: FishBatch[]): { key: string; species: FishSpeciesId; grown: number }[] {
  const total = batches.reduce((n, b) => n + b.count, 0);
  const shown = Math.min(total, MAX_SHOWN);
  const out: { key: string; species: FishSpeciesId; grown: number }[] = [];
  batches.forEach((b) => {
    const share = Math.max(1, Math.round((b.count / Math.max(total, 1)) * shown));
    for (let i = 0; i < Math.min(share, b.count); i++) out.push({ key: `${b.id}-${i}`, species: b.species, grown: b.growth });
  });
  return out.slice(0, MAX_SHOWN);
}

/**
 * One fish with a mind of its own: it drifts from one random spot to the next,
 * turning to face where it is going, until food lands; then it heads for the
 * nearest pellet and eats it.
 */
function Swimmer({
  species,
  grown,
  area,
  pellets,
  onEat,
}: {
  species: FishSpeciesId;
  grown: number;
  area: { w: number; h: number };
  pellets: Pellet[];
  onEat: (id: number) => void;
}) {
  const size = FISH_W * (0.6 + 0.4 * Math.min(1, grown));
  const [x] = useState(() => new Animated.Value(Math.random() * Math.max(1, area.w - size)));
  const [y] = useState(() => new Animated.Value(Math.random() * Math.max(1, area.h - size)));
  const [facing] = useState(() => new Animated.Value(1));
  const pos = useRef<Point>({ x: 0, y: 0 });
  const pelletsRef = useRef(pellets);
  const busy = useRef(false);

  useEffect(() => {
    pelletsRef.current = pellets;
  }, [pellets]);

  useEffect(() => {
    const sx = x.addListener(({ value }) => (pos.current.x = value));
    const sy = y.addListener(({ value }) => (pos.current.y = value));
    let alive = true;

    const swimTo = (target: Point, speed: number, done: () => void) => {
      const dx = target.x - pos.current.x;
      const dy = target.y - pos.current.y;
      const dist = Math.hypot(dx, dy);
      facing.setValue(dx >= 0 ? 1 : -1);
      const duration = Math.max(250, (dist / speed) * 1000);
      Animated.parallel([
        Animated.timing(x, { toValue: target.x, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: target.y, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!alive) return;
        // Cut short (food landed): look around again instead of finishing the old trip.
        if (finished) done();
        else next();
      });
    };

    function next() {
      if (!alive) return;
      const food = pelletsRef.current.filter((p) => p.landed && !p.eaten);
      if (food.length) {
        // Nearest pellet, aiming the mouth (the fish's front edge) at it.
        const nearest = food.reduce((a, b) =>
          Math.hypot(a.x - pos.current.x, a.y - pos.current.y) < Math.hypot(b.x - pos.current.x, b.y - pos.current.y) ? a : b,
        );
        busy.current = true;
        swimTo({ x: nearest.x - size / 2, y: nearest.y - size / 2 }, 75, () => {
          busy.current = false;
          if (!nearest.eaten) onEat(nearest.id);
          next();
        });
        return;
      }
      swimTo(
        { x: Math.random() * Math.max(1, area.w - size), y: Math.random() * Math.max(1, area.h - size) },
        28 + Math.random() * 18,
        () => setTimeout(next, 300 + Math.random() * 900),
      );
    }
    next();
    return () => {
      alive = false;
      x.removeListener(sx);
      y.removeListener(sy);
      x.stopAnimation();
      y.stopAnimation();
    };
  }, [x, y, facing, area.w, area.h, size, onEat]);

  // Food landing mid-wander: break off and go for it.
  useEffect(() => {
    if (!pellets.some((p) => p.landed && !p.eaten) || busy.current) return;
    x.stopAnimation();
    y.stopAnimation();
  }, [pellets, x, y]);

  return (
    <Animated.View style={{ position: 'absolute', transform: [{ translateX: x }, { translateY: y }, { scaleX: facing }] }}>
      {/* The drawing faces left; flipped it faces right, and `facing` turns it from there. */}
      <FishArt species={species} size={size} flip />
    </Animated.View>
  );
}

/**
 * The pond, alive: its fish swim about and, when fed, go for the food. `feedKey`
 * changes every time food is thrown in, by hand or by the feeding machine.
 */
export function PondView({ batches, quality, feedKey }: { batches: FishBatch[]; quality: number; feedKey: number }) {
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [pellets, setPellets] = useState<Pellet[]>([]);
  const nextId = useRef(1);
  const swimmers = swimmersFor(batches);

  useEffect(() => {
    if (!feedKey || !area) return;
    const fresh: Pellet[] = Array.from({ length: PELLETS }, () => {
      const p: Pellet = {
        id: nextId.current++,
        x: 20 + Math.random() * (area.w - 40),
        y: 30 + Math.random() * (area.h - 60),
        fall: new Animated.Value(0),
        eaten: false,
        landed: false,
      };
      return p;
    });
    // Scattered on the surface, then sinking slowly; fish move once it has settled.
    fresh.forEach((p, i) =>
      Animated.timing(p.fall, { toValue: 1, duration: 1100 + i * 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() =>
        setPellets((old) => old.map((q) => (q.id === p.id ? { ...q, landed: true } : q))),
      ),
    );
    setPellets((old) => [...old.filter((p) => !p.eaten), ...fresh]);
  }, [feedKey, area]);

  const eat = useCallback((id: number) => setPellets((old) => old.filter((p) => p.id !== id)), []);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[styles.pond, { opacity: 0.55 + (quality / 100) * 0.45 }]}>
      <View style={[styles.murk, { opacity: (100 - quality) / 160 }]} />
      {area
        ? pellets.map((p) => (
            <Animated.View
              key={p.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: p.x - 6,
                top: p.y - 6,
                opacity: p.fall.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [{ translateY: p.fall.interpolate({ inputRange: [0, 1], outputRange: [-p.y + 6, 0] }) }],
              }}>
              <FeedPellet size={12} />
            </Animated.View>
          ))
        : null}
      {area ? swimmers.map((s) => <Swimmer key={s.key} species={s.species} grown={s.grown} area={area} pellets={pellets} onEat={eat} />) : null}
      {swimmers.length === 0 ? (
        <Txt v="label" style={{ color: C.white, textAlign: 'center', marginTop: 80 }}>
          Havuz boş. Yavru balık bırak.
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pond: {
    height: 220,
    borderRadius: R.xl,
    backgroundColor: '#4FA3DA',
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#9ACF7F',
  },
  murk: { ...StyleSheet.absoluteFill, backgroundColor: '#6B5A2E' },
});
