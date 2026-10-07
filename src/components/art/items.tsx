/**
 * Inventory and market icons: one flat illustration per ItemId, plus the
 * gold coin. Everything is drawn in a 64 x 64 box.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CropId, ItemId } from '@/game/data';

import { FishShape, ProduceShape } from './produce';
import { shade } from './shared';

type IconProps = { size?: number };

const PACKET: Record<CropId, string> = {
  tomato: '#E06B55',
  corn: '#E5B23A',
  carrot: '#EE9445',
  lettuce: '#7DBE62',
  wheat: '#C9A25A',
  strawberry: '#E57C98',
  pepper: '#4FA38A',
  pumpkin: '#D98A3E',
};

function GroundShadow({ w = 22, y = 59 }: { w?: number; y?: number }) {
  return <Ellipse cx={32} cy={y} rx={w} ry={3} fill="#1C2A20" opacity={0.08} />;
}

function SeedPacket({ crop }: { crop: CropId }) {
  const c = PACKET[crop];
  const dark = shade(c, 0.18);
  return (
    <G>
      <GroundShadow w={18} y={60} />
      <Path d="M13 12 L51 12 L51 55 Q51 58 48 58 L16 58 Q13 58 13 55 Z" fill={c} />
      <Path d="M40 12 L51 12 L51 55 Q51 58 48 58 L40 58 Z" fill={dark} opacity={0.35} />
      <Path
        d="M13 7 L16.8 10 L20.6 7 L24.4 10 L28.2 7 L32 10 L35.8 7 L39.6 10 L43.4 7 L47.2 10 L51 7 L51 14 L13 14 Z"
        fill={shade(c, -0.35)}
      />
      <Rect x={17} y={18} width={30} height={27} rx={6} fill="#FFFFFF" />
      <G transform="translate(17.5 16.5) scale(0.45)">
        <ProduceShape crop={crop} />
      </G>
      <Rect x={18} y={48.5} width={20} height={2.6} rx={1.3} fill="#FFFFFF" opacity={0.75} />
      <Rect x={18} y={53} width={13} height={2.2} rx={1.1} fill="#FFFFFF" opacity={0.5} />
      <Ellipse cx={42} cy={51.5} rx={1.6} ry={2.2} fill={shade(c, 0.4)} transform="rotate(30 42 51.5)" />
      <Ellipse cx={46} cy={53} rx={1.6} ry={2.2} fill={shade(c, 0.4)} transform="rotate(-20 46 53)" />
    </G>
  );
}

function Milk() {
  return (
    <G>
      <GroundShadow w={16} />
      <Path d="M25 12 L39 12 L39 19 Q39 22 42 25 Q47 30 47 37 L47 54 Q47 59 42 59 L22 59 Q17 59 17 54 L17 37 Q17 30 22 25 Q25 22 25 19 Z" fill="#FFFFFF" />
      <Path d="M36 12 L39 12 L39 19 Q39 22 42 25 Q47 30 47 37 L47 54 Q47 59 42 59 L36 59 Q41 56 41 50 L41 37 Q41 29 36 24 Z" fill="#E3ECF2" />
      <Path d="M25 12 L39 12 L39 19 Q39 22 42 25 Q47 30 47 37 L47 54 Q47 59 42 59 L22 59 Q17 59 17 54 L17 37 Q17 30 22 25 Q25 22 25 19 Z" fill="none" stroke="#C9D6E0" strokeWidth={1.4} />
      <Rect x={23.5} y={6} width={17} height={8} rx={3} fill="#3C7FB5" />
      <Rect x={23.5} y={6} width={17} height={3} rx={1.5} fill="#5C9BCB" />
      <Rect x={17} y={38} width={30} height={13} fill="#DDEBF6" />
      <Path d="M32 39.5 C35 43.5 36.5 45.5 36.5 47 A4.5 4.5 0 0 1 27.5 47 C27.5 45.5 29 43.5 32 39.5 Z" fill="#3C7FB5" />
      <Circle cx={30.5} cy={46.5} r={1.1} fill="#FFFFFF" opacity={0.8} />
      <Rect x={20.5} y={30} width={3} height={22} rx={1.5} fill="#FFFFFF" opacity={0.9} />
    </G>
  );
}

function Eggs() {
  return (
    <G>
      <GroundShadow w={24} />
      <Ellipse cx={20} cy={30} rx={9.5} ry={12} fill="#E3C9A2" transform="rotate(-16 20 30)" />
      <Ellipse cx={18.5} cy={27} rx={2} ry={3.5} fill="#F3E3CA" transform="rotate(-16 18.5 27)" />
      <Ellipse cx={44} cy={29} rx={9.5} ry={12} fill="#EED9BA" transform="rotate(16 44 29)" />
      <Ellipse cx={41} cy={25} rx={2} ry={3.5} fill="#FAEEDC" transform="rotate(16 41 25)" />
      <Ellipse cx={32} cy={25} rx={10} ry={13} fill="#E9DFD0" />
      <Ellipse cx={31} cy={24} rx={8.8} ry={11.8} fill="#FFFCF6" />
      <Ellipse cx={28} cy={19} rx={2.3} ry={4} fill="#FFFFFF" />
      <Path d="M8 38 L56 38 L52 55 Q51 59 47 59 L17 59 Q13 59 12 55 Z" fill="#B9874F" />
      <Path d="M8 38 L56 38 L55 42 L9 42 Z" fill="#D2A266" />
      <Path d="M12 47 L52 47 M14 53 L50 53" stroke="#9A6B3A" strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M20 42 L21 59 M32 42 L32 59 M44 42 L43 59" stroke="#9A6B3A" strokeWidth={1.2} opacity={0.6} />
    </G>
  );
}

function Wool() {
  return (
    <G>
      <GroundShadow w={20} />
      <Path d="M44 50 C52 54 56 52 58 47 C60 42 55 40 52 44" stroke="#CDB48C" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Circle cx={30} cy={36} r={21} fill="#D9C29C" />
      <Circle cx={28.5} cy={34.5} r={19} fill="#EEDFC4" />
      <Path d="M12 30 C22 24 38 22 50 28" stroke="#D3BC94" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M10 38 C22 30 38 30 51 37" stroke="#D3BC94" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M14 48 C24 38 38 38 47 47" stroke="#D3BC94" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M22 17 C16 26 16 44 24 55" stroke="#C4A97C" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M34 15 C27 25 28 45 38 56" stroke="#C4A97C" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={22} cy={25} rx={5} ry={3} fill="#FFFFFF" opacity={0.6} transform="rotate(-30 22 25)" />
    </G>
  );
}

function GoatMilk() {
  return (
    <G>
      <GroundShadow w={18} />
      <Path d="M43 24 C55 22 56 42 44 44" stroke="#D7B98A" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Path d="M17 15 L45 15 Q46 22 44 26 Q49 34 47 50 Q46 59 38 59 L24 59 Q16 59 15 50 Q13 34 18 26 Q16 22 13 18 Z" fill="#F2DDB2" />
      <Path d="M36 15 L45 15 Q46 22 44 26 Q49 34 47 50 Q46 59 38 59 L34 59 Q40 55 41 48 Q42 34 38 26 Z" fill="#E4CC9E" />
      <Ellipse cx={30} cy={16} rx={15} ry={3.4} fill="#FFFFFF" />
      <Ellipse cx={30} cy={16} rx={15} ry={3.4} fill="none" stroke="#C98A1B" strokeWidth={2} />
      <Path d="M15 38 Q31 42 47 38 L47 45 Q31 49 15 45 Z" fill="#3E8A57" />
      <Path d="M17 15 L45 15 Q46 22 44 26 Q49 34 47 50 Q46 59 38 59 L24 59 Q16 59 15 50 Q13 34 18 26 Q16 22 13 18 Z" fill="none" stroke="#D2B47E" strokeWidth={1.2} />
      <Path d="M24 20 Q22 26 20 30" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
    </G>
  );
}

function Fish({ species }: { species: 'carp' | 'trout' | 'catfish' }) {
  return (
    <G>
      <GroundShadow w={20} y={56} />
      <G transform="translate(1 16) rotate(-12 32 20) scale(0.66)">
        <FishShape species={species} />
      </G>
    </G>
  );
}

function Hay() {
  return (
    <G>
      <GroundShadow w={26} y={58} />
      <Path d="M8 26 Q8 20 14 20 L50 20 Q56 20 56 26 L56 52 Q56 57 51 57 L13 57 Q8 57 8 52 Z" fill="#E2B74E" />
      <Path d="M8 26 Q8 20 14 20 L50 20 Q56 20 56 26 L56 30 L8 30 Z" fill="#F1D27A" />
      <Path d="M44 30 L56 30 L56 52 Q56 57 51 57 L44 57 Z" fill="#CFA03C" />
      <Path d="M13 36 L19 35 M24 42 L31 41 M13 49 L20 48 M33 51 L39 50 M28 34 L35 34 M47 38 L51 37 M46 48 L50 47" stroke="#B88A2C" strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M14 24 L20 25 M30 23 L37 24 M42 25 L48 24" stroke="#D4A845" strokeWidth={1.2} strokeLinecap="round" />
      <Rect x={18} y={20} width={4} height={37} fill="#B5594B" />
      <Rect x={40} y={20} width={4} height={37} fill="#9C4A3E" />
      <Path d="M7 40 L3 38 M8 46 L4 47 M57 33 L61 31 M56 44 L61 45" stroke="#D9AC45" strokeWidth={1.4} strokeLinecap="round" />
    </G>
  );
}

function Sack({ body, dark, label }: { body: string; dark: string; label: ReactNode }) {
  return (
    <G>
      <GroundShadow w={22} />
      <Path d="M20 14 Q32 18 44 14 L42 22 Q52 30 51 46 Q50 59 40 59 L24 59 Q14 59 13 46 Q12 30 22 22 Z" fill={body} />
      <Path d="M38 22 Q48 30 50 44 Q50 58 40 59 L36 59 Q44 52 43 40 Q42 30 36 23 Z" fill={dark} opacity={0.55} />
      <Path d="M18 9 Q22 15 26 12 Q30 16 33 12 Q37 16 40 12 Q43 15 46 9 L44 16 Q32 20 20 16 Z" fill={body} />
      <Path d="M20 20 Q32 25 44 20" stroke={dark} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {label}
    </G>
  );
}

function Grain() {
  return (
    <G>
      <Sack
        body="#D8B98A"
        dark="#B8956A"
        label={
          <G>
            <Circle cx={31} cy={41} r={9} fill="#F4E6CC" />
            <G transform="translate(19 28) scale(0.38)">
              <ProduceShape crop="wheat" />
            </G>
          </G>
        }
      />
      {[[10, 58], [14, 56.5], [52, 58], [56, 57], [49, 56.5]].map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={1.5} ry={2.2} fill="#E0B04A" transform={`rotate(${i * 40} ${x} ${y})`} />
      ))}
    </G>
  );
}

function FishFeed() {
  return (
    <G>
      <GroundShadow w={22} />
      <Path d="M15 14 L49 14 L51 54 Q51 59 46 59 L18 59 Q13 59 13 54 Z" fill="#3C7FB5" />
      <Path d="M40 14 L49 14 L51 54 Q51 59 46 59 L41 59 Z" fill="#2E6A9A" />
      <Path d="M13 9 L51 9 L49 16 L15 16 Z" fill="#5C9BCB" />
      <Path d="M17 12.5 L47 12.5" stroke="#2E6A9A" strokeWidth={1} strokeDasharray="2 2" />
      <Rect x={18} y={24} width={28} height={22} rx={6} fill="#DDEBF6" />
      <G transform="translate(19 26) scale(0.27)">
        <FishShape species="carp" />
      </G>
      <Path d="M24 41 Q32 44 40 41" stroke="#3C7FB5" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {[[9, 57], [12, 58.5], [55, 57.5], [52, 58.5]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.5} fill="#8B5E3C" />
      ))}
    </G>
  );
}

function Fertilizer() {
  return (
    <G>
      <GroundShadow w={22} />
      <Path d="M15 14 L49 14 L51 54 Q51 59 46 59 L18 59 Q13 59 13 54 Z" fill="#3E8A57" />
      <Path d="M40 14 L49 14 L51 54 Q51 59 46 59 L41 59 Z" fill="#2F7046" />
      <Path d="M13 9 L51 9 L49 16 L15 16 Z" fill="#5AA552" />
      <Path d="M17 12.5 L47 12.5" stroke="#2F7046" strokeWidth={1} strokeDasharray="2 2" />
      <Circle cx={32} cy={36} r={11} fill="#E2EEDF" />
      <Path d="M32 44 L32 33" stroke="#3E8A57" strokeWidth={2} strokeLinecap="round" />
      <Path d="M32 36 C26 36 23 32 23 28 C28 28 32 31 32 36 Z" fill="#5AA552" />
      <Path d="M32 34 C38 34 41 29 41 25 C35 25 32 29 32 34 Z" fill="#7CC26B" />
      <Rect x={20} y={49} width={24} height={3} rx={1.5} fill="#FFFFFF" opacity={0.6} />
      {[[9, 57], [12, 58.5], [55, 57.5], [52, 58.5]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.5} fill="#FFFFFF" stroke="#C9D3C2" strokeWidth={0.6} />
      ))}
    </G>
  );
}

function Medicine() {
  return (
    <G>
      <GroundShadow w={16} />
      <Rect x={22} y={8} width={20} height={9} rx={2.5} fill="#F4F0E6" />
      <Rect x={22} y={8} width={20} height={9} rx={2.5} fill="none" stroke="#D6CEBD" strokeWidth={1} />
      <Path d="M26 8 L26 17 M30 8 L30 17 M34 8 L34 17 M38 8 L38 17" stroke="#D6CEBD" strokeWidth={0.9} />
      <Path d="M24 17 L40 17 L40 20 Q47 24 47 31 L47 54 Q47 59 42 59 L22 59 Q17 59 17 54 L17 31 Q17 24 24 20 Z" fill="#B66A30" />
      <Path d="M36 20 L40 20 Q47 24 47 31 L47 54 Q47 59 42 59 L37 59 Q41 56 41 51 L41 31 Q41 24 36 20 Z" fill="#94531F" />
      <Rect x={17} y={32} width={30} height={20} fill="#FFFFFF" />
      <Path d="M29.5 36 L34.5 36 L34.5 39.5 L38 39.5 L38 44.5 L34.5 44.5 L34.5 48 L29.5 48 L29.5 44.5 L26 44.5 L26 39.5 L29.5 39.5 Z" fill="#C2483B" />
      <Rect x={20.5} y={24} width={3} height={6} rx={1.5} fill="#FFFFFF" opacity={0.45} />
    </G>
  );
}

function IconBody({ id }: { id: ItemId }) {
  switch (id) {
    case 'seed_tomato':
      return <SeedPacket crop="tomato" />;
    case 'seed_corn':
      return <SeedPacket crop="corn" />;
    case 'seed_carrot':
      return <SeedPacket crop="carrot" />;
    case 'seed_lettuce':
      return <SeedPacket crop="lettuce" />;
    case 'seed_wheat':
      return <SeedPacket crop="wheat" />;
    case 'seed_strawberry':
      return <SeedPacket crop="strawberry" />;
    case 'seed_pepper':
      return <SeedPacket crop="pepper" />;
    case 'seed_pumpkin':
      return <SeedPacket crop="pumpkin" />;
    case 'tomato':
    case 'corn':
    case 'carrot':
    case 'lettuce':
    case 'wheat':
    case 'strawberry':
    case 'pepper':
    case 'pumpkin':
      return (
        <G>
          <GroundShadow w={20} y={60} />
          <ProduceShape crop={id} />
        </G>
      );
    case 'milk':
      return <Milk />;
    case 'egg':
      return <Eggs />;
    case 'wool':
      return <Wool />;
    case 'goat_milk':
      return <GoatMilk />;
    case 'fish_carp':
      return <Fish species="carp" />;
    case 'fish_trout':
      return <Fish species="trout" />;
    case 'fish_catfish':
      return <Fish species="catfish" />;
    case 'hay':
      return <Hay />;
    case 'grain':
      return <Grain />;
    case 'fish_feed':
      return <FishFeed />;
    case 'fertilizer':
      return <Fertilizer />;
    case 'medicine':
      return <Medicine />;
    default: {
      const never: never = id;
      return never;
    }
  }
}

export function ItemIcon({ id, size = 40 }: IconProps & { id: ItemId }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <IconBody id={id} />
    </Svg>
  );
}

export function CoinIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={35} r={27} fill="#B9821A" />
      <Circle cx={32} cy={32} r={27} fill="#E3A82B" />
      <Circle cx={32} cy={32} r={21} fill="#F2C14E" />
      <Path d="M14 26 A20 20 0 0 1 40 13" stroke="#FBE3A0" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path
        d="M32 19 L35.8 27.2 L44.6 28 L38 34 L40 42.8 L32 38.2 L24 42.8 L26 34 L19.4 28 L28.2 27.2 Z"
        fill="#D99A22"
      />
      <Path d="M32 21 L35 27.8 L42 28.6 L32 31 Z" fill="#F6CF66" opacity={0.7} />
    </Svg>
  );
}
