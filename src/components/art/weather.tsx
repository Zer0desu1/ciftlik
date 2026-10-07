/**
 * Weather icons (64 x 64) and the player's farmer avatar (100 x 100).
 */
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { WeatherKind } from '@/game/data';

/** Puffy cloud drawn in a 50 x 36 local box, placed at (x, y) with scale s. */
function Cloud({ x, y, s = 1, fill = '#EAF1F6', under = '#BFCDD9' }: { x: number; y: number; s?: number; fill?: string; under?: string }) {
  const d = 'M12 34 L40 34 A9 9 0 0 0 41 16 A13 13 0 0 0 16 12 A11 11 0 0 0 12 34 Z';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={d} fill={under} transform="translate(0 2.5)" />
      <Path d={d} fill={fill} />
      <Ellipse cx={22} cy={18} rx={6} ry={3} fill="#FFFFFF" opacity={0.5} />
    </G>
  );
}

function Sun({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Rect key={a} x={-2.4} y={-27} width={4.8} height={8} rx={2.4} fill="#F5B92E" transform={`rotate(${a})`} />
      ))}
      <Circle cx={0} cy={0} r={15} fill="#F5B92E" />
      <Circle cx={-1} cy={-1} r={12.5} fill="#FFD45C" />
      <Circle cx={-5} cy={-5} r={3.5} fill="#FFFFFF" opacity={0.4} />
    </G>
  );
}

function Moon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M4 -18 A18 18 0 1 0 18 8 A14 14 0 1 1 4 -18 Z" fill="#E9CF72" />
      <Path d="M2 -15.5 A15.5 15.5 0 1 0 15 7.5 A14 14 0 0 1 2 -15.5 Z" fill="#F6E39A" />
      <Circle cx={-7} cy={4} r={2.4} fill="#E9CF72" />
      <Circle cx={-2} cy={11} r={1.6} fill="#E9CF72" />
    </G>
  );
}

function Star({ x, y, r = 2 }: { x: number; y: number; r?: number }) {
  return (
    <Path
      d={`M${x} ${y - r * 2} Q${x} ${y} ${x + r * 2} ${y} Q${x} ${y} ${x} ${y + r * 2} Q${x} ${y} ${x - r * 2} ${y} Q${x} ${y} ${x} ${y - r * 2} Z`}
      fill="#F6E39A"
    />
  );
}

function Drops({ color = '#4C93CF' }: { color?: string }) {
  return (
    <G>
      {[
        [22, 48],
        [33, 52],
        [44, 48],
      ].map(([x, y], i) => (
        <Path key={i} d={`M${x} ${y} q-3.4 5 0 7 q3.4 -2 0 -7 Z`} fill={color} transform={`rotate(18 ${x} ${y})`} />
      ))}
    </G>
  );
}

export function WeatherIcon({ kind, size = 32, night = false }: { kind: WeatherKind; size?: number; night?: boolean }) {
  let art;
  switch (kind) {
    case 'sunny':
      art = night ? (
        <G>
          <Moon x={30} y={34} s={1.1} />
          <Star x={50} y={14} r={2} />
          <Star x={54} y={34} r={1.4} />
        </G>
      ) : (
        <Sun x={32} y={32} />
      );
      break;
    case 'partly':
      art = (
        <G>
          {night ? <Moon x={26} y={24} s={0.85} /> : <Sun x={24} y={24} s={0.78} />}
          <Cloud x={14} y={24} s={0.95} />
        </G>
      );
      break;
    case 'cloudy':
      art = (
        <G>
          <Cloud x={20} y={10} s={0.8} fill="#C9D6E1" under="#AFC0CE" />
          <Cloud x={5} y={22} s={1} />
        </G>
      );
      break;
    case 'rain':
      art = (
        <G>
          <Cloud x={6} y={8} s={1.05} fill="#E3EAF0" under="#BACAD7" />
          <Drops />
        </G>
      );
      break;
    case 'storm':
      art = (
        <G>
          <Cloud x={6} y={6} s={1.05} fill="#9AA8B5" under="#7A8A99" />
          <Path d="M34 38 L25 52 L32 52 L28 62 L41 46 L34 46 L38 38 Z" fill="#F5B92E" />
          <Path d="M17 46 q-3 4.4 0 6.2 q3 -1.8 0 -6.2 Z" fill="#4C93CF" transform="rotate(18 17 46)" />
          <Path d="M48 46 q-3 4.4 0 6.2 q3 -1.8 0 -6.2 Z" fill="#4C93CF" transform="rotate(18 48 46)" />
        </G>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {art}
    </Svg>
  );
}

export function FarmerAvatar({ size = 44 }: { size?: number }) {
  const skin = '#F2C29B';
  const skinDark = '#E3A97E';
  const hair = '#7A4A2A';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={50} fill="#F7EACB" />
      <Circle cx={50} cy={50} r={41} fill="#FBF2DD" />
      {/* body, clipped to the circle by its arc */}
      <Path d="M15 85 Q20 72 36 69 L64 69 Q80 72 85 85 A50 50 0 0 1 15 85 Z" fill="#C0392B" />
      <Path d="M28 73 L28 94 M42 69 L42 98.5 M58 69 L58 98.5 M72 73 L72 94 M15 85 L85 85" stroke="#A52F23" strokeWidth={2} opacity={0.6} />
      <Path d="M33 80 L67 80 L67 96.5 A50 50 0 0 1 33 96.5 Z" fill="#3C7FB5" />
      <Path d="M33 80 L33 70 M67 80 L67 70" stroke="#3C7FB5" strokeWidth={5} />
      <Circle cx={36} cy={83} r={1.8} fill="#F2C230" />
      <Circle cx={64} cy={83} r={1.8} fill="#F2C230" />
      <Rect x={43} y={88} width={14} height={7} rx={2} fill="#2E6A9A" />
      <Path d="M43 64 L57 64 L57 71 Q50 76 43 71 Z" fill={skinDark} />
      {/* head */}
      <Circle cx={31} cy={51} r={4.5} fill={skinDark} />
      <Circle cx={69} cy={51} r={4.5} fill={skinDark} />
      <Ellipse cx={50} cy={50} rx={18} ry={19} fill={skin} />
      <Path d="M32 44 Q33 36 40 36 L36 50 Q32 49 32 44 Z" fill={hair} />
      <Path d="M68 44 Q67 36 60 36 L64 50 Q68 49 68 44 Z" fill={hair} />
      <Ellipse cx={40} cy={57} rx={3.6} ry={2.2} fill="#EE9A8A" opacity={0.6} />
      <Ellipse cx={60} cy={57} rx={3.6} ry={2.2} fill="#EE9A8A" opacity={0.6} />
      <Path d="M39.5 46 Q43 44 46 46 M54 46 Q57 44 60.5 46" stroke={hair} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Ellipse cx={43} cy={51} rx={2.1} ry={2.6} fill="#1C2A20" />
      <Ellipse cx={57} cy={51} rx={2.1} ry={2.6} fill="#1C2A20" />
      <Circle cx={43.7} cy={50.2} r={0.8} fill="#FFFFFF" />
      <Circle cx={57.7} cy={50.2} r={0.8} fill="#FFFFFF" />
      <Path d="M50 52 Q48 56 50.5 57" stroke={skinDark} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M44 60 Q50 65 56 60" stroke="#9C4A3E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M56 60 L63 56" stroke="#E2B74E" strokeWidth={1.4} strokeLinecap="round" />
      {/* straw hat */}
      <Ellipse cx={50} cy={38} rx={33} ry={8} fill="#D9AC45" />
      <Ellipse cx={50} cy={36.5} rx={32} ry={7} fill="#EDC864" />
      <Path d="M33 37 Q32 17 50 16 Q68 17 67 37 Q50 41 33 37 Z" fill="#F2D27A" />
      <Path d="M33.4 31 Q50 35 66.6 31 L67 37 Q50 41 33 37 Z" fill="#B5594B" />
      <Path d="M58 18 Q66 20 66.6 30" stroke="#E2BA5A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M24 40 L28 38 M74 40 L70 38 M20 37 L25 36 M80 37 L75 36" stroke="#C99A3A" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
