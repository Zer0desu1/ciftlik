import { Maximize, Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, View, type GestureResponderEvent, type PanResponderInstance } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { MapLife } from '@/components/map-life';
import { FIELDS, landName, type CropId, type FieldId, type LandUse } from '@/game/data';
import { plotStage } from '@/game/selectors';
import { levelOf, ownsLand, type GameState, type Plot } from '@/game/store';
import { C, F } from '@/theme';

export type ZoneId = 'house' | FieldId | 'animals' | 'water' | 'storage';

type Box = { x: number; y: number; w: number; h: number };

/**
 * The map's layout in its own units. The farm as it comes is the 360×360
 * square at the top left; the land for sale wraps around it to the east and
 * south, so buying it makes the map itself bigger.
 */
export const WORLD = { w: 560, h: 480 };

export const ZONES: Record<ZoneId, Box & { label: string }> = {
  house: { x: 8, y: 8, w: 104, h: 104, label: 'Ev' },
  tomatoes: { x: 120, y: 8, w: 232, h: 104, label: 'Domates' },
  vegetables: { x: 8, y: 120, w: 104, h: 104, label: 'Sebze' },
  corn: { x: 120, y: 120, w: 232, h: 104, label: 'Mısır' },
  animals: { x: 8, y: 232, w: 176, h: 120, label: 'Hayvanlar' },
  water: { x: 192, y: 232, w: 160, h: 66, label: 'Su' },
  storage: { x: 192, y: 306, w: 160, h: 46, label: 'Ambar' },
  east: { x: 368, y: 8, w: 184, h: 104, label: 'Doğu Tarlası' },
  orchard: { x: 368, y: 120, w: 184, h: 104, label: 'Çilek Bahçesi' },
  meadow: { x: 368, y: 232, w: 184, h: 120, label: 'Çayır Tarlası' },
  south: { x: 8, y: 368, w: 176, h: 104, label: 'Güney Tarlası' },
  creek: { x: 192, y: 368, w: 160, h: 104, label: 'Dere Kenarı' },
  far: { x: 368, y: 368, w: 184, h: 104, label: 'Uzak Tarla' },
};


/** What a ripe plant looks like from above, per crop. */
const FRUIT: Record<CropId, string> = {
  tomato: '#D9452F',
  corn: '#E8C33A',
  carrot: '#E8822B',
  lettuce: '#8FD16A',
  wheat: '#D9B45A',
  strawberry: '#E0405A',
  pepper: '#4E9A3A',
  pumpkin: '#E58A2A',
};

type ViewBox = { x: number; y: number; size: number };

/**
 * The square of map space shown at first: the farm and every parcel bought,
 * with a strip of the land beyond, so there is visibly more to buy.
 */
function homeView(owned: FieldId[]): ViewBox {
  let right = 380;
  let bottom = 380;
  owned.forEach((f) => {
    const z = ZONES[f];
    right = Math.max(right, z.x + z.w + 8);
    bottom = Math.max(bottom, z.y + z.h + 8);
  });
  const size = Math.max(right, bottom);
  return { x: (right - size) / 2, y: (bottom - size) / 2, size };
}

/** One zone closed in on. */
function viewFor(zone: ZoneId): ViewBox {
  const z = ZONES[zone];
  const size = Math.max(z.w, z.h) + 28;
  return { x: z.x + z.w / 2 - size / 2, y: z.y + z.h / 2 - size / 2, size };
}

function Label({ zone, active, text }: { zone: ZoneId; active: boolean; text?: string }) {
  const z = ZONES[zone];
  const label = text ?? z.label;
  const w = label.length * 6.2 + 18;
  const x = z.x + z.w / 2 - w / 2;
  return (
    <G>
      <Rect x={x} y={z.y + 6} width={w} height={17} rx={8.5} fill={active ? '#1C2A20' : '#FFFFFF'} opacity={0.95} />
      <SvgText
        x={z.x + z.w / 2}
        y={z.y + 18}
        fontSize={9.5}
        fontFamily={F.semibold}
        fontWeight="600"
        fill={active ? '#FFFFFF' : '#1C2A20'}
        textAnchor="middle">
        {label}
      </SvgText>
    </G>
  );
}

/** One field: soil beds in two rows, each plant drawn at its real stage. */
function FieldPatch({ zone, plots }: { zone: FieldId; plots: Plot[] }) {
  const z = ZONES[zone];
  const inner = { x: z.x + 6, y: z.y + 28, w: z.w - 12, h: z.h - 34 };
  const cols = 4;
  const rows = Math.ceil(plots.length / cols);
  const gap = 4;
  const bw = (inner.w - gap * (cols - 1)) / cols;
  const bh = (inner.h - gap * (rows - 1)) / rows;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#A8D58F" />
      {plots.map((p, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const bx = inner.x + c * (bw + gap);
        const by = inner.y + r * (bh + gap);
        const dry = p.crop && !p.dead && p.moisture < 30;
        const soil = p.dead ? '#9C8466' : dry ? '#B48B60' : p.moisture > 70 ? '#6E4528' : '#83562F';
        const stage = plotStage(p);
        const perRow = bw > 40 ? 4 : 3;
        const plants = [] as ReactElement[];
        if (p.crop && stage > 0) {
          const size = [0, 1.6, 3, 4.4, 5][stage];
          for (let k = 0; k < perRow * 2; k++) {
            const px = bx + (bw / perRow) * ((k % perRow) + 0.5);
            const py = by + (bh / 2) * (Math.floor(k / perRow) + 0.5);
            plants.push(
              <G key={k}>
                <Circle cx={px} cy={py} r={size} fill={p.dead ? '#8A7A5C' : dry ? '#9DB35A' : '#3F9A47'} />
                {stage === 4 && !p.dead ? <Circle cx={px + size * 0.35} cy={py - size * 0.3} r={size * 0.5} fill={FRUIT[p.crop]} /> : null}
              </G>,
            );
          }
        }
        return (
          <G key={i}>
            <Rect x={bx} y={by} width={bw} height={bh} rx={5} fill={soil} />
            {[1, 2, 3].map((line) => (
              <Path key={line} d={`M${bx + 3} ${by + (bh / 4) * line} H${bx + bw - 3}`} stroke="#00000018" strokeWidth={1} />
            ))}
            {plants}
            {p.weeds && !p.dead ? <Path d={`M${bx + bw - 7} ${by + bh - 3} l2 -6 l2 6 m-1 0 l3 -5`} stroke="#4C7A2A" strokeWidth={1.4} fill="none" /> : null}
          </G>
        );
      })}
    </G>
  );
}

/** Land not yet bought: rough grass behind a dashed line, and a sign with its price. */
function ForSale({ zone, price, level, locked }: { zone: FieldId; price: number; level: number; locked: boolean }) {
  const z = ZONES[zone];
  const bushes = [0.14, 0.32, 0.78, 0.9].map((fx, i) => ({ x: z.x + z.w * fx, y: z.y + z.h * (i % 2 ? 0.72 : 0.42), r: 6 + (i % 3) * 2 }));
  const cx = z.x + z.w / 2;
  const cy = z.y + z.h / 2 + 10;
  const text = locked ? `Seviye ${level}` : `${price} altın`;
  const w = text.length * 6 + 22;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#D3DDB4" stroke="#B4C48F" strokeWidth={1.5} strokeDasharray="6 5" />
      {bushes.map((b, i) => (
        <G key={i}>
          <Circle cx={b.x} cy={b.y} r={b.r} fill="#A9C783" />
          <Circle cx={b.x + b.r * 0.6} cy={b.y + 1} r={b.r * 0.7} fill="#9BBB74" />
        </G>
      ))}
      {[0.25, 0.55, 0.66].map((fx, i) => (
        <Path key={i} d={`M${z.x + z.w * fx} ${z.y + z.h * 0.85} l2 -6 l2 6 m1 0 l2 -5`} stroke="#8FAE68" strokeWidth={1.3} fill="none" />
      ))}
      <Rect x={cx - 1.5} y={cy} width={3} height={16} fill="#8A6A44" />
      <Rect x={cx - w / 2} y={cy - 12} width={w} height={20} rx={6} fill={locked ? '#EDE7DA' : '#FFFFFF'} stroke="#C9B48E" />
      <SvgText x={cx} y={cy + 2} fontSize={9.5} fontFamily={F.bold} fontWeight="700" fill={locked ? '#8A8170' : '#A36A12'} textAnchor="middle">
        {text}
      </SvgText>
    </G>
  );
}

/** Land given over to more animals: pasture behind a fence, a small barn and hay. */
function PasturePatch({ zone }: { zone: FieldId }) {
  const z = ZONES[zone];
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#B4DD95" />
      <Rect x={z.x + 6} y={z.y + 26} width={z.w - 12} height={z.h - 32} rx={8} fill="none" stroke="#8C6A45" strokeWidth={1.4} strokeDasharray="4 3" />
      <Rect x={z.x + 12} y={z.y + 32} width={30} height={22} rx={2} fill="#B9473A" />
      <Path d={`M${z.x + 10} ${z.y + 33} L${z.x + 27} ${z.y + 25} L${z.x + 44} ${z.y + 33}`} fill="#8E3329" />
      <Rect x={z.x + 22} y={z.y + 42} width={10} height={12} fill="#7B2C22" />
      <Circle cx={z.x + 22} cy={z.y + z.h - 18} r={7} fill="#E3C063" />
      <Circle cx={z.x + 22} cy={z.y + z.h - 18} r={4} fill="#C9A13E" />
      <Rect x={z.x + z.w - 40} y={z.y + z.h - 22} width={26} height={8} rx={3} fill="#8C6A45" />
    </G>
  );
}

/** Land given over to more fish: a second pond. */
function PondPatch({ zone }: { zone: FieldId }) {
  const z = ZONES[zone];
  const cx = z.x + z.w / 2;
  const cy = z.y + z.h / 2 + 10;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#A8D58F" />
      <Ellipse cx={cx} cy={cy} rx={z.w / 2 - 18} ry={z.h / 2 - 22} fill="#58A9DE" />
      <Ellipse cx={cx} cy={cy} rx={z.w / 2 - 18} ry={z.h / 2 - 22} fill="none" stroke="#8CCB74" strokeWidth={3} />
      <Ellipse cx={cx - 10} cy={cy - 4} rx={z.w / 4} ry={z.h / 8} fill="#4F9BD0" opacity={0.5} />
      <Path d={`M${z.x + z.w - 22} ${z.y + z.h - 14} l3 -9 l2 9 m3 0 l2 -7`} stroke="#4C7A2A" strokeWidth={1.4} fill="none" />
      <Path d={`M${z.x + 14} ${z.y + 40} l3 -9 l2 9`} stroke="#4C7A2A" strokeWidth={1.4} fill="none" />
    </G>
  );
}

/** Land given over to water: two tanks and a pipe to the farm. */
function TankPatch({ zone, level }: { zone: FieldId; level: number }) {
  const z = ZONES[zone];
  const cy = z.y + z.h / 2 + 12;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#C9DDB4" />
      <Rect x={z.x + 10} y={cy - 2} width={z.w - 20} height={4} fill="#8B9AA6" />
      {[0.3, 0.7].map((fx) => (
        <G key={fx}>
          <Circle cx={z.x + z.w * fx} cy={cy} r={24} fill="#CBD6DE" />
          <Circle cx={z.x + z.w * fx} cy={cy} r={20} fill="#3D7FB8" opacity={0.25 + level * 0.75} />
          <Circle cx={z.x + z.w * fx - 6} cy={cy - 6} r={6} fill="#ffffff55" />
        </G>
      ))}
    </G>
  );
}

/** Land given over to sunlight: rows of panels. */
function SolarPatch({ zone }: { zone: FieldId }) {
  const z = ZONES[zone];
  const cols = Math.floor((z.w - 16) / 26);
  const rows = Math.floor((z.h - 36) / 20);
  const left = z.x + (z.w - cols * 26 + 4) / 2;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#CFE0B8" />
      {Array.from({ length: rows * cols }).map((_, i) => {
        const x = left + (i % cols) * 26;
        const y = z.y + 30 + Math.floor(i / cols) * 20;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={22} height={15} rx={2} fill="#2F4F7A" />
            <Path d={`M${x + 7.3} ${y} V${y + 15} M${x + 14.6} ${y} V${y + 15} M${x} ${y + 7.5} H${x + 22}`} stroke="#6E8FBF" strokeWidth={0.8} />
          </G>
        );
      })}
    </G>
  );
}

function House({ panels, turbines }: { panels: number; turbines: number }) {
  const z = ZONES.house;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#9ACB7C" />
      <Rect x={z.x + 6} y={z.y + 26} width={z.w - 12} height={z.h - 32} rx={8} fill="#B7DC9C" stroke="#7FB565" strokeDasharray="3 3" />
      <Rect x={z.x + 24} y={z.y + 40} width={46} height={36} rx={3} fill="#B9473A" />
      <Path d={`M${z.x + 24} ${z.y + 58} H${z.x + 70}`} stroke="#8E3329" strokeWidth={2} />
      <Rect x={z.x + 62} y={z.y + 44} width={5} height={7} fill="#7B2C22" />
      <Rect x={z.x + 78} y={z.y + 62} width={12} height={22} rx={3} fill="#5D86B5" />
      <Rect x={z.x + 16} y={z.y + 82} width={28} height={14} rx={3} fill="#7A5432" />
      {[0, 1, 2, 3].map((k) => (
        <Circle key={k} cx={z.x + 21 + k * 6} cy={z.y + 89} r={2} fill={['#E04F5F', '#F2C94C', '#9B59B6', '#F2994A'][k]} />
      ))}
      {/* Roof panels, two rows of three. */}
      {Array.from({ length: panels }).map((_, i) => (
        <Rect key={i} x={z.x + 27 + (i % 3) * 14} y={z.y + 43 + Math.floor(i / 3) * 7} width={12} height={6} rx={1} fill="#2F4F7A" stroke="#6E8FBF" strokeWidth={0.6} />
      ))}
      {/* Turbines along the side of the plot. */}
      {Array.from({ length: turbines }).map((_, i) => {
        const tx = z.x + 92 - i * 10;
        const ty = z.y + 44 + i * 12;
        return (
          <G key={i}>
            <Path d={`M${tx} ${ty} V${ty + 24}`} stroke="#E6E9EC" strokeWidth={2} />
            <Path d={`M${tx} ${ty} l0 -9 M${tx} ${ty} l8 5 M${tx} ${ty} l-8 5`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
            <Circle cx={tx} cy={ty} r={1.8} fill="#9AA3AC" />
          </G>
        );
      })}
      <Circle cx={z.x + 14} cy={z.y + 36} r={7} fill="#3E8A57" />
      <Circle cx={z.x + 92} cy={z.y + 36} r={8} fill="#3E8A57" />
      <Circle cx={z.x + 96} cy={z.y + 96} r={6} fill="#3E8A57" />
    </G>
  );
}

/** The pen, barn, hay and trough. The animals themselves live on the moving layer (map-life). */
function Animals() {
  const z = ZONES.animals;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#B4DD95" />
      <Rect x={z.x + 6} y={z.y + 26} width={z.w - 12} height={z.h - 32} rx={8} fill="none" stroke="#8C6A45" strokeWidth={1.4} strokeDasharray="4 3" />
      <Rect x={z.x + 14} y={z.y + 32} width={32} height={22} rx={2} fill="#B9473A" />
      <Path d={`M${z.x + 14} ${z.y + 43} H${z.x + 46}`} stroke="#8E3329" strokeWidth={1.6} />
      <Rect x={z.x + 8} y={z.y + 66} width={50} height={46} rx={4} fill="#D8C3A0" />
      <Circle cx={z.x + 112} cy={z.y + 82} r={6} fill="#E3C063" />
      <Circle cx={z.x + 112} cy={z.y + 82} r={3.5} fill="#C9A13E" />
    </G>
  );
}

function Water({ tank, fish }: { tank: number; fish: number }) {
  const z = ZONES.water;
  const level = Math.max(0.05, Math.min(1, tank / 1000));
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#A8D58F" />
      <Circle cx={z.x + 34} cy={z.y + 42} r={18} fill="#CBD6DE" />
      <Circle cx={z.x + 34} cy={z.y + 42} r={15} fill="#3D7FB8" opacity={0.25 + level * 0.75} />
      <Circle cx={z.x + 34} cy={z.y + 42} r={6} fill="#ffffff55" />
      <Rect x={z.x + 52} y={z.y + 40} width={14} height={4} fill="#8B9AA6" />
      <Ellipse cx={z.x + 108} cy={z.y + 44} rx={42} ry={18} fill="#58A9DE" />
      <Ellipse cx={z.x + 108} cy={z.y + 44} rx={42} ry={18} fill="none" stroke="#8CCB74" strokeWidth={3} />
      {/* The fish themselves swim on the moving layer (map-life). */}
      {fish > 0 ? <Ellipse cx={z.x + 108} cy={z.y + 44} rx={30} ry={10} fill="#4F9BD0" opacity={0.5} /> : null}
      <Path d={`M${z.x + 140} ${z.y + 30} l3 -8 l2 8 m3 0 l2 -6`} stroke="#4C7A2A" strokeWidth={1.4} fill="none" />
    </G>
  );
}

function Storage() {
  const z = ZONES.storage;
  return (
    <G>
      <Rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#D9D4C7" />
      <Rect x={z.x + 14} y={z.y + 22} width={70} height={18} rx={2} fill="#8896A5" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Path key={k} d={`M${z.x + 18 + k * 11} ${z.y + 22} V${z.y + 40}`} stroke="#6E7C8B" strokeWidth={1} />
      ))}
      <Circle cx={z.x + 112} cy={z.y + 31} r={9} fill="#B8BFC6" />
      <Circle cx={z.x + 134} cy={z.y + 31} r={9} fill="#B8BFC6" />
      <Circle cx={z.x + 112} cy={z.y + 31} r={3} fill="#9AA3AC" />
      <Circle cx={z.x + 134} cy={z.y + 31} r={3} fill="#9AA3AC" />
    </G>
  );
}

/** The camera: the drawing at render scale is scaled by `s` and moved by (x, y), in screen pixels. */
type Cam = { s: number; x: number; y: number };

const MAX_ZOOM = 3.2;
const touchDistance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};
const touchMiddle = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return { x: (a.pageX + b.pageX) / 2, y: (a.pageY + b.pageY) / 2 };
};

/**
 * Where the map is looked at from, and the gestures that move it. A plain
 * object rather than component state: it changes on every frame of a drag,
 * and only the animated values it drives need to reach the screen.
 */
class MapCamera {
  anim = { s: new Animated.Value(1), x: new Animated.Value(0), y: new Animated.Value(0) };
  cam: Cam = { s: 1, x: 0, y: 0 };
  geo = { k: 1, size: 360, minZoom: 1 };
  pan: PanResponderInstance;
  /** When the last drag ended: the click a mouse sends on release is not a tap. */
  private draggedAt = 0;

  constructor() {
    let start: Cam = this.cam;
    let pinch: { d: number; mid: { x: number; y: number } } | null = null;
    // Drag with one finger, pinch with two. Only takes over once a finger
    // moves, so a plain tap still reaches the zone under it.
    this.pan = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_e, g) => g.numberActiveTouches > 1 || Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: (e, g) => {
        start = this.cam;
        pinch = g.numberActiveTouches > 1 && e.nativeEvent.touches.length > 1 ? { d: touchDistance(e), mid: touchMiddle(e) } : null;
      },
      onPanResponderMove: (e, g) => {
        if (g.numberActiveTouches > 1 && e.nativeEvent.touches.length > 1) {
          if (!pinch) {
            start = this.cam;
            pinch = { d: touchDistance(e), mid: touchMiddle(e) };
            return;
          }
          const mid = touchMiddle(e);
          const half = this.geo.size / 2;
          const moved = { ...start, x: start.x + mid.x - pinch.mid.x, y: start.y + mid.y - pinch.mid.y };
          this.zoomAt(touchDistance(e) / pinch.d, half, half, moved);
        } else if (!pinch) {
          this.apply({ ...start, x: start.x + g.dx, y: start.y + g.dy });
        }
      },
      onPanResponderRelease: () => {
        pinch = null;
        this.draggedAt = Date.now();
      },
      onPanResponderTerminate: () => {
        pinch = null;
        this.draggedAt = Date.now();
      },
      onPanResponderTerminationRequest: () => false,
    });
  }

  /** Whether a press is a real tap, not the end of a drag. */
  isTap() {
    return Date.now() - this.draggedAt > 250;
  }

  resize(k: number, size: number, minZoom: number) {
    this.geo = { k, size, minZoom };
  }

  /** Keeps the zoom in range and the land in frame. */
  clamp(c: Cam): Cam {
    const g = this.geo;
    const s = Math.min(MAX_ZOOM, Math.max(g.minZoom, c.s));
    const fit = (t: number, world: number) => {
      const px = world * g.k * s;
      return px <= g.size ? (g.size - px) / 2 : Math.min(0, Math.max(g.size - px, t));
    };
    return { s, x: fit(c.x, WORLD.w), y: fit(c.y, WORLD.h) };
  }

  apply(c: Cam, glide = false) {
    const next = this.clamp(c);
    this.cam = next;
    (['s', 'x', 'y'] as const).forEach((key) => {
      this.anim[key].stopAnimation();
      if (glide) {
        Animated.timing(this.anim[key], { toValue: next[key], duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      } else {
        this.anim[key].setValue(next[key]);
      }
    });
  }

  /** Zooms by `factor` keeping the screen point (px, py) still. */
  zoomAt(factor: number, px: number, py: number, from: Cam = this.cam, glide = false) {
    const s = Math.min(MAX_ZOOM, Math.max(this.geo.minZoom, from.s * factor));
    const wx = (px - from.x) / from.s;
    const wy = (py - from.y) / from.s;
    this.apply({ s, x: px - wx * s, y: py - wy * s }, glide);
  }

  /** Frames a square of map space. */
  show(v: ViewBox, glide = true) {
    const s = 360 / v.size;
    this.apply({ s, x: -v.x * this.geo.k * s, y: -v.y * this.geo.k * s }, glide);
  }
}

/**
 * The farm from above, in the reference's style: zones on a tan ground with
 * paths between them, every field drawn from its real plots and the pond and
 * pasture from the real stock, with the herd, fish and machines moving on top.
 *
 * It can be dragged, pinched or wheeled to zoom, and has + / − buttons. Tapping
 * a zone selects it and the camera glides in on it; the land for sale around
 * the farm can be tapped too, to buy it.
 */
export function FarmMap({
  state,
  selected,
  onSelect,
  onHold,
  moving,
  size,
}: {
  state: GameState;
  selected: ZoneId | null;
  onSelect: (zone: ZoneId) => void;
  /** A long press on a zone: picks a piece of land up, to move it. */
  onHold?: (zone: ZoneId) => void;
  /** The land being moved, if any: the other land is where it can go. */
  moving?: FieldId | null;
  size: number;
}) {
  const fish = state.pond.batches.reduce((n, b) => n + b.count, 0);
  const level = levelOf(state.xp);
  const owned = FIELDS.filter((f) => ownsLand(state, f.id)).map((f) => f.id);
  const ownedKey = owned.join(',');
  // What each piece of land is, so the moving layer knows where the herd, fish and robots go.
  const landKey = owned.map((f) => `${f}:${state.land[f]}`).join(',');
  // Drawn at one pixel scale; zooming scales the drawing as a whole.
  const k = size / 360;
  const minZoom = Math.min(size / (WORLD.w * k), size / (WORLD.h * k));

  const [camera] = useState(() => new MapCamera());
  const node = useRef<View>(null);

  // Follow the selection: in on a zone, or back out to the whole farm.
  useEffect(() => {
    camera.resize(k, size, minZoom);
    camera.show(selected ? viewFor(selected) : homeView(ownedKey ? (ownedKey.split(',') as FieldId[]) : []));
  }, [camera, selected, ownedKey, k, size, minZoom]);

  // The mouse wheel zooms on the web, about the pointer.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = node.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const r = el.getBoundingClientRect();
      camera.zoomAt(Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [camera]);

  const zones = Object.keys(ZONES) as ZoneId[];
  const half = size / 2;

  return (
    <View
      ref={node}
      style={[{ width: size, height: size, overflow: 'hidden', borderRadius: 14, backgroundColor: '#E2D6BA' }, WEB_NO_SCROLL]}
      {...camera.pan.panHandlers}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: WORLD.w * k,
          height: WORLD.h * k,
          transformOrigin: '0 0',
          transform: [{ translateX: camera.anim.x }, { translateY: camera.anim.y }, { scale: camera.anim.s }],
        }}>
        <Svg width={WORLD.w * k} height={WORLD.h * k} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}>
          <Defs>
            <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#E9DFC8" />
              <Stop offset="1" stopColor="#E2D6BA" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={WORLD.w} height={WORLD.h} fill="url(#ground)" />
          <Path d={ROADS} stroke="#D6C7A5" strokeWidth={6} />
          <Path d={ROADS} stroke="#EFE6D2" strokeWidth={1.2} strokeDasharray="5 6" />

          {zones.map((zone) => {
            const field = FIELDS.find((f) => f.id === zone);
            const use: LandUse | undefined = field ? state.land[field.id] : undefined;
            const land = field?.land && !use ? field.land : null;
            const target = moving && field && use && field.id !== moving;
            return (
              <G key={zone}>
                {zone === 'house' ? <House panels={state.power.panels} turbines={state.power.turbines} /> : null}
                {field && use === 'field' ? <FieldPatch zone={field.id} plots={state.fields[field.id]} /> : null}
                {field && use === 'barn' ? <PasturePatch zone={field.id} /> : null}
                {field && use === 'pond' ? <PondPatch zone={field.id} /> : null}
                {field && use === 'tank' ? <TankPatch zone={field.id} level={Math.min(1, state.tank / 2000)} /> : null}
                {field && use === 'solar' ? <SolarPatch zone={field.id} /> : null}
                {field && land ? <ForSale zone={field.id} price={land.price} level={land.level} locked={land.level > level} /> : null}
                {moving === zone ? (
                  <Rect x={ZONES[zone].x - 2} y={ZONES[zone].y - 2} width={ZONES[zone].w + 4} height={ZONES[zone].h + 4} rx={14} fill="#F2C94C33" stroke="#D08A12" strokeWidth={3} strokeDasharray="7 5" />
                ) : null}
                {target ? (
                  <Rect x={ZONES[zone].x + 1} y={ZONES[zone].y + 1} width={ZONES[zone].w - 2} height={ZONES[zone].h - 2} rx={12} fill="#FFFFFF33" stroke="#1F5C3A" strokeWidth={1.5} strokeDasharray="4 4" />
                ) : null}
                {zone === 'animals' ? <Animals /> : null}
                {zone === 'water' ? <Water tank={state.tank} fish={fish} /> : null}
                {zone === 'storage' ? <Storage /> : null}
                {selected === zone ? (
                  <Rect
                    x={ZONES[zone].x - 2}
                    y={ZONES[zone].y - 2}
                    width={ZONES[zone].w + 4}
                    height={ZONES[zone].h + 4}
                    rx={14}
                    fill="none"
                    stroke="#1F5C3A"
                    strokeWidth={2.5}
                  />
                ) : null}
                <Label zone={zone} active={selected === zone} text={field && use ? landName(field, use) : undefined} />
              </G>
            );
          })}
          <Rect x={146} y={114} width={16} height={9} rx={2} fill="#C0392B" />
          <Circle cx={149} cy={124} r={2.4} fill="#333" />
          <Circle cx={159} cy={124} r={2.4} fill="#333" />
        </Svg>
        <MapLife key={`${k}-${landKey}`} state={state} view={{ x: 0, y: 0, scale: k }} land={landKey} />
        {/* Touch targets laid over the drawing, one per zone. Kept out of the
            SVG: press handlers on SVG groups leak the native responder props
            onto web DOM elements. */}
        {zones.map((zone) => {
          const z = ZONES[zone];
          return (
            <Pressable
              key={zone}
              accessibilityRole="button"
              accessibilityLabel={z.label}
              onPress={() => camera.isTap() && onSelect(zone)}
              onLongPress={() => camera.isTap() && onHold?.(zone)}
              delayLongPress={450}
              style={{ position: 'absolute', left: z.x * k, top: z.y * k, width: z.w * k, height: z.h * k }}
            />
          );
        })}
      </Animated.View>

      <View style={styles.zoom}>
        <Pressable accessibilityLabel="Yakınlaştır" onPress={() => camera.zoomAt(1.4, half, half, undefined, true)} style={styles.zoomBtn}>
          <Plus size={16} color={C.ink} />
        </Pressable>
        <Pressable accessibilityLabel="Uzaklaştır" onPress={() => camera.zoomAt(1 / 1.4, half, half, undefined, true)} style={styles.zoomBtn}>
          <Minus size={16} color={C.ink} />
        </Pressable>
        <Pressable accessibilityLabel="Tüm araziyi gör" onPress={() => camera.show({ x: 0, y: (WORLD.h - WORLD.w) / 2, size: WORLD.w })} style={styles.zoomBtn}>
          <Maximize size={14} color={C.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const ROADS = 'M116 0 V360 M0 116 H560 M188 228 V480 M0 228 H560 M364 0 V480 M0 364 H560';

/** On the web, a drag over the map moves the map rather than the page. */
const WEB_NO_SCROLL = (Platform.OS === 'web' ? { touchAction: 'none', cursor: 'grab' } : {}) as object;

const styles = StyleSheet.create({
  zoom: { position: 'absolute', right: 8, bottom: 8, gap: 6 },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFFEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B3220',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
