/**
 * Farm machines and robots. `MachineArt` is the shop / detail illustration
 * (64 x 64 box), `RobotSprite` a bold, simplified version that stays legible
 * at 20-32 px on the farm map (32 x 32 box), and `FeedPellet` a single fish
 * food pellet. All robots share one family look: off-white bodies, deep
 * green accents and a little screen face with two dot eyes. Transparent
 * background, flat two-tone shading, soft ground shadow.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { MachineId } from '@/game/data';

import { shade } from './shared';

const INK = '#1C2A20';
const BODY = '#F7F5EF';
const BODY_DARK = '#E2DED2';
const LINE = '#CDC8B9';
const GREEN = '#1F5C3A';
const GREEN_LIGHT = '#2F7D50';
const LEAF = '#5DAE5B';
const EYE = '#B8F5C8';
const TYRE = '#34403A';
const HUB = '#C9D0CA';
const METAL = '#9AA6A0';
const WATER = '#5AB4E5';
const WATER_DARK = '#3C8FC4';
const SOIL = '#9A6B44';
const GRAIN = '#E8B84A';
const WOOD = '#B9874F';

function GroundShadow({ cx = 32, y = 59, w = 22 }: { cx?: number; y?: number; w?: number }) {
  return <Ellipse cx={cx} cy={y} rx={w} ry={3} fill={INK} opacity={0.1} />;
}

function Wheel({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={TYRE} />
      <Circle cx={x} cy={y} r={r * 0.46} fill={HUB} />
      <Circle cx={x - r * 0.12} cy={y - r * 0.12} r={r * 0.16} fill="#FFFFFF" opacity={0.8} />
    </G>
  );
}

/** The family face: a dark green screen with two glowing dot eyes and a smile. */
function Face({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.min(w, h) * 0.13;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h * 0.32} fill={GREEN} />
      <Circle cx={x + w * 0.32} cy={y + h * 0.42} r={r} fill={EYE} />
      <Circle cx={x + w * 0.68} cy={y + h * 0.42} r={r} fill={EYE} />
      <Path
        d={`M${x + w * 0.42} ${y + h * 0.7} Q${x + w * 0.5} ${y + h * 0.8} ${x + w * 0.58} ${y + h * 0.7}`}
        stroke={EYE}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={x + 1.4} y={y + 1.2} width={w * 0.3} height={1.2} rx={0.6} fill="#FFFFFF" opacity={0.25} />
    </G>
  );
}

function Antenna({ x, y, h = 6 }: { x: number; y: number; h?: number }) {
  return (
    <G>
      <Path d={`M${x} ${y} L${x} ${y - h}`} stroke={METAL} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={x} cy={y - h - 1} r={2} fill={LEAF} />
    </G>
  );
}

/** Off-white rounded robot body with a darker lower band and a green stripe. */
function RobotBox({ x, y, w, h, r = 7 }: { x: number; y: number; w: number; h: number; r?: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={r} fill={BODY} stroke={LINE} strokeWidth={1.2} />
      <Path
        d={`M${x + 0.6} ${y + h * 0.66} L${x + w - 0.6} ${y + h * 0.66} L${x + w - 0.6} ${y + h - r} Q${x + w - 0.6} ${y + h - 0.6} ${x + w - r} ${y + h - 0.6} L${x + r} ${y + h - 0.6} Q${x + 0.6} ${y + h - 0.6} ${x + 0.6} ${y + h - r} Z`}
        fill={BODY_DARK}
      />
      <Rect x={x + 0.6} y={y + h * 0.62} width={w - 1.2} height={2.2} fill={GREEN_LIGHT} />
    </G>
  );
}

function Drop({ x, y, s = 1, rot = 0, color = WATER }: { x: number; y: number; s?: number; rot?: number; color?: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M0 -4 C1.6 -1.6 2.6 -0.2 2.6 1.2 A2.6 2.6 0 0 1 -2.6 1.2 C-2.6 -0.2 -1.6 -1.6 0 -4 Z" fill={color} />
      <Circle cx={-0.9} cy={1} r={0.7} fill="#FFFFFF" opacity={0.8} />
    </G>
  );
}

function Pellet({ x, y, r = 1.4 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={r} ry={r * 0.85} fill="#8A5A33" />
      <Circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.32} fill="#C89668" />
    </G>
  );
}

function Bubble({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.35} stroke="#FFFFFF" strokeWidth={0.9} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#FFFFFF" />
    </G>
  );
}

function Pond({ cx = 32, cy = 54, rx = 27, ry = 7 }: { cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={WATER_DARK} />
      <Ellipse cx={cx} cy={cy - 0.8} rx={rx - 1.5} ry={ry - 1.6} fill={WATER} />
      <Path
        d={`M${cx - rx * 0.6} ${cy} q3 -1.6 6 0 M${cx + rx * 0.25} ${cy + 1.6} q3 -1.6 6 0`}
        stroke="#FFFFFF"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
    </G>
  );
}

/* ------------------------------------------------------------------ devices */

function Sprinkler() {
  const fan: [number, number, number, number][] = [
    [10, 26, -60, 0.9], [14, 17, -45, 1], [21, 11, -25, 1.05], [32, 8, 0, 1.1], [43, 11, 25, 1.05], [50, 17, 45, 1], [54, 26, 60, 0.9],
    [17, 25, -50, 0.7], [24, 19, -28, 0.75], [32, 17, 0, 0.8], [40, 19, 28, 0.75], [47, 25, 50, 0.7],
  ];
  return (
    <G>
      <GroundShadow w={16} />
      <Ellipse cx={32} cy={57} rx={13} ry={3.6} fill={SOIL} />
      <Ellipse cx={32} cy={56.2} rx={11} ry={2.6} fill={shade(SOIL, -0.15)} />
      <Path d="M20 56 l1.5 -5 l1.5 5 M42 56 l1.5 -5.5 l1.5 5.5" stroke={LEAF} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={29} y={36} width={6} height={20} rx={1.5} fill={METAL} />
      <Rect x={32.5} y={36} width={2.5} height={20} fill={shade(METAL, 0.15)} />
      <Rect x={27} y={47} width={10} height={4} rx={1.4} fill={shade(METAL, 0.1)} />
      <Rect x={24} y={30} width={16} height={8} rx={3.5} fill={GREEN} />
      <Rect x={24} y={30} width={16} height={3} rx={1.5} fill={GREEN_LIGHT} />
      <Rect x={29.5} y={25} width={5} height={6} rx={1.5} fill={BODY} stroke={LINE} strokeWidth={1} />
      <Path d="M27 25 Q32 20 37 25" stroke={WATER} strokeWidth={1.2} fill="none" opacity={0.6} />
      {fan.map(([x, y, rot, s], i) => (
        <Drop key={i} x={x} y={y} rot={rot} s={s} color={i % 3 === 1 ? WATER_DARK : WATER} />
      ))}
    </G>
  );
}

function Feeder() {
  const falling = [
    [33, 42], [31, 45], [34, 47.5], [32, 50],
  ];
  return (
    <G>
      <GroundShadow w={24} />
      {/* far legs */}
      <Rect x={20} y={32} width={3} height={24} rx={1.2} fill={shade(METAL, 0.12)} />
      <Rect x={41} y={32} width={3} height={24} rx={1.2} fill={shade(METAL, 0.12)} />
      {/* hopper */}
      <Path d="M14 12 L50 12 L50 24 L38 36 L26 36 L14 24 Z" fill={BODY} stroke={LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M40 12 L50 12 L50 24 L38 36 L33 36 L40 24 Z" fill={BODY_DARK} />
      <Rect x={12} y={8} width={40} height={6} rx={2.5} fill={GREEN} />
      <Rect x={12} y={8} width={40} height={2.4} rx={1.2} fill={GREEN_LIGHT} />
      <Rect x={14.6} y={19} width={34.8} height={2.4} fill={GREEN_LIGHT} />
      <Rect x={21} y={24} width={10} height={6} rx={2} fill="#FFFFFF" stroke={LINE} strokeWidth={0.8} />
      <Path d="M22.4 28.6 L29.6 28.6" stroke={GRAIN} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={41} cy={27} r={1.5} fill={LEAF} />
      <Rect x={28.5} y={35} width={7} height={4} rx={1} fill={METAL} />
      {/* near legs */}
      <Rect x={14} y={22} width={3.4} height={34} rx={1.4} fill={METAL} />
      <Rect x={46.6} y={22} width={3.4} height={34} rx={1.4} fill={METAL} />
      {falling.map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={1.2} ry={1.6} fill={GRAIN} />
      ))}
      {/* trough */}
      <Path d="M18 51 L46 51 L44 58 Q43.5 59.5 42 59.5 L22 59.5 Q20.5 59.5 20 58 Z" fill={WOOD} />
      <Path d="M18 51 L46 51 L45.6 53 L18.4 53 Z" fill={shade(WOOD, -0.18)} />
      <Path d="M21 51.2 Q32 46 43 51.2 Z" fill={GRAIN} />
      <Path d="M26 49.5 l1 0.4 M34 48.5 l1 0.4 M38 49.8 l1 0.4" stroke={shade(GRAIN, 0.2)} strokeWidth={1} strokeLinecap="round" />
      <Path d="M21 56 L43 56" stroke={shade(WOOD, 0.15)} strokeWidth={1.1} strokeLinecap="round" />
    </G>
  );
}

function FishFeederDevice() {
  return (
    <G>
      <Pond cx={34} cy={54} rx={27} ry={7} />
      {/* pole and arm */}
      <Rect x={10} y={14} width={3.6} height={42} rx={1.5} fill={METAL} />
      <Rect x={12} y={14} width={1.6} height={42} fill={shade(METAL, 0.15)} />
      <Ellipse cx={11.8} cy={56.5} rx={4.5} ry={1.6} fill={shade(WATER_DARK, 0.15)} />
      <Rect x={10} y={14} width={22} height={3.4} rx={1.5} fill={METAL} />
      {/* dispenser */}
      <Path d="M24 18 L48 18 L48 30 Q48 34 44 36 L40 38 L32 38 L28 36 Q24 34 24 30 Z" fill={BODY} stroke={LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M40 18 L48 18 L48 30 Q48 34 44 36 L40 38 L37 38 Q42 33 42 28 Z" fill={BODY_DARK} />
      <Rect x={22.5} y={13} width={27} height={6.5} rx={3} fill={GREEN} />
      <Rect x={22.5} y={13} width={27} height={2.6} rx={1.3} fill={GREEN_LIGHT} />
      <Rect x={28} y={23} width={10} height={6} rx={2} fill="#FFFFFF" stroke={LINE} strokeWidth={0.8} />
      <Pellet x={31} y={26.4} r={1.2} />
      <Pellet x={34.6} y={26} r={1.2} />
      <Circle cx={44} cy={24} r={1.4} fill={LEAF} />
      <Rect x={33} y={37} width={6} height={3.4} rx={1} fill={METAL} />
      {/* pellets spraying down */}
      <Pellet x={33} y={44} />
      <Pellet x={38} y={43} />
      <Pellet x={29} y={47} />
      <Pellet x={41} y={47.5} />
      <Pellet x={35.5} y={48.5} />
      <Ellipse cx={35} cy={53.4} rx={8} ry={2} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.75} />
      <Ellipse cx={35} cy={53.4} rx={12.5} ry={3.2} fill="none" stroke="#FFFFFF" strokeWidth={0.8} opacity={0.4} />
      {/* a hungry fish */}
      <Path d="M46 54 Q50 49.5 54 53.2 L56.5 51 L56 55.6 Q51 57 46 54 Z" fill="#E59A4A" />
      <Circle cx={49} cy={53} r={0.8} fill={INK} />
    </G>
  );
}

function PondFilterDevice() {
  return (
    <G>
      <Pond cx={32} cy={54} rx={28} ry={7} />
      {/* intake pipe from the pond */}
      <Path d="M12 52 L12 40 Q12 36 16 36 L18 36" stroke={METAL} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* box */}
      <Rect x={17} y={22} width={28} height={28} rx={5} fill={BODY} stroke={LINE} strokeWidth={1.2} />
      <Path d="M36 22.6 L40 22.6 Q44.4 22.6 44.4 27 L44.4 45 Q44.4 49.4 40 49.4 L36 49.4 Z" fill={BODY_DARK} />
      <Rect x={15.5} y={18} width={31} height={6.5} rx={3} fill={GREEN} />
      <Rect x={15.5} y={18} width={31} height={2.6} rx={1.3} fill={GREEN_LIGHT} />
      <Path d="M21.5 31 L34 31 M21.5 35 L34 35 M21.5 39 L34 39" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={21} y={42.5} width={7} height={4} rx={1.5} fill={GREEN} />
      <Circle cx={23} cy={44.5} r={0.9} fill={EYE} />
      <Circle cx={26} cy={44.5} r={0.9} fill={EYE} />
      {/* outflow, clean water falling back in */}
      <Rect x={44} y={29} width={10} height={4.6} rx={1.6} fill={METAL} />
      <Rect x={52} y={28.4} width={3} height={5.8} rx={1} fill={shade(METAL, 0.15)} />
      <Path d="M54.6 29 Q60 29.5 60 36 L60 51 L55 51 L55.6 36 Q55.6 34 54.6 33.8 Z" fill={WATER} />
      <Path d="M57.6 34 L57.6 47" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.75} />
      <Ellipse cx={57.5} cy={51.5} rx={5} ry={1.8} fill="#FFFFFF" opacity={0.7} />
      <Bubble x={56} y={22} r={2.4} />
      <Bubble x={51} y={16} r={1.6} />
      <Bubble x={10} y={30} r={1.8} />
      <Bubble x={23} y={56} r={1.4} />
      <Bubble x={40} y={55.5} r={1.8} />
    </G>
  );
}

function SolarPump() {
  return (
    <G>
      <GroundShadow cx={30} w={26} />
      {/* panel on its post */}
      <Rect x={17} y={30} width={3.4} height={28} rx={1.2} fill={METAL} />
      <Path d="M4 30 L22 14 L36 22 L18 38 Z" fill="#C9D0CA" />
      <Path d="M6 30 L22 16 L33.8 22.8 L18 36.4 Z" fill="#2F5C9A" />
      <Path d="M10 26.5 L21.8 33.4 M14 23 L25.8 29.8 M18 19.5 L29.8 26.3 M12 32.2 L26 19.4 M15 33.9 L29 21.1" stroke="#5F8DC8" strokeWidth={0.9} />
      <Path d="M9 27.6 L20 18 L22 19.2 L11 28.8 Z" fill="#FFFFFF" opacity={0.25} />
      {/* wire */}
      <Path d="M19 46 Q28 54 38 50" stroke={GREEN} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* pump */}
      <Rect x={34} y={36} width={16} height={20} rx={5} fill={BODY} stroke={LINE} strokeWidth={1.2} />
      <Path d="M44 36.6 L45 36.6 Q49.4 36.6 49.4 41 L49.4 51 Q49.4 55.4 45 55.4 L44 55.4 Z" fill={BODY_DARK} />
      <Rect x={32.5} y={33} width={19} height={5.5} rx={2.6} fill={GREEN} />
      <Rect x={32.5} y={33} width={19} height={2.2} rx={1.1} fill={GREEN_LIGHT} />
      <Rect x={37} y={42} width={8} height={5.5} rx={2} fill={GREEN} />
      <Path d="M40.6 42.8 L39 45.4 L41 45.4 L39.6 47" stroke="#FFE07A" strokeWidth={1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={33} y={54} width={18} height={4} rx={1.6} fill={shade(METAL, 0.1)} />
      {/* pipe up and over, with a drop */}
      <Path d="M46 34 L46 22 Q46 18 50 18 L54 18 Q57 18 57 21 L57 25" stroke={METAL} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M47.4 33 L47.4 22.4 Q47.4 19.4 50.4 19.4" stroke="#FFFFFF" strokeWidth={0.9} fill="none" opacity={0.5} />
      <Rect x={54.5} y={24} width={5} height={3} rx={1} fill={shade(METAL, 0.15)} />
      <Drop x={57} y={33} s={1.3} />
      <Ellipse cx={57} cy={58} rx={4} ry={1.3} fill={WATER} opacity={0.6} />
      {/* a little sun spark */}
      <Circle cx={8} cy={12} r={3.2} fill="#F7C744" />
      <Path d="M8 5.4 L8 7 M8 17 L8 18.6 M1.4 12 L3 12 M13 12 L14.6 12 M3.4 7.4 L4.5 8.5 M11.5 15.5 L12.6 16.6 M12.6 7.4 L11.5 8.5" stroke="#F7C744" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}

/* ------------------------------------------------------------------ robots */

function Weeder() {
  return (
    <G>
      <GroundShadow cx={30} w={24} />
      {/* weed being pulled */}
      <Path d="M54 57 Q53 51 55 47 M54.5 52 Q50 49 49 45 M54.6 51 Q59 48 60 44" stroke={LEAF} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={54} cy={58} rx={6} ry={1.8} fill={SOIL} />
      <Antenna x={20} y={24} />
      <RobotBox x={8} y={24} w={34} h={24} />
      <Face x={12} y={28} w={17} h={10} />
      <Path d="M33 29 Q36 26 39 29 Q36 32 33 29 Z" fill={LEAF} />
      {/* arm with a little claw */}
      <Path d="M41 36 L49 33 L53 43" stroke={GREEN} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={49} cy={33} r={2.2} fill={METAL} />
      <Path d="M50.5 43 L52 48.5 M53 43 L53 49 M55.5 43 L54 48.5" stroke={METAL} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={49.5} y={41.5} width={7} height={3} rx={1.2} fill={GREEN} />
      <Wheel x={16} y={51} r={6.5} />
      <Wheel x={34} y={51} r={6.5} />
    </G>
  );
}

function Harvester() {
  return (
    <G>
      <GroundShadow w={27} />
      {/* basket of produce on the back */}
      <Path d="M36 18 Q38 10 44 12 L45 17 Z" fill="#EE9445" />
      <Path d="M41 12 L39 8 M42.5 12 L43 7.5" stroke={LEAF} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={47} cy={16} r={5} fill="#E0453A" />
      <Path d="M45.5 11.5 L47 12.4 L48.5 11.5" stroke={LEAF} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Circle cx={45.6} cy={14.4} r={1.1} fill="#FFFFFF" opacity={0.6} />
      <Ellipse cx={54} cy={15} rx={3.2} ry={6} fill="#E5B23A" transform="rotate(20 54 15)" />
      <Path d="M52 19 Q56 16 58.5 18" stroke={LEAF} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M34 18 L60 18 L57.5 30 L36.5 30 Z" fill={WOOD} />
      <Rect x={33} y={17} width={28} height={3.6} rx={1.6} fill={shade(WOOD, -0.18)} />
      <Path d="M35.5 25 L58.5 25 M41 20.6 L41.5 30 M47 20.6 L47 30 M53 20.6 L52.5 30" stroke={shade(WOOD, 0.18)} strokeWidth={1.1} />
      <Antenna x={22} y={28} h={5} />
      <RobotBox x={14} y={28} w={44} h={20} />
      <Face x={17} y={31} w={16} h={9.5} />
      {/* front reel */}
      <Path d="M15 40 L8 42" stroke={GREEN} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={8} cy={46} r={6.5} fill={GREEN_LIGHT} />
      <Circle cx={8} cy={46} r={6.5} fill="none" stroke={GREEN} strokeWidth={1.4} />
      <Path d="M8 39.5 L8 52.5 M1.5 46 L14.5 46 M3.4 41.4 L12.6 50.6 M12.6 41.4 L3.4 50.6" stroke={GRAIN} strokeWidth={1.3} strokeLinecap="round" />
      <Circle cx={8} cy={46} r={2} fill={METAL} />
      <Wheel x={26} y={51} r={6.5} />
      <Wheel x={47} y={51} r={6.5} />
    </G>
  );
}

function Planter() {
  const seeds = [
    [51.5, 48], [50, 52], [52.5, 55],
  ];
  return (
    <G>
      <GroundShadow cx={30} w={24} />
      <Ellipse cx={52} cy={58.4} rx={9} ry={2} fill={SOIL} />
      <Path d="M58 57.5 Q58 53 60 51.5 M58 54.5 Q55.5 52.5 55 50.5" stroke={LEAF} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {/* seed hopper */}
      <Path d="M13 12 L39 12 L35 27 L17 27 Z" fill={GREEN_LIGHT} />
      <Path d="M30 12 L39 12 L35 27 L29 27 Z" fill={GREEN} />
      <Rect x={11.5} y={10} width={29} height={4} rx={1.8} fill={GREEN} />
      <Path d="M15 11 Q26 6 37 11 Z" fill={SOIL} />
      <Ellipse cx={20} cy={9.6} rx={1.2} ry={0.8} fill="#C89668" />
      <Ellipse cx={26} cy={8.4} rx={1.2} ry={0.8} fill="#C89668" />
      <Ellipse cx={31} cy={9.4} rx={1.2} ry={0.8} fill="#C89668" />
      <Path d="M18 19 Q22 15.5 26 19 Q22 22.5 18 19 Z" fill={LEAF} />
      <RobotBox x={8} y={26} w={36} h={22} />
      <Face x={12} y={30} w={17} h={10} />
      {/* chute dropping seeds */}
      <Path d="M43 38 L49 41 L50 46" stroke={METAL} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {seeds.map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={1.2} ry={1.7} fill={SOIL} transform={`rotate(${i * 30 - 20} ${x} ${y})`} />
      ))}
      <Wheel x={16} y={51} r={6.5} />
      <Wheel x={36} y={51} r={6.5} />
    </G>
  );
}

function Collector() {
  return (
    <G>
      <GroundShadow cx={30} w={24} />
      {/* milk bottle */}
      <Path d="M14 18 L20 18 L20 21 Q23 23 23 27 L23 34 L11 34 L11 27 Q11 23 14 21 Z" fill="#FFFFFF" stroke="#C9D6E0" strokeWidth={1.1} />
      <Rect x={11.6} y={27} width={10.8} height={5} fill="#DDEBF6" />
      <Rect x={13.4} y={15} width={7.2} height={4} rx={1.4} fill="#3C7FB5" />
      <Rect x={12.8} y={24} width={1.6} height={8} rx={0.8} fill="#FFFFFF" />
      {/* egg basket */}
      <Ellipse cx={31} cy={25} rx={3.4} ry={4.4} fill="#E3C9A2" />
      <Ellipse cx={37} cy={24} rx={3.4} ry={4.6} fill="#FFFCF6" stroke="#E9DFD0" strokeWidth={0.8} />
      <Ellipse cx={42.5} cy={25.5} rx={3.2} ry={4.2} fill="#EED9BA" />
      <Ellipse cx={36} cy={22.5} rx={0.9} ry={1.6} fill="#FFFFFF" />
      <Path d="M25.5 27 L48 27 L46 34 L27.5 34 Z" fill={WOOD} />
      <Rect x={25} y={26.4} width={23.5} height={2.6} rx={1.2} fill={shade(WOOD, -0.18)} />
      <Path d="M27 31 L46.6 31 M32 29 L32.5 34 M37 29 L37 34 M42 29 L41.5 34" stroke={shade(WOOD, 0.18)} strokeWidth={1} />
      {/* tray + body */}
      <Rect x={8} y={33} width={44} height={3} rx={1.5} fill={GREEN} />
      <RobotBox x={10} y={35} w={40} h={14} r={6} />
      <Face x={13} y={37} w={13} h={7.2} />
      <Circle cx={45} cy={40} r={1.4} fill={LEAF} />
      <Wheel x={18} y={51} r={6.5} />
      <Wheel x={42} y={51} r={6.5} />
    </G>
  );
}

function Cleaner() {
  return (
    <G>
      <GroundShadow w={26} />
      {/* broom on an arm */}
      <Path d="M40 34 L54 48" stroke={WOOD} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M51 45 L58 52 L55 59 L46 54 Z" fill="#E5B23A" />
      <Path d="M51 45 L58 52 L57 54.4 L49.5 47 Z" fill={GREEN} />
      <Path d="M49 51 L52.5 57 M52 49.5 L55.5 56" stroke="#C99A2A" strokeWidth={1} strokeLinecap="round" />
      {/* dust puffs */}
      <Circle cx={60} cy={57} r={1.6} fill="#D8CDB8" />
      <Circle cx={61.5} cy={53.5} r={1.1} fill="#D8CDB8" />
      {/* round body */}
      <Ellipse cx={28} cy={50} rx={22} ry={6} fill={GREEN} />
      <Path d="M6 48 Q6 28 28 28 Q50 28 50 48 Z" fill={BODY} stroke={LINE} strokeWidth={1.2} />
      <Path d="M38 30.4 Q49.4 33 49.4 47.4 L41 47.4 Q42 36 38 30.4 Z" fill={BODY_DARK} />
      <Ellipse cx={28} cy={48} rx={22} ry={3.4} fill={BODY_DARK} />
      <Rect x={6} y={47} width={44} height={2.4} fill={GREEN_LIGHT} />
      <Face x={17} y={33} w={18} h={9.5} />
      <Antenna x={28} y={28.4} h={4} />
      <Wheel x={19} y={55} r={3.6} />
      <Wheel x={37} y={55} r={3.6} />
    </G>
  );
}

function machineShape(id: MachineId): ReactNode {
  switch (id) {
    case 'sprinkler':
      return <Sprinkler />;
    case 'weeder':
      return <Weeder />;
    case 'harvester':
      return <Harvester />;
    case 'planter':
      return <Planter />;
    case 'feeder':
      return <Feeder />;
    case 'collector':
      return <Collector />;
    case 'cleaner':
      return <Cleaner />;
    case 'fish_feeder':
      return <FishFeederDevice />;
    case 'pond_filter':
      return <PondFilterDevice />;
    case 'solar_pump':
      return <SolarPump />;
    default: {
      const never: never = id;
      return never;
    }
  }
}

export function MachineArt({ id, size = 64 }: { id: MachineId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {machineShape(id)}
    </Svg>
  );
}

/* ------------------------------------------------------------------ map sprites */

/*
 * Sprites are drawn in a 32 x 32 box with bold shapes and no hairlines so
 * they read at 20-32 px. Robots share one simplified chassis.
 */

function SpriteShadow({ w = 12 }: { w?: number }) {
  return <Ellipse cx={16} cy={29.5} rx={w} ry={2} fill={INK} opacity={0.16} />;
}

function SpriteChassis({ top }: { top?: ReactNode }) {
  return (
    <G>
      <SpriteShadow />
      {top}
      <Rect x={5} y={13} width={22} height={13} rx={4.5} fill={BODY} stroke={GREEN} strokeWidth={1.4} />
      <Rect x={5.7} y={21.5} width={20.6} height={3.8} rx={1.6} fill={BODY_DARK} />
      <Rect x={8} y={15.5} width={10} height={6} rx={2} fill={GREEN} />
      <Circle cx={11} cy={18.4} r={1.2} fill={EYE} />
      <Circle cx={15} cy={18.4} r={1.2} fill={EYE} />
      <Circle cx={10} cy={27} r={3.2} fill={TYRE} />
      <Circle cx={22} cy={27} r={3.2} fill={TYRE} />
      <Circle cx={10} cy={27} r={1.3} fill={HUB} />
      <Circle cx={22} cy={27} r={1.3} fill={HUB} />
    </G>
  );
}

function spriteShape(id: MachineId): ReactNode {
  switch (id) {
    case 'weeder':
      return (
        <G>
          <SpriteChassis
            top={
              <G>
                <Path d="M12 14 L12 9.5" stroke={METAL} strokeWidth={1.4} strokeLinecap="round" />
                <Circle cx={12} cy={8.5} r={2} fill={LEAF} />
              </G>
            }
          />
          <Path d="M26 19 L29.5 21 L29.5 26.5" stroke={GREEN} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M28 26 L31 26" stroke={METAL} strokeWidth={2} strokeLinecap="round" />
        </G>
      );
    case 'harvester':
      return (
        <SpriteChassis
          top={
            <G>
              <Circle cx={15} cy={8.5} r={3} fill="#E0453A" />
              <Circle cx={20.5} cy={8} r={3} fill="#EE9445" />
              <Path d="M11 10 L26 10 L24.5 15 L12.5 15 Z" fill={WOOD} />
              <Rect x={10.5} y={9.5} width={16} height={2} rx={1} fill={shade(WOOD, -0.2)} />
            </G>
          }
        />
      );
    case 'planter':
      return (
        <G>
          <SpriteChassis
            top={
              <G>
                <Path d="M8 6 L22 6 L19.5 14 L10.5 14 Z" fill={GREEN_LIGHT} />
                <Rect x={7} y={5} width={16} height={2.6} rx={1.2} fill={GREEN} />
              </G>
            }
          />
          <Ellipse cx={29} cy={22} rx={1.2} ry={1.6} fill={SOIL} />
          <Ellipse cx={28.4} cy={26.5} rx={1.2} ry={1.6} fill={SOIL} />
        </G>
      );
    case 'collector':
      return (
        <SpriteChassis
          top={
            <G>
              <Rect x={7} y={5} width={6} height={9} rx={2} fill="#FFFFFF" stroke="#9FB6C8" strokeWidth={1} />
              <Rect x={7.8} y={3.6} width={4.4} height={2.6} rx={1} fill="#3C7FB5" />
              <Ellipse cx={18.5} cy={9.5} rx={2.2} ry={2.8} fill="#FFFCF6" stroke="#D9C9AE" strokeWidth={0.8} />
              <Ellipse cx={22.5} cy={10} rx={2.2} ry={2.6} fill="#E3C9A2" />
              <Path d="M15 11 L26 11 L25 14 L16 14 Z" fill={WOOD} />
            </G>
          }
        />
      );
    case 'cleaner':
      return (
        <G>
          <SpriteShadow w={13} />
          <Path d="M24 18 L29.5 25" stroke={WOOD} strokeWidth={2} strokeLinecap="round" />
          <Path d="M27 23 L31.5 26.5 L30 30 L25 27.5 Z" fill="#E5B23A" />
          <Ellipse cx={15} cy={26} rx={12} ry={3.4} fill={GREEN} />
          <Path d="M3 25 Q3 13 15 13 Q27 13 27 25 Z" fill={BODY} stroke={GREEN} strokeWidth={1.4} />
          <Rect x={10} y={16.5} width={10} height={5.5} rx={2} fill={GREEN} />
          <Circle cx={13} cy={19.2} r={1.2} fill={EYE} />
          <Circle cx={17} cy={19.2} r={1.2} fill={EYE} />
        </G>
      );
    case 'sprinkler':
      return (
        <G>
          <SpriteShadow w={7} />
          <Rect x={14} y={17} width={4} height={12} rx={1.2} fill={METAL} />
          <Rect x={10} y={14} width={12} height={5} rx={2.4} fill={GREEN} />
          <Drop x={6} y={10} rot={-45} s={1.2} />
          <Drop x={16} y={6} s={1.3} />
          <Drop x={26} y={10} rot={45} s={1.2} />
        </G>
      );
    case 'feeder':
      return (
        <G>
          <SpriteShadow w={12} />
          <Rect x={7} y={14} width={2.4} height={14} rx={1} fill={METAL} />
          <Rect x={22.6} y={14} width={2.4} height={14} rx={1} fill={METAL} />
          <Path d="M5 5 L27 5 L27 12 L20 19 L12 19 L5 12 Z" fill={BODY} stroke={GREEN} strokeWidth={1.4} strokeLinejoin="round" />
          <Rect x={4} y={3} width={24} height={4} rx={1.8} fill={GREEN} />
          <Path d="M8 24 L24 24 L22.5 29 L9.5 29 Z" fill={WOOD} />
          <Path d="M9.5 24.2 Q16 20.5 22.5 24.2 Z" fill={GRAIN} />
        </G>
      );
    case 'fish_feeder':
      return (
        <G>
          <Ellipse cx={16} cy={27} rx={14} ry={4} fill={WATER} />
          <Rect x={4} y={6} width={2.6} height={21} rx={1} fill={METAL} />
          <Rect x={4} y={6} width={12} height={2.4} rx={1} fill={METAL} />
          <Path d="M10 8 L24 8 L24 15 Q24 18 20 19 L14 19 Q10 18 10 15 Z" fill={BODY} stroke={GREEN} strokeWidth={1.4} />
          <Rect x={9} y={5} width={16} height={3.6} rx={1.6} fill={GREEN} />
          <Pellet x={15} y={23} r={1.3} />
          <Pellet x={19.5} y={22} r={1.3} />
        </G>
      );
    case 'pond_filter':
      return (
        <G>
          <Ellipse cx={16} cy={27} rx={14} ry={4} fill={WATER} />
          <Rect x={8} y={9} width={16} height={16} rx={3} fill={BODY} stroke={GREEN} strokeWidth={1.4} />
          <Rect x={7} y={7} width={18} height={4} rx={1.8} fill={GREEN} />
          <Path d="M11.5 15 L20.5 15 M11.5 19 L20.5 19" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M24 14 Q29 14 28.5 24" stroke={WATER_DARK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Circle cx={5} cy={18} r={1.6} fill="#FFFFFF" stroke={WATER_DARK} strokeWidth={0.8} />
        </G>
      );
    case 'solar_pump':
      return (
        <G>
          <SpriteShadow w={13} />
          <Rect x={9} y={16} width={2.4} height={13} rx={1} fill={METAL} />
          <Path d="M1 16 L11 7 L19 11.5 L9 20.5 Z" fill="#2F5C9A" stroke="#C9D0CA" strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M6 11.5 L14 16" stroke="#7FA6D8" strokeWidth={1} />
          <Rect x={17} y={17} width={9} height={11} rx={2.4} fill={BODY} stroke={GREEN} strokeWidth={1.4} />
          <Rect x={16} y={15.4} width={11} height={3} rx={1.4} fill={GREEN} />
          <Drop x={28} y={11} s={1.2} />
        </G>
      );
    default: {
      const never: never = id;
      return never;
    }
  }
}

/** A tiny, bold machine for the farm map (meant for 20-32 px). */
export function RobotSprite({ id, size = 28 }: { id: MachineId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {spriteShape(id)}
    </Svg>
  );
}

/** One fish-food pellet: a rounded brown blob with a highlight. */
export function FeedPellet({ size = 6 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M5 1 C7.6 1 9.2 2.8 9 5.2 C8.8 7.6 7 9 4.8 9 C2.4 9 0.9 7.4 1 5 C1.1 2.6 2.6 1 5 1 Z" fill="#8A5A33" />
      <Path d="M1.3 6 C2 8 3.4 9 4.8 9 C7 9 8.8 7.6 9 5.2 C7.6 7.4 4 8 1.3 6 Z" fill="#6E4526" />
      <Ellipse cx={3.6} cy={3.4} rx={1.4} ry={1} fill="#C89668" transform="rotate(-30 3.6 3.4)" />
    </Svg>
  );
}
