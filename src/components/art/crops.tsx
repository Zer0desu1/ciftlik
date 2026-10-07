/**
 * One field plot: a mound of soil and the plant growing on it, seen slightly
 * from the side. Drawn in a 100 x 100 box; the plant stands at (50, 78).
 */
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CropId } from '@/game/data';

import { CornShape, LettuceShape, PumpkinShape, WheatEar } from './produce';

export type CropStage = 0 | 1 | 2 | 3 | 4;

type Leafs = { leaf: string; dark: string; light: string; stem: string };

const HEALTHY: Leafs = { leaf: '#5AA552', dark: '#3E8A57', light: '#7CC26B', stem: '#4A8F45' };
const THIRSTY: Leafs = { leaf: '#A3AE4C', dark: '#86913C', light: '#C1C66A', stem: '#8E9842' };

const BX = 50;
const BY = 78;

/** A pointed leaf whose base sits at (x, y), pointing `angle` degrees from straight up. */
function Leaf({
  x,
  y,
  angle,
  len,
  w,
  fill,
  vein,
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  w: number;
  fill: string;
  vein?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path
        d={`M0 0 C${w} ${-len * 0.25} ${w * 0.9} ${-len * 0.75} 0 ${-len} C${-w * 0.9} ${-len * 0.75} ${-w} ${-len * 0.25} 0 0 Z`}
        fill={fill}
      />
      {vein ? (
        <Path d={`M0 ${-len * 0.1} L0 ${-len * 0.8}`} stroke={vein} strokeWidth={0.9} strokeLinecap="round" opacity={0.6} />
      ) : null}
    </G>
  );
}

function Soil({ dry }: { dry: boolean }) {
  const base = dry ? '#B48E62' : '#6E4528';
  const top = dry ? '#CDAA7C' : '#8B5E3C';
  const fleck = dry ? '#BC9668' : '#7A4F30';
  return (
    <G>
      <Ellipse cx={50} cy={86} rx={42} ry={8} fill="#1C2A20" opacity={0.08} />
      <Ellipse cx={50} cy={81} rx={40} ry={12} fill={base} />
      <Ellipse cx={50} cy={78} rx={37} ry={9} fill={top} />
      <Ellipse cx={42} cy={75} rx={20} ry={3.5} fill="#FFFFFF" opacity={dry ? 0.18 : 0.08} />
      {[
        [24, 79], [33, 83], [70, 82], [77, 77], [62, 76], [38, 76], [56, 84],
      ].map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={2.2} ry={1.1} fill={fleck} />
      ))}
      {dry ? (
        <Path
          d="M22 80 L28 78 L31 81 L36 79 M64 81 L69 78 L74 80 M44 85 L49 83 L53 86"
          stroke="#8F6B43"
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </G>
  );
}

function Weeds() {
  const w = '#6E9A34';
  const wd = '#557A26';
  return (
    <G>
      <G transform="translate(19 81)">
        <Path d="M0 0 Q-3 -6 -6 -8 Q-2 -6 0 -2 Q0 -8 -1 -12 Q2 -7 1 -1 Q3 -6 6 -9 Q4 -4 1 1 Z" fill={w} />
        <Path d="M0 0 Q1 -5 0 -10" stroke={wd} strokeWidth={0.8} fill="none" />
      </G>
      <G transform="translate(82 82)">
        <Path d="M0 0 Q-4 -4 -7 -5 Q-3 -3 -1 -1 Q-2 -6 -1 -9 Q1 -5 0 -1 Q3 -4 6 -5 Q3 -2 1 1 Z" fill={w} />
        <Path d="M0 -1 L0.5 -12" stroke={wd} strokeWidth={0.9} />
        <Circle cx={0.5} cy={-13} r={2.4} fill="#F2C230" />
        <Circle cx={0.5} cy={-13} r={1} fill="#E0A21A" />
      </G>
    </G>
  );
}

function Sprout({ crop, c }: { crop: CropId; c: Leafs }) {
  if (crop === 'corn' || crop === 'wheat') {
    return (
      <G>
        <Path d={`M${BX} ${BY} Q${BX - 4} ${BY - 8} ${BX - 7} ${BY - 12}`} stroke={c.light} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <Path d={`M${BX} ${BY} Q${BX + 1} ${BY - 9} ${BX + 2} ${BY - 15}`} stroke={c.leaf} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Path d={`M${BX} ${BY} Q${BX + 5} ${BY - 6} ${BX + 8} ${BY - 9}`} stroke={c.light} strokeWidth={2} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  return (
    <G>
      <Path d={`M${BX} ${BY} Q${BX - 1} ${BY - 6} ${BX} ${BY - 10}`} stroke={c.stem} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Leaf x={BX} y={BY - 9} angle={-62} len={9} w={4} fill={c.light} />
      <Leaf x={BX} y={BY - 9} angle={58} len={10} w={4.4} fill={c.leaf} />
    </G>
  );
}

function SmallTomato({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={6.5} fill="#C7362B" />
      <Circle cx={x - 0.6} cy={y - 0.6} r={5.7} fill="#E5483A" />
      <Circle cx={x - 2.4} cy={y - 2.4} r={1.4} fill="#FFFFFF" opacity={0.45} />
      <Path d={`M${x - 3} ${y - 6} L${x} ${y - 4.5} L${x + 3} ${y - 6} L${x + 1} ${y - 7.5} L${x} ${y - 9} L${x - 1} ${y - 7.5} Z`} fill="#3E8A57" />
    </G>
  );
}

function TomatoPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  return (
    <G>
      <Rect x={59} y={20} width={3} height={60} rx={1.5} fill="#B08356" />
      <Path d="M58 34 Q55 36 52 35 M58 54 Q55 56 51 55" stroke="#D8C49A" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d={`M${BX} ${BY} Q${BX - 2} 52 ${BX} 24`} stroke={c.stem} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Leaf x={49.5} y={70} angle={-68} len={17} w={7} fill={c.dark} vein={c.light} />
      <Leaf x={49.5} y={66} angle={64} len={18} w={7} fill={c.leaf} vein={c.light} />
      <Leaf x={49} y={56} angle={-56} len={18} w={7.5} fill={c.leaf} vein={c.light} />
      <Leaf x={49} y={50} angle={52} len={17} w={7} fill={c.dark} vein={c.light} />
      <Leaf x={49} y={41} angle={-42} len={15} w={6.5} fill={c.dark} vein={c.light} />
      <Leaf x={49.5} y={36} angle={40} len={14} w={6} fill={c.leaf} vein={c.light} />
      <Leaf x={50} y={27} angle={-14} len={11} w={5} fill={c.light} />
      <Leaf x={50} y={27} angle={20} len={10} w={4.5} fill={c.leaf} />
      {ripe ? (
        <G>
          <SmallTomato x={38} y={58} />
          <SmallTomato x={62} y={46} />
          <SmallTomato x={43} y={42} />
          <SmallTomato x={60} y={66} />
          <SmallTomato x={52} y={60} />
        </G>
      ) : null}
    </G>
  );
}

function SmallPepper({ x, y, red, tilt }: { x: number; y: number; red: boolean; tilt: number }) {
  const [d, m, l] = red ? ['#B92E26', '#DC3D30', '#F06B5B'] : ['#3E7F2E', '#62AE45', '#8ACB6E'];
  return (
    <G transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <Path d="M-5 0 C-6 8 -3 15 0 18 C3 15 6 8 5 0 C3 -2 -3 -2 -5 0 Z" fill={d} />
      <Path d="M-4.4 0.5 C-5 8 -2.6 14 -0.4 16.5 C1.5 13 3.6 7 3.6 0.5 C2 -1.2 -2.6 -1.2 -4.4 0.5 Z" fill={m} />
      <Path d="M-2.6 2 C-3 6 -2 9 -1.4 11" stroke={l} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M0 -0.5 Q0 -4 2 -6" stroke="#3E8A57" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Ellipse cx={0} cy={-0.4} rx={4} ry={1.6} fill="#3E8A57" />
    </G>
  );
}

function PepperPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  return (
    <G>
      <Path d={`M${BX} ${BY} L${BX} 38 M${BX} 60 Q44 50 38 44 M${BX} 56 Q57 48 62 42`} stroke={c.stem} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Leaf x={50} y={72} angle={-72} len={16} w={6.5} fill={c.dark} vein={c.light} />
      <Leaf x={50} y={70} angle={70} len={16} w={6.5} fill={c.leaf} vein={c.light} />
      <Leaf x={38} y={44} angle={-50} len={15} w={6.5} fill={c.leaf} vein={c.light} />
      <Leaf x={38} y={44} angle={-8} len={13} w={6} fill={c.dark} vein={c.light} />
      <Leaf x={62} y={42} angle={46} len={15} w={6.5} fill={c.dark} vein={c.light} />
      <Leaf x={62} y={42} angle={6} len={13} w={6} fill={c.leaf} vein={c.light} />
      <Leaf x={50} y={39} angle={-18} len={14} w={6} fill={c.light} vein={c.leaf} />
      <Leaf x={50} y={39} angle={22} len={13} w={5.5} fill={c.leaf} vein={c.light} />
      <Leaf x={50} y={58} angle={-80} len={13} w={5.5} fill={c.leaf} />
      {ripe ? (
        <G>
          <SmallPepper x={40} y={50} red tilt={10} />
          <SmallPepper x={59} y={48} red={false} tilt={-12} />
          <SmallPepper x={50} y={58} red tilt={4} />
        </G>
      ) : null}
    </G>
  );
}

function SmallStrawberry({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M0 9 C-5 7 -7 1 -5.5 -2 C-4 -4.5 4 -4.5 5.5 -2 C7 1 5 7 0 9 Z" fill="#E5434A" />
      <Path d="M1 8.6 C4.5 6.5 6.4 1 5.5 -2 C6.6 1 5 7 0 9 Z" fill="#C92F35" />
      <Circle cx={-2} cy={0} r={0.6} fill="#F8DA7A" />
      <Circle cx={1.5} cy={-0.5} r={0.6} fill="#F8DA7A" />
      <Circle cx={-0.5} cy={3} r={0.6} fill="#F8DA7A" />
      <Circle cx={2.5} cy={3} r={0.6} fill="#F8DA7A" />
      <Circle cx={0.5} cy={6} r={0.6} fill="#F8DA7A" />
      <Path d="M-4 -3 L0 -1.5 L4 -3 L1.5 -4.5 L0 -6 L-1.5 -4.5 Z" fill="#3E8A57" />
    </G>
  );
}

function Trefoil({ x, y, angle, len, c, tone }: { x: number; y: number; angle: number; len: number; c: Leafs; tone: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d={`M0 0 L0 ${-len}`} stroke={c.stem} strokeWidth={1.6} strokeLinecap="round" />
      <Ellipse cx={-5} cy={-len - 2} rx={4.4} ry={5.6} fill={tone} transform={`rotate(-40 -5 ${-len - 2})`} />
      <Ellipse cx={5} cy={-len - 2} rx={4.4} ry={5.6} fill={tone} transform={`rotate(40 5 ${-len - 2})`} />
      <Ellipse cx={0} cy={-len - 6} rx={4.6} ry={6} fill={tone} />
      <Path d={`M0 ${-len - 1} L0 ${-len - 9} M-1 ${-len - 1} L-7 ${-len - 5} M1 ${-len - 1} L7 ${-len - 5}`} stroke={c.light} strokeWidth={0.8} opacity={0.7} />
    </G>
  );
}

function StrawberryPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  return (
    <G>
      <Trefoil x={50} y={78} angle={-62} len={16} c={c} tone={c.dark} />
      <Trefoil x={50} y={78} angle={60} len={17} c={c} tone={c.dark} />
      <Trefoil x={50} y={78} angle={-28} len={20} c={c} tone={c.leaf} />
      <Trefoil x={50} y={78} angle={26} len={21} c={c} tone={c.leaf} />
      <Trefoil x={50} y={78} angle={0} len={24} c={c} tone={c.light} />
      {ripe ? (
        <G>
          <Path d="M50 74 Q40 66 33 68 M50 74 Q62 64 68 66 M50 74 Q50 70 51 69" stroke={c.stem} strokeWidth={1.2} fill="none" />
          <SmallStrawberry x={32} y={72} />
          <SmallStrawberry x={68} y={70} />
          <SmallStrawberry x={51} y={73} />
        </G>
      ) : (
        <G>
          <Circle cx={36} cy={66} r={3} fill="#FFFFFF" />
          <Circle cx={36} cy={66} r={1.2} fill="#F2C230" />
        </G>
      )}
    </G>
  );
}

function PumpkinLeaf({ x, y, r, fill, vein }: { x: number; y: number; r: number; fill: string; vein: string }) {
  return (
    <G>
      <Path
        d={`M${x} ${y + r * 0.9} C${x - r * 1.2} ${y + r * 0.6} ${x - r * 1.2} ${y - r * 0.6} ${x - r * 0.45} ${y - r * 0.7} C${x - r * 0.3} ${y - r * 1.1} ${x + r * 0.3} ${y - r * 1.1} ${x + r * 0.45} ${y - r * 0.7} C${x + r * 1.2} ${y - r * 0.6} ${x + r * 1.2} ${y + r * 0.6} ${x} ${y + r * 0.9} Z`}
        fill={fill}
      />
      <Path
        d={`M${x} ${y + r * 0.8} L${x} ${y - r * 0.7} M${x} ${y + r * 0.6} L${x - r * 0.75} ${y - r * 0.15} M${x} ${y + r * 0.6} L${x + r * 0.75} ${y - r * 0.15}`}
        stroke={vein}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.6}
      />
    </G>
  );
}

function PumpkinPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  return (
    <G>
      <Path d="M50 78 Q36 74 26 68 M50 78 Q66 72 74 64 M50 78 Q50 60 50 50" stroke={c.stem} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M74 64 Q82 60 80 55 Q78 52 76 55" stroke={c.stem} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <PumpkinLeaf x={28} y={62} r={14} fill={c.dark} vein={c.light} />
      <PumpkinLeaf x={72} y={58} r={15} fill={c.leaf} vein={c.light} />
      <PumpkinLeaf x={50} y={46} r={15} fill={c.light} vein={c.dark} />
      {ripe ? (
        <G transform="translate(28 46) scale(0.75)">
          <PumpkinShape />
        </G>
      ) : (
        <G>
          <Circle cx={60} cy={72} r={4} fill="#F2C230" />
          <Circle cx={60} cy={72} r={1.6} fill="#E08A1A" />
        </G>
      )}
    </G>
  );
}

function CornLeaf({ y, side, len, fill }: { y: number; side: 1 | -1; len: number; fill: string }) {
  return (
    <G transform={`translate(${BX} ${y}) scale(${side} 1)`}>
      <Path d={`M0 0 C${len * 0.4} ${-len * 0.4} ${len * 0.85} ${-len * 0.3} ${len} ${len * 0.1} C${len * 0.75} ${-len * 0.12} ${len * 0.4} ${-len * 0.12} 0 4 Z`} fill={fill} />
    </G>
  );
}

function CornPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  return (
    <G>
      <Path d={`M${BX} ${BY} L${BX} 16`} stroke={c.stem} strokeWidth={4} strokeLinecap="round" />
      <CornLeaf y={70} side={-1} len={30} fill={c.dark} />
      <CornLeaf y={64} side={1} len={32} fill={c.leaf} />
      <CornLeaf y={52} side={-1} len={30} fill={c.leaf} />
      <CornLeaf y={44} side={1} len={28} fill={c.dark} />
      <CornLeaf y={34} side={-1} len={24} fill={c.light} />
      <CornLeaf y={27} side={1} len={20} fill={c.leaf} />
      <G stroke={ripe ? '#C9962A' : c.light} strokeWidth={1.4} strokeLinecap="round">
        <Path d="M50 18 L50 6 M50 16 L44 8 M50 16 L56 8 M50 19 L42 14 M50 19 L58 14" />
      </G>
      {ripe ? (
        <G>
          <G transform="translate(41 36) rotate(-24) scale(0.34) translate(-32 -36)">
            <CornShape />
          </G>
          <G transform="translate(59 50) rotate(26) scale(0.34) translate(-32 -36)">
            <CornShape />
          </G>
        </G>
      ) : null}
    </G>
  );
}

function WheatPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  const stalk = ripe ? '#D6A63A' : c.leaf;
  const blade = ripe ? '#C9A04A' : c.dark;
  return (
    <G>
      {[-40, -26, -12, 4, 18, 32, 44].map((a, i) => (
        <Path
          key={`b${i}`}
          d={`M${BX} ${BY} q${a * 0.2} -10 ${a * 0.55} -${18 + (i % 3) * 4}`}
          stroke={blade}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {[-26, -13, 0, 13, 26].map((a, i) => {
        const r = (a * Math.PI) / 180;
        const len = 44 - Math.abs(a) * 0.4 + (i % 2) * 3;
        const tx = BX + Math.sin(r) * len;
        const ty = BY - Math.cos(r) * len;
        return (
          <G key={`s${i}`}>
            <Path d={`M${BX} ${BY} L${tx} ${ty}`} stroke={stalk} strokeWidth={1.6} strokeLinecap="round" />
            <G transform={`translate(${tx} ${ty}) scale(0.8) translate(${-tx} ${-ty})`}>
              <WheatEar x={tx} y={ty} angle={a} len={0} tone={ripe ? 'gold' : 'green'} />
            </G>
          </G>
        );
      })}
    </G>
  );
}

function CarrotPlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  const fronds = [-46, -24, -6, 12, 30, 50];
  return (
    <G>
      {fronds.map((a, i) => {
        const len = 30 - Math.abs(a) * 0.15;
        const fill = i % 2 ? c.leaf : c.dark;
        return (
          <G key={i} transform={`translate(${BX} ${BY - 1}) rotate(${a})`}>
            <Path d={`M0 0 L0 ${-len}`} stroke={c.stem} strokeWidth={1.4} strokeLinecap="round" />
            {[0.35, 0.55, 0.75].map((t, j) => (
              <G key={j}>
                <Ellipse cx={-3.4} cy={-len * t} rx={3.6} ry={1.8} fill={fill} transform={`rotate(-30 -3.4 ${-len * t})`} />
                <Ellipse cx={3.4} cy={-len * t} rx={3.6} ry={1.8} fill={fill} transform={`rotate(30 3.4 ${-len * t})`} />
              </G>
            ))}
            <Ellipse cx={0} cy={-len - 1.5} rx={2} ry={3.6} fill={c.light} />
          </G>
        );
      })}
      {ripe ? (
        <G>
          <Path d="M43 78 Q44 72 50 72 Q56 72 57 78 Q50 81 43 78 Z" fill="#E86F1C" />
          <Path d="M50 72 Q56 72 57 78 Q53 80 50 80 Z" fill="#D45E12" />
          <Path d="M46 75 L48 75 M52 76 L54 76" stroke="#B9500F" strokeWidth={0.9} strokeLinecap="round" />
          <Path d="M30 80 Q31 76 35 76 Q39 76 40 80 Q35 82 30 80 Z" fill="#E86F1C" />
          <Path d="M61 80 Q62 76 66 76 Q70 76 71 80 Q66 82 61 80 Z" fill="#D45E12" />
          <Path d="M35 76 L33 70 M35 76 L37 70 M66 76 L64 70 M66 76 L68 71" stroke={c.dark} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      ) : null}
    </G>
  );
}

function LettucePlant({ c, ripe }: { c: Leafs; ripe: boolean }) {
  if (ripe) {
    return (
      <G transform="translate(23 40) scale(0.85)">
        <LettuceShape />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={30} cy={70} rx={11} ry={7} fill={c.dark} transform="rotate(-25 30 70)" />
      <Ellipse cx={70} cy={70} rx={11} ry={7} fill={c.dark} transform="rotate(25 70 70)" />
      <Ellipse cx={36} cy={60} rx={10} ry={8} fill={c.leaf} transform="rotate(-40 36 60)" />
      <Ellipse cx={64} cy={60} rx={10} ry={8} fill={c.leaf} transform="rotate(40 64 60)" />
      <Ellipse cx={50} cy={56} rx={10} ry={12} fill={c.light} />
      <Ellipse cx={50} cy={70} rx={12} ry={8} fill={c.leaf} />
      <Path d="M50 76 L50 48 M36 66 L41 58 M64 66 L59 58" stroke="#E4F4D4" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
    </G>
  );
}

function Plant({ crop, ripe, c }: { crop: CropId; ripe: boolean; c: Leafs }) {
  switch (crop) {
    case 'tomato':
      return <TomatoPlant c={c} ripe={ripe} />;
    case 'pepper':
      return <PepperPlant c={c} ripe={ripe} />;
    case 'strawberry':
      return <StrawberryPlant c={c} ripe={ripe} />;
    case 'pumpkin':
      return <PumpkinPlant c={c} ripe={ripe} />;
    case 'corn':
      return <CornPlant c={c} ripe={ripe} />;
    case 'wheat':
      return <WheatPlant c={c} ripe={ripe} />;
    case 'carrot':
      return <CarrotPlant c={c} ripe={ripe} />;
    case 'lettuce':
      return <LettucePlant c={c} ripe={ripe} />;
  }
}

export function CropArt({
  crop,
  stage,
  size = 72,
  dry = false,
  weeds = false,
}: {
  crop: CropId;
  stage: CropStage;
  size?: number;
  dry?: boolean;
  weeds?: boolean;
}) {
  const c = dry ? THIRSTY : HEALTHY;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Soil dry={dry} />
      {stage === 0 ? (
        <G>
          <Ellipse cx={BX} cy={BY} rx={7} ry={2.8} fill={dry ? '#8F6B43' : '#4A2E1A'} />
          <Ellipse cx={BX - 1} cy={BY - 0.6} rx={1.8} ry={1.2} fill="#E8D3A3" />
          <Ellipse cx={BX + 2.4} cy={BY + 0.2} rx={1.6} ry={1.1} fill="#D9BF8A" />
        </G>
      ) : null}
      {stage === 1 ? <Sprout crop={crop} c={c} /> : null}
      {stage === 2 ? (
        <G transform={`translate(${BX} ${BY}) scale(0.6) translate(${-BX} ${-BY})`}>
          <Plant crop={crop} ripe={false} c={c} />
        </G>
      ) : null}
      {stage >= 3 ? <Plant crop={crop} ripe={stage === 4} c={c} /> : null}
      {weeds ? <Weeds /> : null}
    </Svg>
  );
}
