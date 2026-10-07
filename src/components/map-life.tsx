import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';

import { AnimalArt } from '@/components/art/animals';
import { RobotSprite } from '@/components/art/machines';
import { dayOf } from '@/game/clock';
import { MACHINES, type MachineId, type SpeciesId } from '@/game/data';
import { isAdult, type GameState } from '@/game/store';

type Rect = { x: number; y: number; w: number; h: number };
type View_ = { x: number; y: number; scale: number };

/** Where things live on the map, in its own 360×360 space (see ZONES in farm-map). */
const PEN: Rect = { x: 60, y: 264, w: 116, h: 80 };
const COOP: Rect = { x: 16, y: 300, w: 46, h: 44 };
const FIELD_AREAS: Rect[] = [
  { x: 128, y: 38, w: 216, h: 66 },
  { x: 16, y: 150, w: 88, h: 66 },
  { x: 128, y: 150, w: 216, h: 66 },
];
// Stable arrays, so a Wanderer's effect doesn't restart on every render.
const PEN_AREAS = [PEN];
const COOP_AREAS = [COOP];
const SPOT: Partial<Record<MachineId, { x: number; y: number }>> = {
  feeder: { x: 150, y: 262 },
  fish_feeder: { x: 278, y: 252 },
  pond_filter: { x: 336, y: 286 },
  solar_pump: { x: 206, y: 248 },
};

/** How many of each kind to draw, at most; past that the pen would be a blur. */
const SHOW: Record<SpeciesId, number> = { cow: 6, sheep: 4, goat: 4, chicken: 8 };
const SIZE: Record<SpeciesId, number> = { cow: 22, sheep: 18, goat: 18, chicken: 12 };

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * Something that ambles around: picks a spot in one of its areas, walks there,
 * stops a moment, picks another. `faceLeft` says which way the drawing looks,
 * so it can be turned to face where it is going.
 */
function Wanderer({
  areas,
  view,
  size,
  speed,
  faceLeft = true,
  children,
}: {
  areas: Rect[];
  view: View_;
  size: number;
  speed: number;
  faceLeft?: boolean;
  children: ReactNode;
}) {
  const { x: vx, y: vy, scale } = view;
  const s = size * scale;
  const [start] = useState(() => {
    const a = areas[Math.floor(Math.random() * areas.length)];
    return { x: (rand(a.x, a.x + a.w - size) - vx) * scale, y: (rand(a.y, a.y + a.h - size) - vy) * scale };
  });
  const [x] = useState(() => new Animated.Value(start.x));
  const [y] = useState(() => new Animated.Value(start.y));
  const [facing] = useState(() => new Animated.Value(1));
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let alive = true;
    const at = { ...start };
    const sx = x.addListener(({ value }) => (at.x = value));
    const sy = y.addListener(({ value }) => (at.y = value));
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (!alive) return;
      const a = areas[Math.floor(Math.random() * areas.length)];
      const tx = (rand(a.x, a.x + a.w - size) - vx) * scale;
      const ty = (rand(a.y, a.y + a.h - size) - vy) * scale;
      const dx = tx - at.x;
      facing.setValue(dx < 0 === faceLeft ? 1 : -1);
      const duration = Math.max(400, (Math.hypot(dx, ty - at.y) / (speed * scale)) * 1000);
      Animated.parallel([
        Animated.timing(x, { toValue: tx, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(y, { toValue: ty, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && alive) timer = setTimeout(step, rand(600, 2600));
      });
    };
    // A small hop while walking, so it reads as steps rather than sliding.
    const hop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -1.5, duration: 260, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    );
    hop.start();
    timer = setTimeout(step, rand(0, 1500));
    return () => {
      alive = false;
      clearTimeout(timer);
      hop.stop();
      x.removeListener(sx);
      y.removeListener(sy);
      x.stopAnimation();
      y.stopAnimation();
    };
  }, [areas, vx, vy, scale, start, size, speed, faceLeft, x, y, facing, bob]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', width: s, height: s, transform: [{ translateX: x }, { translateY: y }, { translateY: bob }, { scaleX: facing }] }}>
      {children}
    </Animated.View>
  );
}

/** A machine that stays put but is plainly running: a gentle bob. */
function Bobber({ at, view, size, children }: { at: { x: number; y: number }; view: View_; size: number; children: ReactNode }) {
  const [bob] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -2, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const s = size * view.scale;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (at.x - view.x) * view.scale - s / 2,
        top: (at.y - view.y) * view.scale - s / 2,
        width: s,
        height: s,
        transform: [{ translateY: bob }],
      }}>
      {children}
    </Animated.View>
  );
}

/**
 * The living layer over the map: the herd wandering its pen, chickens pecking
 * about the coop, and whatever machines are running going about their chores.
 * Drawn above the map and below nothing - it takes no touches.
 */
export function MapLife({ state, view }: { state: GameState; view: View_ }) {
  const day = dayOf(state.minutes);
  const herd: ReactNode[] = [];

  (['cow', 'sheep', 'goat', 'chicken'] as SpeciesId[]).forEach((sp) => {
    const all = state.animals.filter((a) => a.species === sp);
    const young = all.filter((a) => !isAdult(a, day));
    const shown = Math.min(all.length, SHOW[sp]);
    // Keep the young in proportion: a herd half calves shows half calves.
    const youngShown = Math.min(young.length, Math.round((young.length / Math.max(all.length, 1)) * shown));
    for (let i = 0; i < shown; i++) {
      const isYoung = i < youngShown;
      const size = SIZE[sp] * (isYoung ? 0.75 : 1);
      herd.push(
        <Wanderer
          key={`${sp}-${i}-${isYoung}`}
          areas={sp === 'chicken' ? COOP_AREAS : PEN_AREAS}
          view={view}
          size={size}
          speed={sp === 'chicken' ? 14 : 6}>
          <AnimalArt species={sp} size={size * view.scale} variant={all[i]?.variant ?? 0} young={isYoung} />
        </Wanderer>,
      );
    }
  });

  const robots: ReactNode[] = [];
  (Object.keys(MACHINES) as MachineId[]).forEach((id) => {
    if (!state.machines[id]?.on) return;
    const zone = MACHINES[id].zone;
    if (id === 'sprinkler') {
      FIELD_AREAS.forEach((f, i) =>
        robots.push(
          <Bobber key={`spr-${i}`} at={{ x: f.x + f.w / 2, y: f.y + f.h / 2 }} view={view} size={16}>
            <RobotSprite id="sprinkler" size={16 * view.scale} />
          </Bobber>,
        ),
      );
    } else if (SPOT[id]) {
      robots.push(
        <Bobber key={id} at={SPOT[id]!} view={view} size={18}>
          <RobotSprite id={id} size={18 * view.scale} />
        </Bobber>,
      );
    } else {
      robots.push(
        <Wanderer key={id} areas={zone === 'fields' ? FIELD_AREAS : PEN_AREAS} view={view} size={20} speed={16} faceLeft={false}>
          <RobotSprite id={id} size={20 * view.scale} />
        </Wanderer>,
      );
    }
  });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {herd}
      {robots}
    </View>
  );
}
