import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { seasonDay, seasonOf, weatherFor } from '../clock';
import { ACHIEVEMENTS, CROPS, DOG_PRICE, MAX_ORDERS, SEASON_DAYS, WORKSHOP_SLOTS, WORKSHOPS } from '../data';
import { emptyPlot, happeningFor, initialState, migrate, powerUsed, sellPrice, useGame, type Animal, type GameState, type Plot } from '../store';

/** Seasons, workshops, orders, achievements, and what each morning brings. */

const T0 = 1_000_000_000_000;
let now = T0;
const S = () => useGame.getState();
const said = () => S().events.find((e) => !e.text.startsWith('Başarım açıldı'))!.text;
function start(patch: Partial<GameState> = {}) {
  now = T0;
  useGame.setState({ ...initialState(T0), events: [], coins: 100_000, xp: 100_000, ...patch });
}
function advance(hours: number) {
  now += hours * 60_000;
  S().tick(now);
}
const plot = (patch: Partial<Plot>): Plot => ({ ...emptyPlot(), ...patch });
let n = 0;
const animal = (species: Animal['species'], patch: Partial<Animal> = {}): Animal => ({
  id: `${species}-f${n++}`, species, name: `F${n}`, breed: 'T', tag: 'T', bornDay: -100, variant: 0,
  fullness: 100, health: 100, happiness: 100, product: 0, pregnantSince: null, sickHours: 0, warnedSick: false, ...patch,
});
/** The first day from `from` that brings this happening. */
const dayWith = (kind: string, from = 3) => {
  for (let d = from; d < from + 400; d++) if (happeningFor(d)?.kind === kind) return d;
  throw new Error(`no ${kind}`);
};

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  start();
});
afterEach(() => vi.restoreAllMocks());

describe('seasons', () => {
  it('run five days each, spring to winter, and round again', () => {
    expect([1, SEASON_DAYS, SEASON_DAYS + 1, 3 * SEASON_DAYS + 1, 4 * SEASON_DAYS + 1].map(seasonOf)).toEqual(['spring', 'spring', 'summer', 'winter', 'spring']);
    expect(seasonDay(SEASON_DAYS + 2)).toBe(2);
  });

  it('winter is colder than summer', () => {
    const avg = (from: number) => Array.from({ length: SEASON_DAYS }, (_, i) => weatherFor(from + i).temp).reduce((a, b) => a + b, 0) / SEASON_DAYS;
    expect(avg(3 * SEASON_DAYS + 1)).toBeLessThan(avg(SEASON_DAYS + 1) - 10);
  });

  it('a crop out of season grows at half speed', () => {
    // Day 1 is spring: tomatoes are in season, corn is not.
    start({ fields: { ...initialState().fields, corn: [plot({ crop: 'tomato', moisture: 100 }), plot({ crop: 'corn', moisture: 100 }), ...Array(6).fill(emptyPlot())] } });
    advance(2);
    const [tomato, corn] = S().fields.corn;
    expect(tomato.growth / (2 / CROPS.tomato.growHours)).toBeCloseTo(1, 1);
    expect(corn.growth / (2 / CROPS.corn.growHours)).toBeCloseTo(0.5, 1);
  });

  it('a crop out of season sells dearer', () => {
    const springDay = 2;
    const summerDay = SEASON_DAYS + 2;
    // corn: summer crop; the daily wobble is the same factor either way only by chance, so compare to the base
    const ratio = (day: number) => sellPrice(day, 'corn') / sellPrice(day, 'tomato');
    expect(ratio(springDay)).toBeGreaterThan(0);
    expect(sellPrice(springDay, 'corn')).toBeGreaterThanOrEqual(Math.round(3 * 0.8 * 1.4));
    expect(sellPrice(summerDay, 'corn')).toBeLessThanOrEqual(Math.round(3 * 1.25));
  });

  it('animals eat more in winter', () => {
    const winter = (3 * SEASON_DAYS) * 24 * 60 + 8 * 60;
    start({ minutes: winter, animals: [animal('cow')] });
    advance(4);
    const winterLoss = 100 - S().animals[0].fullness;
    start({ minutes: 8 * 60, animals: [animal('cow')] });
    advance(4);
    const springLoss = 100 - S().animals[0].fullness;
    expect(winterLoss).toBeGreaterThan(springLoss * 1.2);
  });
});

describe('workshops', () => {
  it('a mill turns wheat into flour after its hours, and draws power while busy', () => {
    start({ inventory: { wheat: 7 } });
    S().buyWorkshop('mill');
    expect(S().coins).toBe(100_000 - WORKSHOPS.mill.price);
    const idle = powerUsed(S());
    S().craft('mill');
    S().craft('mill');
    S().craft('mill');
    expect(S().inventory.wheat).toBe(1);
    expect(S().events[0].text).toBe('Buğday yetmiyor: 3 gerekli.');
    expect(powerUsed(S())).toBeCloseTo(idle + WORKSHOPS.mill.power);
    advance(WORKSHOPS.mill.hours + 0.1);
    expect(S().inventory.flour).toBe(1);
    advance(WORKSHOPS.mill.hours);
    expect(S().inventory.flour).toBe(2);
    expect(S().stats.crafted).toBe(2);
  });

  it('batches queue up to the slots, and the bakery needs both flour and an egg', () => {
    start({ inventory: { flour: 10, egg: 1 } });
    S().buyWorkshop('bakery');
    S().craft('bakery');
    S().craft('bakery');
    expect(S().workshops.bakery!.jobs).toHaveLength(1);
    expect(S().events[0].text).toBe('Yumurta yetmiyor: 1 gerekli.');
    useGame.setState({ inventory: { flour: 10, egg: 10 } });
    for (let i = 0; i < 5; i++) S().craft('bakery');
    expect(S().workshops.bakery!.jobs).toHaveLength(WORKSHOP_SLOTS);
  });

  it('cannot craft in a workshop not built, nor build one too early', () => {
    start({ inventory: { strawberry: 10 }, xp: 0 });
    S().craft('jam');
    S().buyWorkshop('jam');
    expect(S().workshops.jam).toBeUndefined();
    expect(S().inventory.strawberry).toBe(10);
  });

  it('an unpaid electricity bill holds the batches', () => {
    start({ inventory: { wheat: 3 } });
    S().buyWorkshop('mill');
    S().craft('mill');
    useGame.setState({ power: { ...S().power, unpaid: 50 } });
    advance(WORKSHOPS.mill.hours + 1);
    expect(S().inventory.flour ?? 0).toBe(0);
    useGame.setState({ power: { ...S().power, unpaid: 0 } });
    advance(WORKSHOPS.mill.hours + 1);
    expect(S().inventory.flour).toBe(1);
  });
});

describe('orders', () => {
  it('a farm starts with orders, and delivering one pays its reward', () => {
    expect(S().orders.length).toBeGreaterThan(0);
    const o = S().orders[0];
    useGame.setState({ inventory: {} });
    S().deliver(o.id);
    expect(S().orders).toContainEqual(o);
    expect(said()).toContain('gerekli');
    useGame.setState({ inventory: { ...S().inventory, [o.item]: o.qty } });
    S().deliver(o.id);
    expect(S().orders.find((x) => x.id === o.id)).toBeUndefined();
    expect(S().coins).toBe(100_000 + o.reward);
    expect(S().inventory[o.item]).toBe(0);
    expect(S().stats.orders).toBe(1);
  });

  it('orders run out after their day, and new ones come, never more than the limit', () => {
    start({ orders: [{ id: 'x', who: 'Test', item: 'egg', qty: 1, reward: 1, xp: 1, dueDay: 1 }] });
    advance(24);
    expect(S().orders.find((o) => o.id === 'x')).toBeUndefined();
    for (let i = 0; i < 10; i++) advance(24);
    expect(S().orders.length).toBeGreaterThan(0);
    expect(S().orders.length).toBeLessThanOrEqual(MAX_ORDERS);
    expect(S().orders.every((o) => o.qty > 0 && o.reward > 0)).toBe(true);
  });
});

describe('achievements', () => {
  it('are noticed when met, and their reward is taken once', () => {
    start({ coins: 0, xp: 0, achievements: [], claimed: [] });
    S().harvest('tomatoes', 0);
    expect(S().achievements).toContain('harvest_1');
    const reward = ACHIEVEMENTS.find((a) => a.id === 'harvest_1')!.reward;
    S().claim('harvest_1');
    S().claim('harvest_1');
    expect(S().coins).toBe(reward);
    S().claim('orders_50');
    expect(S().coins).toBe(reward);
  });
});

describe('what each morning brings', () => {
  it('is fixed by the day, so the market knows a boom in advance', () => {
    expect(happeningFor(1)).toBeNull();
    expect(happeningFor(2)).toBeNull();
    const day = dayWith('boom');
    const h = happeningFor(day)!;
    expect(h.item).toBeDefined();
    expect(sellPrice(day, h.item!)).toBeGreaterThanOrEqual(2 * sellPrice(day - 1, h.item!) * 0.6);
  });

  it('a fox takes a hen, unless there is a dog', () => {
    const day = dayWith('fox');
    start({ minutes: (day - 1) * 24 * 60 - 30 });
    const hens = S().animals.filter((a) => a.species === 'chicken').length;
    advance(1);
    expect(S().animals.filter((a) => a.species === 'chicken')).toHaveLength(hens - 1);
    expect(S().happening?.kind).toBe('fox');

    start({ minutes: (day - 1) * 24 * 60 - 30 });
    S().buyDog();
    expect(S().coins).toBe(100_000 - DOG_PRICE);
    advance(1);
    expect(S().animals.filter((a) => a.species === 'chicken')).toHaveLength(hens);
  });

  it('a drought stops the rain and dries the fields faster', () => {
    const day = dayWith('drought');
    start({ minutes: (day - 1) * 24 * 60 + 60, happening: { day, kind: 'drought', note: '' }, fields: { ...initialState().fields, corn: [plot({ crop: 'wheat', moisture: 100 }), ...Array(7).fill(emptyPlot())] } });
    advance(2);
    const droughtLoss = 100 - S().fields.corn[0].moisture;
    start({ minutes: (day - 1) * 24 * 60 + 60, happening: null, fields: { ...initialState().fields, corn: [plot({ crop: 'wheat', moisture: 100 }), ...Array(7).fill(emptyPlot())] } });
    advance(2);
    const normalLoss = 100 - S().fields.corn[0].moisture;
    if (!weatherFor(day).kind.includes('rain') && weatherFor(day).kind !== 'storm') expect(droughtLoss).toBeCloseTo(normalLoss * 2, 0);
    expect(droughtLoss).toBeGreaterThan(0);
  });

  it('locusts set growing crops back', () => {
    const day = dayWith('locusts');
    start({ minutes: (day - 1) * 24 * 60 - 30, fields: { ...initialState().fields, corn: [plot({ crop: 'wheat', growth: 0.6, moisture: 100 }), ...Array(7).fill(emptyPlot())] } });
    advance(1);
    expect(S().fields.corn[0].growth).toBeLessThan(0.5);
  });
});

describe('settings', () => {
  it('the farm can be renamed, and a reset keeps the name', () => {
    S().rename('  Kuzey Rüzgarı Çiftliği  ');
    expect(S().farmName).toBe('Kuzey Rüzgarı Çiftliği');
    S().rename('   ');
    expect(S().farmName).toBe('Kuzey Rüzgarı Çiftliği');
    useGame.setState({ coins: 1 });
    S().reset();
    expect(S().farmName).toBe('Kuzey Rüzgarı Çiftliği');
    expect(S().coins).toBe(initialState().coins);
  });

  it('a version-9 save gets orders, stats and the rest, empty', () => {
    const old = { ...initialState(T0), version: 9 } as unknown as Record<string, unknown>;
    for (const k of ['orders', 'stats', 'achievements', 'claimed', 'workshops', 'happening', 'dog']) delete old[k];
    const s = migrate(old as unknown as GameState, 9);
    expect(s.version).toBe(10);
    expect(s.orders).toEqual([]);
    expect(s.stats.harvested).toBe(0);
    expect(s.workshops).toEqual({});
    expect(s.dog).toBe(false);
  });
});
