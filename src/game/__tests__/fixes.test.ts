import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BARN_CAPACITY, COOP_CAPACITY, FACILITIES, POWER, SUN } from '../data';
import { emptyPlot, initialState, migrate, powerMade, repair, SAVE_KEY, SAVE_VERSION, useGame, type Animal, type GameState, type Plot } from '../store';
import { farmHealth } from '../selectors';

/** Things a full check of the game turned up, each kept fixed. */

const T0 = 1_000_000_000_000;
const S = () => useGame.getState();
let n = 0;
const animal = (species: Animal['species'], patch: Partial<Animal> = {}): Animal => ({
  id: `${species}-t${n++}`, species, name: `A${n}`, breed: 'T', tag: 'T', bornDay: -100, variant: 0,
  fullness: 100, health: 100, happiness: 100, product: 0, pregnantSince: null, sickHours: 0, warnedSick: false, ...patch,
});
const plot = (patch: Partial<Plot>): Plot => ({ ...emptyPlot(), ...patch });

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  useGame.setState({ ...initialState(T0), events: [], coins: 100_000, xp: 100_000 });
});
afterEach(() => vi.restoreAllMocks());

describe('fixes', () => {
  it('panels still make power in the evening sun, and peak at 13:00', () => {
    useGame.setState({ power: { ...S().power, panels: 1 } });
    expect(powerMade(S(), 19 * 60 + 40)).toBeGreaterThan(0);
    expect(powerMade(S(), 13 * 60)).toBeCloseTo(POWER.panel.kwh * SUN.sunny);
  });

  it('a calf on the way holds its place in the barn', () => {
    useGame.setState({ animals: [...Array.from({ length: BARN_CAPACITY - 1 }, () => animal('sheep')), animal('cow', { pregnantSince: 0 })] });
    S().buyAnimal('goat');
    expect(S().animals).toHaveLength(BARN_CAPACITY);
  });

  it('a full coop never hatches a negative number of chicks', () => {
    useGame.setState({
      animals: Array.from({ length: COOP_CAPACITY + 3 }, () => animal('chicken')),
      incubator: [{ id: 'tray', eggs: 6, readyAt: S().minutes }],
    });
    S().tick(T0 + 60_000);
    expect(S().animals.filter((a) => a.species === 'chicken')).toHaveLength(COOP_CAPACITY + 3);
    expect(S().log.every((l) => l.births >= 0)).toBe(true);
  });

  it('fertilizer does nothing for a crop already ripe', () => {
    useGame.setState({ inventory: { fertilizer: 1 }, fields: { ...S().fields, corn: [plot({ crop: 'corn', growth: 1, moisture: 80 }), ...S().fields.corn.slice(1)] } });
    S().fertilize('corn', 0);
    expect(S().fields.corn[0].fertilized).toBe(false);
    expect(S().inventory.fertilizer).toBe(1);
  });

  it('the market buys only seeds and supplies, in whole numbers', () => {
    const coins = S().coins;
    S().buy('tomato', 5);
    S().buy('seed_tomato', -3);
    S().buy('seed_tomato', 1.5);
    expect(S().coins).toBe(coins);
    expect(S().inventory.tomato ?? 0).toBe(0);
  });

  it('a clock that jumps back does not freeze the farm', () => {
    useGame.setState({ lastReal: T0 });
    S().tick(T0 - 3_600_000);
    expect(S().lastReal).toBe(T0 - 3_600_000);
    const minutes = S().minutes;
    S().tick(T0 - 3_600_000 + 120_000);
    expect(S().minutes).toBeGreaterThan(minutes);
  });

  it('a surplus pays off an old electricity bill first', () => {
    useGame.setState({ minutes: 24 * 60 - 1, lastReal: T0, power: { panels: 0, turbines: 0, used: 0, made: 100, unpaid: 10, history: [] } });
    const coins = S().coins;
    S().tick(T0 + 120_000);
    expect(S().power.unpaid).toBe(0);
    expect(S().coins).toBe(coins + Math.round(100 * POWER.sell) - 10);
  });

  it('the planter turns to another seed when the old one runs out', () => {
    useGame.setState({
      machines: { planter: { on: true } },
      inventory: { seed_wheat: 1 },
      fields: { ...S().fields, corn: [plot({ lastCrop: 'tomato' }), ...Array.from({ length: 7 }, () => plot({ crop: 'corn', growth: 0.5, moisture: 80 }))] },
      lastReal: T0,
    });
    S().tick(T0 + 120_000);
    expect(S().fields.corn[0].crop).toBe('wheat');
  });

  it('bare soil does not drag the farm health down', () => {
    useGame.setState({ fields: { ...S().fields, tomatoes: [], vegetables: [], corn: [] }, land: {}, animals: [], barnClean: 100, pond: { ...S().pond, batches: [] } });
    expect(farmHealth(S())).toBe(100);
  });

  it('hens that shared the barn get a coop big enough when the save is loaded', () => {
    const old = initialState(T0);
    const hens = Array.from({ length: 30 }, () => animal('chicken'));
    const s = migrate({ ...old, version: 8, animals: hens, upgrades: { ...old.upgrades, coop: 0 } } as unknown as GameState, 8);
    expect(s.upgrades.coop).toBe(1);
    expect(FACILITIES.coop.steps[0].capacity).toBeGreaterThanOrEqual(30);
  });
});

describe('saves from elsewhere', () => {
  it('an old save, from before land had uses, keeps the starting land even where nothing grew', () => {
    const old = initialState(T0) as unknown as Record<string, unknown>;
    delete old.land;
    const fields = { ...(old.fields as GameState['fields']), tomatoes: [], vegetables: [] };
    const s = migrate({ ...old, fields, version: 5 } as unknown as GameState, 5);
    expect(s.land.tomatoes).toBe('empty');
    expect(s.land.vegetables).toBe('empty');
    expect(s.land.corn).toBe('field');
  });

  it('a save missing its starting land is mended on load, whatever its version', () => {
    const broken = { ...initialState(T0), land: { east: 'field' as const }, fields: { ...initialState(T0).fields, tomatoes: [], east: [] } };
    const s = repair(broken);
    expect(s.land.tomatoes).toBe('empty');
    expect(s.land.vegetables).toBe('field');
    expect(s.fields.east).toHaveLength(8);
    expect(repair({ ...initialState(T0), land: { ...initialState(T0).land, corn: 'solar' } }).fields.corn).toEqual([]);
  });

  it('an older copy of the game cannot write over a newer save', async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ state: { coins: 1 }, version: SAVE_VERSION + 1 }));
    useGame.setState({ coins: 777 });
    await new Promise((r) => setTimeout(r, 10));
    expect(JSON.parse((await AsyncStorage.getItem(SAVE_KEY))!).state.coins).toBe(1);
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ state: { coins: 1 }, version: SAVE_VERSION - 1 }));
    useGame.setState({ coins: 778 });
    await new Promise((r) => setTimeout(r, 10));
    expect(JSON.parse((await AsyncStorage.getItem(SAVE_KEY))!).state.coins).toBe(778);
  });
});
