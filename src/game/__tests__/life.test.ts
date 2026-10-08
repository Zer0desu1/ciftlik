import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dayOf } from '../clock';
import { BARN_CAPACITY, COOP_CAPACITY, HATCH_HOURS, POND_CAPACITY, SICK_DEATH_HOURS, SPECIES } from '../data';
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

  it('the incubator needs eggs and room in the coop', () => {
    start({ inventory: {}, animals: [] });
    S().incubate(6);
    expect(S().incubator).toHaveLength(0);
    start({ inventory: { egg: 6 }, animals: Array.from({ length: COOP_CAPACITY }, () => animal('chicken')) });
    S().incubate(6);
    expect(S().incubator).toHaveLength(0);
    expect(S().inventory.egg).toBe(6);
    expect(S().events[0].text).toBe('Kümeste civcivlere yer yok.');
  });

  it('a full barn leaves the coop free, and a full coop the barn', () => {
    start({ inventory: { egg: 6 }, animals: Array.from({ length: BARN_CAPACITY }, () => animal('cow')) });
    S().incubate(6);
    expect(S().incubator).toHaveLength(1);
    useGame.setState({ coins: 10_000, xp: 10_000 });
    S().buyAnimal('chicken');
    expect(S().animals.filter((a) => a.species === 'chicken')).toHaveLength(1);
    S().buyAnimal('cow');
    expect(S().animals.filter((a) => a.species === 'cow')).toHaveLength(BARN_CAPACITY);
    expect(S().events[0].text).toBe('Ahırda yer kalmadı. Ahırı büyütebilirsin.');
    start({ coins: 10_000, xp: 10_000, animals: Array.from({ length: COOP_CAPACITY }, () => animal('chicken')) });
    S().buyAnimal('chicken');
    expect(S().events[0].text).toBe('Kümeste yer kalmadı. Kümesi büyütebilirsin.');
    S().buyAnimal('sheep');
    expect(S().animals.filter((a) => a.species === 'sheep')).toHaveLength(1);
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

describe('selling animals', () => {
  it('sells a chosen group at once for the sum of their values, and leaves the rest', () => {
    const herd = [animal('cow'), animal('cow', { bornDay: 1 }), animal('sheep'), animal('goat')];
    start({ coins: 0, animals: herd });
    const ids = [herd[0].id, herd[1].id, herd[2].id];
    const expected = ids.reduce((sum, id) => sum + animalValue(herd.find((a) => a.id === id)!, 1), 0);
    S().sellAnimals([...ids, 'no-such-animal']);
    expect(S().animals.map((a) => a.id)).toEqual([herd[3].id]);
    expect(S().coins).toBe(expected);
    expect(S().log.find((l) => l.day === 1)!.income).toBe(expected);
    expect(S().events[0].text).toBe(`3 hayvan ${expected} altına satıldı.`);
  });

  it('heals the chosen sick ones, sickest first, as far as the medicine goes', () => {
    const herd = [animal('cow', { health: 60 }), animal('cow', { health: 10 }), animal('sheep', { health: 100 }), animal('goat', { health: 30 })];
    start({ inventory: { medicine: 2 }, animals: herd });
    S().healMany(herd.map((a) => a.id));
    expect(S().animals.map((a) => a.health)).toEqual([60, 100, 100, 100]);
    expect(S().inventory.medicine).toBe(0);
    expect(S().events[0].text).toBe('İlaç yetmedi: 2 hayvan iyileşti, 1 hayvan bekliyor.');
  });

  it('pets everyone chosen, and only them', () => {
    const herd = [animal('cow', { happiness: 40 }), animal('cow', { happiness: 40 }), animal('sheep', { happiness: 40 })];
    start({ animals: herd });
    S().petMany([herd[0].id, herd[2].id]);
    expect(S().animals.map((a) => a.happiness)).toEqual([58, 40, 58]);
  });

  it('selling nothing changes nothing', () => {
    start({ coins: 10, animals: [animal('cow')] });
    S().sellAnimals([]);
    expect(S().coins).toBe(10);
    expect(S().animals).toHaveLength(1);
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
    expect(s.version).toBe(9);
    expect(s.incubator).toEqual([]);
    expect(s.animals.every((a) => a.pregnantSince === null && a.sickHours === 0 && a.warnedSick === false)).toBe(true);
    expect(s.log[0]).toMatchObject({ births: 0, deaths: 0 });
  });
});

describe('ids', () => {
  it('a new animal never takes an id the starting herd has', () => {
    useGame.setState({ ...initialState(), coins: 100_000, xp: 100_000 });
    for (let i = 0; i < 6; i++) S().buyAnimal('chicken');
    const ids = S().animals.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a save whose animals share ids gets them apart, and its counter moved on', () => {
    const old = initialState();
    const twin = { ...old.animals[0] };
    const s = migrate({ ...old, version: 8, nextId: 2, animals: [...old.animals, twin] } as unknown as GameState, 8);
    const ids = s.animals.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(s.nextId).toBeGreaterThan(Math.max(...ids.map((id) => Number(id.split('-')[1]))));
  });
});
