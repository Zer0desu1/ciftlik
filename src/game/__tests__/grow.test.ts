import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_AREA, BASE_PLOTS, FACILITIES, FIELD_EXPANSIONS, FIELDS, LAND_AREA, LEVELS } from '../data';
import {
  barnCapacity,
  farmArea,
  fieldLevel,
  initialState,
  migrate,
  ownedFields,
  pondCapacity,
  tankCapacity,
  useGame,
  type Animal,
  type GameState,
} from '../store';

/** Growing the farm: wider fields and bigger buildings. */

const T0 = 1_000_000_000_000;
let now = T0;
const S = () => useGame.getState();
function start(patch: Partial<GameState> = {}) {
  now = T0;
  useGame.setState({ ...initialState(T0), minutes: 0, events: [], ...patch });
}
function advance(hours: number) {
  now += hours * 60_000;
  S().tick(now);
}
const RICH = 100_000;
const MAX_XP = LEVELS[LEVELS.length - 1];

let n = 0;
const animal = (species: Animal['species']): Animal => ({
  id: `${species}-${n++}`, species, name: `A${n}`, breed: 'T', tag: 'T', bornDay: -100, variant: 0,
  fullness: 100, health: 100, happiness: 100, product: 0, pregnantSince: null, sickHours: 0, warnedSick: false,
});

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  start();
});
afterEach(() => vi.restoreAllMocks());

describe('fields', () => {
  it('start at eight plots and grow a row of four per expansion, for coins', () => {
    start({ coins: RICH, xp: MAX_XP });
    expect(S().fields.corn).toHaveLength(BASE_PLOTS);
    expect(fieldLevel(S(), 'corn')).toBe(0);
    S().expandField('corn');
    expect(S().fields.corn).toHaveLength(BASE_PLOTS + 4);
    expect(S().fields.corn.slice(BASE_PLOTS).every((p) => p.crop === null)).toBe(true);
    expect(S().coins).toBe(RICH - FIELD_EXPANSIONS[0].cost);
    S().expandField('corn');
    expect(S().fields.corn).toHaveLength(BASE_PLOTS + 8);
    expect(fieldLevel(S(), 'corn')).toBe(2);
  });

  it('stop at the largest size', () => {
    start({ coins: RICH, xp: MAX_XP });
    for (let i = 0; i < 5; i++) S().expandField('tomatoes');
    expect(S().fields.tomatoes).toHaveLength(BASE_PLOTS + 8);
    expect(S().coins).toBe(RICH - FIELD_EXPANSIONS[0].cost - FIELD_EXPANSIONS[1].cost);
  });

  it('need the level and the coins', () => {
    start({ coins: RICH, xp: 0 });
    S().expandField('corn');
    S().expandField('corn');
    expect(S().fields.corn).toHaveLength(BASE_PLOTS + 4); // the second step needs a higher level
    start({ coins: 10, xp: MAX_XP });
    S().expandField('corn');
    expect(S().fields.corn).toHaveLength(BASE_PLOTS);
  });

  it('new plots can be planted and grow like the rest', () => {
    start({ coins: RICH, xp: MAX_XP, inventory: { seed_wheat: 1 } });
    S().expandField('corn');
    S().plant('corn', BASE_PLOTS + 2, 'wheat');
    S().water('corn', BASE_PLOTS + 2);
    advance(2);
    expect(S().fields.corn[BASE_PLOTS + 2].growth).toBeGreaterThan(0);
  });
});

describe('buildings', () => {
  it('each building grows step by step to its largest size', () => {
    start({ coins: RICH, xp: MAX_XP });
    for (const id of ['barn', 'pond', 'tank'] as const) {
      const f = FACILITIES[id];
      const read = { barn: barnCapacity, pond: pondCapacity, tank: tankCapacity }[id];
      expect(read(S())).toBe(f.base);
      S().upgrade(id);
      expect(read(S())).toBe(f.steps[0].capacity);
      S().upgrade(id);
      S().upgrade(id);
      expect(read(S())).toBe(f.steps[f.steps.length - 1].capacity);
      expect(S().upgrades[id]).toBe(f.steps.length);
    }
  });

  it('a bigger barn takes more animals', () => {
    start({ coins: RICH, xp: MAX_XP, animals: Array.from({ length: FACILITIES.barn.base }, () => animal('chicken')) });
    S().buyAnimal('chicken');
    expect(S().animals).toHaveLength(FACILITIES.barn.base);
    S().upgrade('barn');
    S().buyAnimal('chicken');
    expect(S().animals).toHaveLength(FACILITIES.barn.base + 1);
  });

  it('a bigger pond takes more fish', () => {
    start({ coins: RICH, xp: MAX_XP, pond: { batches: [{ id: 'a', species: 'carp', count: FACILITIES.pond.base, growth: 0 }], quality: 90, fullness: 90 } });
    S().stockFish('carp', 5);
    expect(S().pond.batches).toHaveLength(1);
    S().upgrade('pond');
    S().stockFish('carp', 5);
    expect(S().pond.batches.reduce((sum, b) => sum + b.count, 0)).toBe(FACILITIES.pond.base + 5);
  });

  it('a bigger tank holds more water', () => {
    start({ coins: RICH, xp: MAX_XP, tank: FACILITIES.tank.base });
    S().pump();
    expect(S().tank).toBe(FACILITIES.tank.base);
    S().upgrade('tank');
    S().pump();
    expect(S().tank).toBeGreaterThan(FACILITIES.tank.base);
    expect(S().tank).toBeLessThanOrEqual(FACILITIES.tank.steps[0].capacity);
  });

  it('need the level', () => {
    start({ coins: RICH, xp: 0 });
    S().upgrade('barn');
    expect(S().upgrades.barn).toBe(0);
    expect(S().coins).toBe(RICH);
  });
});

describe('land', () => {
  const east = FIELDS.find((f) => f.id === 'east')!;

  it('starts with only the three home fields; the parcels around are for sale', () => {
    start();
    expect(ownedFields(S()).map((f) => f.id)).toEqual(['tomatoes', 'vegetables', 'corn']);
    expect(FIELDS.filter((f) => f.land).every((f) => S().fields[f.id].length === 0)).toBe(true);
  });

  it('buying a parcel makes it a field of empty plots, ready to plant, and grows the farm', () => {
    start({ coins: east.land!.price });
    const area = farmArea(S());
    S().buyLand('east');
    expect(S().coins).toBe(0);
    expect(S().fields.east).toHaveLength(BASE_PLOTS);
    expect(S().fields.east.every((p) => p.crop === null)).toBe(true);
    expect(farmArea(S())).toBe(area + LAND_AREA);
    useGame.setState({ inventory: { ...S().inventory, seed_wheat: 1 } });
    S().plant('east', 0, 'wheat');
    expect(S().fields.east[0].crop).toBe('wheat');
  });

  it('cannot be bought without the coins or the level, nor twice', () => {
    start({ coins: east.land!.price - 1 });
    S().buyLand('east');
    expect(S().fields.east).toHaveLength(0);
    const far = FIELDS.find((f) => f.id === 'far')!;
    start({ coins: RICH, xp: 0 });
    S().buyLand('far');
    expect(S().fields.far).toHaveLength(0);
    expect(S().events[0].text).toBe(`Bu arazi için seviye ${far.land!.level} gerekli.`);
    start({ coins: RICH });
    S().buyLand('east');
    S().buyLand('east');
    expect(S().coins).toBe(RICH - east.land!.price);
  });

  it('land not yet bought cannot be widened', () => {
    start({ coins: RICH, xp: MAX_XP });
    S().expandField('east');
    expect(S().fields.east).toHaveLength(0);
  });

  it('a version-4 save gets the land around it, unbought', () => {
    const old = { ...initialState(T0), version: 4 } as unknown as GameState;
    const fields = { tomatoes: old.fields.tomatoes, vegetables: old.fields.vegetables, corn: old.fields.corn };
    const s = migrate({ ...old, fields }, 4);
    expect(s.fields.far).toEqual([]);
    expect(s.fields.tomatoes).toHaveLength(BASE_PLOTS);
  });
});

describe('the farm', () => {
  it('grows in area with every expansion', () => {
    start({ coins: RICH, xp: MAX_XP });
    expect(farmArea(S())).toBe(BASE_AREA);
    S().expandField('corn');
    S().upgrade('barn');
    expect(farmArea(S())).toBeGreaterThan(BASE_AREA);
  });

  it('a version-2 save loads as it was built', () => {
    const v2 = { ...initialState(T0), version: 2, upgrades: undefined };
    const s = migrate(v2, 2);
    expect(s.version).toBe(5);
    expect(s.upgrades).toEqual({ barn: 0, pond: 0, tank: 0 });
    expect(barnCapacity(s)).toBe(FACILITIES.barn.base);
  });
});
