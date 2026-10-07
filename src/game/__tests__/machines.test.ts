import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CROPS, LEVELS, MACHINES, SPECIES, WATER_PER_PLOT, type MachineId } from '../data';
import { emptyPlot, initialState, migrate, useGame, type Animal, type GameState, type Plot } from '../store';

/** Machines and robots doing chores, and catching a chosen number of fish. */

const T0 = 1_000_000_000_000;
let now = T0;
const S = () => useGame.getState();
const MAX_XP = LEVELS[LEVELS.length - 1];

function start(patch: Partial<GameState> = {}) {
  now = T0;
  useGame.setState({ ...initialState(T0), minutes: 7 * 60, events: [], coins: 100_000, xp: MAX_XP, ...patch });
}
function advance(hours: number) {
  now += hours * 60_000;
  S().tick(now);
}
function own(...ids: MachineId[]) {
  useGame.setState({ machines: Object.fromEntries(ids.map((id) => [id, { on: true }])) });
}
const plot = (crop: Plot['crop'], growth: number, moisture: number, extra: Partial<Plot> = {}): Plot => ({ ...emptyPlot(), crop, growth, moisture, ...extra });
const field = (...plots: Plot[]) => [...plots, ...Array.from({ length: 8 - plots.length }, emptyPlot)];

let n = 0;
const animal = (species: Animal['species'], patch: Partial<Animal> = {}): Animal => ({
  id: `${species}-${n++}`, species, name: `A${n}`, breed: 'T', tag: 'T', bornDay: -100, variant: 0,
  fullness: 100, health: 100, happiness: 100, product: 0, pregnantSince: null, sickHours: 0, warnedSick: false, ...patch,
});

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  start();
});
afterEach(() => vi.restoreAllMocks());

describe('buying machines', () => {
  it('costs its price once, switches it on, and needs the level', () => {
    start({ xp: 0 });
    S().buyMachine('harvester');
    expect(S().machines.harvester).toBeUndefined();
    start();
    S().buyMachine('harvester');
    expect(S().machines.harvester).toEqual({ on: true });
    expect(S().coins).toBe(100_000 - MACHINES.harvester.price);
    S().buyMachine('harvester');
    expect(S().coins).toBe(100_000 - MACHINES.harvester.price);
  });

  it('a switched-off machine does nothing', () => {
    start({ fields: { ...initialState().fields, corn: field(plot('corn', 1, 70)) } });
    own('harvester');
    S().toggleMachine('harvester');
    expect(S().machines.harvester?.on).toBe(false);
    advance(1);
    expect(S().fields.corn[0].crop).toBe('corn');
  });
});

describe('field machines', () => {
  it('the sprinkler waters drying plots from the tank', () => {
    start({ tank: 500, fields: { ...initialState().fields, corn: field(plot('corn', 0.2, 20)) } });
    own('sprinkler');
    advance(1);
    expect(S().fields.corn[0].moisture).toBeGreaterThan(90);
    expect(S().tank).toBeLessThanOrEqual(500 - WATER_PER_PLOT);
  });

  it('the sprinkler stops, and says so once, when the tank is empty', () => {
    start({ tank: 0, fields: { ...initialState().fields, corn: field(plot('corn', 0.2, 20), plot('corn', 0.2, 20)) } });
    own('sprinkler');
    advance(1);
    advance(1);
    expect(S().events.filter((e) => /Otomatik sulama durdu/.test(e.text))).toHaveLength(1);
  });

  it('the weeder pulls weeds', () => {
    start({ fields: { ...initialState().fields, corn: field(plot('corn', 0.2, 80, { weeds: true })) } });
    own('weeder');
    advance(1);
    expect(S().fields.corn[0].weeds).toBe(false);
  });

  it('the harvester picks ripe crops into the barn', () => {
    start({ inventory: {}, fields: { ...initialState().fields, corn: field(plot('corn', 1, 80), plot('corn', 0.5, 80)) } });
    own('harvester');
    advance(1);
    expect(S().inventory.corn).toBe(CROPS.corn.yield);
    expect(S().fields.corn[0].crop).toBeNull();
    expect(S().fields.corn[1].crop).toBe('corn');
  });

  it('the planter sows the same crop again where seeds allow', () => {
    start({ inventory: { seed_corn: 1 }, fields: { ...initialState().fields, corn: field(plot('corn', 1, 80), plot('corn', 1, 80)) } });
    own('harvester', 'planter');
    advance(1);
    expect(S().fields.corn.slice(0, 2).map((p) => p.crop)).toEqual(['corn', null]);
    expect(S().inventory.seed_corn).toBe(0);
    expect(S().events.some((e) => /mısır tohumu bitti/.test(e.text))).toBe(true);
  });

  it('a hand harvest is remembered for the planter too', () => {
    start({ inventory: { seed_corn: 2 }, fields: { ...initialState().fields, corn: field(plot('corn', 1, 80)) } });
    S().harvest('corn', 0);
    expect(S().fields.corn[0].lastCrop).toBe('corn');
    own('planter');
    advance(1);
    expect(S().fields.corn[0].crop).toBe('corn');
  });
});

describe('animal machines', () => {
  it('the feeder feeds hungry animals at meal times, from the barn', () => {
    start({ minutes: 7 * 60, inventory: { hay: 20 }, animals: [animal('cow', { fullness: 30 })] });
    own('feeder');
    advance(1);
    expect(S().animals[0].fullness).toBeGreaterThan(90);
    expect(S().inventory.hay).toBe(20 - SPECIES.cow.ration);
  });

  it('the feeder waits for breakfast', () => {
    start({ minutes: 1 * 60, inventory: { hay: 20 }, animals: [animal('cow', { fullness: 50 })] });
    own('feeder');
    advance(1);
    expect(S().inventory.hay).toBe(20);
  });

  it('the collector gathers produce, the cleaner keeps the barn clean', () => {
    start({ inventory: {}, barnClean: 30, animals: [animal('chicken', { product: 1 })] });
    own('collector', 'cleaner');
    advance(1);
    expect(S().inventory.egg).toBe(SPECIES.chicken.productAmount);
    expect(S().barnClean).toBeGreaterThan(90);
  });
});

describe('water machines', () => {
  it('the fish feeder feeds hungry fish, the filter cleans, the solar pump fills by day', () => {
    start({ minutes: 9 * 60, tank: 100, inventory: { fish_feed: 4 }, pond: { batches: [{ id: 'a', species: 'carp', count: 3, growth: 0.3 }], quality: 50, fullness: 20 } });
    own('fish_feeder', 'pond_filter', 'solar_pump');
    advance(2);
    expect(S().pond.fullness).toBeGreaterThan(80);
    expect(S().inventory.fish_feed).toBe(2);
    expect(S().pond.quality).toBeGreaterThan(50);
    expect(S().tank).toBeGreaterThan(100);
  });

  it('the solar pump rests at night', () => {
    start({ minutes: 20 * 60, tank: 100 }); // stays inside day 1, which is dry
    own('solar_pump');
    advance(2);
    expect(S().tank).toBe(100);
  });
});

describe('catching fish', () => {
  it('takes as many as asked, leaving the rest to grow on and breed', () => {
    start({ inventory: {}, pond: { batches: [{ id: 'a', species: 'carp', count: 6, growth: 1 }], quality: 90, fullness: 90 } });
    S().catchFish('a', 2);
    expect(S().inventory.fish_carp).toBe(2);
    expect(S().pond.batches[0].count).toBe(4);
    S().catchFish('a', 99);
    expect(S().inventory.fish_carp).toBe(6);
    expect(S().pond.batches).toHaveLength(0);
  });

  it('with no number given, takes the whole batch', () => {
    start({ inventory: {}, pond: { batches: [{ id: 'a', species: 'carp', count: 3, growth: 1 }], quality: 90, fullness: 90 } });
    S().catchFish('a');
    expect(S().inventory.fish_carp).toBe(3);
  });
});

describe('old saves', () => {
  it('a version-3 save loads with no machines', () => {
    const s = migrate({ ...initialState(T0), version: 3, machines: undefined, warned: undefined }, 3);
    expect(s.version).toBe(5);
    expect(s.machines).toEqual({});
    expect(s.warned).toEqual({});
  });
});
