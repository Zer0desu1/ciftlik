import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimalArt, FishArt } from '@/components/art/animals';
import { RobotSprite } from '@/components/art/machines';
import { dayOf, weatherFor } from '@/game/clock';
import { MACHINES, WIND, type FieldId, type LandUse, type MachineId, type SpeciesId } from '@/game/data';
import { isAdult, type GameState } from '@/game/store';

type Rect = { x: number; y: number; w: number; h: number };
type View_ = { x: number; y: number; scale: number };

/** Where things live on the map, in its own units (see ZONES in farm-map). */
const PEN: Rect = { x: 60, y: 264, w: 116, h: 80 };
const COOP: Rect = { x: 16, y: 300, w: 46, h: 44 };
/** Inside the pond's oval, so a fish never swims onto the grass. */
const POND: Rect = { x: 268, y: 266, w: 66, h: 21 };
/** Each piece of land's box (as ZONES in farm-map; kept here to avoid an import cycle). */
const LAND_BOX: Record<FieldId, Rect> = {
  tomatoes: { x: 120, y: 8, w: 232, h: 104 },
  vegetables: { x: 8, y: 120, w: 104, h: 104 },
  corn: { x: 120, y: 120, w: 232, h: 104 },
  east: { x: 368, y: 8, w: 184, h: 104 },
  orchard: { x: 368, y: 120, w: 184, h: 104 },
  meadow: { x: 368, y: 232, w: 184, h: 120 },
  south: { x: 8, y: 368, w: 176, h: 104 },
  creek: { x: 192, y: 368, w: 160, h: 104 },
  far: { x: 368, y: 368, w: 184, h: 104 },
};

/** Where things move on a piece of land, by what it is used for. */
function areaOn(f: FieldId, use: LandUse): Rect {
  const z = LAND_BOX[f];
  if (use === 'pond') {
    // Inside the pond's oval (see PondPatch).
    const rx = z.w / 2 - 18;
    const ry = z.h / 2 - 22;
    return { x: z.x + z.w / 2 - rx * 0.6, y: z.y + z.h / 2 + 10 - ry * 0.55, w: rx * 1.2, h: ry * 1.1 };
  }
  if (use === 'barn' || use === 'coop') return { x: z.x + 50, y: z.y + 30, w: z.w - 60, h: z.h - 40 };
  return { x: z.x + 8, y: z.y + 30, w: z.w - 16, h: z.h - 38 };
}
// Stable arrays, so a Wanderer's effect doesn't restart on every render.
const PEN_AREAS = [PEN];
const SPOT: Partial<Record<MachineId, { x: number; y: number }>> = {
  feeder: { x: 150, y: 262 },
  fish_feeder: { x: 278, y: 252 },
  pond_filter: { x: 336, y: 286 },
  solar_pump: { x: 206, y: 248 },
};

/** How many of each kind to draw, at most; past that the pen would be a blur. */
const SHOW: Record<SpeciesId, number> = { cow: 6, sheep: 4, goat: 4, chicken: 8 };
const SIZE: Record<SpeciesId, number> = { cow: 22, sheep: 18, goat: 18, chicken: 12 };

/** Turbine hubs, as TURBINE_AT in farm-map (kept here to avoid an import cycle). */
const TURBINES = [
  { x: 101, y: 52 },
  { x: 101, y: 78 },
  { x: 14, y: 62 },
];

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const hashOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

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
    const a = areas[Math.floor(Math.random() * areas.length)] ?? { x: 0, y: 0, w: size, h: size };
    return { x: (rand(a.x, a.x + a.w - size) - vx) * scale, y: (rand(a.y, a.y + a.h - size) - vy) * scale };
  });
  const [x] = useState(() => new Animated.Value(start.x));
  const [y] = useState(() => new Animated.Value(start.y));
  const [facing] = useState(() => new Animated.Value(1));
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let alive = true;
    // Where it stands: known at the end of each walk, so nothing listens per frame.
    const at = { ...start };
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (!alive || !areas.length) return;
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
        if (!finished || !alive) return;
        at.x = tx;
        at.y = ty;
        timer = setTimeout(step, rand(600, 2600));
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

/** Turbine blades, turning faster the harder the wind blows. */
function Blades({ at, view, wind }: { at: { x: number; y: number }; view: View_; wind: number }) {
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 2600 / Math.max(0.3, wind), easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [turn, wind]);
  const size = 26 * view.scale;
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: (at.x - view.x) * view.scale - size / 2, top: (at.y - view.y) * view.scale - size / 2, width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="-13 -13 26 26">
        {[0, 120, 240].map((deg) => (
          <Path key={deg} d="M0 0 L-1.6 -2 L0 -12 L1.6 -2 Z" fill="#FFFFFF" stroke="#C7CED6" strokeWidth={0.6} transform={`rotate(${deg})`} />
        ))}
        <Circle r={2} fill="#9AA3AC" />
      </Svg>
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
export function MapLife({ state, view, land }: { state: GameState; view: View_; land: string }) {
  const day = dayOf(state.minutes);
  // `land` is "id:use,id:use": what each owned piece of land is. Each area is
  // its own stable array, so a Wanderer's effect doesn't restart on every render.
  const { fieldAreas, pens, coops, ponds } = useMemo(() => {
    const parts = land ? land.split(',').map((p) => p.split(':') as [FieldId, LandUse]) : [];
    const on = (use: LandUse) => parts.filter(([, u]) => u === use).map(([f]) => areaOn(f, use));
    return {
      fieldAreas: on('field'),
      pens: [PEN, ...on('barn')].map((a) => [a]),
      coops: [COOP, ...on('coop')].map((a) => [a]),
      ponds: [POND, ...on('pond')].map((a) => [a]),
    };
  }, [land]);
  const herd: ReactNode[] = [];

  (['cow', 'sheep', 'goat', 'chicken'] as SpeciesId[]).forEach((sp) => {
    const all = state.animals.filter((a) => a.species === sp);
    const young = all.filter((a) => !isAdult(a, day));
    // More pasture, more of the herd on show; each animal keeps to one pen.
    const homes = sp === 'chicken' ? coops : pens;
    const shown = Math.min(all.length, SHOW[sp] * homes.length);
    // Keep the young in proportion: a herd half calves shows half calves.
    const youngShown = Math.min(young.length, Math.round((young.length / Math.max(all.length, 1)) * shown));
    const adults = all.filter((a) => isAdult(a, day));
    const onShow = [...young.slice(0, youngShown), ...adults.slice(0, shown - youngShown)];
    onShow.forEach((a) => {
      const isYoung = !isAdult(a, day);
      const size = SIZE[sp] * (isYoung ? 0.75 : 1);
      // Keyed by the animal, and kept to one pen by its id, so growing up or
      // the herd changing never sends a sprite jumping elsewhere.
      const home = homes[hashOf(a.id) % homes.length];
      herd.push(
        <Wanderer key={a.id} areas={home} view={view} size={size} speed={sp === 'chicken' ? 14 : 6}>
          <AnimalArt species={sp} size={size * view.scale} variant={a.variant} young={isYoung} />
        </Wanderer>,
      );
    });
  });

  // Fish, up to six a pond, in proportion to what swims there, spread over the ponds.
  const fish: ReactNode[] = [];
  const total = state.pond.batches.reduce((n, b) => n + b.count, 0);
  const room = 6 * ponds.length;
  state.pond.batches.forEach((b) => {
    const n = Math.max(1, Math.round((b.count / total) * Math.min(total, room)));
    for (let i = 0; i < n && fish.length < room; i++) {
      const size = b.growth >= 1 ? 11 : 8;
      fish.push(
        <Wanderer key={`${b.id}-${i}`} areas={ponds[fish.length % ponds.length]} view={view} size={size} speed={9}>
          <FishArt species={b.species} size={size * view.scale} />
        </Wanderer>,
      );
    }
  });

  const robots: ReactNode[] = [];
  (Object.keys(MACHINES) as MachineId[]).forEach((id) => {
    if (!state.machines[id]?.on) return;
    const zone = MACHINES[id].zone;
    if (id === 'sprinkler') {
      fieldAreas.forEach((f, i) =>
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
        <Wanderer key={id} areas={zone === 'fields' ? fieldAreas : PEN_AREAS} view={view} size={20} speed={16} faceLeft={false}>
          <RobotSprite id={id} size={20 * view.scale} />
        </Wanderer>,
      );
    }
  });

  const wind = WIND[weatherFor(day).kind];
  const blades = TURBINES.slice(0, state.power.turbines).map((t, i) => <Blades key={`turbine-${i}`} at={t} view={view} wind={wind} />);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {blades}
      {fish}
      {herd}
      {robots}
    </View>
  );
}
