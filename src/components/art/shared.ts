/**
 * Small helpers shared by the illustration components: unique gradient ids
 * and a little colour arithmetic so every shape can get a lighter or darker
 * tone of its own colour for the two-tone flat shading.
 */
import { useId } from 'react';

/** An id that is safe inside `url(#...)`, unique per component instance. */
export function useUid(prefix: string): string {
  const raw = useId();
  return `${prefix}${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colours; t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Darken (amount > 0) or lighten (amount < 0) a hex colour. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, '#000000', amount) : mix(hex, '#FFFFFF', -amount);
}
