import { WEATHER, type WeatherKind } from './data';

/** One real second is one game minute: a game hour a minute, a day in 24 minutes. */
export const GAME_MINUTES_PER_SECOND = 1;

/** Offline time is caught up to at most this many game hours, so a week away doesn't kill everything. */
export const MAX_CATCH_UP_HOURS = 48;

export const MINUTES_PER_DAY = 24 * 60;

export function dayOf(gameMinutes: number): number {
  return Math.floor(gameMinutes / MINUTES_PER_DAY) + 1;
}

/** Hour of the day as a fraction, 0 ≤ h < 24. */
export function hourOf(gameMinutes: number): number {
  return (gameMinutes % MINUTES_PER_DAY) / 60;
}

export function clockLabel(gameMinutes: number): string {
  const total = Math.floor(gameMinutes % MINUTES_PER_DAY);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function greeting(hour: number): string {
  if (hour < 5) return 'İyi geceler';
  if (hour < 11) return 'Günaydın';
  if (hour < 17) return 'İyi günler';
  if (hour < 21) return 'İyi akşamlar';
  return 'İyi geceler';
}

export function isNight(hour: number): boolean {
  return hour < 5.5 || hour >= 20;
}

/** Deterministic randomness per day, so a day's weather and prices don't reroll on restart. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DayWeather = { kind: WeatherKind; temp: number };

const TEMP: Record<WeatherKind, [number, number]> = {
  sunny: [27, 33],
  partly: [22, 27],
  cloudy: [18, 23],
  rain: [14, 19],
  storm: [12, 17],
};

export function weatherFor(day: number): DayWeather {
  const rand = seeded(day * 9973 + 17);
  const roll = rand();
  // Day one is always fair: nobody's first look at the farm should be a storm.
  const kind: WeatherKind =
    day === 1
      ? 'sunny'
      : roll < 0.34
        ? 'sunny'
        : roll < 0.58
          ? 'partly'
          : roll < 0.76
            ? 'cloudy'
            : roll < 0.94
              ? 'rain'
              : 'storm';
  const [lo, hi] = TEMP[kind];
  return { kind, temp: Math.round(lo + rand() * (hi - lo)) };
}

export function weatherLabel(kind: WeatherKind): string {
  return WEATHER[kind].label;
}
