/**
 * Workshops: small production buildings (dairy, mill, bakery, jam kitchen)
 * drawn in a 100 x 100 box in the same flat, two-tone style as the machines.
 * `busy` adds a quiet sign of work (smoke, steam, a glowing oven, moving
 * sails). `WorkshopMapIcon` is the same drawing sized for the farm map.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { shade } from './shared';

export type WorkshopArtId = 'dairy' | 'mill' | 'bakery' | 'jam';

type WorkshopArtProps = { id: WorkshopArtId; size?: number; busy?: boolean };

const INK = '#1C2A20';
const MILK_BLUE = '#3C7FB5';
const MILK_BLUE_LIGHT = '#5C9BCB';
const MILK_WALL = '#F7FAFC';
const MILK_SHADE = '#E3ECF2';
const MILK_LINE = '#C9D6E0';
const METAL = '#9AA6A0';
const CAN = '#C9D3DA';
const WOOD = '#B9874F';
const CREAM = '#F2E6CF';
const ROOF_RED = '#B5594B';
const BRICK = '#C9714F';
const SOOT = '#3A2A22';
const JAM = '#C7362B';
const LEAF = '#5DAE5B';

function GroundShadow({ cx = 50, w = 40 }: { cx?: number; w?: number }) {
  return <Ellipse cx={cx} cy={88} rx={w} ry={5} fill={INK} opacity={0.1} />;
}

/** Soft grey-white puffs rising from (x, y). */
function Puffs({ x, y, color = '#FFFFFF' }: { x: number; y: number; color?: string }) {
  return (
    <G opacity={0.85}>
      <Circle cx={x} cy={y} r={3} fill={color} />
      <Circle cx={x + 3.5} cy={y - 5} r={4} fill={color} />
      <Circle cx={x + 1} cy={y - 11} r={5} fill={color} />
    </G>
  );
}

function Dairy({ busy }: { busy: boolean }) {
  return (
    <G>
      <GroundShadow />
      {/* vent pipe */}
      <Rect x={60} y={22} width={6} height={14} rx={1.5} fill={METAL} />
      {busy && <Puffs x={63} y={18} />}
      {/* walls */}
      <Rect x={18} y={46} width={60} height={40} fill={MILK_WALL} stroke={MILK_LINE} strokeWidth={1.6} />
      <Rect x={64} y={46.8} width={13.2} height={38.4} fill={MILK_SHADE} />
      <Rect x={18.8} y={74} width={58.4} height={4} fill={MILK_BLUE_LIGHT} opacity={0.5} />
      {/* roof */}
      <Path d="M10 49 L48 22 L86 49 Z" fill={MILK_BLUE} />
      <Path d="M10 49 L48 22 L51 24 L15 49 Z" fill={MILK_BLUE_LIGHT} />
      <Rect x={8} y={47} width={80} height={5} rx={2.5} fill={shade(MILK_BLUE, 0.2)} />
      <Circle cx={48} cy={39} r={4.5} fill="#DDEBF6" stroke={MILK_WALL} strokeWidth={1.6} />
      {/* door */}
      <Rect x={37} y={60} width={22} height={26} rx={2} fill={MILK_BLUE} />
      <Path d="M39 62 L57 84 M57 62 L39 84" stroke={MILK_WALL} strokeWidth={2} strokeLinecap="round" />
      <Rect x={23} y={57} width={9} height={9} rx={1.5} fill="#DDEBF6" stroke={MILK_LINE} strokeWidth={1.2} />
      {/* milk can */}
      <Path d="M80 72 Q80 69 83 69 L91 69 Q94 69 94 72 L94 86 Q94 88 92 88 L82 88 Q80 88 80 86 Z" fill={CAN} />
      <Rect x={89} y={69.5} width={4.4} height={18} rx={1.5} fill={shade(CAN, 0.12)} />
      <Path d="M83.5 69 L84.5 63 L89.5 63 L90.5 69 Z" fill={CAN} />
      <Rect x={82} y={59.5} width={10} height={4} rx={2} fill={METAL} />
      <Rect x={80} y={76} width={14} height={3.4} fill={MILK_BLUE} />
      <Rect x={82} y={71} width={1.8} height={14} rx={0.9} fill="#FFFFFF" opacity={0.8} />
      {busy && <Path d="M84 56 Q82 52 85 49 M89 56 Q91 52 88 48" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />}
    </G>
  );
}

function Sail({ angle }: { angle: number }) {
  return (
    <G transform={`rotate(${angle} 50 34)`}>
      <Rect x={48.8} y={4} width={2.4} height={30} fill={shade(WOOD, 0.2)} />
      <Rect x={51.2} y={6} width={8} height={24} fill="#FFFDF6" stroke={WOOD} strokeWidth={1.2} />
      <Path d="M51.2 14 L59.2 14 M51.2 22 L59.2 22" stroke={WOOD} strokeWidth={0.9} />
    </G>
  );
}

function Mill({ busy }: { busy: boolean }) {
  const tilt = busy ? 20 : 0;
  return (
    <G>
      <GroundShadow />
      {/* tower */}
      <Path d="M32 86 L40 38 L60 38 L68 86 Z" fill={CREAM} />
      <Path d="M54 38 L60 38 L68 86 L58 86 Z" fill={shade(CREAM, 0.1)} />
      <Path d="M36 62 L64 62" stroke={shade(CREAM, 0.15)} strokeWidth={1.4} />
      <Path d="M43 86 L43 74 Q43 68 50 68 Q57 68 57 74 L57 86 Z" fill="#8B5E3C" />
      <Circle cx={50} cy={52} r={3.6} fill="#DDEBF6" stroke={WOOD} strokeWidth={1.2} />
      {/* cap */}
      <Path d="M36 40 Q50 18 64 40 Z" fill={ROOF_RED} />
      <Path d="M54 23 Q61 30 64 40 L56 40 Q56 31 54 23 Z" fill={shade(ROOF_RED, 0.15)} />
      <Rect x={34} y={38} width={32} height={4} rx={2} fill={shade(ROOF_RED, 0.25)} />
      {/* sails */}
      <Sail angle={45 + tilt} />
      <Sail angle={135 + tilt} />
      <Sail angle={225 + tilt} />
      <Sail angle={315 + tilt} />
      <Circle cx={50} cy={34} r={4} fill={shade(WOOD, 0.15)} />
      <Circle cx={49} cy={33} r={1.4} fill="#FFFFFF" opacity={0.6} />
      {busy && (
        <Path
          d="M18 20 Q22 8 34 4 M82 48 Q78 60 66 64"
          stroke={INK}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          opacity={0.25}
        />
      )}
      {/* flour sack at the door */}
      <Path d="M70 88 Q68 78 73 76 L80 76 Q85 78 83 88 Z" fill="#F6F1E7" stroke="#D9CFBD" strokeWidth={1} />
      <Path d="M72 77 Q76.5 79 81 77" stroke="#3C7FB5" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Bakery({ busy }: { busy: boolean }) {
  return (
    <G>
      <GroundShadow />
      {/* chimney */}
      <Rect x={64} y={28} width={10} height={14} fill={BRICK} />
      <Rect x={62.5} y={25} width={13} height={4} rx={1} fill={shade(BRICK, 0.25)} />
      {busy && <Puffs x={68} y={21} color="#E4E0D8" />}
      {/* walls */}
      <Rect x={16} y={46} width={68} height={40} fill={BRICK} />
      <Rect x={70} y={46} width={14} height={40} fill={shade(BRICK, 0.12)} />
      <Path
        d="M16 56 L84 56 M16 66 L84 66 M16 76 L84 76 M26 46 L26 56 M44 46 L44 56 M62 46 L62 56 M34 56 L34 66 M70 56 L70 66 M24 66 L24 76 M76 66 L76 76 M30 76 L30 86 M72 76 L72 86"
        stroke={shade(BRICK, -0.25)}
        strokeWidth={1.2}
      />
      {/* roof */}
      <Path d="M8 49 L50 24 L92 49 Z" fill="#7A4A35" />
      <Path d="M8 49 L50 24 L53 26 L14 49 Z" fill="#94603F" />
      <Rect x={6} y={47} width={88} height={5} rx={2.5} fill="#5F3828" />
      {/* bread sign */}
      <Ellipse cx={50} cy={40} rx={8} ry={4.6} fill="#DE9A4F" />
      <Path d="M45 40 L47 37.5 M49 41 L51 38 M53 41.5 L55 38.5" stroke="#F3D29A" strokeWidth={1.4} strokeLinecap="round" />
      {/* oven mouth */}
      <Path d="M32 86 L32 72 Q32 58 50 58 Q68 58 68 72 L68 86 Z" fill={CREAM} />
      <Path d="M37 86 L37 73 Q37 63 50 63 Q63 63 63 73 L63 86 Z" fill={SOOT} />
      {busy && (
        <G>
          <Path d="M40 86 L40 76 Q40 68 50 68 Q60 68 60 76 L60 86 Z" fill="#F29A3A" />
          <Path d="M44 86 Q44 76 50 74 Q56 76 56 86 Z" fill="#FFD36B" />
        </G>
      )}
      <Rect x={30} y={84} width={40} height={4} rx={1.5} fill={shade(CREAM, 0.15)} />
    </G>
  );
}

function Jam({ busy }: { busy: boolean }) {
  return (
    <G>
      <GroundShadow />
      {/* walls */}
      <Rect x={18} y={44} width={64} height={42} fill="#F6E7CC" stroke="#E0CBA6" strokeWidth={1.4} />
      <Rect x={68} y={44.7} width={13.3} height={40.6} fill="#E9D5B2" />
      {/* roof with scalloped trim */}
      <Path d="M10 47 L50 20 L90 47 Z" fill={JAM} />
      <Path d="M10 47 L50 20 L53 22 L15 47 Z" fill="#E0453A" />
      <Path
        d="M10 46 L90 46 L90 50 Q86 54 82 50 Q78 54 74 50 Q70 54 66 50 Q62 54 58 50 Q54 54 50 50 Q46 54 42 50 Q38 54 34 50 Q30 54 26 50 Q22 54 18 50 Q14 54 10 50 Z"
        fill="#FFFFFF"
      />
      <Path d="M44 34 Q50 28 56 34 Q50 40 44 34 Z" fill={LEAF} />
      {/* serving window */}
      <Rect x={26} y={56} width={48} height={20} rx={2} fill="#6B4A35" />
      {busy && <Path d="M37 62 Q35 59 37 56.5 M45 62 Q47 59 45 56.5" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.85} />}
      {/* pot */}
      <Path d="M30 64 L52 64 L50 74 Q50 76 48 76 L34 76 Q32 76 32 74 Z" fill="#5E6B66" />
      <Ellipse cx={41} cy={64} rx={11} ry={2.6} fill={JAM} />
      <Rect x={27} y={63} width={4} height={2.4} rx={1} fill="#5E6B66" />
      <Rect x={51} y={63} width={4} height={2.4} rx={1} fill="#5E6B66" />
      {busy && <Circle cx={37} cy={63.6} r={1.4} fill="#E06B55" />}
      {busy && <Circle cx={44} cy={64} r={1} fill="#E06B55" />}
      {/* jar */}
      <Rect x={58} y={64} width={10} height={12} rx={2.4} fill={JAM} />
      <Rect x={59.5} y={66} width={1.6} height={8} rx={0.8} fill="#FFFFFF" opacity={0.5} />
      <Path d="M56.5 64.5 Q57 60.5 63 60.5 Q69 60.5 69.5 64.5 Z" fill="#FFFFFF" />
      <Path d="M60 61 L60 64.5 M63 60.5 L63 64.5 M66 61 L66 64.5" stroke="#E06B55" strokeWidth={1.4} />
      {/* counter */}
      <Rect x={22} y={75} width={56} height={5} rx={1.5} fill={WOOD} />
      <Rect x={22} y={75} width={56} height={1.8} rx={0.9} fill={shade(WOOD, -0.18)} />
      <Rect x={28} y={80} width={44} height={6} fill="#E9D5B2" />
    </G>
  );
}

function workshopShape(id: WorkshopArtId, busy: boolean): ReactNode {
  switch (id) {
    case 'dairy':
      return <Dairy busy={busy} />;
    case 'mill':
      return <Mill busy={busy} />;
    case 'bakery':
      return <Bakery busy={busy} />;
    case 'jam':
      return <Jam busy={busy} />;
    default: {
      const never: never = id;
      return never;
    }
  }
}

/** A workshop building (100 x 100 box); `busy` adds smoke, steam or a glowing oven. */
export function WorkshopArt({ id, size = 72, busy = false }: WorkshopArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {workshopShape(id, busy)}
    </Svg>
  );
}

/** The same building for the farm map (meant for ~22 px). */
export function WorkshopMapIcon({ id, size = 22, busy = false }: WorkshopArtProps) {
  return <WorkshopArt id={id} size={size} busy={busy} />;
}
