import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dayOf } from '../clock';
import { BARN_CAPACITY, HATCH_HOURS, POND_CAPACITY, SICK_DEATH_HOURS, SPECIES } from '../data';
import { animalValue, dueAt, initialState, isAdult, migrate, useGame, type Animal, type GameState } from '../store';

/**
 * Breeding and dying. Kept apart from game.test.ts because both lean on
 * Math.random and on the long stretches of time a life takes.
 */

const T0 = 1_000_000_000_000;
const HOUR_MS = 60_000;
let now = T0;

function start(patch: Partial<GameState> = {}) {
  now = T0;
  useGame.setState({ ...initialState(T0), minutes: 0, events: [], ...patch });
}
function advance(hours: number) {
  now += hours * HOUR_MS;
  useGame.getState().tick(now);
}
const S = () => useGame.getState();

let n = 0;
function animal(species: Animal['species'], patch: Partial<Animal> = {}): Animal {
  return {
    id: `${species}-${n++}`,
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

const always = () => vi.spyOn(Math, 'random').mockReturnValue(0);

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  start();
});
afterEach(() => vi.restoreAllMocks());

describe('breeding', () => {
  it('a well-kept adult with a partner conceives, and says so', () => {
    always();
    start({ animals: [animal('cow'), animal('cow')] });
    advance(1);
    expect(S().animals.every((a) => a.pregnantSince !== null)).toBe(true);
    expect(S().events.some((e) => /gebe/.test(e.text))).toBe(true);
  });

  it('needs two adults, a full belly and good health, and never happens to chickens', () => {
    always();
    const cases: Animal[][] = [
      [animal('cow')],
      [animal('cow', { fullness: 20 }), animal('cow', { fullness: 20 })],
      [animal('cow', { health: 50 }), animal('cow', { health: 50 })],
      [animal('chicken'), animal('chicken')],
      [animal('cow', { bornDay: 1 }), animal('cow', { bornDay: 1 })],
    ];
    for (const animals of cases) {
      start({ animals });
      advance(1);
      expect(S().animals.every((a) => a.pregnantSince === null)).toBe(true);
    }
  });

  it('stops when the barn is full', () => {
    always();
    start({ animals: Array.from({ length: BARN_CAPACITY }, () => animal('sheep')) });
    advance(1);
    expect(S().animals.every((a) => a.pregnantSince === null)).toBe(true);
  });

  it('gives birth when the time comes: a young one of the same breed joins the herd', () => {
    const gestation = SPECIES.cow.gestationHours!;
    start({ animals: [animal('cow', { name: 'Papatya', breed: 'Jersey', pregnantSince: 0 })] });
    expect(dueAt(S().animals[0])).toBe(gestation * 60);
    advance(gestation - 1);
    expect(S().animals).toHaveLength(1);
    advance(2);
    expect(S().animals).toHaveLength(2);
    const young = S().animals[1];
    expect(young.breed).toBe('Jersey');
    expect(isAdult(young, dayOf(S().minutes))).toBe(false);
    expect(S().animals[0].pregnantSince).toBeNull();
    expect(S().events.some((e) => /Papatya bir buzağı doğurdu/.test(e.text))).toBe(true);
    expect(S().log.reduce((sum, l) => sum + l.births, 0)).toBe(1);
  });

  it('the young make nothing until grown, and fetch half at market', () => {
    start({ animals: [animal('cow', { bornDay: 1 })] });
    advance(10);
    const calf = S().animals[0];
    expect(calf.product).toBe(0);
    expect(animalValue(calf, 1)).toBe(Math.round(SPECIES.cow.price * 0.6 * 0.5 * (calf.health / 100)));
    expect(isAdult(calf, 1 + SPECIES.cow.maturityDays)).toBe(true);
  });

  it('old animals make less', () => {
    start({ animals: [animal('chicken'), animal('chicken', { bornDay: 1 - Math.ceil(SPECIES.chicken.lifespanDays * 0.85) })] });
    advance(4);
    const [young, old] = S().animals;
    expect(old.product).toBeCloseTo(young.product * 0.6, 5);
  });

  it('eggs in the incubator hatch into chicks', () => {
    start({ inventory: { egg: 10 }, animals: [] });
    S().incubate(10);
    expect(S().inventory.egg).toBe(4);
    expect(S().incubator).toHaveLength(1);
    expect(S().incubator[0].eggs).toBe(6);
    advance(HATCH_HOURS - 1);
    expect(S().animals).toHaveLength(0);
    advance(2);
    expect(S().animals).toHaveLength(6);
    expect(S().animals.every((a) => a.species === 'chicken' && !isAdult(a, dayOf(S().minutes)))).toBe(true);
    expect(S().incubator).toHaveLength(0);
  });

  it('the incubator needs eggs and room in the barn', () => {
    start({ inventory: {}, animals: [] });
    S().incubate(6);
    expect(S().incubator).toHaveLength(0);
    start({ inventory: { egg: 6 }, animals: Array.from({ length: BARN_CAPACITY }, () => animal('cow')) });
    S().incubate(6);
    expect(S().incubator).toHaveLength(0);
    expect(S().inventory.egg).toBe(6);
  });

  it('grown fish spawn in clean water when fed, within the room in the pond', () => {
    always();
    start({ pond: { batches: [{ id: 'a', species: 'carp', count: 6, growth: 1 }], quality: 90, fullness: 90 } });
    advance(1);
    expect(S().pond.batches.length).toBeGreaterThan(1);
    expect(S().pond.batches.slice(1).every((b) => b.species === 'carp' && b.growth < 0.1)).toBe(true);
    expect(S().pond.batches.reduce((sum, b) => sum + b.count, 0)).toBeLessThanOrEqual(POND_CAPACITY);
  });

  it('fish do not spawn while young, hungry or in murky water', () => {
    always();
    const ponds: GameState['pond'][] = [
      { batches: [{ id: 'a', species: 'carp', count: 6, growth: 0.5 }], quality: 90, fullness: 90 },
      { batches: [{ id: 'a', species: 'carp', count: 6, growth: 1 }], quality: 90, fullness: 10 },
      { batches: [{ id: 'a', species: 'carp', count: 6, growth: 1 }], quality: 40, fullness: 90 },
    ];
    for (const pond of ponds) {
      start({ pond });
      advance(1);
      expect(S().pond.batches).toHaveLength(1);
    }
  });
});

describe('names', () => {
  it('no two animals of a kind share a name, even past the end of the name list', () => {
    start({ inventory: { egg: 18 }, animals: [] });
    for (let i = 0; i < 3; i++) S().incubate(6);
    advance(25);
    const names = S().animals.map((a) => a.name);
    expect(names).toHaveLength(18);
    expect(new Set(names).size).toBe(18);
    expect(new Set(initialState(T0).animals.filter((a) => a.species === 'chicken').map((a) => a.name)).size).toBe(8);
  });
});

describe('death', () => {
  it('a starving animal is warned about, then dies after hours at zero health', () => {
    start({ inventory: {}, barnClean: 100, animals: [animal('goat', { name: 'Zıpzıp', fullness: 0, health: 10 })] });
    advance(3);
    expect(S().events.some((e) => /Zıpzıp çok hasta/.test(e.text))).toBe(true);
    // Health 10 falls to 0 in about five hours; it then has SICK_DEATH_HOURS left.
    advance(SICK_DEATH_HOURS - 1);
    expect(S().animals).toHaveLength(1);
    advance(4);
    expect(S().animals).toHaveLength(0);
    expect(S().events.some((e) => /Zıpzıp hastalıktan öldü/.test(e.text))).toBe(true);
    expect(S().log.reduce((sum, l) => sum + l.deaths, 0)).toBe(1);
  });

  it('medicine and food in time save it', () => {
    start({ inventory: { medicine: 1, hay: 10 }, barnClean: 100, animals: [animal('goat', { fullness: 0, health: 0 })] });
    advance(SICK_DEATH_HOURS - 2);
    S().heal(S().animals[0].id);
    S().feedSpecies('goat');
    advance(6);
    expect(S().animals).toHaveLength(1);
    expect(S().animals[0].sickHours).toBe(0);
  });

  it('an animal past its lifespan can die of old age', () => {
    always();
    start({ animals: [animal('chicken', { bornDay: -SPECIES.chicken.lifespanDays - 5 })] });
    advance(1);
    expect(S().animals).toHaveLength(0);
    expect(S().events.some((e) => /yaşlılıktan/.test(e.text))).toBe(true);
  });
});

describe('old saves', () => {
  it('a version-1 save loads with breeding fields at rest and an empty incubator', () => {
    const fresh = initialState(T0);
    const v1 = {
      ...fresh,
      version: 1,
      animals: fresh.animals.map((a) => ({ id: a.id, species: a.species, name: a.name, breed: a.breed, tag: a.tag, bornDay: a.bornDay, variant: a.variant, fullness: a.fullness, health: a.health, happiness: a.happiness, product: a.product })),
      log: [{ day: 1, income: 0, expense: 0, crops: 0, produce: 0, fish: 0 }],
      incubator: undefined,
    };
    const s = migrate(v1, 1);
    expect(s.version).toBe(4);
    expect(s.incubator).toEqual([]);
    expect(s.animals.every((a) => a.pregnantSince === null && a.sickHours === 0 && a.warnedSick === false)).toBe(true);
    expect(s.log[0]).toMatchObject({ births: 0, deaths: 0 });
  });
});
