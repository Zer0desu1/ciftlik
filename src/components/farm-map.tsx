import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { MapLife } from '@/components/map-life';
import type { CropId, FieldId } from '@/game/data';
import { plotStage } from '@/game/selectors';
import type { GameState, Plot } from '@/game/store';
import { F } from '@/theme';

export type ZoneId = 'house' | FieldId | 'animals' | 'water' | 'storage';

type Box = { x: number; y: number; w: number; h: number };

/** The map's layout, in its own 360×360 space. */
export const ZONES: Record<ZoneId, Box & { label: string }> = {
  house: { x: 8, y: 8, w: 104, h: 104, label: 'Ev' },
  tomatoes: { x: 120, y: 8, w: 232, h: 104, label: 'Domates' },
  vegetables: { x: 8, y: 120, w: 104, h: 104, label: 'Sebze' },
  corn: { x: 120, y: 120, w: 232, h: 104, label: 'Mısır' },
  animals: { x: 8, y: 232, w: 176, h: 120, label: 'Hayvanlar' },
  water: { x: 192, y: 232, w: 160, h: 66, label: 'Su' },
  storage: { x: 192, y: 306, w: 160, h: 46, label: 'Ambar' },
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

/** The square of map space in view: the whole farm, or one zone closed in on. */
function viewFor(zone: ZoneId | null): { x: number; y: number; size: number } {
  if (!zone) return { x: 0, y: 0, size: 360 };
  const z = ZONES[zone];
  const size = Math.max(z.w, z.h) + 28;
  return { x: z.x + z.w / 2 - size / 2, y: z.y + z.h / 2 - size / 2, size };
}

function Label({ zone, active }: { zone: ZoneId; active: boolean }) {
  const z = ZONES[zone];
  const w = z.label.length * 6.2 + 18;
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
        {z.label}
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

function House() {
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
      {Array.from({ length: Math.min(fish, 6) }).map((_, i) => (
        <Path
          key={i}
          d={`M${z.x + 84 + (i % 3) * 16} ${z.y + 38 + Math.floor(i / 3) * 10} q4 -3 8 0 q-4 3 -8 0 l-3 -2 v4 z`}
          fill="#F2A541"
        />
      ))}
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

/**
 * The farm from above, in the reference's style: zones on a tan ground with
 * paths between them, every field drawn from its real plots and the pond and
 * pasture from the real stock. Tapping a zone selects it; a selected zone fills
 * the frame (the view box closes in on it), which reads as zooming in.
 */
export function FarmMap({
  state,
  selected,
  onSelect,
  size,
}: {
  state: GameState;
  selected: ZoneId | null;
  onSelect: (zone: ZoneId) => void;
  size: number;
}) {
  const fish = state.pond.batches.reduce((n, b) => n + b.count, 0);

  const view = viewFor(selected);
  const scale = size / view.size;

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox={`${view.x} ${view.y} ${view.size} ${view.size}`}>
        <Defs>
          <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E9DFC8" />
            <Stop offset="1" stopColor="#E2D6BA" />
          </LinearGradient>
        </Defs>
        {/* Ground well past the map's edge: a zone near the border, zoomed into,
            frames some of what lies beyond it, which should read as more farm. */}
        <Rect x={-120} y={-120} width={600} height={600} fill="#E2D6BA" />
        <Rect x={0} y={0} width={360} height={360} rx={18} fill="url(#ground)" />
        <Path d="M116 0 V360 M0 116 H360 M188 228 V360 M0 228 H360" stroke="#D6C7A5" strokeWidth={6} />
        <Path d="M116 0 V360 M0 116 H360 M188 228 V360 M0 228 H360" stroke="#EFE6D2" strokeWidth={1.2} strokeDasharray="5 6" />

        {(['house', 'tomatoes', 'vegetables', 'corn', 'animals', 'water', 'storage'] as ZoneId[]).map((zone) => (
          <G key={zone}>
            {zone === 'house' ? <House /> : null}
            {zone === 'tomatoes' || zone === 'vegetables' || zone === 'corn' ? <FieldPatch zone={zone} plots={state.fields[zone]} /> : null}
            {zone === 'animals' ? <Animals /> : null}
            {zone === 'water' ? <Water tank={state.tank} fish={fish} /> : null}
            {zone === 'storage' ? <Storage /> : null}
            {selected === zone ? (
              <Rect x={ZONES[zone].x - 2} y={ZONES[zone].y - 2} width={ZONES[zone].w + 4} height={ZONES[zone].h + 4} rx={14} fill="none" stroke="#1F5C3A" strokeWidth={2.5} />
            ) : null}
            <Label zone={zone} active={selected === zone} />
          </G>
        ))}
        <Rect x={146} y={114} width={16} height={9} rx={2} fill="#C0392B" />
        <Circle cx={149} cy={124} r={2.4} fill="#333" />
        <Circle cx={159} cy={124} r={2.4} fill="#333" />
      </Svg>
      <MapLife key={`${view.x},${view.y},${view.size}`} state={state} view={{ x: view.x, y: view.y, scale }} />
      {/* Touch targets laid over the drawing, one per zone, placed through the
          same view the drawing uses. Kept out of the SVG: press handlers on SVG
          groups leak the native responder props onto web DOM elements. */}
      {(Object.keys(ZONES) as ZoneId[]).map((zone) => {
        const z = ZONES[zone];
        return (
          <Pressable
            key={zone}
            accessibilityRole="button"
            accessibilityLabel={z.label}
            onPress={() => onSelect(zone)}
            style={{
              position: 'absolute',
              left: (z.x - view.x) * scale,
              top: (z.y - view.y) * scale,
              width: z.w * scale,
              height: z.h * scale,
            }}
          />
        );
      })}
    </View>
  );
}
