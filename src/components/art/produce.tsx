/**
 * Produce drawings shared by the item icons, the seed packets and the ripe
 * crops. Each one is a bare `G` drawn in a 64 x 64 box (centred around
 * 32, 36) so callers can place and scale it with a transform.
 */
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CropId, FishSpeciesId } from '@/game/data';

const LEAF = '#5AA552';
const LEAF_DARK = '#3E8A57';
const LEAF_LIGHT = '#7CC26B';

export function TomatoShape() {
  return (
    <G>
      <Ellipse cx={32} cy={38} rx={21} ry={19} fill="#C7362B" />
      <Ellipse cx={30.5} cy={36.5} rx={19} ry={17} fill="#E5483A" />
      <Ellipse cx={22} cy={30} rx={5.5} ry={3.2} fill="#FFFFFF" opacity={0.35} transform="rotate(-35 22 30)" />
      <G transform="translate(32 21)">
        <Ellipse cx={6} cy={1} rx={6.5} ry={2.4} fill={LEAF_DARK} transform="rotate(15)" />
        <Ellipse cx={5} cy={3} rx={5.5} ry={2.2} fill={LEAF} transform="rotate(65)" />
        <Ellipse cx={5} cy={-3} rx={5.5} ry={2.2} fill={LEAF} transform="rotate(115)" />
        <Ellipse cx={6} cy={-1} rx={6.5} ry={2.4} fill={LEAF_DARK} transform="rotate(165)" />
        <Circle cx={0} cy={0} r={2.6} fill={LEAF_DARK} />
      </G>
      <Path d="M32 21 Q32 15 36 13" stroke={LEAF_DARK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    </G>
  );
}

function cornKernels(cx: number, cy: number, rx: number, ry: number) {
  const out: { x: number; y: number }[] = [];
  for (let y = cy - ry + 4; y <= cy + ry - 3; y += 4.4) {
    for (let x = cx - rx + 2.5; x <= cx + rx - 2; x += 4.2) {
      const nx = (x - cx) / (rx - 1.5);
      const ny = (y - cy) / (ry - 1.5);
      if (nx * nx + ny * ny <= 1) out.push({ x, y });
    }
  }
  return out;
}

export function CornShape() {
  const kernels = cornKernels(32, 30, 10.5, 21);
  return (
    <G transform="rotate(18 32 36)">
      <Ellipse cx={32} cy={30} rx={10.5} ry={21} fill="#E2A922" />
      <Ellipse cx={31} cy={29} rx={9} ry={19.5} fill="#F2C230" />
      {kernels.map((k, i) => (
        <Ellipse key={i} cx={k.x} cy={k.y} rx={1.8} ry={1.7} fill={k.x > 33 ? '#E8B52A' : '#F9D75E'} />
      ))}
      <Path d="M32 60 C18 54 15 38 20 24 C23 36 27 46 34 53 Z" fill={LEAF} />
      <Path d="M32 60 C19 52 18 42 20 24 C22 40 26 49 33 55 Z" fill={LEAF_LIGHT} />
      <Path d="M32 60 C46 54 49 38 44 24 C41 36 37 46 30 53 Z" fill={LEAF_DARK} />
      <Path d="M31 58 C32 61 33 63 34 64" stroke={LEAF_DARK} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function CarrotShape() {
  return (
    <G transform="rotate(28 32 38)">
      <G transform="translate(32 21)">
        <Path d="M0 0 C-2 -8 -9 -12 -12 -18 C-6 -16 -2 -9 0 0 Z" fill={LEAF} />
        <Path d="M0 0 C-1 -9 0 -15 1 -21 C4 -14 3 -7 0 0 Z" fill={LEAF_LIGHT} />
        <Path d="M0 0 C3 -7 9 -11 12 -16 C10 -9 5 -4 0 0 Z" fill={LEAF_DARK} />
      </G>
      <Path d="M23 23 Q32 18 41 23 Q43 27 41 33 L34 57 Q32 60.5 30 57 L23 33 Q21 27 23 23 Z" fill="#E86F1C" />
      <Path d="M32 20.5 Q37 21 41 23 Q43 27 41 33 L34 57 Q33 59 32 59.5 Z" fill="#D45E12" />
      <Path d="M24.5 27 Q26 26 28 27 M30 34 Q32 33 34 34 M26 40 Q27.5 39.5 29 40 M34 45 Q35 44.5 36 45 M30 50 Q31 49.5 32 50" stroke="#B9500F" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <Ellipse cx={27} cy={28} rx={1.8} ry={5} fill="#FFFFFF" opacity={0.3} />
    </G>
  );
}

export function LettuceShape() {
  return (
    <G>
      <Ellipse cx={32} cy={46} rx={24} ry={12} fill="#3F8A3B" />
      <Circle cx={13} cy={42} r={9} fill="#5DAA4E" />
      <Circle cx={51} cy={42} r={9} fill="#4F9C45" />
      <Circle cx={20} cy={30} r={10} fill="#6DB85C" />
      <Circle cx={44} cy={30} r={10} fill="#5DAA4E" />
      <Circle cx={32} cy={24} r={10} fill="#6DB85C" />
      <Circle cx={32} cy={48} r={11} fill="#5DAA4E" />
      <Circle cx={23} cy={40} r={10} fill="#86C76A" />
      <Circle cx={41} cy={40} r={10} fill="#7DBF62" />
      <Circle cx={32} cy={33} r={10} fill="#8FCF72" />
      <Circle cx={32} cy={40} r={8} fill="#B9E29A" />
      <Circle cx={30} cy={38} r={5} fill="#CDEBB0" />
      <Path d="M32 48 Q31 41 33 35 M23 46 Q20 40 21 34 M41 46 Q44 40 43 34" stroke="#E4F4D4" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.7} />
    </G>
  );
}

export function WheatEar({
  x,
  y,
  angle,
  len,
  tone = 'gold',
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  tone?: 'gold' | 'green';
}) {
  const grains = [0, 1, 2, 3, 4];
  const [stem, dark, light] =
    tone === 'gold' ? ['#C9962A', '#D9A535', '#EDC155'] : ['#5E9A43', '#6FAE4E', '#97CC6E'];
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d={`M0 0 L0 ${len}`} stroke={stem} strokeWidth={1.6} strokeLinecap="round" />
      {grains.map((i) => (
        <G key={i}>
          <Ellipse cx={-2.2} cy={-i * 3.3} rx={1.9} ry={3.3} fill={dark} transform={`rotate(-28 -2.2 ${-i * 3.3})`} />
          <Ellipse cx={2.2} cy={-i * 3.3} rx={1.9} ry={3.3} fill={light} transform={`rotate(28 2.2 ${-i * 3.3})`} />
        </G>
      ))}
      <Ellipse cx={0} cy={-16.5} rx={1.7} ry={3} fill={light} />
      <Path d="M-3 -10 L-6 -19 M3 -10 L6 -19 M0 -18 L0 -25" stroke={dark} strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
}

export function WheatShape() {
  return (
    <G>
      <Path d="M32 44 L22 60 M32 44 L28 61 M32 44 L36 61 M32 44 L42 60" stroke="#C9962A" strokeWidth={2} strokeLinecap="round" />
      {[-30, -15, 0, 15, 30].map((a) => {
        const r = (a * Math.PI) / 180;
        const len = a === 0 ? 22 : Math.abs(a) === 15 ? 21 : 18;
        return <WheatEar key={a} x={32 + Math.sin(r) * len} y={44 - Math.cos(r) * len} angle={a} len={len} />;
      })}
      <Rect x={25} y={41} width={14} height={6} rx={2} fill="#B5594B" />
      <Rect x={25} y={41} width={14} height={2.4} rx={1.2} fill="#CF7465" />
    </G>
  );
}

const STRAW_SEEDS = [
  [25, 31], [32, 30], [39, 31], [22, 38], [29, 37], [36, 37], [43, 38],
  [26, 44], [33, 44], [40, 44], [29, 50], [36, 50], [32, 55],
];

export function StrawberryShape() {
  return (
    <G>
      <Path d="M32 60 C19 54 13 37 17 28 C21 20 43 20 47 28 C51 37 45 54 32 60 Z" fill="#C92F35" />
      <Path d="M31 58 C19 52 14 37 18 29 C22 22 41 22 44 29 C47 37 42 52 31 58 Z" fill="#E5434A" />
      <Ellipse cx={23} cy={33} rx={3} ry={6} fill="#FFFFFF" opacity={0.25} transform="rotate(20 23 33)" />
      {STRAW_SEEDS.map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={1} ry={1.5} fill="#F8DA7A" />
      ))}
      <G transform="translate(32 24)">
        <Ellipse cx={-7} cy={0} rx={7} ry={3} fill={LEAF_DARK} transform="rotate(15)" />
        <Ellipse cx={7} cy={0} rx={7} ry={3} fill={LEAF_DARK} transform="rotate(-15)" />
        <Ellipse cx={-4} cy={-1} rx={6} ry={2.8} fill={LEAF} transform="rotate(-25)" />
        <Ellipse cx={4} cy={-1} rx={6} ry={2.8} fill={LEAF} transform="rotate(25)" />
        <Ellipse cx={0} cy={0} rx={2.8} ry={5} fill={LEAF_LIGHT} />
      </G>
      <Path d="M32 21 Q31 15 34 11" stroke={LEAF_DARK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function PepperShape({ color = 'red' }: { color?: 'red' | 'green' | 'yellow' }) {
  const tones = {
    red: ['#B92E26', '#DC3D30', '#F06B5B'],
    green: ['#3E7F2E', '#56A23F', '#7CC26B'],
    yellow: ['#D59A12', '#F0BC2A', '#F8D766'],
  }[color];
  return (
    <G>
      <Path d="M16 28 C14 46 21 60 32 60 C43 60 50 46 48 28 C46 21 37 21 32 25 C27 21 18 21 16 28 Z" fill={tones[0]} />
      <Path d="M17 29 C16 45 22 57 31 57 C40 57 46 45 45 29 C43 23 36 23 32 27 C28 23 19 23 17 29 Z" fill={tones[1]} />
      <Path d="M32 28 C29 38 29 50 31 57" stroke={tones[0]} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Ellipse cx={23} cy={36} rx={2.6} ry={8} fill={tones[2]} opacity={0.7} transform="rotate(8 23 36)" />
      <Ellipse cx={32} cy={25} rx={8} ry={3.4} fill={LEAF_DARK} />
      <Path d="M32 24 Q32 16 37 13" stroke={LEAF_DARK} strokeWidth={3.4} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function PumpkinShape() {
  return (
    <G>
      <Path d="M33 23 Q33 15 39 12" stroke="#6E4528" strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <Path d="M36 20 C44 12 54 16 54 22 C47 25 41 24 36 20 Z" fill={LEAF} />
      <Ellipse cx={20} cy={40} rx={14} ry={17} fill="#D96F17" />
      <Ellipse cx={44} cy={40} rx={14} ry={17} fill="#C9620F" />
      <Ellipse cx={26} cy={40} rx={11} ry={18} fill="#EE8A26" />
      <Ellipse cx={38} cy={40} rx={11} ry={18} fill="#E07B1F" />
      <Ellipse cx={32} cy={40} rx={9} ry={18.5} fill="#F59A33" />
      <Ellipse cx={30} cy={32} rx={2.4} ry={8} fill="#FFFFFF" opacity={0.25} />
      <Ellipse cx={32} cy={23} rx={5} ry={2} fill="#B5570C" />
    </G>
  );
}

export function ProduceShape({ crop }: { crop: CropId }) {
  switch (crop) {
    case 'tomato':
      return <TomatoShape />;
    case 'corn':
      return <CornShape />;
    case 'carrot':
      return <CarrotShape />;
    case 'lettuce':
      return <LettuceShape />;
    case 'wheat':
      return <WheatShape />;
    case 'strawberry':
      return <StrawberryShape />;
    case 'pepper':
      return <PepperShape />;
    case 'pumpkin':
      return <PumpkinShape />;
  }
}

/* ------------------------------------------------------------------ fish */

const FISH_LOOK: Record<
  FishSpeciesId,
  { back: string; body: string; belly: string; fin: string; finDark: string }
> = {
  carp: { back: '#7F7230', body: '#B9A04A', belly: '#EBD887', fin: '#C08A3A', finDark: '#9C6C28' },
  trout: { back: '#6F8580', body: '#C3CDD0', belly: '#F1F3F2', fin: '#9FAFAE', finDark: '#7E8F8D' },
  catfish: { back: '#4E5A61', body: '#7D8A92', belly: '#C9D0D3', fin: '#65727A', finDark: '#4E5A61' },
};

/** A side-view fish facing left, drawn in a 100 x 60 box. */
export function FishShape({ species }: { species: FishSpeciesId }) {
  const c = FISH_LOOK[species];
  if (species === 'catfish') {
    return (
      <G>
        <Path d="M78 30 L95 17 C93 26 93 34 95 44 Z" fill={c.fin} />
        <Path d="M38 19 C44 10 54 11 58 19 Z" fill={c.finDark} />
        <Path d="M44 41 C54 50 72 48 82 36 L60 40 Z" fill={c.finDark} />
        <Path d="M8 32 C8 20 22 16 40 17 C58 18 74 22 82 30 C74 38 58 42 40 42 C22 42 8 40 8 32 Z" fill={c.body} />
        <Path d="M8 32 C8 22 22 17 40 17 C58 18 74 22 82 30 C66 26 50 24 36 24 C22 24 12 27 8 32 Z" fill={c.back} />
        <Path d="M9 34 C14 41 26 42 40 42 C56 42 70 38 80 32 C64 36 50 37 36 37 C22 37 14 36 9 34 Z" fill={c.belly} />
        <Path d="M30 33 C34 40 40 41 42 37 Z" fill={c.fin} />
        <Circle cx={19} cy={27} r={2.6} fill="#FFFFFF" />
        <Circle cx={18.6} cy={27.2} r={1.6} fill="#1C2A20" />
        <Path d="M8 33 Q13 35 17 33" stroke="#3A4449" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <Path d="M10 31 C4 32 0 37 -2 43 M11 33 C7 36 5 41 5 46 M12 28 C6 25 2 21 0 16" stroke="#3A4449" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  const trout = species === 'trout';
  return (
    <G>
      <Path d="M74 30 L94 14 C90 25 90 35 94 46 Z" fill={c.fin} />
      <Path d="M76 30 L90 20 C88 27 88 33 90 40 Z" fill={c.finDark} opacity={0.5} />
      <Path d={trout ? 'M40 15 C46 6 58 8 62 17 Z' : 'M36 17 C42 7 58 7 64 18 Z'} fill={c.finDark} />
      <Path d="M52 43 C56 51 64 51 66 41 Z" fill={c.finDark} />
      <Path d="M12 30 C20 15 46 10 64 17 C70 20 74 25 78 30 C74 35 70 40 64 43 C46 50 20 45 12 30 Z" fill={c.body} />
      <Path d="M12 30 C20 15 46 10 64 17 C70 20 74 25 78 30 C66 23 50 21 36 22 C24 23 16 26 12 30 Z" fill={c.back} />
      <Path d="M13 32 C22 44 46 49 64 43 C70 40 74 35 77 31 C64 38 46 40 32 39 C22 38 16 35 13 32 Z" fill={c.belly} />
      {trout ? (
        <G>
          <Path d="M20 31 C34 28 54 28 76 30 C56 34 36 35 20 31 Z" fill="#E59AA0" opacity={0.85} />
          {[
            [36, 21], [44, 19], [52, 20], [60, 21], [40, 25], [48, 24], [56, 25], [66, 26], [68, 33], [60, 36],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={1.2} fill="#3F4B48" />
          ))}
        </G>
      ) : (
        <G>
          {[
            [36, 24], [44, 22], [52, 23], [60, 25], [40, 31], [48, 30], [56, 31], [64, 31], [44, 37], [52, 37], [60, 37],
          ].map(([x, y], i) => (
            <Path key={i} d={`M${x} ${y - 3} Q${x + 3.6} ${y} ${x} ${y + 3}`} stroke={c.back} strokeWidth={1} fill="none" opacity={0.55} />
          ))}
        </G>
      )}
      <Path d="M28 22 C24 28 24 34 28 39" stroke={c.back} strokeWidth={1.3} fill="none" opacity={0.6} strokeLinecap="round" />
      <Path d="M34 33 C40 40 46 40 46 35 Z" fill={c.fin} />
      <Circle cx={20} cy={27} r={3.2} fill="#FFFFFF" />
      <Circle cx={19.4} cy={27.3} r={2} fill="#1C2A20" />
      <Circle cx={18.8} cy={26.5} r={0.7} fill="#FFFFFF" />
      <Path d="M12 31 Q15 33 18 32" stroke={c.back} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      {!trout && <Path d="M13 32 C10 35 9 38 10 41" stroke={c.finDark} strokeWidth={1} fill="none" strokeLinecap="round" />}
    </G>
  );
}
