import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { C, F, R, S, shadow } from '@/theme';

type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'number';

const TXT: Record<TxtVariant, TextStyle> = {
  display: { fontFamily: F.extrabold, fontSize: 28, letterSpacing: -0.6, color: C.ink },
  title: { fontFamily: F.bold, fontSize: 22, letterSpacing: -0.4, color: C.ink },
  heading: { fontFamily: F.bold, fontSize: 17, letterSpacing: -0.2, color: C.ink },
  body: { fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: C.inkSoft },
  label: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  caption: { fontFamily: F.medium, fontSize: 12, color: C.muted },
  number: { fontFamily: F.extrabold, fontSize: 26, letterSpacing: -0.6, color: C.ink },
};

export function Txt({
  v = 'body',
  style,
  children,
  numberOfLines,
}: {
  v?: TxtVariant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={[TXT[v], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

/**
 * Every screen's frame: the cream page, safe-area padding, and room at the
 * bottom so the last card clears the tab bar.
 */
export function Screen({
  children,
  header,
  bottomGap = 110,
  padded = true,
}: {
  children: ReactNode;
  header?: ReactNode;
  bottomGap?: number;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      {header}
      <ScrollView
        contentContainerStyle={{
          paddingTop: header ? S.sm : insets.top + S.md,
          paddingBottom: bottomGap + insets.bottom,
          paddingHorizontal: padded ? S.xl : 0,
          gap: S.lg,
        }}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

/** A pushed screen's top bar: round back button, centred title and subtitle. */
export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + S.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.round}>
        <ChevronLeft size={22} color={C.ink} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Txt v="heading">{title}</Txt>
        {subtitle ? <Txt v="caption">{subtitle}</Txt> : null}
      </View>
      <View style={{ width: 42, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  tint,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tint?: string;
}) {
  const body = [styles.card, tint ? { backgroundColor: tint } : null, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [body, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}>
      {children}
    </Pressable>
  );
}

/** A small square of tint with an icon in it, as at the top of every stat card. */
export function IconBadge({ children, tint, size = 40 }: { children: ReactNode; tint: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
      {icon}
      <Text style={[styles.chipText, active ? { color: C.white } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = 'green' }: { text: string; tone?: 'green' | 'amber' | 'rose' | 'blue' | 'muted' }) {
  const colors = {
    green: [C.greenSoft, C.green],
    amber: [C.amberSoft, C.amber],
    rose: [C.roseSoft, C.rose],
    blue: [C.blueSoft, C.blue],
    muted: ['#EFEBE1', C.inkSoft],
  }[tone];
  return (
    <View style={{ backgroundColor: colors[0], borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors[1] }}>{text}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'soft' | 'ghost' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: C.green, fg: C.white },
    soft: { bg: C.greenSoft, fg: C.green },
    ghost: { bg: 'transparent', fg: C.green },
    danger: { bg: C.roseSoft, fg: C.rose },
  }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'ghost' && { borderWidth: 1, borderColor: C.line },
        style,
      ]}>
      {icon}
      <Text style={{ fontFamily: F.bold, fontSize: small ? 13 : 15, color: palette.fg }}>{label}</Text>
    </Pressable>
  );
}

/** Circular progress, as in the farm-health card. */
export function Ring({
  value,
  size = 64,
  stroke = 7,
  color = C.green,
  track = C.greenSoft,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Bar({ value, color = C.green, track = C.greenSoft, height = 7 }: { value: number; color?: string; track?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: S.sm }}>
      <View style={{ flex: 1 }}>
        <Txt v="heading">{title}</Txt>
        {subtitle ? <Txt v="caption" style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
      </View>
      {action}
    </View>
  );
}

/** A meter with its label and value, for moisture, fullness, health and the like. */
export function Meter({ label, value, color, track }: { label: string; value: number; color?: string; track?: string }) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt v="caption">{label}</Txt>
        <Txt v="caption" style={{ color: C.ink, fontFamily: F.semibold }}>%{Math.round(value)}</Txt>
      </View>
      <Bar value={value} color={color} track={track} />
    </View>
  );
}

export function Row({ children, gap = S.md, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    ...shadow,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingBottom: S.sm,
    backgroundColor: C.page,
  },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
    backgroundColor: C.card,
    ...shadow,
  },
  chipActive: { backgroundColor: C.ink },
  chipText: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  button: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: 13,
    borderRadius: R.md,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.sm },
});
