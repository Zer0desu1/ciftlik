/**
 * The wide header scene on the home screen: sky that follows the game clock,
 * rolling hills with wind turbines, a red barn and silo, trees, a fence, a
 * cow and ploughed rows, fading into the page colour at the bottom.
 *
 * Drawn in a 400 x 300 box with `slice`, so it fills any width. The top
 * ~110 units are kept calm for a greeting overlay; the bottom ~75 fade into
 * the cream page so cards can overlap it.
 */
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { WeatherKind } from '@/game/data';

import { AnimalBody } from './animals';
import { mix, useUid } from './shared';

const PAGE = '#F4F0E6';

/** [hour, sky top, sky bottom, night darkness, warm tint] */
type Key = [number, string, string, number, number];

const KEYS: Key[] = [
  [0, '#0E1735', '#2A3963', 0.42, 0],
  [4.6, '#0E1735', '#2A3963', 0.42, 0],
  [5.6, '#5C6CA8', '#F2B4A6', 0.2, 0.1],
  [6.6, '#9ACAEA', '#FAD8C3', 0.04, 0.06],
  [7.6, '#8CC6EB', '#DDF0F8', 0, 0],
  [16.4, '#8CC6EB', '#DDF0F8', 0, 0],
  [18, '#8296CB', '#F7C58F', 0.06, 0.1],
  [19.3, '#3E4C87', '#E98B5D', 0.22, 0.14],
  [20.4, '#0E1735', '#2A3963', 0.42, 0],
  [24, '#0E1735', '#2A3963', 0.42, 0],
];

function skyAt(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0])));
  return {
    top: mix(a[1], b[1], t),
    bottom: mix(a[2], b[2], t),
    dark: a[3] + (b[3] - a[3]) * t,
    warm: a[4] + (b[4] - a[4]) * t,
    hour: h,
  };
}

const STARS = [
  [22, 18, 1.1], [64, 40, 0.8], [98, 14, 1.2], [140, 52, 0.7], [176, 24, 1], [214, 46, 0.8],
  [246, 12, 1.1], [282, 36, 0.7], [330, 20, 0.9], [372, 44, 1.1], [390, 12, 0.7], [118, 88, 0.6],
  [40, 76, 0.8], [190, 92, 0.6], [262, 84, 0.8], [362, 92, 0.7],
];

function Cloud({ x, y, s, fill, opacity = 1 }: { x: number; y: number; s: number; fill: string; opacity?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <Ellipse cx={0} cy={6} rx={30} ry={7} fill={fill} />
      <Circle cx={-12} cy={2} r={9} fill={fill} />
      <Circle cx={2} cy={-3} r={12} fill={fill} />
      <Circle cx={15} cy={2} r={8} fill={fill} />
    </G>
  );
}

function Turbine({ x, y, h, angle }: { x: number; y: number; h: number; angle: number }) {
  const top = y - h;
  return (
    <G>
      <Path d={`M${x - 1.8} ${y} L${x - 0.8} ${top} L${x + 0.8} ${top} L${x + 1.8} ${y} Z`} fill="#F4F6F7" />
      <Path d={`M${x + 0.2} ${y} L${x + 0.6} ${top} L${x + 0.8} ${top} L${x + 1.8} ${y} Z`} fill="#D5DDE1" />
      <G transform={`translate(${x} ${top}) rotate(${angle})`}>
        {[0, 120, 240].map((a) => (
          <Path key={a} d="M-1.3 0 Q-1.6 -12 0 -22 Q1.8 -12 1.3 0 Z" fill="#FAFBFB" transform={`rotate(${a})`} />
        ))}
        <Circle cx={0} cy={0} r={2.2} fill="#DDE4E8" />
      </G>
    </G>
  );
}

function RoundTree({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Rect x={x - 2.5} y={y - r * 0.6} width={5} height={r * 0.6 + 2} rx={1.5} fill="#7A5230" />
      <Circle cx={x} cy={y - r * 1.25} r={r} fill="#3F8A44" />
      <Circle cx={x - r * 0.18} cy={y - r * 1.35} r={r * 0.82} fill="#5AA552" />
      <Circle cx={x - r * 0.38} cy={y - r * 1.6} r={r * 0.32} fill="#7CC26B" />
    </G>
  );
}

function Pine({ x, y, h }: { x: number; y: number; h: number }) {
  const w = h * 0.36;
  return (
    <G>
      <Rect x={x - 2} y={y - 6} width={4} height={8} fill="#6E4528" />
      <Path d={`M${x} ${y - h} L${x + w} ${y - h * 0.32} L${x + w * 0.55} ${y - h * 0.34} L${x + w * 1.15} ${y - 4} L${x - w * 1.15} ${y - 4} L${x - w * 0.55} ${y - h * 0.34} L${x - w} ${y - h * 0.32} Z`} fill="#2F6E43" />
      <Path d={`M${x} ${y - h} L${x - w} ${y - h * 0.32} L${x - w * 0.55} ${y - h * 0.34} L${x - w * 1.15} ${y - 4} L${x} ${y - 4} Z`} fill="#3F8752" />
    </G>
  );
}

function Barn({ lit }: { lit: number }) {
  const glow = mix('#5A1E17', '#FFD45C', lit);
  return (
    <G>
      <Rect x={66} y={168} width={68} height={45} fill="#C0392B" />
      <Rect x={118} y={168} width={16} height={45} fill="#A93226" />
      <Path d="M74 168 L74 213 M106 168 L106 213 M126 168 L126 213" stroke="#A93226" strokeWidth={1} />
      <Path d="M59 171 L74 147 L100 136 L126 147 L141 171 Z" fill="#8E2A20" />
      <Path d="M59 171 L74 147 L100 136 L126 147 L141 171" stroke="#F4F0E6" strokeWidth={2.4} fill="none" strokeLinejoin="round" />
      <Rect x={91} y={150} width={18} height={13} fill={glow} stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M100 150 L100 163" stroke="#FFFFFF" strokeWidth={1.5} />
      <Rect x={82} y={181} width={36} height={32} fill="#A93226" stroke="#FFFFFF" strokeWidth={2.4} />
      <Path d="M100 181 L100 213 M82 181 L100 213 M100 181 L82 213 M100 181 L118 213 M118 181 L100 213" stroke="#FFFFFF" strokeWidth={2} />
    </G>
  );
}

function Silo() {
  return (
    <G>
      <Rect x={141} y={150} width={23} height={63} fill="#B4BCC2" />
      <Rect x={154} y={150} width={10} height={63} fill="#9AA3AA" />
      <Path d="M141 150 Q141 136 152.5 136 Q164 136 164 150 Z" fill="#8C959C" />
      <Path d="M152.5 136 Q164 136 164 150 L156 150 Q156 140 152.5 136 Z" fill="#788188" />
      <Path d="M141 166 L164 166 M141 182 L164 182 M141 198 L164 198" stroke="#8C959C" strokeWidth={1.5} />
    </G>
  );
}

function Fence() {
  const posts = [6, 30, 54, 78, 102, 126, 150, 174, 198];
  return (
    <G>
      <Rect x={0} y={214} width={204} height={4} rx={1.5} fill="#B98A5A" />
      <Rect x={0} y={224} width={204} height={4} rx={1.5} fill="#B98A5A" />
      <Rect x={0} y={214} width={204} height={1.4} fill="#D3A876" />
      {posts.map((x) => (
        <G key={x}>
          <Rect x={x - 2.5} y={208} width={5} height={28} rx={1} fill="#9C6E43" />
          <Rect x={x - 2.5} y={208} width={2} height={28} fill="#B98A5A" />
        </G>
      ))}
    </G>
  );
}

const ROW_PLANTS = [0.15, 0.32, 0.5, 0.68, 0.86];

function Field() {
  const rows = [0, 1, 2, 3, 4, 5];
  return (
    <G>
      <Path d="M252 212 Q330 204 400 204 L400 282 L206 282 Q228 240 252 212 Z" fill="#9A6A45" />
      {rows.map((i) => {
        const y0 = 212 + i * 12.5;
        const x0 = 252 - i * 7.8;
        const y1 = 205 + i * 14;
        return (
          <G key={i}>
            <Path d={`M${x0} ${y0 + 3} Q330 ${y1 - 1} 400 ${y1 + 2}`} stroke="#7E5434" strokeWidth={2.4 + i * 0.6} fill="none" />
            <Path d={`M${x0 + 2} ${y0 - 1} Q330 ${y1 - 5} 400 ${y1 - 3}`} stroke="#B17D52" strokeWidth={1 + i * 0.2} fill="none" opacity={0.7} />
            {ROW_PLANTS.map((t, j) => {
              const x = x0 + (400 - x0) * t;
              const y = y0 + (y1 - y0) * t - 3;
              const s = 0.7 + i * 0.22;
              return (
                <G key={j} transform={`translate(${x} ${y}) scale(${s})`}>
                  <Ellipse cx={-2.2} cy={-2} rx={2.6} ry={1.3} fill="#4E9A47" transform="rotate(-30 -2.2 -2)" />
                  <Ellipse cx={2.2} cy={-2.4} rx={2.6} ry={1.3} fill="#6DB85C" transform="rotate(30 2.2 -2.4)" />
                  <Ellipse cx={0} cy={-3.5} rx={1.2} ry={2.2} fill="#7CC26B" />
                </G>
              );
            })}
          </G>
        );
      })}
    </G>
  );
}

const RAIN = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 97) % 420;
  const y = (i * 53) % 250;
  return { x, y, l: 9 + (i % 4) * 3 };
});

export function FarmHero({ hour, weather, height = 300 }: { hour: number; weather: WeatherKind; height?: number }) {
  const uid = useUid('hero');
  const sky = skyAt(hour);
  const wet = weather === 'rain' || weather === 'storm';
  const grey = weather === 'storm' ? 0.55 : weather === 'rain' ? 0.42 : weather === 'cloudy' ? 0.2 : 0;
  const skyTop = mix(sky.top, '#8E9AA6', grey * (1 - sky.dark));
  const skyBottom = mix(sky.bottom, '#B9C2CA', grey * (1 - sky.dark));
  const night = sky.dark > 0.3;
  const lit = Math.min(1, Math.max(0, (sky.dark - 0.15) / 0.2));

  const h = sky.hour;
  const sunUp = h >= 5.2 && h <= 19.8;
  const t = (h - 5.2) / 14.6;
  const sunX = 250 + t * 120;
  const sunY = 150 - Math.sin(Math.PI * t) * 92;
  const sunColor = mix('#FFD45C', '#F59A4A', Math.abs(t - 0.5) > 0.36 ? (Math.abs(t - 0.5) - 0.36) / 0.14 : 0);

  const cloudFill = night ? '#5A678C' : wet ? '#D3DAE0' : '#FFFFFF';
  const cloudBack = night ? '#46527A' : wet ? '#B4BEC7' : '#EEF5FA';
  const clouds: [number, number, number, boolean][] =
    weather === 'sunny'
      ? [[340, 96, 0.7, false], [214, 72, 0.45, true]]
      : weather === 'partly'
        ? [[318, 82, 0.9, false], [210, 64, 0.6, true], [372, 110, 0.55, true]]
        : [
            [60, 40, 1.1, true], [170, 56, 1.0, false], [290, 46, 1.2, true],
            [372, 72, 1.0, false], [240, 96, 0.8, false], [110, 92, 0.75, false],
          ];

  return (
    <Svg width="100%" height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skyTop} />
          <Stop offset="1" stopColor={skyBottom} />
        </LinearGradient>
        <LinearGradient id={`${uid}fade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PAGE} stopOpacity={0} />
          <Stop offset="0.7" stopColor={PAGE} stopOpacity={1} />
          <Stop offset="1" stopColor={PAGE} stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id={`${uid}dim`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0E1735" stopOpacity={0} />
          <Stop offset="0.2" stopColor="#0E1735" stopOpacity={1} />
          <Stop offset="1" stopColor="#0E1735" stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id={`${uid}grey`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5E6B78" stopOpacity={0} />
          <Stop offset="0.2" stopColor="#5E6B78" stopOpacity={1} />
          <Stop offset="1" stopColor="#5E6B78" stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id={`${uid}hill`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B4DBA2" />
          <Stop offset="1" stopColor="#9CCB8A" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={400} height={300} fill={`url(#${uid}sky)`} />

      {sky.dark > 0.12
        ? STARS.map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill="#FFF6D6" opacity={Math.min(1, (sky.dark - 0.12) * 3) * (wet ? 0.3 : 0.9)} />
          ))
        : null}

      {night ? (
        <G>
          <Path d="M334 44 A18 18 0 1 0 348 70 A14 14 0 1 1 334 44 Z" fill="#F6E39A" />
        </G>
      ) : sunUp && !wet ? (
        <G>
          <Circle cx={sunX} cy={sunY} r={30} fill={sunColor} opacity={0.18} />
          <Circle cx={sunX} cy={sunY} r={21} fill={sunColor} opacity={0.3} />
          <Circle cx={sunX} cy={sunY} r={15} fill={sunColor} />
        </G>
      ) : null}

      {clouds.map(([x, y, s, back], i) => (
        <Cloud key={i} x={x} y={y} s={s} fill={back ? cloudBack : cloudFill} opacity={wet ? 0.95 : 0.9} />
      ))}

      {/* landscape */}
      <Path d="M0 160 C50 138 110 140 160 152 C220 166 280 126 400 142 L400 230 L0 230 Z" fill={`url(#${uid}hill)`} />
      <Turbine x={302} y={136} h={44} angle={(hour * 40) % 120} />
      <Turbine x={344} y={135} h={38} angle={((hour * 40) % 120) + 50} />
      <Turbine x={58} y={146} h={30} angle={((hour * 40) % 120) + 20} />
      <Path d="M0 186 C70 162 150 170 210 182 C270 194 330 170 400 176 L400 240 L0 240 Z" fill="#8CC877" />
      <Path d="M0 204 C100 194 250 198 400 200 L400 300 L0 300 Z" fill="#78BE64" />
      <Path d="M0 206 C100 197 250 200 400 202 L400 210 C250 208 100 204 0 214 Z" fill="#8FCF79" opacity={0.6} />

      <Pine x={30} y={212} h={52} />
      <Pine x={48} y={210} h={38} />
      <Barn lit={lit} />
      <Silo />
      <RoundTree x={186} y={212} r={18} />
      <RoundTree x={212} y={208} r={12} />
      <Ellipse cx={168} cy={213} rx={10} ry={5} fill="#4E9A47" />
      <Ellipse cx={60} cy={214} rx={9} ry={4.5} fill="#4E9A47" />

      <Field />
      <Fence />
      <Ellipse cx={226} cy={235} rx={20} ry={3.5} fill="#1C2A20" opacity={0.12} />
      <G transform="translate(202 188) scale(0.48)">
        <AnimalBody species="cow" variant={0} />
      </G>
      <Path d="M180 240 l2 -6 l2 6 M186 240 l1.5 -5 l1.5 5 M262 244 l2 -6 l2 6" stroke="#4E9A47" strokeWidth={1.4} fill="none" strokeLinecap="round" />

      {/* light and weather */}
      {sky.dark > 0 ? <Rect x={0} y={112} width={400} height={188} fill={`url(#${uid}dim)`} opacity={sky.dark * 0.85} /> : null}
      {sky.warm > 0 ? <Rect x={0} y={0} width={400} height={300} fill="#F08A4B" opacity={sky.warm} /> : null}
      {grey > 0 && !night ? <Rect x={0} y={112} width={400} height={188} fill={`url(#${uid}grey)`} opacity={grey * 0.3} /> : null}
      {lit > 0 ? <Rect x={91} y={150} width={18} height={13} fill="#FFD45C" opacity={lit * 0.9} /> : null}

      {wet
        ? RAIN.map((d, i) => (
            <Path
              key={i}
              d={`M${d.x} ${d.y} l-3 ${d.l}`}
              stroke={night ? '#9FB3D6' : '#FFFFFF'}
              strokeWidth={1.3}
              strokeLinecap="round"
              opacity={0.55}
            />
          ))
        : null}
      {weather === 'storm' ? (
        <Path d="M262 70 L250 96 L260 96 L252 120 L274 88 L263 88 L272 70 Z" fill="#FFE07A" opacity={0.95} />
      ) : null}

      <Rect x={0} y={226} width={400} height={74} fill={`url(#${uid}fade)`} />
    </Svg>
  );
}
