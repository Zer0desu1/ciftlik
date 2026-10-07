import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clockLabel, dayOf, hourOf, weatherFor } from '../clock';
import { CROPS, FISH, HUNGER_PER_HOUR, POND_CAPACITY, SPECIES, TANK_CAPACITY, WATER_PER_PLOT, WEATHER } from '../data';
import { farmHealth, plotStage, summarizeField, tasks } from '../selectors';
import {
  buyPrice,
  emptyPlot,
  initialState,
  levelOf,
  priceMultiplier,
  sellPrice,
  useGame,
  type Animal,
  type GameState,
  type Plot,
} from '../store';

const T0 = 1_000_000_000_000;
const HOUR_MS = 60_000; // one game hour is one real minute

/** Starts every test from a known farm at the given game time (default day 1, 00:00, sunny). */
function start(patch: Partial<GameState> = {}) {
  useGame.setState({ ...initialState(T0), minutes: 0, events: [], ...patch });
}

let now = T0;
/** Moves the clock forward by `hours` game hours through the real tick path. */
function advance(hours: number) {
  now += hours * HOUR_MS;
  useGame.getState().tick(now);
}

const S = () => useGame.getState();
const plot = (crop: Plot['crop'], growth: number, moisture: number, extra: Partial<Plot> = {}): Plot => ({
  ...emptyPlot(),
  crop,
  growth,
  moisture,
  ...extra,
});

function animal(species: Animal['species'], patch: Partial<Animal> = {}): Animal {
  return {
    id: `${species}-${Math.random()}`,
    species,
    name: 'Test',
    breed: 'Test',
    tag: 'T-1',
    bornDay: -100,
    variant: 0,
    fullness: 100,
    health: 100,
    happiness: 100,
    product: 0,
    pregnantSince: null,
    sickHours: 0,
    warnedSick: false,
    ...patch,
  };
}

function firstDay(kind: 'rain' | 'sunny'): number {
  for (let d = 2; d < 500; d++) if (WEATHER[weatherFor(d).kind].rain === (kind === 'rain')) return d;
  throw new Error('no such day');
}

beforeEach(() => {
  now = T0;
  // No surprise weeds or fish deaths unless a test asks for them.
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  start();
});

afterEach(() => vi.restoreAllMocks());

describe('clock', () => {
  it('turns game minutes into day, hour and a clock face', () => {
    expect(dayOf(0)).toBe(1);
    expect(dayOf(24 * 60)).toBe(2);
    expect(hourOf(90)).toBe(1.5);
    expect(clockLabel(6 * 60 + 5)).toBe('06:05');
  });

  it('keeps a day’s weather the same every time it is asked, and day one fair', () => {
    expect(weatherFor(7)).toEqual(weatherFor(7));
    expect(weatherFor(1).kind).toBe('sunny');
  });

  it('runs one game hour per real minute, ignores sub-minute ticks and caps catch-up at 48 hours', () => {
    advance(1);
    expect(S().minutes).toBeCloseTo(60);
    now += 500; // half a real second: under one game minute
    S().tick(now);
    expect(S().minutes).toBeCloseTo(60);
    now += 1000 * HOUR_MS;
    S().tick(now);
    expect(S().minutes).toBeCloseTo(60 + 48 * 60);
  });

  it('starts a new day: meals reset, a log row and an event appear', () => {
    start({ minutes: 23 * 60, meals: { day: 1, done: [true, true, true] } });
    advance(2);
    expect(dayOf(S().minutes)).toBe(2);
    expect(S().meals).toEqual({ day: 2, done: [false, false, false] });
    expect(S().log.some((l) => l.day === 2)).toBe(true);
    expect(S().events[0].text).toMatch(/2\. gün başladı/);
  });

  it('sleeps until 06:00 the next morning', () => {
    start({ minutes: 20 * 60 });
    S().sleep();
    expect(dayOf(S().minutes)).toBe(2);
    expect(hourOf(S().minutes)).toBeCloseTo(6);
  });
});

describe('fields', () => {
  it('plants a seed into an empty plot only, using one seed and giving xp', () => {
    start({ inventory: { seed_lettuce: 2 }, xp: 0 });
    S().plant('vegetables', 7, 'lettuce');
    expect(S().fields.vegetables[7].crop).toBe('lettuce');
    expect(S().inventory.seed_lettuce).toBe(1);
    expect(S().xp).toBe(1);
    S().plant('vegetables', 7, 'lettuce');
    expect(S().inventory.seed_lettuce).toBe(1);
  });

  it('refuses to plant without a seed and says so', () => {
    start({ inventory: {} });
    S().plant('vegetables', 7, 'lettuce');
    expect(S().fields.vegetables[7].crop).toBeNull();
    expect(S().events[0].tone).toBe('bad');
  });

  it('waters a plot from the tank, and not an empty or dead one', () => {
    start({ tank: 500 });
    S().fields.tomatoes[0] = plot('tomato', 0.3, 20);
    useGame.setState({ fields: { ...S().fields } });
    S().water('tomatoes', 0);
    expect(S().fields.tomatoes[0].moisture).toBe(100);
    expect(S().tank).toBe(500 - WATER_PER_PLOT);
    S().water('tomatoes', 7);
    expect(S().tank).toBe(500 - WATER_PER_PLOT);
  });

  it('cannot water with an empty tank', () => {
    start({ tank: 10 });
    useGame.setState({ fields: { ...S().fields, tomatoes: [plot('tomato', 0.3, 20), ...S().fields.tomatoes.slice(1)] } });
    S().water('tomatoes', 0);
    expect(S().fields.tomatoes[0].moisture).toBe(20);
    expect(S().events[0].tone).toBe('bad');
  });

  it('waters a whole field, skipping moist plots and stopping when the tank runs dry', () => {
    const plots = [plot('corn', 0.2, 20), plot('corn', 0.2, 95), plot('corn', 0.2, 20), plot('corn', 0.2, 20), ...Array(4).fill(emptyPlot())];
    start({ tank: WATER_PER_PLOT * 2, fields: { ...initialState().fields, corn: plots } });
    S().waterField('corn');
    const m = S().fields.corn.map((p) => p.moisture);
    expect(m.slice(0, 4)).toEqual([100, 95, 100, 20]);
    expect(S().tank).toBe(0);
  });

  it('grows a moist plant by 1/growHours per hour', () => {
    start({ fields: { ...initialState().fields, vegetables: [plot('lettuce', 0, 100), ...Array(7).fill(emptyPlot())] } });
    advance(3);
    expect(S().fields.vegetables[0].growth).toBeCloseTo(3 / CROPS.lettuce.growHours, 5);
    expect(S().fields.vegetables[0].moisture).toBeLessThan(100);
  });

  it('stops growing when dry and dies after 18 dry hours', () => {
    start({ fields: { ...initialState().fields, vegetables: [plot('lettuce', 0.5, 5), ...Array(7).fill(emptyPlot())] } });
    advance(10);
    expect(S().fields.vegetables[0].growth).toBe(0.5);
    expect(S().fields.vegetables[0].dead).toBe(false);
    advance(9);
    expect(S().fields.vegetables[0].dead).toBe(true);
  });

  it('grows at half speed with weeds, and pulling them restores it', () => {
    start({ fields: { ...initialState().fields, corn: [plot('wheat', 0, 100, { weeds: true }), ...Array(7).fill(emptyPlot())] } });
    advance(2);
    expect(S().fields.corn[0].growth).toBeCloseTo((2 / CROPS.wheat.growHours) * 0.5, 5);
    S().weed('corn', 0);
    expect(S().fields.corn[0].weeds).toBe(false);
  });

  it('grows faster and yields half again with fertilizer, using one bag', () => {
    start({ inventory: { fertilizer: 1 }, fields: { ...initialState().fields, corn: [plot('wheat', 0, 100), ...Array(7).fill(emptyPlot())] } });
    S().fertilize('corn', 0);
    expect(S().inventory.fertilizer).toBe(0);
    advance(2);
    expect(S().fields.corn[0].growth).toBeCloseTo((2 / CROPS.wheat.growHours) * 1.3, 5);
    useGame.setState({ fields: { ...S().fields, corn: [{ ...S().fields.corn[0], growth: 1 }, ...S().fields.corn.slice(1)] } });
    S().harvest('corn', 0);
    expect(S().inventory.wheat).toBe(Math.round(CROPS.wheat.yield * 1.5));
  });

  it('harvests a ripe plot into the barn, clears it, logs it and gives xp', () => {
    start({ inventory: {}, xp: 0, fields: { ...initialState().fields, tomatoes: [plot('tomato', 1, 70), plot('tomato', 0.5, 70), ...Array(6).fill(emptyPlot())] } });
    S().harvest('tomatoes', 1);
    expect(S().inventory.tomato).toBeUndefined();
    S().harvest('tomatoes', 0);
    expect(S().inventory.tomato).toBe(CROPS.tomato.yield);
    expect(S().fields.tomatoes[0].crop).toBeNull();
    expect(S().log.find((l) => l.day === 1)!.crops).toBe(CROPS.tomato.yield);
    expect(S().xp).toBe(Math.round(CROPS.tomato.growHours / 2));
  });

  it('harvests every ripe plot in a field at once', () => {
    start({ inventory: {}, fields: { ...initialState().fields, corn: [plot('corn', 1, 70), plot('corn', 1, 70), plot('corn', 0.4, 70), ...Array(5).fill(emptyPlot())] } });
    S().harvestField('corn');
    expect(S().inventory.corn).toBe(CROPS.corn.yield * 2);
    expect(S().fields.corn[2].crop).toBe('corn');
  });

  it('rots a ripe crop left for 36 hours, and a dead plot can be cleared', () => {
    start({ fields: { ...initialState().fields, corn: [plot('corn', 1, 100), ...Array(7).fill(emptyPlot())] } });
    advance(35);
    expect(S().fields.corn[0].dead).toBe(false);
    advance(2);
    expect(S().fields.corn[0].dead).toBe(true);
    S().harvest('corn', 0);
    expect(S().inventory.corn).toBeUndefined();
    S().clearPlot('corn', 0);
    expect(S().fields.corn[0]).toMatchObject({ crop: null, dead: false });
  });

  it('tidies a whole field at once: dead plants out, weeds pulled, live crops left alone', () => {
    start({ fields: { ...initialState().fields, corn: [plot('corn', 0.4, 0, { dead: true }), plot('wheat', 0.3, 60, { weeds: true }), plot('corn', 0.5, 60), plot('corn', 0.1, 0, { dead: true }), ...Array(4).fill(emptyPlot())] } });
    S().tidyField('corn');
    const f = S().fields.corn;
    expect(f.map((p) => p.crop)).toEqual([null, 'wheat', 'corn', null, null, null, null, null]);
    expect(f.some((p) => p.dead || p.weeds)).toBe(false);
    expect(f[2].growth).toBe(0.5);
    expect(S().events[0].text).toBe('2 ölü bitki ve 1 parselin otu temizlendi.');
  });

  it('lets weeds spring up by chance on growing plots', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    start({ fields: { ...initialState().fields, corn: [plot('corn', 0.2, 100), ...Array(7).fill(emptyPlot())] } });
    advance(1);
    expect(S().fields.corn[0].weeds).toBe(true);
  });

  it('on a rainy day soaks every field and fills the tank', () => {
    const rainDay = firstDay('rain');
    start({ minutes: (rainDay - 1) * 24 * 60, tank: 100, fields: { ...initialState().fields, corn: [plot('corn', 0.2, 20), ...Array(7).fill(emptyPlot())] } });
    advance(3);
    expect(S().fields.corn[0].moisture).toBe(100);
    expect(S().tank).toBeGreaterThan(100);
    expect(S().tank).toBeLessThanOrEqual(TANK_CAPACITY);
  });

  it('reports field state for the screens', () => {
    const plots = [plot('corn', 1, 70), plot('corn', 0.3, 10), plot('corn', 0.3, 70, { weeds: true }), plot('corn', 0, 0, { dead: true }), emptyPlot(), emptyPlot(), emptyPlot(), emptyPlot()];
    expect(summarizeField(plots)).toMatchObject({ planted: 3, empty: 4, ripe: 1, thirsty: 1, weeds: 1, dead: 1 });
    expect(plots.map(plotStage)).toEqual([4, 2, 2, 1, 0, 0, 0, 0]);
  });
});

describe('animals', () => {
  it('get hungry slowly: fed in the evening, still half full by breakfast', () => {
    start({ animals: [animal('cow')] });
    advance(5);
    expect(S().animals[0].fullness).toBeCloseTo(100 - 5 * HUNGER_PER_HOUR);
    advance(7); // 12 hours, an evening meal to breakfast
    expect(S().animals[0].fullness).toBeGreaterThan(50);
  });

  it('eat their ration from the barn when fed, and only the hungry ones eat', () => {
    start({ inventory: { hay: 10 }, animals: [animal('cow', { fullness: 40 }), animal('cow', { fullness: 99 })] });
    S().feedSpecies('cow');
    expect(S().animals.map((a) => a.fullness)).toEqual([100, 99]);
    expect(S().inventory.hay).toBe(10 - SPECIES.cow.ration);
  });

  it('feed as many as the feed allows and say it ran short', () => {
    start({ inventory: { grain: 1 }, animals: [animal('chicken', { fullness: 10 }), animal('chicken', { fullness: 10 })] });
    S().feedSpecies('chicken');
    expect(S().animals.map((a) => a.fullness)).toEqual([100, 10]);
    expect(S().events[0].tone).toBe('bad');
  });

  it('mark a meal served only once the whole herd is fed in its slot', () => {
    start({ minutes: 7 * 60, inventory: { hay: 50, grain: 50 }, animals: [animal('cow', { fullness: 10 }), animal('chicken', { fullness: 10 })] });
    S().feedSpecies('cow');
    expect(S().meals.done[0]).toBe(false);
    S().feedSpecies('chicken');
    expect(S().meals.done).toEqual([true, false, false]);
  });

  it('count no meal before breakfast', () => {
    start({ minutes: 4 * 60, inventory: { hay: 50 }, animals: [animal('cow', { fullness: 10 })] });
    S().feedAll();
    expect(S().meals.done).toEqual([false, false, false]);
  });

  it('make their product while fed and well, and stop when hungry', () => {
    start({ animals: [animal('chicken', { fullness: 100 }), animal('chicken', { fullness: 0 })] });
    advance(4);
    expect(S().animals[0].product).toBeGreaterThan(0.4);
    expect(S().animals[1].product).toBe(0);
  });

  it('hand over their product when it is ready, logging it and giving xp', () => {
    start({ inventory: {}, xp: 0, animals: [animal('cow', { product: 1 }), animal('cow', { product: 0.5 })] });
    S().collect('cow');
    expect(S().inventory.milk).toBe(SPECIES.cow.productAmount);
    expect(S().animals.map((a) => a.product)).toEqual([0, 0.5]);
    expect(S().log.find((l) => l.day === 1)!.produce).toBe(SPECIES.cow.productAmount);
    expect(S().xp).toBe(SPECIES.cow.productAmount);
  });

  it('lose health when starving, and faster in a dirty barn', () => {
    start({ barnClean: 100, animals: [animal('goat', { fullness: 0, health: 80 })] });
    advance(2);
    const starving = S().animals[0].health;
    expect(starving).toBeLessThan(80);
    start({ barnClean: 0, animals: [animal('goat', { fullness: 0, health: 80 })] });
    now = T0;
    advance(2);
    expect(S().animals[0].health).toBeLessThan(starving);
  });

  it('get a clean barn, medicine and a pat', () => {
    start({ barnClean: 20, inventory: { medicine: 1 }, animals: [animal('sheep', { health: 40, happiness: 50 })] });
    S().cleanBarn();
    expect(S().barnClean).toBe(100);
    const id = S().animals[0].id;
    S().heal(id);
    expect(S().animals[0].health).toBe(100);
    expect(S().inventory.medicine).toBe(0);
    S().pet(id);
    expect(S().animals[0].happiness).toBe(68);
  });

  it('cannot be healed without medicine', () => {
    start({ inventory: {}, animals: [animal('sheep', { health: 40 })] });
    S().heal(S().animals[0].id);
    expect(S().animals[0].health).toBe(40);
  });

  it('can be bought with enough coins and sold for part of their price', () => {
    start({ coins: SPECIES.cow.price, animals: [] });
    S().buyAnimal('cow');
    expect(S().animals).toHaveLength(1);
    expect(S().coins).toBe(0);
    S().buyAnimal('cow');
    expect(S().animals).toHaveLength(1);
    const a = S().animals[0];
    S().sellAnimal(a.id);
    expect(S().animals).toHaveLength(0);
    expect(S().coins).toBe(Math.round(SPECIES.cow.price * 0.6 * (a.health / 100)));
  });
});

describe('pond', () => {
  it('feeds the fish with two bags of feed', () => {
    start({ inventory: { fish_feed: 5 }, pond: { batches: [], quality: 80, fullness: 20 } });
    S().feedFish();
    expect(S().pond.fullness).toBe(100);
    expect(S().inventory.fish_feed).toBe(3);
  });

  it('grows fish only while they are fed and the water is clean', () => {
    start({ pond: { batches: [{ id: 'b', species: 'carp', count: 3, growth: 0 }], quality: 90, fullness: 100 } });
    advance(4);
    expect(S().pond.batches[0].growth).toBeCloseTo(4 / FISH.carp.growHours, 5);
    start({ pond: { batches: [{ id: 'b', species: 'carp', count: 3, growth: 0 }], quality: 90, fullness: 0 } });
    now = T0;
    advance(4);
    expect(S().pond.batches[0].growth).toBe(0);
  });

  it('lets only grown fish be caught', () => {
    start({ inventory: {}, pond: { batches: [{ id: 'a', species: 'trout', count: 4, growth: 1 }, { id: 'b', species: 'carp', count: 2, growth: 0.5 }], quality: 90, fullness: 90 } });
    S().catchFish('b');
    expect(S().inventory.fish_carp).toBeUndefined();
    S().catchFish('a');
    expect(S().inventory.fish_trout).toBe(4);
    expect(S().pond.batches.map((b) => b.id)).toEqual(['b']);
  });

  it('stocks fingerlings up to the pond’s capacity, for coins', () => {
    start({ coins: 10_000, pond: { batches: [{ id: 'a', species: 'carp', count: POND_CAPACITY - 2, growth: 0 }], quality: 90, fullness: 90 } });
    S().stockFish('carp', 5);
    expect(S().pond.batches.reduce((n, b) => n + b.count, 0)).toBe(POND_CAPACITY);
    expect(S().coins).toBe(10_000 - 2 * FISH.carp.price);
  });

  it('cleans the water for coins', () => {
    start({ coins: 100, pond: { batches: [], quality: 30, fullness: 50 } });
    S().cleanPond();
    expect(S().pond.quality).toBe(100);
    expect(S().coins).toBe(88);
  });

  it('loses fish in murky water', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    start({ pond: { batches: [{ id: 'a', species: 'carp', count: 3, growth: 0.2 }], quality: 5, fullness: 100 } });
    advance(1);
    expect(S().pond.batches[0].count).toBeLessThan(3);
  });
});

describe('market and money', () => {
  it('buys for the list price and refuses without the coins', () => {
    start({ coins: 20, inventory: {} });
    S().buy('seed_tomato', 2);
    expect(S().inventory.seed_tomato).toBe(2);
    expect(S().coins).toBe(20 - 2 * buyPrice('seed_tomato'));
    S().buy('medicine', 1);
    expect(S().inventory.medicine).toBeUndefined();
  });

  it('sells at the day’s price, never more than is in the barn', () => {
    start({ coins: 0, inventory: { pumpkin: 2 } });
    S().sell('pumpkin', 5);
    expect(S().inventory.pumpkin).toBe(0);
    expect(S().coins).toBe(2 * sellPrice(1, 'pumpkin'));
    expect(S().log.find((l) => l.day === 1)!.income).toBe(S().coins);
  });

  it('sells a whole category at once and leaves the rest', () => {
    start({ coins: 0, inventory: { milk: 2, egg: 4, tomato: 3 } });
    S().sellKind('produce');
    expect(S().inventory).toMatchObject({ milk: 0, egg: 0, tomato: 3 });
    expect(S().coins).toBe(2 * sellPrice(1, 'milk') + 4 * sellPrice(1, 'egg'));
  });

  it('moves prices from day to day but holds them within a day', () => {
    expect(priceMultiplier(3, 'tomato')).toBe(priceMultiplier(3, 'tomato'));
    const days = Array.from({ length: 10 }, (_, i) => sellPrice(i + 1, 'tomato'));
    expect(new Set(days).size).toBeGreaterThan(1);
    days.forEach((p) => expect(p).toBeGreaterThan(0));
  });

  it('runs the pump for coins, up to the tank’s size', () => {
    start({ coins: 100, tank: TANK_CAPACITY - 100 });
    S().pump();
    expect(S().tank).toBe(TANK_CAPACITY);
    expect(S().coins).toBe(92);
  });
});

describe('level locks', () => {
  it('keep locked seeds, animals and fish out of reach until the level is reached', () => {
    start({ xp: 0, coins: 10_000, inventory: {}, animals: [], pond: { batches: [], quality: 90, fullness: 90 } });
    S().buy('seed_pumpkin', 1);
    S().buyAnimal('goat');
    S().stockFish('catfish', 1);
    expect(S().inventory.seed_pumpkin).toBeUndefined();
    expect(S().animals).toHaveLength(0);
    expect(S().pond.batches).toHaveLength(0);
    expect(S().coins).toBe(10_000);
    useGame.setState({ xp: 10_000 });
    S().buy('seed_pumpkin', 1);
    S().buyAnimal('goat');
    S().stockFish('catfish', 1);
    expect(S().inventory.seed_pumpkin).toBe(1);
    expect(S().animals).toHaveLength(1);
    expect(S().pond.batches).toHaveLength(1);
  });
});

describe('progress and the home screen', () => {
  it('levels up at the thresholds and announces it', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(60)).toBe(2);
    start({ xp: 59, inventory: { seed_lettuce: 1 } });
    S().plant('vegetables', 7, 'lettuce');
    expect(levelOf(S().xp)).toBe(2);
    expect(S().events[0].text).toMatch(/Seviye 2/);
  });

  it('scores the farm’s health between 0 and 100, lower when things are neglected', () => {
    const good = farmHealth(initialState());
    const neglected = farmHealth({ ...initialState(), barnClean: 0, animals: initialState().animals.map((a) => ({ ...a, health: 10, fullness: 0 })) });
    expect(good).toBeGreaterThan(neglected);
    [good, neglected].forEach((h) => expect(h).toBeGreaterThanOrEqual(0));
    expect(good).toBeLessThanOrEqual(100);
  });

  it('lists what needs doing, most urgent first', () => {
    const s = { ...initialState(), minutes: 7 * 60 };
    const list = tasks(s);
    expect(list[0].tone).toBe('urgent');
    expect(list.some((t) => t.id === 'ripe-tomatoes')).toBe(true);
  });
});

describe('saving', () => {
  it('stores only data, and brings it back on load', async () => {
    const storage = (await import('./async-storage-mock')).default;
    start({ coins: 777 });
    await new Promise((r) => setTimeout(r, 0));
    const raw = await storage.getItem('ciftlik-save');
    const saved = JSON.parse(raw!).state;
    expect(saved.coins).toBe(777);
    expect(Object.values(saved).some((v) => typeof v === 'function')).toBe(false);
    // Change the farm in memory (which also overwrites the save), put the
    // earlier save back as if the app had been closed, and load it.
    useGame.setState({ coins: 5 });
    await new Promise((r) => setTimeout(r, 0));
    await storage.setItem('ciftlik-save', raw!);
    await useGame.persist.rehydrate();
    expect(S().coins).toBe(777);
    expect(typeof S().tick).toBe('function');
  });
});
