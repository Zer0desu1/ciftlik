/**
 * Cute flat farm animals (side body, head turned three-quarters to the
 * viewer) and pond fish. Animals are drawn in a 100 x 100 box with their
 * feet on y = 92 and a transparent background.
 */
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { FishSpeciesId, SpeciesId } from '@/game/data';

import { FishShape } from './produce';
import { shade } from './shared';

const INK = '#1C2A20';
const BLUSH = '#F09A94';

function Eye({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={INK} />
      <Circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.36} fill="#FFFFFF" />
    </G>
  );
}

/* ------------------------------------------------------------------ cow */

const COWS = [
  { body: '#FBFAF6', patch: '#2F2F35' },
  { body: '#FBF7F0', patch: '#8B5A3C' },
  { body: '#B07446', patch: '#7E4E2D' },
  { body: '#A9AEB3', patch: '#5F656B' },
];

function Cow({ variant }: { variant: number }) {
  const { body, patch } = COWS[variant % COWS.length];
  const line = shade(body, 0.2);
  const under = shade(body, 0.1);
  const far = shade(body, 0.16);
  const muzzle = '#F2B8AC';
  const hoof = '#4A4040';
  return (
    <G>
      <Path d="M86 46 Q94 52 91 68" stroke={line} strokeWidth={3.6} fill="none" strokeLinecap="round" />
      <Path d="M86 46 Q94 52 91 68" stroke={body} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={91} cy={70} rx={2.8} ry={4} fill={patch} />
      <Rect x={33} y={60} width={8} height={31} rx={3.5} fill={far} />
      <Rect x={69} y={60} width={8} height={31} rx={3.5} fill={far} />
      <Rect x={33} y={86} width={8} height={6} rx={2} fill={hoof} />
      <Rect x={69} y={86} width={8} height={6} rx={2} fill={hoof} />
      <Path
        d="M30 42 Q30 34 40 34 L76 34 Q88 34 88 46 L88 56 Q88 68 76 68 L42 68 Q30 68 30 58 Z"
        fill={body}
        stroke={line}
        strokeWidth={1.2}
      />
      <Path d="M30.8 58 Q31 67.2 42 67.2 L76 67.2 Q87.2 67.2 87.4 57 Q60 64 30.8 58 Z" fill={under} />
      <Path d="M50 34.6 Q47 44 55 47 Q64 49 67 41 Q68 37 71 34.6 Z" fill={patch} />
      <Path d="M79 43 Q73 50 78 57 Q83 61 87.4 57 L87.4 46 Q86 43 79 43 Z" fill={patch} />
      <Ellipse cx={44} cy={55} rx={5} ry={4} fill={patch} />
      <Ellipse cx={68} cy={69} rx={7} ry={4.5} fill={muzzle} />
      <Path d="M64 72 L64 75 M68 72.5 L68 76 M72 72 L72 75" stroke={shade(muzzle, 0.15)} strokeWidth={2} strokeLinecap="round" />
      <Rect x={39} y={62} width={9} height={30} rx={4} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={75} y={60} width={9} height={32} rx={4} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={39} y={86} width={9} height={6} rx={2} fill={hoof} />
      <Rect x={75} y={86} width={9} height={6} rx={2} fill={hoof} />
      {/* head */}
      <Path d="M19 22 Q15 15 20 11" stroke="#EADFC3" strokeWidth={3.6} fill="none" strokeLinecap="round" />
      <Path d="M33 22 Q37 15 32 11" stroke="#EADFC3" strokeWidth={3.6} fill="none" strokeLinecap="round" />
      <Ellipse cx={10} cy={30} rx={8} ry={4} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(-18 10 30)" />
      <Ellipse cx={10.5} cy={30} rx={5} ry={2.2} fill={muzzle} transform="rotate(-18 10.5 30)" />
      <Ellipse cx={42} cy={30} rx={8} ry={4} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(18 42 30)" />
      <Ellipse cx={41.5} cy={30} rx={5} ry={2.2} fill={muzzle} transform="rotate(18 41.5 30)" />
      <Path d="M14 31 Q14 18 26 18 Q38 18 38 31 L37 42 Q36 49 26 49 Q16 49 15 42 Z" fill={body} stroke={line} strokeWidth={1.2} />
      <Path d="M28 18.4 Q37.4 19 37.5 31 Q33 34 30 29 Q27.5 24 28 18.4 Z" fill={patch} />
      <Path d="M22 19 Q24 15 27 18 Q28 15 30 18.5" stroke={line} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={17} cy={40} rx={3} ry={1.8} fill={BLUSH} opacity={0.55} />
      <Ellipse cx={35} cy={40} rx={3} ry={1.8} fill={BLUSH} opacity={0.55} />
      <Eye x={20.5} y={33} />
      <Eye x={31.5} y={33} />
      <Ellipse cx={26} cy={46} rx={12} ry={8} fill={muzzle} stroke={shade(muzzle, 0.12)} strokeWidth={1} />
      <Ellipse cx={21.5} cy={46} rx={1.6} ry={2.3} fill="#B9766C" />
      <Ellipse cx={30.5} cy={46} rx={1.6} ry={2.3} fill="#B9766C" />
      <Path d="M23 51 Q26 53 29 51" stroke="#B9766C" strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* ------------------------------------------------------------------ hen */

const HENS = [
  { body: '#B9653A', wing: '#8F4826', tail: '#5E3220', speckle: false },
  { body: '#FBF8F2', wing: '#E6DDCD', tail: '#D9CDB8', speckle: false },
  { body: '#7E6556', wing: '#5E4A3F', tail: '#3F332D', speckle: true },
  { body: '#E2A84A', wing: '#C4852C', tail: '#9A6420', speckle: false },
];

const SPECKLES = [
  [44, 46], [52, 42], [60, 48], [68, 46], [40, 58], [48, 60], [58, 66], [66, 62], [74, 56], [36, 66], [50, 72], [62, 74],
];

function Hen({ variant }: { variant: number }) {
  const h = HENS[variant % HENS.length];
  const line = shade(h.body, 0.18);
  const comb = '#E0453A';
  const leg = '#E8A23A';
  return (
    <G>
      <Path d="M50 77 L49 89 M60 77 L61 89" stroke={leg} strokeWidth={2.8} strokeLinecap="round" />
      <Path d="M44 91 L49 89 L53 91 M56 91 L61 89 L66 91" stroke={leg} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M68 52 Q70 30 84 24 Q80 34 82 40 Q88 32 95 32 Q88 44 84 60 Z" fill={h.tail} />
      <Path d="M74 54 Q78 38 88 36 Q84 46 84 58 Z" fill={shade(h.tail, -0.15)} />
      <Path
        d="M22 40 C22 28 38 26 44 36 C52 44 66 40 78 44 C88 50 86 70 72 77 C60 83 40 82 31 73 C24 66 22 54 22 40 Z"
        fill={h.body}
        stroke={line}
        strokeWidth={1.2}
      />
      <Path d="M27 62 C32 74 46 80 60 79 C46 76 36 70 31 60 Z" fill={shade(h.body, -0.18)} opacity={0.7} />
      {h.speckle
        ? SPECKLES.map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={1.5} ry={1.1} fill="#FFFFFF" opacity={0.85} />)
        : null}
      <Path d="M44 54 C50 44 68 44 76 52 C76 64 64 72 52 68 C46 65 43 60 44 54 Z" fill={h.wing} />
      <Path d="M52 56 Q62 54 70 58 M50 61 Q60 60 68 64" stroke={shade(h.wing, 0.15)} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Circle cx={26} cy={18} r={4.2} fill={comb} />
      <Circle cx={32} cy={16} r={4.6} fill={comb} />
      <Circle cx={38} cy={18.5} r={4} fill={comb} />
      <Circle cx={32} cy={30} r={12} fill={h.body} />
      <Path d="M21 30 L12 33.5 L21 37 Z" fill="#F2B33D" />
      <Path d="M21 33.5 L12 33.5 L21 37 Z" fill="#DB9A28" />
      <Ellipse cx={21.5} cy={41} rx={3} ry={4.6} fill={comb} />
      <Ellipse cx={35} cy={36} rx={3} ry={1.8} fill={BLUSH} opacity={0.55} />
      <Eye x={28} y={28} r={2.5} />
      <Eye x={37} y={28.5} r={2.2} />
    </G>
  );
}

/* ------------------------------------------------------------------ sheep */

const SHEEP = [
  { wool: '#F8F4EA', face: '#3A3335', leg: '#3A3335' },
  { wool: '#F0E2C6', face: '#4A3B33', leg: '#4A3B33' },
  { wool: '#C3C3C1', face: '#3A3335', leg: '#3A3335' },
  { wool: '#55504F', face: '#262122', leg: '#262122' },
];

const FLUFF = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { x: 59 + Math.cos(a) * 25, y: 52 + Math.sin(a) * 14 };
});

function Sheep({ variant }: { variant: number }) {
  const s = SHEEP[variant % SHEEP.length];
  const woolDark = shade(s.wool, 0.14);
  return (
    <G>
      <Rect x={44} y={62} width={6} height={28} rx={3} fill={shade(s.leg, -0.12)} />
      <Rect x={70} y={62} width={6} height={28} rx={3} fill={shade(s.leg, -0.12)} />
      <Rect x={36} y={62} width={6.5} height={30} rx={3} fill={s.leg} />
      <Rect x={62} y={62} width={6.5} height={30} rx={3} fill={s.leg} />
      {FLUFF.map((p, i) => (
        <Circle key={`d${i}`} cx={p.x} cy={p.y + 1.6} r={10.5} fill={woolDark} />
      ))}
      <Circle cx={86} cy={48} r={5.5} fill={woolDark} />
      <Ellipse cx={59} cy={53} rx={26} ry={15} fill={s.wool} />
      {FLUFF.map((p, i) => (
        <Circle key={`w${i}`} cx={p.x} cy={p.y} r={10} fill={s.wool} />
      ))}
      <Circle cx={85.5} cy={47} r={5} fill={s.wool} />
      <Path d="M50 46 q3 -3 6 0 M62 44 q3 -3 6 0 M56 56 q3 -3 6 0 M70 54 q3 -3 6 0" stroke={woolDark} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {/* head */}
      <Ellipse cx={16} cy={43} rx={8} ry={3.6} fill={s.face} transform="rotate(-24 16 43)" />
      <Ellipse cx={17} cy={43} rx={4.6} ry={1.6} fill="#E7A9A0" transform="rotate(-24 17 43)" />
      <Ellipse cx={44} cy={43} rx={8} ry={3.6} fill={s.face} transform="rotate(24 44 43)" />
      <Ellipse cx={43} cy={43} rx={4.6} ry={1.6} fill="#E7A9A0" transform="rotate(24 43 43)" />
      <Ellipse cx={30} cy={48} rx={11} ry={13} fill={s.face} />
      <Ellipse cx={30} cy={56} rx={7} ry={5} fill={shade(s.face, -0.12)} />
      <Path d="M27.5 55 Q30 57 32.5 55" stroke={shade(s.face, -0.45)} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      <Circle cx={24} cy={36} r={5.5} fill={s.wool} />
      <Circle cx={30} cy={34} r={6} fill={s.wool} />
      <Circle cx={36} cy={36} r={5.5} fill={s.wool} />
      <Circle cx={30} cy={38.5} r={4.6} fill={s.wool} />
      <Circle cx={25.5} cy={46} r={3} fill="#FFFFFF" />
      <Circle cx={34.5} cy={46} r={3} fill="#FFFFFF" />
      <Eye x={25.8} y={46.4} r={1.9} />
      <Eye x={34.8} y={46.4} r={1.9} />
      <Ellipse cx={23} cy={52} rx={2.4} ry={1.4} fill={BLUSH} opacity={0.5} />
      <Ellipse cx={37} cy={52} rx={2.4} ry={1.4} fill={BLUSH} opacity={0.5} />
    </G>
  );
}

/* ------------------------------------------------------------------ goat */

const GOATS = [
  { body: '#F7F2E8', patch: '#C9935A' },
  { body: '#9A6640', patch: '#6E4528' },
  { body: '#F7F2E8', patch: '#34343A' },
  { body: '#EADBB8', patch: '#CDB284' },
];

function Goat({ variant }: { variant: number }) {
  const { body, patch } = GOATS[variant % GOATS.length];
  const line = shade(body, 0.2);
  const far = shade(body, 0.15);
  const hoof = '#4A4040';
  const horn = '#B8AA92';
  return (
    <G>
      <Path d="M82 42 Q88 34 86 28" stroke={line} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M82 42 Q88 34 86 28" stroke={body} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Rect x={45} y={56} width={6} height={35} rx={3} fill={far} />
      <Rect x={73} y={56} width={6} height={35} rx={3} fill={far} />
      <Rect x={45} y={87} width={6} height={5} rx={1.6} fill={hoof} />
      <Rect x={73} y={87} width={6} height={5} rx={1.6} fill={hoof} />
      <Path
        d="M34 46 Q34 38 44 38 L74 38 Q85 38 85 49 L85 54 Q85 64 74 64 L44 64 Q34 64 34 55 Z"
        fill={body}
        stroke={line}
        strokeWidth={1.2}
      />
      <Path d="M34.8 55 Q35 63.2 44 63.2 L74 63.2 Q84.2 63.2 84.4 54 Q60 60 34.8 55 Z" fill={shade(body, 0.08)} />
      <Path d="M56 38.6 L74 38.6 Q78 39 79 41 Q74 50 64 50 Q55 48 56 38.6 Z" fill={patch} />
      <Rect x={38} y={58} width={7} height={34} rx={3.2} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={66} y={58} width={7} height={34} rx={3.2} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={66} y={58} width={7} height={14} rx={3.2} fill={patch} />
      <Rect x={38} y={87} width={7} height={5} rx={1.6} fill={hoof} />
      <Rect x={66} y={87} width={7} height={5} rx={1.6} fill={hoof} />
      {/* neck + head */}
      <Path d="M35 52 L24 34 L38 28 L48 42 Z" fill={body} />
      <Path d="M22 19 Q19 8 28 4" stroke={horn} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M31 19 Q31 9 40 6" stroke={shade(horn, 0.12)} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ellipse cx={11} cy={29} rx={8.5} ry={3.4} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(22 11 29)" />
      <Ellipse cx={42} cy={29} rx={8.5} ry={3.4} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(-22 42 29)" />
      <Path d="M17 28 Q17 17 27 17 Q36 17 36 28 L34 40 Q32 48 26.5 48 Q21 48 19 40 Z" fill={body} stroke={line} strokeWidth={1.2} />
      <Path d="M24 17.6 Q27 16 30 17.6 L28.6 30 L25.4 30 Z" fill={patch} opacity={variant % 4 === 1 ? 0.6 : 1} />
      <Ellipse cx={26.5} cy={43} rx={7} ry={5.5} fill="#EBCFC2" />
      <Ellipse cx={24} cy={42.5} rx={1.2} ry={1.8} fill="#A9786B" />
      <Ellipse cx={29} cy={42.5} rx={1.2} ry={1.8} fill="#A9786B" />
      <Path d="M23 49 L26.5 58 L30 49 Z" fill={shade(patch, 0.1)} />
      <Ellipse cx={19.5} cy={37} rx={2.4} ry={1.4} fill={BLUSH} opacity={0.5} />
      <Ellipse cx={33.5} cy={37} rx={2.4} ry={1.4} fill={BLUSH} opacity={0.5} />
      <Eye x={22} y={30} r={2.3} />
      <Eye x={31} y={30} r={2.3} />
    </G>
  );
}

/* ------------------------------------------------------------------ young */

/*
 * Babies stand on the same y = 92 baseline but only fill about two thirds of
 * the box: a big head, short round body, big eyes and none of the adult
 * extras (horns, udder, comb, beard).
 */

function Calf({ variant }: { variant: number }) {
  const { body, patch } = COWS[variant % COWS.length];
  const line = shade(body, 0.2);
  const under = shade(body, 0.1);
  const far = shade(body, 0.16);
  const muzzle = '#F2B8AC';
  const hoof = '#4A4040';
  return (
    <G>
      <Path d="M75 60 Q81 64 79.5 72" stroke={line} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M75 60 Q81 64 79.5 72" stroke={body} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <Ellipse cx={79.5} cy={73.5} rx={2} ry={2.8} fill={patch} />
      <Rect x={47} y={69} width={5.5} height={22} rx={2.6} fill={far} transform="rotate(4 49.75 80)" />
      <Rect x={68.5} y={69} width={5.5} height={22} rx={2.6} fill={far} transform="rotate(-3 71.25 80)" />
      <Rect x={47.6} y={88} width={5.5} height={4} rx={1.6} fill={hoof} />
      <Rect x={68} y={88} width={5.5} height={4} rx={1.6} fill={hoof} />
      <Path
        d="M40 62 Q40 54 49 54 L68 54 Q77 54 77 63 L77 66 Q77 75 68 75 L49 75 Q40 75 40 67 Z"
        fill={body}
        stroke={line}
        strokeWidth={1.2}
      />
      <Path d="M40.8 67 Q41 74.2 49 74.2 L68 74.2 Q76.2 74.2 76.4 66 Q58 71.5 40.8 67 Z" fill={under} />
      <Path d="M56 54.6 Q54 61 59 63 Q65 64 67 58 Q67.5 56 69 54.6 Z" fill={patch} />
      <Path d="M71.5 58 Q67.5 63 71 68 Q74 70.5 76.4 67 L76.4 62 Q75.5 57.5 71.5 58 Z" fill={patch} />
      <Rect x={42} y={70} width={6.5} height={22} rx={3} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(-3 45.25 81)" />
      <Rect x={63.5} y={70} width={6.5} height={22} rx={3} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(3 66.75 81)" />
      <Rect x={41.4} y={88} width={6.5} height={4} rx={1.6} fill={hoof} />
      <Rect x={64.2} y={88} width={6.5} height={4} rx={1.6} fill={hoof} />
      {/* head */}
      <Ellipse cx={18.5} cy={40} rx={6} ry={3.2} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(-20 18.5 40)" />
      <Ellipse cx={19} cy={40} rx={3.6} ry={1.7} fill={muzzle} transform="rotate(-20 19 40)" />
      <Ellipse cx={45.5} cy={40} rx={6} ry={3.2} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(20 45.5 40)" />
      <Ellipse cx={45} cy={40} rx={3.6} ry={1.7} fill={muzzle} transform="rotate(20 45 40)" />
      <Path d="M20 44 Q20 30 32 30 Q44 30 44 44 L43 51 Q42 57 32 57 Q22 57 21 51 Z" fill={body} stroke={line} strokeWidth={1.2} />
      <Path d="M34 30.4 Q43.4 31 43.5 42 Q39 45 36.5 40 Q33.5 35 34 30.4 Z" fill={patch} />
      <Path d="M28 31 Q30 26.5 32.5 30 Q34 26.5 36 30.6" stroke={line} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={23.2} cy={49} rx={2.6} ry={1.6} fill={BLUSH} opacity={0.55} />
      <Ellipse cx={40.8} cy={49} rx={2.6} ry={1.6} fill={BLUSH} opacity={0.55} />
      <Eye x={26.5} y={42} r={3.3} />
      <Eye x={37.5} y={42} r={3.3} />
      <Ellipse cx={32} cy={53.5} rx={8.5} ry={5.6} fill={muzzle} stroke={shade(muzzle, 0.12)} strokeWidth={1} />
      <Ellipse cx={28.8} cy={53} rx={1.2} ry={1.7} fill="#B9766C" />
      <Ellipse cx={35.2} cy={53} rx={1.2} ry={1.7} fill="#B9766C" />
      <Path d="M30 56.4 Q32 57.8 34 56.4" stroke="#B9766C" strokeWidth={1} fill="none" strokeLinecap="round" />
    </G>
  );
}

const CHICKS = [
  { body: '#FFD84D', wing: '#F2BC2A' },
  { body: '#F8EDC6', wing: '#E8D8A6' },
  { body: '#DDB07A', wing: '#C4925A' },
  { body: '#D8CE98', wing: '#BFB37A' },
];

function Chick({ variant }: { variant: number }) {
  const c = CHICKS[variant % CHICKS.length];
  const line = shade(c.body, 0.2);
  const leg = '#E8A23A';
  return (
    <G>
      <Path d="M51 82 L50 89.5 M61 82 L62 89.5" stroke={leg} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M46 92 L50 89.5 L53.5 92 M58.5 92 L62 89.5 L66 92" stroke={leg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M76 64 L85 58 L82 67 Z" fill={c.wing} stroke={line} strokeWidth={1.2} strokeLinejoin="round" />
      {/* outline pass, then fill pass, so head and body read as one fluffy shape */}
      <Ellipse cx={57} cy={69} rx={22} ry={17} fill={line} stroke={line} strokeWidth={1.2} />
      <Circle cx={40} cy={50} r={15.5} fill={line} stroke={line} strokeWidth={1.2} />
      <Ellipse cx={57} cy={69} rx={22} ry={17} fill={c.body} />
      <Circle cx={40} cy={50} r={15.5} fill={c.body} />
      <Path d="M36 74 C42 84 58 88 70 83 C56 84 44 80 38 70 Z" fill={shade(c.body, -0.3)} opacity={0.7} />
      <Path d="M37 35.5 Q35 29 39 27 Q39 32 41 35 Q42 29 46.5 28.5 Q43.5 32 43.5 36 Z" fill={c.body} stroke={line} strokeWidth={1} strokeLinejoin="round" />
      <Path d="M51 64 C55 56 68 57 72 64 C71 72 62 76 55 73 C51 71 50 67 51 64 Z" fill={c.wing} />
      <Path d="M56 66 Q62 64.5 67 67" stroke={shade(c.wing, 0.12)} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M26.5 49 L20.5 52 L26.5 55 Z" fill="#F2A93D" strokeLinejoin="round" />
      <Path d="M26.5 52 L20.5 52 L26.5 55 Z" fill="#DB8F24" />
      <Ellipse cx={30} cy={57} rx={2.8} ry={1.7} fill={BLUSH} opacity={0.55} />
      <Ellipse cx={45} cy={56.5} rx={2.8} ry={1.7} fill={BLUSH} opacity={0.55} />
      <Eye x={33} y={48} r={3.1} />
      <Eye x={43.5} y={48.5} r={2.8} />
    </G>
  );
}

const LAMB_FLUFF = Array.from({ length: 11 }, (_, i) => {
  const a = (i / 11) * Math.PI * 2;
  return { x: 61 + Math.cos(a) * 15.5, y: 64 + Math.sin(a) * 8.5 };
});

function Lamb({ variant }: { variant: number }) {
  const s = SHEEP[variant % SHEEP.length];
  const woolDark = shade(s.wool, 0.12);
  return (
    <G>
      <Rect x={53} y={70} width={4.6} height={21} rx={2.3} fill={shade(s.leg, -0.12)} />
      <Rect x={70} y={70} width={4.6} height={21} rx={2.3} fill={shade(s.leg, -0.12)} />
      <Rect x={47} y={70} width={5} height={22} rx={2.5} fill={s.leg} />
      <Rect x={64} y={70} width={5} height={22} rx={2.5} fill={s.leg} />
      {LAMB_FLUFF.map((p, i) => (
        <Circle key={`d${i}`} cx={p.x} cy={p.y + 1.4} r={7.6} fill={woolDark} />
      ))}
      <Circle cx={80} cy={60} r={4} fill={woolDark} />
      <Ellipse cx={61} cy={64.5} rx={16} ry={9} fill={s.wool} />
      {LAMB_FLUFF.map((p, i) => (
        <Circle key={`w${i}`} cx={p.x} cy={p.y} r={7.2} fill={s.wool} />
      ))}
      <Circle cx={79.6} cy={59.2} r={3.6} fill={s.wool} />
      <Path d="M56 60 q2.5 -2.5 5 0 M65 64 q2.5 -2.5 5 0" stroke={woolDark} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      {/* head */}
      <Ellipse cx={22} cy={53} rx={6.5} ry={3} fill={s.face} transform="rotate(-18 22 53)" />
      <Ellipse cx={22.8} cy={53} rx={3.6} ry={1.3} fill="#E7A9A0" transform="rotate(-18 22.8 53)" />
      <Ellipse cx={46} cy={53} rx={6.5} ry={3} fill={s.face} transform="rotate(18 46 53)" />
      <Ellipse cx={45.2} cy={53} rx={3.6} ry={1.3} fill="#E7A9A0" transform="rotate(18 45.2 53)" />
      <Ellipse cx={34} cy={56} rx={10.5} ry={11.5} fill={s.face} />
      <Ellipse cx={34} cy={63} rx={6} ry={4.2} fill={shade(s.face, -0.14)} />
      <Path d="M32 62.4 Q34 64 36 62.4" stroke={shade(s.face, -0.45)} strokeWidth={1} fill="none" strokeLinecap="round" />
      <Circle cx={29.5} cy={45.5} r={4} fill={s.wool} />
      <Circle cx={34} cy={44} r={4.4} fill={s.wool} />
      <Circle cx={38.5} cy={45.5} r={4} fill={s.wool} />
      <Circle cx={29.4} cy={54.5} r={3.6} fill="#FFFFFF" />
      <Circle cx={38.6} cy={54.5} r={3.6} fill="#FFFFFF" />
      <Eye x={29.7} y={54.9} r={2.4} />
      <Eye x={38.9} y={54.9} r={2.4} />
      <Ellipse cx={26.5} cy={60} rx={2.2} ry={1.3} fill={BLUSH} opacity={0.5} />
      <Ellipse cx={41.5} cy={60} rx={2.2} ry={1.3} fill={BLUSH} opacity={0.5} />
    </G>
  );
}

function Kid({ variant }: { variant: number }) {
  const { body, patch } = GOATS[variant % GOATS.length];
  const line = shade(body, 0.2);
  const far = shade(body, 0.15);
  const hoof = '#4A4040';
  const horn = '#C9BDA6';
  return (
    <G>
      <Path d="M75 57 Q80 52 79 47.5" stroke={line} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M75 57 Q80 52 79 47.5" stroke={body} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Rect x={51} y={64} width={4.4} height={27} rx={2.2} fill={far} />
      <Rect x={70.5} y={64} width={4.4} height={27} rx={2.2} fill={far} />
      <Rect x={51} y={88} width={4.4} height={4} rx={1.4} fill={hoof} />
      <Rect x={70.5} y={88} width={4.4} height={4} rx={1.4} fill={hoof} />
      <Path
        d="M44 60 Q44 54 51 54 L70 54 Q77 54 77 61 L77 63 Q77 70 70 70 L51 70 Q44 70 44 64 Z"
        fill={body}
        stroke={line}
        strokeWidth={1.2}
      />
      <Path d="M44.8 64 Q45 69.2 51 69.2 L70 69.2 Q76.2 69.2 76.4 63 Q60 67.5 44.8 64 Z" fill={shade(body, 0.08)} />
      <Path d="M59 54.6 L70 54.6 Q74 55 75 57 Q71 62.5 65 62.5 Q58.5 61 59 54.6 Z" fill={patch} />
      <Rect x={46} y={65} width={5} height={27} rx={2.4} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={65.5} y={65} width={5} height={27} rx={2.4} fill={body} stroke={line} strokeWidth={1.2} />
      <Rect x={65.5} y={65} width={5} height={9} rx={2.4} fill={patch} />
      <Rect x={46} y={88} width={5} height={4} rx={1.4} fill={hoof} />
      <Rect x={65.5} y={88} width={5} height={4} rx={1.4} fill={hoof} />
      {/* neck + head */}
      <Path d="M44.6 63 L34 48 L42 43 L51 56 Z" fill={body} />
      <Circle cx={27.5} cy={31} r={2} fill={horn} />
      <Circle cx={36.5} cy={31} r={2} fill={shade(horn, 0.1)} />
      <Ellipse cx={16.5} cy={40} rx={7} ry={3} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(18 16.5 40)" />
      <Ellipse cx={47.5} cy={40} rx={7} ry={3} fill={body} stroke={line} strokeWidth={1.2} transform="rotate(-18 47.5 40)" />
      <Path d="M22 41 Q22 30 32 30 Q42 30 42 41 L40.5 48.5 Q39 55 32 55 Q25 55 23.5 48.5 Z" fill={body} stroke={line} strokeWidth={1.2} />
      <Path d="M30 30.5 Q32 29.6 34 30.5 L33 39 L31 39 Z" fill={patch} opacity={variant % 4 === 1 ? 0.6 : 1} />
      <Ellipse cx={32} cy={50} rx={6} ry={4.6} fill="#EBCFC2" />
      <Ellipse cx={30} cy={49.6} rx={1} ry={1.5} fill="#A9786B" />
      <Ellipse cx={34} cy={49.6} rx={1} ry={1.5} fill="#A9786B" />
      <Ellipse cx={24.8} cy={46} rx={2.2} ry={1.3} fill={BLUSH} opacity={0.5} />
      <Ellipse cx={39.2} cy={46} rx={2.2} ry={1.3} fill={BLUSH} opacity={0.5} />
      <Eye x={27.3} y={40.5} r={3} />
      <Eye x={36.7} y={40.5} r={3} />
    </G>
  );
}

/** The bare animal drawing as a `G` in a 100 x 100 box, for composing into scenes. */
export function AnimalBody({ species, variant = 0, young = false }: { species: SpeciesId; variant?: number; young?: boolean }) {
  const v = Math.abs(Math.floor(variant));
  switch (species) {
    case 'cow':
      return young ? <Calf variant={v} /> : <Cow variant={v} />;
    case 'chicken':
      return young ? <Chick variant={v} /> : <Hen variant={v} />;
    case 'sheep':
      return young ? <Lamb variant={v} /> : <Sheep variant={v} />;
    case 'goat':
      return young ? <Kid variant={v} /> : <Goat variant={v} />;
  }
}

export function AnimalArt({
  species,
  size = 96,
  variant = 0,
  young = false,
}: {
  species: SpeciesId;
  size?: number;
  variant?: number;
  /** Draw the baby (calf, chick, lamb, kid) instead of the adult. */
  young?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <AnimalBody species={species} variant={variant} young={young} />
    </Svg>
  );
}

export function FishArt({ species, size = 72, flip = false }: { species: FishSpeciesId; size?: number; flip?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform={flip ? 'translate(98 20) scale(-1 1)' : 'translate(2 20)'}>
        <FishShape species={species} />
      </G>
    </Svg>
  );
}
