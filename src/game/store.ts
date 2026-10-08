import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  dayOf,
  GAME_MINUTES_PER_SECOND,
  hourOf,
  MAX_CATCH_UP_HOURS,
  MINUTES_PER_DAY,
  seasonOf,
  seeded,
  weatherFor,
} from './clock';
import {
  BASE_AREA,
  BASE_PLOTS,
  CROPS,
  FACILITIES,
  FIELD_EXPANSIONS,
  FIELDS,
  FISH,
  HATCH_HOURS,
  HUNGER_PER_HOUR,
  LAND_AREA,
  LAND_USES,
  SEASONS,
  ACHIEVEMENTS,
  CUSTOMERS,
  DOG_PRICE,
  HAPPENING_CHANCE,
  HAPPENINGS,
  MAX_ORDERS,
  WINTER_HUNGER,
  WORKSHOP_SLOTS,
  WORKSHOPS,
  type HappeningKind,
  type StatId,
  type WorkshopId,
  POWER,
  SUN,
  WIND,
  landName,
  type LandUse,
  INCUBATOR_SIZE,
  ITEMS,
  LEVELS,
  MACHINES,
  MEALS,
  SICK_DEATH_HOURS,
  SPECIES,
  WATER_PER_PLOT,
  WEATHER,
  type CropId,
  type FacilityId,
  type FieldId,
  type FishSpeciesId,
  type ItemId,
  type ItemKind,
  type MachineId,
  type SpeciesId,
} from './data';

export type Plot = {
  crop: CropId | null;
  /** 0 → 1 while growing; ripe at 1. */
  growth: number;
  /** Soil moisture, 0–100. Growth stops below DRY. */
  moisture: number;
  fertilized: boolean;
  weeds: boolean;
  /** Game hours spent ripe and unpicked; past ROT_HOURS the crop rots. */
  ripeHours: number;
  /** Game hours spent bone dry; past WILT_HOURS the crop dies. */
  dryHours: number;
  dead: boolean;
  /** What was last harvested here, so the planting robot can sow it again. */
  lastCrop?: CropId | null;
};

export type Animal = {
  id: string;
  species: SpeciesId;
  name: string;
  breed: string;
  tag: string;
  bornDay: number;
  variant: number;
  /** How fed, 0–100. Falls between meals. */
  fullness: number;
  health: number;
  happiness: number;
  /** 0 → 1 toward the next egg, milking or shearing. */
  product: number;
  /** Game minute it conceived, or null. The young arrives `gestationHours` later. */
  pregnantSince: number | null;
  /** Game hours spent at zero health; past SICK_DEATH_HOURS it dies. */
  sickHours: number;
  /** Set once the "very sick" warning has gone out, so it isn't repeated every hour. */
  warnedSick: boolean;
};

export type Tray = { id: string; eggs: number; readyAt: number };

export type FishBatch = { id: string; species: FishSpeciesId; count: number; growth: number };

export type DayLog = {
  day: number;
  income: number;
  expense: number;
  crops: number;
  produce: number;
  fish: number;
  births: number;
  deaths: number;
};

/** Something a customer wants. */
export type Order = { id: string; who: string; item: ItemId; qty: number; reward: number; xp: number; dueDay: number };

/** The farm's electricity: what is built, and today's meter readings. */
export type Power = {
  panels: number;
  turbines: number;
  /** kWh used and made since midnight. */
  used: number;
  made: number;
  /** A bill not yet paid, in coins. While it stands the machines are off. */
  unpaid: number;
  /** The last days settled, newest first. */
  history: { day: number; used: number; made: number; net: number }[];
};

export type FarmEvent = { id: number; at: number; text: string; tone: 'good' | 'bad' | 'info' };

export type GameState = {
  version: 10;
  farmName: string;
  /** Game time, in minutes since day 1, 00:00. */
  minutes: number;
  /** Wall clock of the last tick, so time keeps passing while the app is closed. */
  lastReal: number;
  coins: number;
  xp: number;
  inventory: Partial<Record<ItemId, number>>;
  fields: Record<FieldId, Plot[]>;
  /** The land owned and what is on it. Land not listed is still for sale. */
  land: Partial<Record<FieldId, LandUse>>;
  power: Power;
  /** What customers have asked for, to deliver before `dueDay` ends. */
  orders: Order[];
  /** Lifetime counts, for achievements. */
  stats: Record<StatId, number>;
  /** Achievements won, by id. */
  achievements: string[];
  /** Achievements whose reward has been taken. */
  claimed: string[];
  /** Workshops built, each with the batches on: when each is ready, in game minutes. */
  workshops: Partial<Record<WorkshopId, { jobs: number[] }>>;
  /** What happened this morning, if anything. */
  happening: { day: number; kind: HappeningKind; item?: ItemId; note: string } | null;
  /** A watchdog: keeps the fox from the coop. */
  dog: boolean;
  animals: Animal[];
  barnClean: number;
  /** `feeds` counts every feeding, by hand or machine, so the pond can show the food going in. */
  pond: { batches: FishBatch[]; quality: number; fullness: number; feeds?: number };
  /** Egg trays in the incubator; each hatches into chicks at `readyAt`. */
  incubator: Tray[];
  /** How many times each building has been enlarged (0 = as built). Fields grow by plots instead. */
  upgrades: Record<FacilityId, number>;
  /** Machines bought, and whether each is switched on. */
  machines: Partial<Record<MachineId, { on: boolean }>>;
  /** Day a given machine last complained about running out, so it says so once a day. */
  warned: Partial<Record<string, number>>;
  tank: number;
  /** Which of today's three meals have been served. */
  meals: { day: number; done: [boolean, boolean, boolean] };
  log: DayLog[];
  events: FarmEvent[];
  nextId: number;
};

type Actions = {
  tick: (nowMs: number) => void;
  plant: (field: FieldId, index: number, crop: CropId) => void;
  water: (field: FieldId, index: number) => void;
  waterField: (field: FieldId) => void;
  fertilize: (field: FieldId, index: number) => void;
  weed: (field: FieldId, index: number) => void;
  harvest: (field: FieldId, index: number) => void;
  harvestField: (field: FieldId) => void;
  clearPlot: (field: FieldId, index: number) => void;
  tidyField: (field: FieldId) => void;
  feedSpecies: (species: SpeciesId) => void;
  feedAll: () => void;
  collect: (species: SpeciesId) => void;
  collectAll: () => void;
  pet: (id: string) => void;
  heal: (id: string) => void;
  healMany: (ids: string[]) => void;
  petMany: (ids: string[]) => void;
  cleanBarn: () => void;
  buyAnimal: (species: SpeciesId) => void;
  incubate: (eggs: number) => void;
  expandField: (field: FieldId) => void;
  buyLand: (field: FieldId, use?: LandUse) => void;
  buyPower: (kind: 'panel' | 'turbine') => void;
  deliver: (orderId: string) => void;
  buyWorkshop: (id: WorkshopId) => void;
  craft: (id: WorkshopId) => void;
  buyDog: () => void;
  rename: (name: string) => void;
  claim: (achievementId: string) => void;
  warnOldTab: () => void;
  payBill: () => void;
  /** `destroy` digs up whatever grows on a field rather than refusing. */
  convertLand: (field: FieldId, to: LandUse, destroy?: boolean) => void;
  swapLand: (a: FieldId, b: FieldId) => void;
  upgrade: (facility: FacilityId) => void;
  sellAnimal: (id: string) => void;
  sellAnimals: (ids: string[]) => void;
  feedFish: () => void;
  cleanPond: () => void;
  stockFish: (species: FishSpeciesId, count: number) => void;
  catchFish: (batchId: string, count?: number) => void;
  buyMachine: (id: MachineId) => void;
  toggleMachine: (id: MachineId) => void;
  buy: (item: ItemId, qty: number) => void;
  sell: (item: ItemId, qty: number) => void;
  sellKind: (kind: ItemKind) => void;
  pump: () => void;
  sleep: () => void;
  reset: () => void;
};

export type Store = GameState & Actions;

/** Below this the soil is too dry to grow anything. */
const DRY = 15;
const ROT_HOURS = 36;
const WILT_HOURS = 18;
const PUMP_LITRES = 300;
const PUMP_COST = 8;
const POND_CLEAN_COST = 12;
const FISH_FEED_PER_MEAL = 2;

export function emptyPlot(): Plot {
  return { crop: null, growth: 0, moisture: 60, fertilized: false, weeds: false, ripeHours: 0, dryHours: 0, dead: false };
}

function plotWith(crop: CropId, growth: number, moisture: number): Plot {
  return { ...emptyPlot(), crop, growth, moisture };
}

/**
 * A name nobody of the same kind already has. Starts from a random spot in
 * the species' list; once the list runs out, numbers the repeats ("Tüylü 2").
 */
function freshName(species: SpeciesId, taken: Animal[], rand: () => number): string {
  const names = SPECIES[species].names;
  const used = new Set(taken.filter((a) => a.species === species).map((a) => a.name));
  const start = Math.floor(rand() * names.length);
  for (let i = 0; i < names.length; i++) {
    const name = names[(start + i) % names.length];
    if (!used.has(name)) return name;
  }
  for (let k = 2; ; k++) {
    const name = `${names[start]} ${k}`;
    if (!used.has(name)) return name;
  }
}

/** A grown animal of working age: past maturity, well short of old. */
function makeAnimal(species: SpeciesId, n: number, day: number, rand: () => number, taken: Animal[] = []): Animal {
  const s = SPECIES[species];
  return {
    id: `${species}-${n}`,
    species,
    name: freshName(species, taken, rand),
    breed: s.breeds[Math.floor(rand() * s.breeds.length)],
    tag: `${s.tag}-${100 + n}`,
    bornDay: day - s.maturityDays - Math.floor(rand() * s.lifespanDays * 0.45),
    variant: Math.floor(rand() * 4),
    fullness: 80,
    health: 92 + Math.floor(rand() * 8),
    happiness: 80,
    product: rand() * 0.6,
    pregnantSince: null,
    sickHours: 0,
    warnedSick: false,
  };
}

/** A newborn: today's birthday, its parent's breed, a name of its own. */
function makeYoung(species: SpeciesId, n: number, day: number, breed: string, taken: Animal[]): Animal {
  return {
    ...makeAnimal(species, n, day, Math.random, taken),
    breed,
    bornDay: day,
    fullness: 90,
    health: 100,
    happiness: 90,
    product: 0,
  };
}

export function ageDays(a: Animal, day: number): number {
  return day - a.bornDay;
}

export function isAdult(a: Animal, day: number): boolean {
  return ageDays(a, day) >= SPECIES[a.species].maturityDays;
}

export function isOld(a: Animal, day: number): boolean {
  return ageDays(a, day) >= SPECIES[a.species].lifespanDays * 0.8;
}

/** Game minute the young is due, or null when not expecting. */
export function dueAt(a: Animal): number | null {
  const gestation = SPECIES[a.species].gestationHours;
  return a.pregnantSince === null || gestation === null ? null : a.pregnantSince + gestation * 60;
}

export function initialState(now = Date.now()): GameState {
  const rand = seeded(42);
  const animals: Animal[] = [];
  let n = 1;
  const herd: [SpeciesId, number][] = [
    ['cow', 3],
    ['chicken', 8],
    ['sheep', 2],
    ['goat', 2],
  ];
  for (const [species, count] of herd) {
    for (let i = 0; i < count; i++) animals.push(makeAnimal(species, n++, 1, rand, animals));
  }
  // A farm already in motion: some rows half grown, one ready to pick, some empty to plant.
  const fields: Record<FieldId, Plot[]> = {
    tomatoes: [
      plotWith('tomato', 1, 70), plotWith('tomato', 1, 64), plotWith('tomato', 0.62, 55), plotWith('tomato', 0.4, 38),
      plotWith('pepper', 0.2, 72), emptyPlot(), emptyPlot(), emptyPlot(),
    ],
    vegetables: [
      plotWith('lettuce', 0.85, 66), plotWith('lettuce', 0.7, 60), plotWith('carrot', 0.45, 24), plotWith('carrot', 0.3, 18),
      emptyPlot(), emptyPlot(), emptyPlot(), emptyPlot(),
    ],
    corn: [
      plotWith('corn', 0.5, 70), plotWith('corn', 0.5, 70), plotWith('corn', 0.35, 66), plotWith('wheat', 0.9, 58),
      plotWith('wheat', 0.6, 58), emptyPlot(), emptyPlot(), emptyPlot(),
    ],
    // Land not yet bought: no plots until it is.
    east: [], orchard: [], meadow: [], south: [], creek: [], far: [],
  };
  const land: GameState['land'] = { tomatoes: 'field', vegetables: 'field', corn: 'field' };
  return {
    version: 10,
    farmName: 'Yeşil Vadi Çiftliği',
    land,
    power: { panels: 0, turbines: 0, used: 0, made: 0, unpaid: 0, history: [] },
    orders: [
      { id: 'order-a', who: 'Köy bakkalı', item: 'egg', qty: 6, reward: 30, xp: 15, dueDay: 3 },
      { id: 'order-b', who: 'Lokanta Lezzet', item: 'tomato', qty: 8, reward: 70, xp: 20, dueDay: 4 },
    ],
    stats: { harvested: 0, collected: 0, caught: 0, born: 0, orders: 0, crafted: 0 },
    achievements: [],
    claimed: [],
    workshops: {},
    happening: null,
    dog: false,
    minutes: 7 * 60,
    lastReal: now,
    coins: 300,
    xp: 0,
    inventory: {
      seed_tomato: 4, seed_corn: 3, seed_lettuce: 6, seed_carrot: 4, seed_wheat: 6,
      hay: 40, grain: 30, fish_feed: 16, fertilizer: 3, medicine: 1, egg: 6, milk: 4,
    },
    fields,
    animals,
    barnClean: 80,
    pond: {
      batches: [
        { id: 'fish-1', species: 'carp', count: 6, growth: 0.92 },
        { id: 'fish-2', species: 'trout', count: 4, growth: 0.35 },
      ],
      quality: 82,
      fullness: 70,
    },
    incubator: [],
    upgrades: { barn: 0, coop: 0, pond: 0, tank: 0 },
    machines: {},
    warned: {},
    tank: 720,
    meals: { day: 1, done: [false, false, false] },
    log: [{ day: 1, income: 0, expense: 0, crops: 0, produce: 0, fish: 0, births: 0, deaths: 0 }],
    events: [{ id: 1, at: 7 * 60, text: 'Çiftliğe hoş geldin! Önce hayvanları besle.', tone: 'info' }],
    // Past the ids the starting herd took, so nothing new is given one of theirs.
    nextId: n,
  };
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function levelOf(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1;
  return level;
}

export function levelProgress(xp: number): { level: number; into: number; span: number } {
  const level = levelOf(xp);
  const base = LEVELS[level - 1] ?? 0;
  const next = LEVELS[level] ?? base + 1000;
  return { level, into: xp - base, span: next - base };
}

/** Today's market multiplier for an item, steady through the day. */
export function priceMultiplier(day: number, item: ItemId): number {
  const rand = seeded(day * 7919 + item.length * 131 + item.charCodeAt(0) * 17 + item.charCodeAt(item.length - 1));
  return 0.8 + rand() * 0.45;
}

export function sellPrice(day: number, item: ItemId): number {
  const def = ITEMS[item];
  const base = def.kind === 'seed' || def.kind === 'supply' ? def.price * 0.5 : def.price;
  const crop = def.kind === 'crop' ? Object.values(CROPS).find((c) => c.harvest === item) : undefined;
  // Scarce out of season, so dearer.
  const season = crop && !crop.seasons.includes(seasonOf(day)) ? 1.4 : 1;
  const h = happeningFor(day);
  const boom = h?.kind === 'boom' && h.item === item ? 2 : 1;
  return Math.max(1, Math.round(base * priceMultiplier(day, item) * season * boom));
}

export function buyPrice(item: ItemId): number {
  return ITEMS[item].price;
}

/** The meal slot that is current at this hour: the last one whose hour has come, or none before breakfast. */
export function currentMeal(hour: number): number {
  let index = -1;
  MEALS.forEach((meal, i) => {
    if (hour >= meal.hour) index = i;
  });
  return index;
}

function ensureDay(state: GameState, day: number): DayLog {
  let entry = state.log.find((l) => l.day === day);
  if (!entry) {
    entry = { day, income: 0, expense: 0, crops: 0, produce: 0, fish: 0, births: 0, deaths: 0 };
    state.log = [...state.log, entry].slice(-14);
  }
  return entry;
}

type Draft = GameState;

/** Copies just enough of the state to mutate it safely and hand it back to zustand. */
function draft(s: GameState): Draft {
  return {
    ...s,
    inventory: { ...s.inventory },
    fields: Object.fromEntries(FIELDS.map((f) => [f.id, (s.fields[f.id] ?? []).map((p) => ({ ...p }))])) as Record<FieldId, Plot[]>,
    animals: s.animals.map((a) => ({ ...a })),
    pond: { ...s.pond, batches: s.pond.batches.map((b) => ({ ...b })) },
    incubator: s.incubator.map((t) => ({ ...t })),
    upgrades: { ...s.upgrades },
    machines: Object.fromEntries(Object.entries(s.machines).map(([k, v]) => [k, { ...v }])),
    warned: { ...s.warned },
    land: { ...s.land },
    power: { ...s.power, history: [...s.power.history] },
    orders: [...s.orders],
    stats: { ...s.stats },
    achievements: [...s.achievements],
    claimed: [...s.claimed],
    workshops: Object.fromEntries(Object.entries(s.workshops).map(([k, v]) => [k, { jobs: [...(v?.jobs ?? [])] }])),
    meals: { day: s.meals.day, done: [...s.meals.done] as [boolean, boolean, boolean] },
    log: s.log.map((l) => ({ ...l })),
    events: [...s.events],
  };
}

function note(d: Draft, text: string, tone: FarmEvent['tone'] = 'info') {
  d.events = [{ id: d.nextId++, at: d.minutes, text, tone }, ...d.events].slice(0, 40);
}

function addItem(d: Draft, item: ItemId, qty: number) {
  d.inventory[item] = (d.inventory[item] ?? 0) + qty;
}

function takeItem(d: Draft, item: ItemId, qty: number): boolean {
  const have = d.inventory[item] ?? 0;
  if (have < qty) return false;
  d.inventory[item] = have - qty;
  return true;
}

function gainXp(d: Draft, amount: number) {
  const before = levelOf(d.xp);
  d.xp += amount;
  const after = levelOf(d.xp);
  if (after > before) note(d, `Seviye ${after}! Pazarda yeni ürünler açıldı.`, 'good');
}

/** Picks one ripe plot, if it is ripe. Returns the units harvested. */
function harvestPlot(d: Draft, field: FieldId, index: number): number {
  const p = d.fields[field]?.[index];
  if (!p || !p.crop || p.dead || p.growth < 1) return 0;
  const crop = CROPS[p.crop];
  const amount = Math.round(crop.yield * (p.fertilized ? 1.5 : 1));
  addItem(d, crop.harvest, amount);
  d.stats.harvested += amount;
  ensureDay(d, dayOf(d.minutes)).crops += amount;
  d.fields[field][index] = { ...emptyPlot(), moisture: p.moisture, lastCrop: p.crop };
  gainXp(d, Math.round(crop.growHours / 2));
  return amount;
}

/**
 * Feeds the animals of one kind whose fullness is under `below`, as far as the
 * feed goes. Returns how many ate and whether the feed ran out first.
 */
function feedHerd(d: Draft, species: SpeciesId, below: number): { fed: number; short: boolean } {
  const s = SPECIES[species];
  let fed = 0;
  for (const a of d.animals) {
    if (a.species !== species || a.fullness >= below) continue;
    if (!takeItem(d, s.feed, s.ration)) return { fed, short: true };
    a.fullness = 100;
    fed++;
  }
  return { fed, short: false };
}

/** Takes in every finished product from one kind. Returns the units collected. */
function collectHerd(d: Draft, species: SpeciesId): number {
  const s = SPECIES[species];
  let total = 0;
  d.animals.forEach((a) => {
    if (a.species !== species || a.product < 1) return;
    a.product = 0;
    total += s.productAmount;
  });
  if (!total) return 0;
  addItem(d, s.product, total);
  d.stats.collected += total;
  ensureDay(d, dayOf(d.minutes)).produce += total;
  gainXp(d, total);
  return total;
}

/** Says something on a machine's behalf at most once a game day. */
function warnOnce(d: Draft, key: string, text: string) {
  const day = dayOf(d.minutes);
  if (d.warned[key] === day) return;
  d.warned[key] = day;
  note(d, text, 'bad');
}

/** A machine works while switched on and the electricity is paid for. */
const running = (d: Draft, id: MachineId) => d.machines[id]?.on === true && !(d.power.unpaid > 0);

/**
 * Every switched-on machine does its chore. Runs after each slice of the
 * simulation, so a sprinkler catches a plot as it dries rather than an hour later.
 */
function runMachines(d: Draft, dt: number) {
  const hour = hourOf(d.minutes);

  for (const def of FIELDS) {
    const plots = d.fields[def.id];
    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      if (running(d, 'weeder') && p.weeds && !p.dead) p.weeds = false;
      if (running(d, 'sprinkler') && p.crop && !p.dead && p.growth < 1 && p.moisture < 35) {
        if (d.tank >= WATER_PER_PLOT) {
          d.tank -= WATER_PER_PLOT;
          p.moisture = 100;
        } else {
          warnOnce(d, 'sprinkler', 'Otomatik sulama durdu: su deposu boş.');
        }
      }
      if (running(d, 'harvester')) harvestPlot(d, def.id, i);
      const now = d.fields[def.id][i];
      if (running(d, 'planter') && (!now.crop || now.dead)) {
        // A dead plant is cleared and sown again. A plot never sown gets what
        // the field is for, of whatever seed is in store.
        const inStock = (c: CropId) => (d.inventory[CROPS[c].seed] ?? 0) > 0;
        const first = (now.dead ? now.crop : now.lastCrop) ?? null;
        // What it grew before, if there is seed for it; else what the field is for.
        const season = seasonOf(dayOf(d.minutes));
        const inSeason = (c: CropId) => inStock(c) && CROPS[c].seasons.includes(season);
        const want = first && inStock(first) ? first : (def.suggested.find(inSeason) ?? def.suggested.find(inStock) ?? first);
        if (want) {
          const crop = CROPS[want];
          if (takeItem(d, crop.seed, 1)) {
            d.fields[def.id][i] = { ...emptyPlot(), crop: want, moisture: now.moisture, lastCrop: want };
          } else {
            if (now.dead) d.fields[def.id][i] = { ...emptyPlot(), moisture: now.moisture, lastCrop: want };
            warnOnce(d, `planter-${crop.id}`, `Ekim robotu: ${crop.name.toLowerCase()} tohumu bitti.`);
          }
        }
      }
    }
  }

  if (running(d, 'feeder')) {
    // At each meal it serves the whole herd, as "Hepsini besle" would, so the
    // meal counts as done; between meals it tops up anyone going hungry.
    const slot = currentMeal(hour);
    const mealDue = slot >= 0 && !(d.meals.day === dayOf(d.minutes) && d.meals.done[slot]);
    (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => {
      const r = feedHerd(d, sp, mealDue ? 95 : 40);
      if (r.short) warnOnce(d, `feeder-${SPECIES[sp].feed}`, `Otomatik yemlik: ${ITEMS[SPECIES[sp].feed].name.toLowerCase()} bitti.`);
    });
    if (mealDue) markMeal(d);
  }
  if (running(d, 'collector')) (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => collectHerd(d, sp));
  if (running(d, 'cleaner') && d.barnClean < 50) d.barnClean = 100;

  if (running(d, 'fish_feeder') && d.pond.batches.length && d.pond.fullness < 40) {
    if (takeItem(d, 'fish_feed', FISH_FEED_PER_MEAL)) {
      d.pond.fullness = 100;
      d.pond.feeds = (d.pond.feeds ?? 0) + 1;
    } else warnOnce(d, 'fish_feeder', 'Balık yemleme makinesi: balık yemi bitti.');
  }
  if (running(d, 'pond_filter')) d.pond.quality = clamp(d.pond.quality + 2.2 * dt);
  if (running(d, 'solar_pump') && hour >= 7 && hour < 19) d.tank = Math.min(tankCapacity(d), d.tank + 30 * dt);
}

/** kWh an hour the farm makes now: panels and solar land by the sun, turbines by the wind. */
export function powerMade(s: GameState, minutes = s.minutes): number {
  const hour = hourOf(minutes);
  const kind = weatherFor(dayOf(minutes)).kind;
  // The sun rises at 6 and sets at 20, strongest at 13.
  const sun = hour > 6 && hour < 20 ? Math.sin(((hour - 6) / 14) * Math.PI) * SUN[kind] : 0;
  const solarLand = landCount(s, 'solar') * LAND_USES.solar.adds;
  return (s.power.panels * POWER.panel.kwh + solarLand) * sun + s.power.turbines * POWER.turbine.kwh * WIND[kind];
}

/** kWh an hour the farm uses now: the house and the machines that are working. */
export function powerUsed(s: GameState): number {
  const machines = (Object.keys(s.machines) as MachineId[]).filter((id) => s.machines[id]?.on && !(s.power.unpaid > 0));
  const shops = (Object.keys(s.workshops ?? {}) as WorkshopId[]).filter((id) => (s.workshops[id]?.jobs.length ?? 0) > 0 && !(s.power.unpaid > 0));
  return POWER.house + machines.reduce((n, id) => n + MACHINES[id].power, 0) + shops.reduce((n, id) => n + WORKSHOPS[id].power, 0);
}

/** What today's meter comes to so far: positive is owed, negative is earned. */
export function powerBalance(s: GameState): number {
  const net = s.power.used - s.power.made;
  return net > 0 ? Math.round(net * POWER.buy) : -Math.round(-net * POWER.sell);
}

function meter(d: Draft, dt: number) {
  d.power.used += powerUsed(d) * dt;
  d.power.made += powerMade(d) * dt;
}

/** Midnight: the day's electricity is paid for, or the surplus sold. */
function settlePower(d: Draft, day: number) {
  const net = powerBalance(d);
  d.power.history = [{ day, used: Math.round(d.power.used), made: Math.round(d.power.made), net }, ...d.power.history].slice(0, 7);
  d.power.used = 0;
  d.power.made = 0;
  const log = ensureDay(d, day);
  if (net < 0) {
    // A surplus goes first to any bill still owed.
    const owed = Math.min(d.power.unpaid, -net);
    d.power.unpaid -= owed;
    const paid = -net - owed;
    d.coins += paid;
    log.income += paid;
    note(d, owed ? `Fazla elektrik satıldı: ${owed} altını eski faturaya gitti, +${paid} altın kasada.` : `Fazla elektrik şebekeye satıldı: +${paid} altın.`, 'good');
  } else if (net > 0) {
    const bill = net + d.power.unpaid;
    if (d.coins >= bill) {
      d.coins -= bill;
      log.expense += bill;
      d.power.unpaid = 0;
      note(d, `Elektrik faturası ödendi: ${bill} altın.`, 'info');
    } else {
      d.power.unpaid = bill;
      note(d, `Elektrik faturası ödenemedi (${bill} altın). Ödenene kadar makineler çalışmaz.`, 'bad');
    }
  }
}

/** Advances the simulation by `hours` game hours, in slices of at most one hour. */
function simulate(d: Draft, hours: number) {
  let left = hours;
  while (left > 0) {
    const dt = Math.min(1, left);
    left -= dt;
    const beforeDay = dayOf(d.minutes);
    meter(d, dt);
    d.minutes += dt * 60;
    const day = dayOf(d.minutes);
    if (day !== beforeDay) {
      settlePower(d, beforeDay);
      d.meals = { day, done: [false, false, false] };
      ensureDay(d, day);
      const w = weatherFor(day);
      if (seasonOf(day) !== seasonOf(beforeDay)) note(d, `${SEASONS[seasonOf(day)].name} geldi! ${SEASONS[seasonOf(day)].blurb}`, 'info');
      note(d, `${day}. gün başladı · ${WEATHER[w.kind].label}, ${w.temp}°C`, 'info');
      newOrders(d, day);
      happen(d, day);
    }

    const weather = weatherFor(day);
    const w = WEATHER[weather.kind];
    const heat = weather.temp >= 30 ? 1.2 : 1;

    const drought = d.happening?.day === day && d.happening.kind === 'drought';
    const rain = w.rain && !drought;
    const dry = w.dryFactor * (drought ? 2 : 1);
    const season = seasonOf(day);
    if (rain) d.tank = Math.min(tankCapacity(d), d.tank + 40 * dt);

    // Workshops
    (Object.keys(d.workshops) as WorkshopId[]).forEach((id) => {
      const shop = d.workshops[id];
      if (!shop?.jobs.length) return;
      if (d.power.unpaid > 0) {
        shop.jobs = shop.jobs.map((t) => t + dt * 60);
        return;
      }
      const done = shop.jobs.filter((t) => t <= d.minutes).length;
      if (!done) return;
      shop.jobs = shop.jobs.filter((t) => t > d.minutes);
      addItem(d, WORKSHOPS[id].output, done);
      d.stats.crafted += done;
      gainXp(d, 3 * done);
      note(d, `${WORKSHOPS[id].name}: ${done} ${ITEMS[WORKSHOPS[id].output].name.toLowerCase()} hazır.`, 'good');
    });

    // Fields
    for (const def of FIELDS) {
      d.fields[def.id].forEach((p) => {
        if (!p.crop || p.dead) return;
        const crop = CROPS[p.crop];
        p.moisture = rain ? 100 : clamp(p.moisture - crop.thirst * dry * heat * dt);
        if (p.growth < 1) {
          if (p.moisture > DRY) {
            // Out of season it struggles, and in winter more so.
            const seasonal = crop.seasons.includes(season) ? 1 : season === 'winter' ? 0.3 : 0.5;
            const rate = (1 / crop.growHours) * (p.weeds ? 0.5 : 1) * (p.fertilized ? 1.3 : 1) * seasonal;
            p.growth = Math.min(1, p.growth + rate * dt);
            p.dryHours = 0;
          } else {
            p.dryHours += dt;
            if (p.dryHours >= WILT_HOURS) {
              p.dead = true;
              note(d, `${crop.name} susuzluktan kurudu.`, 'bad');
            }
          }
          if (!p.weeds && Math.random() < 0.015 * dt) p.weeds = true;
        } else {
          p.ripeHours += dt;
          if (p.ripeHours >= ROT_HOURS) {
            p.dead = true;
            note(d, `Toplanmayan ${crop.name.toLowerCase()} çürüdü.`, 'bad');
          }
        }
      });
    }

    // Barn and animals
    d.barnClean = clamp(d.barnClean - 1.6 * dt);
    const dead = new Set<string>();
    const born: Animal[] = [];
    const adultsOf = (sp: SpeciesId) => d.animals.filter((x) => x.species === sp && isAdult(x, day) && !isOld(x, day)).length;
    d.animals.forEach((a) => {
      const s = SPECIES[a.species];
      const adult = isAdult(a, day);
      const old = isOld(a, day);
      a.fullness = clamp(a.fullness - HUNGER_PER_HOUR * (seasonOf(day) === 'winter' ? WINTER_HUNGER : 1) * dt);
      a.happiness = clamp(a.happiness - 0.8 * dt);
      let healthDelta = 0.4;
      if (a.fullness < 20) healthDelta -= 2.5;
      if (d.barnClean < 30) healthDelta -= 0.8;
      if (old) healthDelta -= 0.2;
      a.health = clamp(a.health + healthDelta * dt);

      if (adult && a.fullness > 30 && a.health > 40) {
        const mood = a.happiness > 60 ? 1.15 : 1;
        const age = old ? 0.6 : 1;
        a.product = Math.min(1, a.product + ((mood * age) / s.productHours) * dt);
      }

      // Sickness: a warning first, then death if nobody steps in.
      if (a.health < 15 && !a.warnedSick) {
        a.warnedSick = true;
        note(d, `${a.name} çok hasta! Besle ya da ilaç ver.`, 'bad');
      } else if (a.health > 30) {
        a.warnedSick = false;
      }
      a.sickHours = a.health <= 0 ? a.sickHours + dt : 0;
      if (a.sickHours >= SICK_DEATH_HOURS) {
        dead.add(a.id);
        note(d, `${a.name} hastalıktan öldü.`, 'bad');
        return;
      }
      if (ageDays(a, day) > s.lifespanDays && Math.random() < dt / 48) {
        dead.add(a.id);
        note(d, `${a.name} yaşlılıktan öldü.`, 'bad');
        return;
      }

      // Birth, when the time comes.
      const due = dueAt(a);
      if (due !== null && d.minutes >= due) {
        a.pregnantSince = null;
        const young = makeYoung(a.species, d.nextId++, day, a.breed, [...d.animals, ...born]);
        born.push(young);
        d.stats.born++;
        note(d, `${a.name} bir ${s.baby} doğurdu: ${young.name}!`, 'good');
      }

      // Conception: a well-kept adult with a second adult of its kind, and room in the barn.
      const expecting = d.animals.filter((x) => x.pregnantSince !== null).length + born.length;
      if (
        s.gestationHours !== null &&
        adult &&
        !old &&
        a.pregnantSince === null &&
        a.fullness > 50 &&
        a.health > 70 &&
        adultsOf(a.species) >= 2 &&
        inBarn(d) + expecting < barnCapacity(d) &&
        Math.random() < s.conceiveChance * (a.happiness > 60 ? 1.3 : 1) * dt
      ) {
        a.pregnantSince = d.minutes;
        note(d, `${a.name} gebe! ${s.gestationHours} saat sonra ${s.baby} doğacak.`, 'good');
      }
    });
    if (dead.size || born.length) {
      d.animals = [...d.animals.filter((a) => !dead.has(a.id)), ...born];
      const log = ensureDay(d, day);
      log.deaths += dead.size;
      log.births += born.length;
    }

    // Incubator
    d.incubator = d.incubator.filter((tray) => {
      if (d.minutes < tray.readyAt) return true;
      const room = coopCapacity(d) - inCoop(d);
      const chicks = Math.max(0, Math.min(tray.eggs, room));
      for (let i = 0; i < chicks; i++) d.animals.push(makeYoung('chicken', d.nextId++, day, SPECIES.chicken.breeds[0], d.animals));
      d.stats.born += chicks;
      if (chicks) {
        ensureDay(d, day).births += chicks;
        note(d, `Kuluçkadan ${chicks} civciv çıktı!`, 'good');
      } else {
        note(d, 'Kümes dolu olduğu için yumurtalar çıkamadı.', 'bad');
      }
      return false;
    });

    // Pond
    const pond = d.pond;
    pond.fullness = clamp(pond.fullness - 5 * dt);
    pond.quality = clamp(pond.quality + (w.rain ? 2 : -1.1) * dt);
    pond.batches.forEach((b) => {
      if (pond.fullness > 25 && pond.quality > 30) {
        b.growth = Math.min(1, b.growth + dt / FISH[b.species].growHours);
      }
      if (pond.quality < 15 && b.count > 0 && Math.random() < 0.08 * dt) {
        b.count -= 1;
        ensureDay(d, day).deaths += 1;
        note(d, `Bulanık suda bir ${FISH[b.species].name.toLowerCase()} öldü.`, 'bad');
      }
    });
    pond.batches = pond.batches.filter((b) => b.count > 0);
    // Spawning: grown fish breed when fed and the water is clean, if there is room.
    const spawned: FishBatch[] = [];
    pond.batches.forEach((b) => {
      const room = pondCapacity(d) - [...pond.batches, ...spawned].reduce((n, x) => n + x.count, 0);
      if (!canSpawn(b, pond, room)) return;
      if (Math.random() >= FISH[b.species].spawnChance * dt) return;
      const fry = Math.min(room, 1 + Math.floor(b.count / 3));
      spawned.push({ id: `fish-${d.nextId++}`, species: b.species, count: fry, growth: 0 });
      ensureDay(d, day).births += fry;
      note(d, `Havuzda ${fry} yavru ${FISH[b.species].name.toLowerCase()} çıktı!`, 'good');
    });
    pond.batches.push(...spawned);

    runMachines(d, dt);
  }
}

function update(set: (fn: (s: Store) => Partial<Store>) => void, fn: (d: Draft) => void) {
  set((s) => {
    const d = draft(s);
    fn(d);
    checkAchievements(d);
    return d;
  });
}

/** How far the farm is toward an achievement. */
export function achievementProgress(s: GameState, a: (typeof ACHIEVEMENTS)[number]): number {
  const m = a.measure;
  if ('stat' in m) return s.stats?.[m.stat] ?? 0;
  if (m.count === 'cows') return s.animals.filter((x) => x.species === 'cow').length;
  if (m.count === 'chickens') return s.animals.filter((x) => x.species === 'chicken').length;
  if (m.count === 'land') return FIELDS.filter((f) => f.land && s.land[f.id]).length;
  if (m.count === 'panels') return s.power.panels;
  if (m.count === 'level') return levelOf(s.xp);
  return s.coins;
}

function checkAchievements(d: Draft) {
  if (!d.achievements) return;
  for (const a of ACHIEVEMENTS) {
    if (d.achievements.includes(a.id) || achievementProgress(d, a) < a.target) continue;
    d.achievements = [...d.achievements, a.id];
    note(d, `Başarım açıldı: ${a.name}! Ödülünü Görevler'den al.`, 'good');
  }
}

/** Items a customer could reasonably ask this farm for, as it stands. */
function orderable(d: Draft): ItemId[] {
  const level = levelOf(d.xp);
  const out: ItemId[] = Object.values(CROPS).filter((c) => c.level <= level).map((c) => c.harvest);
  (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => {
    if (d.animals.some((a) => a.species === sp)) out.push(SPECIES[sp].product);
  });
  d.pond.batches.forEach((b) => out.push(FISH[b.species].catch));
  (Object.keys(d.workshops) as WorkshopId[]).forEach((id) => out.push(WORKSHOPS[id].output));
  return [...new Set(out)];
}

/** Morning: orders run out, and new customers come. */
function newOrders(d: Draft, day: number) {
  const late = d.orders.filter((o) => o.dueDay < day);
  if (late.length) {
    d.orders = d.orders.filter((o) => o.dueDay >= day);
    note(d, late.length === 1 ? `${late[0].who} siparişi zamanında gelmedi, vazgeçti.` : `${late.length} sipariş zamanında teslim edilmedi.`, 'bad');
  }
  const items = orderable(d);
  let wanted = d.orders.length < MAX_ORDERS ? 1 + (Math.random() < 0.4 ? 1 : 0) : 0;
  while (wanted-- > 0 && d.orders.length < MAX_ORDERS && items.length) {
    const item = items[Math.floor(Math.random() * items.length)];
    const kind = ITEMS[item].kind;
    const [lo, hi] = kind === 'crop' ? [6, 16] : kind === 'produce' ? [4, 12] : [2, 5];
    const qty = lo + Math.floor(Math.random() * (hi - lo + 1));
    const reward = Math.round(ITEMS[item].price * qty * (1.6 + Math.random() * 0.6));
    d.orders = [
      ...d.orders,
      {
        id: `order-${d.nextId++}`,
        who: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
        item,
        qty,
        reward,
        xp: 5 + qty * 2,
        dueDay: day + 2 + Math.floor(Math.random() * 2),
      },
    ];
  }
}

/** What the day has in store, chosen by the day itself, so the market knows a boom in advance. */
export function happeningFor(day: number): { kind: HappeningKind; item?: ItemId } | null {
  if (day < 3) return null;
  const rand = seeded(day * 4513 + 7);
  if (rand() >= HAPPENING_CHANCE) return null;
  const roll = rand();
  const season = seasonOf(day);
  let kind: HappeningKind = roll < 0.3 ? 'fox' : roll < 0.55 ? 'drought' : roll < 0.75 ? 'locusts' : 'boom';
  if (kind === 'drought' && season === 'winter') kind = 'boom';
  if (kind === 'locusts' && season !== 'summer' && season !== 'autumn') kind = 'boom';
  if (kind !== 'boom') return { kind };
  const sellable = (Object.keys(ITEMS) as ItemId[]).filter((i) => ['crop', 'produce', 'fish', 'goods'].includes(ITEMS[i].kind));
  return { kind, item: sellable[Math.floor(rand() * sellable.length)] };
}

/** Morning: whatever the day brings, happens. */
function happen(d: Draft, day: number) {
  const h = happeningFor(day);
  d.happening = null;
  if (!h) return;
  if (h.kind === 'fox') {
    const hens = d.animals.filter((a) => a.species === 'chicken');
    if (!hens.length) return;
    if (d.dog) {
      d.happening = { day, kind: 'fox', note: 'Karabaş tilkiyi kovaladı, kümes güvende.' };
      return note(d, 'Gece tilki geldi ama Karabaş kovaladı!', 'good');
    }
    const taken = hens[Math.floor(Math.random() * hens.length)];
    d.animals = d.animals.filter((a) => a.id !== taken.id);
    ensureDay(d, day).deaths++;
    d.happening = { day, kind: 'fox', note: `Tilki ${taken.name} adlı tavuğu kaptı. Bekçi köpeği alırsan bir daha olmaz.` };
    return note(d, `Gece tilki kümese girdi, ${taken.name} kayıp!`, 'bad');
  }
  if (h.kind === 'drought') {
    d.happening = { day, kind: 'drought', note: HAPPENINGS.drought.blurb };
    return note(d, 'Kuraklık! Bugün yağmur yok, tarlalar çabuk kurur.', 'bad');
  }
  if (h.kind === 'locusts') {
    let hit = 0;
    for (const f of FIELDS) {
      d.fields[f.id] = d.fields[f.id].map((p) => {
        if (!p.crop || p.dead || p.growth >= 1) return p;
        hit++;
        return { ...p, growth: Math.max(0, p.growth - 0.25) };
      });
    }
    if (!hit) return;
    d.happening = { day, kind: 'locusts', note: `Çekirgeler ${hit} parselin büyümesini geri attı.` };
    return note(d, `Çekirge sürüsü! ${hit} parsel geri kaldı.`, 'bad');
  }
  d.happening = { day, kind: 'boom', item: h.item, note: `Bugün ${ITEMS[h.item!].name.toLowerCase()} fiyatı iki katı!` };
  note(d, `Fiyat patlaması: ${ITEMS[h.item!].name} bugün iki katına satılıyor!`, 'good');
}

export const SAVE_KEY = 'ciftlik-save';
export const SAVE_VERSION = 10;

/**
 * Storage that never lets an older copy of the game write over a save made
 * by a newer one (an old browser tab left open, say): that older save would
 * come back without whatever the newer version keeps.
 */
const guardedStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
  setItem: async (name: string, value: string) => {
    try {
      const was = JSON.parse((await AsyncStorage.getItem(name)) ?? 'null')?.version ?? 0;
      const now = JSON.parse(value)?.version ?? 0;
      if (was > now) return;
    } catch {
      // An unreadable save is no reason not to write a good one.
    }
    await AsyncStorage.setItem(name, value);
  },
};

/**
 * Mends a save so the game can always run on it: the three starting pieces
 * of land are always the farm's, land in use as a field has plots and land
 * that is not a field has none. Missing lists come back empty.
 */
export function repair(s: GameState): GameState {
  const fields = { ...s.fields } as Record<FieldId, Plot[]>;
  const land = { ...(s.land ?? {}) } as GameState['land'];
  for (const f of FIELDS) {
    fields[f.id] = Array.isArray(fields[f.id]) ? fields[f.id] : [];
    if (!f.land && !land[f.id]) land[f.id] = fields[f.id].length ? 'field' : 'empty';
    const use = land[f.id];
    if (use === 'field' && !fields[f.id].length) fields[f.id] = Array.from({ length: f.plots }, emptyPlot);
    if (use !== 'field' && fields[f.id].length) fields[f.id] = [];
  }
  return {
    ...s,
    fields,
    land,
    animals: Array.isArray(s.animals) ? s.animals : [],
    orders: Array.isArray(s.orders) ? s.orders : [],
    achievements: Array.isArray(s.achievements) ? s.achievements : [],
    claimed: Array.isArray(s.claimed) ? s.claimed : [],
    workshops: s.workshops ?? {},
    incubator: Array.isArray(s.incubator) ? s.incubator : [],
  };
}

export const useGame = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      tick: (nowMs) => {
        const s = get();
        if (nowMs < s.lastReal) return set({ lastReal: nowMs });
        const elapsedMin = ((nowMs - s.lastReal) / 1000) * GAME_MINUTES_PER_SECOND;
        if (elapsedMin < 1) return;
        const hours = Math.min(elapsedMin / 60, MAX_CATCH_UP_HOURS);
        update(set, (d) => {
          simulate(d, hours);
          d.lastReal = nowMs;
        });
      },

      plant: (field, index, crop) =>
        update(set, (d) => {
          const p = d.fields[field]?.[index];
          if (!p || p.crop) return;
          if (!takeItem(d, CROPS[crop].seed, 1)) return note(d, `${CROPS[crop].name} tohumun kalmadı.`, 'bad');
          d.fields[field][index] = { ...emptyPlot(), crop, moisture: p.moisture };
          gainXp(d, 1);
        }),

      water: (field, index) =>
        update(set, (d) => {
          const p = d.fields[field]?.[index];
          if (!p || !p.crop || p.dead) return;
          if (d.tank < WATER_PER_PLOT) return note(d, 'Su deposu boş. Pompayı çalıştır.', 'bad');
          d.tank -= WATER_PER_PLOT;
          p.moisture = 100;
        }),

      waterField: (field) =>
        update(set, (d) => {
          let watered = 0;
          for (const p of d.fields[field]) {
            if (!p.crop || p.dead || p.moisture > 85) continue;
            if (d.tank < WATER_PER_PLOT) {
              note(d, 'Su deposu bitti, bazı parseller sulanamadı.', 'bad');
              break;
            }
            d.tank -= WATER_PER_PLOT;
            p.moisture = 100;
            watered++;
          }
          if (watered) gainXp(d, 1);
        }),

      fertilize: (field, index) =>
        update(set, (d) => {
          const p = d.fields[field]?.[index];
          if (!p || !p.crop || p.dead || p.fertilized || p.growth >= 1) return;
          if (!takeItem(d, 'fertilizer', 1)) return note(d, 'Gübren kalmadı.', 'bad');
          p.fertilized = true;
        }),

      weed: (field, index) =>
        update(set, (d) => {
          const p = d.fields[field]?.[index];
          if (!p || !p.weeds) return;
          p.weeds = false;
          gainXp(d, 1);
        }),

      harvest: (field, index) =>
        update(set, (d) => {
          harvestPlot(d, field, index);
        }),

      harvestField: (field) =>
        update(set, (d) => {
          let total = 0;
          for (let i = 0; i < d.fields[field].length; i++) total += harvestPlot(d, field, i);
          if (total) note(d, `${total} birim ürün hasat edildi.`, 'good');
        }),

      clearPlot: (field, index) =>
        update(set, (d) => {
          const p = d.fields[field]?.[index];
          if (!p) return;
          d.fields[field][index] = { ...emptyPlot(), moisture: p.moisture, lastCrop: p.crop ?? p.lastCrop };
        }),

      tidyField: (field) =>
        update(set, (d) => {
          let dead = 0;
          let weeds = 0;
          d.fields[field] = d.fields[field].map((p) => {
            if (p.dead) {
              dead++;
              return { ...emptyPlot(), moisture: p.moisture, lastCrop: p.crop };
            }
            if (p.weeds) {
              weeds++;
              return { ...p, weeds: false };
            }
            return p;
          });
          if (!dead && !weeds) return;
          gainXp(d, 1);
          const parts = [dead ? `${dead} ölü bitki` : '', weeds ? `${weeds} parselin otu` : ''].filter(Boolean);
          note(d, `${parts.join(' ve ')} temizlendi.`, 'good');
        }),

      feedSpecies: (species) =>
        update(set, (d) => {
          const s = SPECIES[species];
          const { fed, short } = feedHerd(d, species, 95);
          if (short) note(d, `${ITEMS[s.feed].name} yetmedi, ${s.plural.toLowerCase()} tam doymadı.`, 'bad');
          if (fed) {
            gainXp(d, 1);
            markMeal(d);
          }
        }),

      feedAll: () => (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => get().feedSpecies(sp)),

      collect: (species) =>
        update(set, (d) => {
          const s = SPECIES[species];
          const total = collectHerd(d, species);
          if (total) note(d, `${total} ${ITEMS[s.product].unit} ${ITEMS[s.product].name.toLowerCase()} toplandı.`, 'good');
        }),

      collectAll: () => (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => get().collect(sp)),

      pet: (id) =>
        update(set, (d) => {
          const a = d.animals.find((x) => x.id === id);
          if (a) a.happiness = clamp(a.happiness + 18);
        }),

      heal: (id) =>
        update(set, (d) => {
          const a = d.animals.find((x) => x.id === id);
          if (!a || a.health >= 95) return;
          if (!takeItem(d, 'medicine', 1)) return note(d, 'İlacın yok. Pazardan alabilirsin.', 'bad');
          a.health = 100;
          note(d, `${a.name} iyileşti.`, 'good');
        }),

      healMany: (ids) =>
        update(set, (d) => {
          // The sickest first, so short medicine goes where it matters most.
          const ill = d.animals.filter((a) => ids.includes(a.id) && a.health < 95).sort((a, b) => a.health - b.health);
          if (!ill.length) return note(d, 'Seçilenlerin hepsi sağlıklı.', 'info');
          let healed = 0;
          for (const a of ill) {
            if (!takeItem(d, 'medicine', 1)) break;
            a.health = 100;
            healed++;
          }
          if (healed < ill.length) note(d, `İlaç yetmedi: ${healed} hayvan iyileşti, ${ill.length - healed} hayvan bekliyor.`, 'bad');
          else note(d, `${healed} hayvan iyileşti.`, 'good');
        }),

      petMany: (ids) =>
        update(set, (d) => {
          let n = 0;
          d.animals.forEach((a) => {
            if (!ids.includes(a.id)) return;
            a.happiness = clamp(a.happiness + 18);
            n++;
          });
          if (n) note(d, `${n} hayvan sevildi.`, 'good');
        }),

      cleanBarn: () =>
        update(set, (d) => {
          if (d.barnClean > 90) return;
          d.barnClean = 100;
          gainXp(d, 2);
          note(d, 'Ahır tertemiz.', 'good');
        }),

      buyAnimal: (species) =>
        update(set, (d) => {
          const s = SPECIES[species];
          if (s.level > levelOf(d.xp)) return note(d, `${s.name} için seviye ${s.level} gerekli.`, 'bad');
          if (species === 'chicken' ? inCoop(d) + eggsIn(d) >= coopCapacity(d) : inBarn(d) + expectingIn(d) >= barnCapacity(d)) {
            return note(d, species === 'chicken' ? 'Kümeste yer kalmadı. Kümesi büyütebilirsin.' : 'Ahırda yer kalmadı. Ahırı büyütebilirsin.', 'bad');
          }
          if (d.coins < s.price) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= s.price;
          ensureDay(d, dayOf(d.minutes)).expense += s.price;
          const animal = makeAnimal(species, d.nextId++, dayOf(d.minutes), Math.random, d.animals);
          animal.bornDay = dayOf(d.minutes) - s.maturityDays - 5;
          animal.product = 0;
          d.animals.push(animal);
          note(d, `Yeni ${s.name.toLowerCase()} geldi: ${animal.name}.`, 'good');
        }),

      incubate: (eggs) =>
        update(set, (d) => {
          if (d.incubator.length >= 3) return note(d, 'Kuluçka makinesinde boş tepsi yok.', 'bad');
          const room = coopCapacity(d) - inCoop(d) - eggsIn(d);
          const n = Math.min(eggs, INCUBATOR_SIZE, room, d.inventory.egg ?? 0);
          if (n <= 0) return note(d, room <= 0 ? 'Kümeste civcivlere yer yok.' : 'Kuluçkaya koyacak yumurta yok.', 'bad');
          takeItem(d, 'egg', n);
          d.incubator.push({ id: `tray-${d.nextId++}`, eggs: n, readyAt: d.minutes + HATCH_HOURS * 60 });
          gainXp(d, 1);
          note(d, `${n} yumurta kuluçkaya kondu. ${HATCH_HOURS} saat sonra civciv çıkacak.`, 'info');
        }),

      expandField: (field) =>
        update(set, (d) => {
          if (!ownsField(d, field)) return note(d, ownsLand(d, field) ? 'Bu arazi tarla değil.' : 'Önce bu araziyi satın al.', 'bad');
          const step = FIELD_EXPANSIONS[fieldLevel(d, field)];
          if (!step) return note(d, 'Bu tarla en büyük hâlinde.', 'info');
          if (step.level > levelOf(d.xp)) return note(d, `Genişletmek için seviye ${step.level} gerekli.`, 'bad');
          if (d.coins < step.cost) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= step.cost;
          ensureDay(d, dayOf(d.minutes)).expense += step.cost;
          d.fields[field] = [...d.fields[field], ...Array.from({ length: step.plots }, emptyPlot)];
          gainXp(d, 10);
          note(d, `${FIELDS.find((f) => f.id === field)!.name} genişledi: ${d.fields[field].length} parsel.`, 'good');
        }),

      buyLand: (field, use = 'empty') =>
        update(set, (d) => {
          const def = FIELDS.find((f) => f.id === field)!;
          if (!def.land || ownsLand(d, field)) return;
          const level = Math.max(def.land.level, LAND_USES[use].level);
          if (level > levelOf(d.xp)) return note(d, `Bunun için seviye ${level} gerekli.`, 'bad');
          const price = landPrice(field, use);
          if (d.coins < price) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= price;
          ensureDay(d, dayOf(d.minutes)).expense += price;
          d.land[field] = use;
          d.fields[field] = use === 'field' ? Array.from({ length: def.plots }, emptyPlot) : [];
          gainXp(d, 15);
          const what =
            use === 'empty'
              ? 'Ne olacağını seçmek için haritada araziye dokun.'
              : use === 'field'
                ? `${def.plots} yeni parsel ekime hazır.`
                : `${LAND_USES[use].blurb}.`;
          note(d, `${landName(def, use)} senin! ${what}`, 'good');
        }),

      buyPower: (kind) =>
        update(set, (d) => {
          const def = POWER[kind];
          const key = kind === 'panel' ? 'panels' : 'turbines';
          const name = kind === 'panel' ? 'Güneş paneli' : 'Rüzgâr türbini';
          if (d.power[key] >= def.max) return note(d, `${name} için yer kalmadı.`, 'info');
          if (def.level > levelOf(d.xp)) return note(d, `${name} için seviye ${def.level} gerekli.`, 'bad');
          if (d.coins < def.price) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= def.price;
          ensureDay(d, dayOf(d.minutes)).expense += def.price;
          d.power[key] += 1;
          gainXp(d, 5);
          note(d, `${name} kuruldu (${d.power[key]} / ${def.max}).`, 'good');
        }),

      deliver: (orderId) =>
        update(set, (d) => {
          const o = d.orders.find((x) => x.id === orderId);
          if (!o) return;
          if ((d.inventory[o.item] ?? 0) < o.qty) return note(d, `${o.who} için ${o.qty} ${ITEMS[o.item].name.toLowerCase()} gerekli.`, 'bad');
          takeItem(d, o.item, o.qty);
          d.orders = d.orders.filter((x) => x.id !== orderId);
          d.coins += o.reward;
          ensureDay(d, dayOf(d.minutes)).income += o.reward;
          gainXp(d, o.xp);
          d.stats.orders++;
          note(d, `${o.who} siparişini aldı: +${o.reward} altın.`, 'good');
        }),

      buyWorkshop: (id) =>
        update(set, (d) => {
          const w = WORKSHOPS[id];
          if (d.workshops[id]) return;
          if (w.level > levelOf(d.xp)) return note(d, `${w.name} için seviye ${w.level} gerekli.`, 'bad');
          if (d.coins < w.price) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= w.price;
          ensureDay(d, dayOf(d.minutes)).expense += w.price;
          d.workshops[id] = { jobs: [] };
          gainXp(d, 15);
          note(d, `${w.name} kuruldu.`, 'good');
        }),

      craft: (id) =>
        update(set, (d) => {
          const w = WORKSHOPS[id];
          const shop = d.workshops[id];
          if (!shop) return;
          if (shop.jobs.length >= WORKSHOP_SLOTS) return note(d, `${w.name} dolu: bir parti bitsin.`, 'bad');
          const short = w.inputs.find((i) => (d.inventory[i.item] ?? 0) < i.qty);
          if (short) return note(d, `${ITEMS[short.item].name} yetmiyor: ${short.qty} gerekli.`, 'bad');
          w.inputs.forEach((i) => takeItem(d, i.item, i.qty));
          // Batches queue: each starts when the one before it is done.
          const from = Math.max(d.minutes, ...shop.jobs);
          shop.jobs = [...shop.jobs, from + w.hours * 60];
        }),

      buyDog: () =>
        update(set, (d) => {
          if (d.dog) return;
          if (d.coins < DOG_PRICE) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= DOG_PRICE;
          ensureDay(d, dayOf(d.minutes)).expense += DOG_PRICE;
          d.dog = true;
          note(d, 'Karabaş çiftliğe geldi. Artık tilki kümese yaklaşamaz.', 'good');
        }),

      claim: (id) =>
        update(set, (d) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (!a || !d.achievements.includes(id) || d.claimed.includes(id)) return;
          d.claimed = [...d.claimed, id];
          d.coins += a.reward;
          ensureDay(d, dayOf(d.minutes)).income += a.reward;
          gainXp(d, 10);
          note(d, `${a.name} ödülü: +${a.reward} altın.`, 'good');
        }),

      warnOldTab: () =>
        update(set, (d) => warnOnce(d, 'old-tab', 'Oyun başka bir sekmede eski bir sürümle açık. O sekmeyi kapat, yoksa kaydın bozulabilir.')),

      rename: (name) =>
        update(set, (d) => {
          const clean = name.trim().slice(0, 32);
          if (clean) d.farmName = clean;
        }),

      payBill: () =>
        update(set, (d) => {
          const bill = d.power.unpaid;
          if (!bill) return;
          if (d.coins < bill) return note(d, `Faturayı ödemek için ${bill} altın gerekli.`, 'bad');
          d.coins -= bill;
          ensureDay(d, dayOf(d.minutes)).expense += bill;
          d.power.unpaid = 0;
          note(d, 'Fatura ödendi, makineler yeniden çalışıyor.', 'good');
        }),

      convertLand: (field, to, destroy = false) =>
        update(set, (d) => {
          const def = FIELDS.find((f) => f.id === field)!;
          const from = d.land[field];
          if (!from || from === to) return;
          const use = LAND_USES[to];
          if (use.level > levelOf(d.xp)) return note(d, `${use.name} için seviye ${use.level} gerekli.`, 'bad');
          if (d.coins < use.cost) return note(d, 'Yeterli paran yok.', 'bad');
          // What is on the land now has to go somewhere first.
          const growing = from === 'field' ? d.fields[field].filter((p) => p.crop && !p.dead).length : 0;
          if (growing && !destroy) return note(d, `${def.name} üzerinde ${growing} ekin var: hasat et ya da tarlayı boz.`, 'bad');
          if (from === 'barn') {
            const left = barnCapacity(d) - LAND_USES.barn.adds;
            const herd = inBarn(d) + expectingIn(d);
            if (herd > left) return note(d, `Hayvanlar (doğacaklar dahil) kalan ahıra sığmaz: önce ${herd - left} hayvan sat.`, 'bad');
          }
          if (from === 'coop') {
            const left = coopCapacity(d) - LAND_USES.coop.adds;
            const hens = inCoop(d) + eggsIn(d);
            if (hens > left) return note(d, `Tavuklar kalan kümese sığmaz: önce ${hens - left} tavuk sat.`, 'bad');
          }
          if (from === 'pond') {
            const left = pondCapacity(d) - LAND_USES.pond.adds;
            const fish = d.pond.batches.reduce((n, b) => n + b.count, 0);
            if (fish > left) return note(d, `Balıklar kalan havuza sığmaz: önce ${fish - left} balık tut.`, 'bad');
          }
          const fromName = landName(def, from);
          d.coins -= use.cost;
          ensureDay(d, dayOf(d.minutes)).expense += use.cost;
          d.land[field] = to;
          d.fields[field] = to === 'field' ? Array.from({ length: def.plots }, emptyPlot) : [];
          d.tank = Math.min(d.tank, tankCapacity(d));
          gainXp(d, 5);
          note(d, `${fromName} artık ${landName(def, to)}.${growing ? ` ${growing} ekin söküldü.` : ''}`, 'good');
        }),

      swapLand: (a, b) =>
        update(set, (d) => {
          if (a === b || !d.land[a] || !d.land[b]) return;
          const [da, db] = [a, b].map((id) => FIELDS.find((f) => f.id === id)!);
          const names = [landName(da, d.land[a]!), landName(db, d.land[b]!)];
          [d.land[a], d.land[b]] = [d.land[b], d.land[a]];
          [d.fields[a], d.fields[b]] = [d.fields[b], d.fields[a]];
          note(d, `${names[0]} ile ${names[1]} yer değiştirdi.`, 'info');
        }),

      upgrade: (facility) =>
        update(set, (d) => {
          const f = FACILITIES[facility];
          const step = f.steps[d.upgrades[facility]];
          if (!step) return note(d, `${f.name} en büyük hâlinde.`, 'info');
          if (step.level > levelOf(d.xp)) return note(d, `${f.name} için seviye ${step.level} gerekli.`, 'bad');
          if (d.coins < step.cost) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= step.cost;
          ensureDay(d, dayOf(d.minutes)).expense += step.cost;
          d.upgrades[facility] += 1;
          gainXp(d, 10);
          note(d, `${f.name} büyüdü: ${step.capacity} ${f.unit}.`, 'good');
        }),

      sellAnimal: (id) => get().sellAnimals([id]),

      sellAnimals: (ids) =>
        update(set, (d) => {
          const day = dayOf(d.minutes);
          const sold = d.animals.filter((a) => ids.includes(a.id));
          if (!sold.length) return;
          const value = sold.reduce((n, a) => n + animalValue(a, day), 0);
          d.animals = d.animals.filter((a) => !ids.includes(a.id));
          d.coins += value;
          ensureDay(d, day).income += value;
          note(d, sold.length === 1 ? `${sold[0].name} ${value} altına satıldı.` : `${sold.length} hayvan ${value} altına satıldı.`, 'info');
        }),

      feedFish: () =>
        update(set, (d) => {
          if (d.pond.fullness > 90) return;
          if (!takeItem(d, 'fish_feed', FISH_FEED_PER_MEAL)) return note(d, 'Balık yemi bitti.', 'bad');
          d.pond.fullness = 100;
          d.pond.feeds = (d.pond.feeds ?? 0) + 1;
          gainXp(d, 1);
        }),

      cleanPond: () =>
        update(set, (d) => {
          if (d.pond.quality > 90) return;
          if (d.coins < POND_CLEAN_COST) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= POND_CLEAN_COST;
          ensureDay(d, dayOf(d.minutes)).expense += POND_CLEAN_COST;
          d.pond.quality = 100;
          note(d, 'Havuzun suyu tazelendi.', 'good');
        }),

      stockFish: (species, count) =>
        update(set, (d) => {
          const f = FISH[species];
          if (f.level > levelOf(d.xp)) return note(d, `${f.name} için seviye ${f.level} gerekli.`, 'bad');
          const room = pondCapacity(d) - d.pond.batches.reduce((n, b) => n + b.count, 0);
          const qty = Math.min(Math.floor(count), room);
          if (qty <= 0) return note(d, 'Havuz dolu.', 'bad');
          const cost = qty * f.price;
          if (d.coins < cost) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= cost;
          ensureDay(d, dayOf(d.minutes)).expense += cost;
          d.pond.batches.push({ id: `fish-${d.nextId++}`, species, count: qty, growth: 0 });
          note(d, `${qty} yavru ${f.name.toLowerCase()} havuza bırakıldı.`, 'good');
        }),

      catchFish: (batchId, count) =>
        update(set, (d) => {
          const b = d.pond.batches.find((x) => x.id === batchId);
          if (!b || b.growth < 1) return;
          const n = Math.max(0, Math.min(b.count, Math.floor(count ?? b.count)));
          if (!n) return;
          const f = FISH[b.species];
          addItem(d, f.catch, n);
          d.stats.caught += n;
          ensureDay(d, dayOf(d.minutes)).fish += n;
          gainXp(d, n * 3);
          note(d, `${n} ${f.name.toLowerCase()} tutuldu.`, 'good');
          b.count -= n;
          d.pond.batches = d.pond.batches.filter((x) => x.count > 0);
        }),

      buyMachine: (id) =>
        update(set, (d) => {
          const m = MACHINES[id];
          if (d.machines[id]) return;
          if (m.level > levelOf(d.xp)) return note(d, `${m.name} için seviye ${m.level} gerekli.`, 'bad');
          if (d.coins < m.price) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= m.price;
          ensureDay(d, dayOf(d.minutes)).expense += m.price;
          d.machines[id] = { on: true };
          gainXp(d, 15);
          note(d, `${m.name} kuruldu ve çalışıyor.`, 'good');
        }),

      toggleMachine: (id) =>
        update(set, (d) => {
          const m = d.machines[id];
          if (m) m.on = !m.on;
        }),

      buy: (item, qty) =>
        update(set, (d) => {
          if (!Number.isInteger(qty) || qty <= 0) return;
          if (ITEMS[item].kind !== 'seed' && ITEMS[item].kind !== 'supply') return;
          const crop = Object.values(CROPS).find((c) => c.seed === item);
          if (crop && crop.level > levelOf(d.xp)) return note(d, `${crop.name} için seviye ${crop.level} gerekli.`, 'bad');
          const cost = buyPrice(item) * qty;
          if (d.coins < cost) return note(d, 'Yeterli paran yok.', 'bad');
          d.coins -= cost;
          ensureDay(d, dayOf(d.minutes)).expense += cost;
          addItem(d, item, qty);
        }),

      sell: (item, qty) =>
        update(set, (d) => {
          const have = d.inventory[item] ?? 0;
          const n = Math.min(have, Math.floor(qty));
          if (n <= 0) return;
          const earned = sellPrice(dayOf(d.minutes), item) * n;
          d.inventory[item] = have - n;
          d.coins += earned;
          ensureDay(d, dayOf(d.minutes)).income += earned;
        }),

      sellKind: (kind) =>
        update(set, (d) => {
          let earned = 0;
          const day = dayOf(d.minutes);
          (Object.keys(d.inventory) as ItemId[]).forEach((item) => {
            const n = d.inventory[item] ?? 0;
            if (!n || ITEMS[item].kind !== kind) return;
            earned += sellPrice(day, item) * n;
            d.inventory[item] = 0;
          });
          if (!earned) return;
          d.coins += earned;
          ensureDay(d, day).income += earned;
          note(d, `Satıştan ${earned} altın kazandın.`, 'good');
        }),

      pump: () =>
        update(set, (d) => {
          if (d.tank >= tankCapacity(d)) return;
          if (d.coins < PUMP_COST) return note(d, 'Pompanın elektriği için paran yok.', 'bad');
          d.coins -= PUMP_COST;
          ensureDay(d, dayOf(d.minutes)).expense += PUMP_COST;
          d.tank = Math.min(tankCapacity(d), d.tank + PUMP_LITRES);
        }),

      sleep: () =>
        update(set, (d) => {
          const hour = hourOf(d.minutes);
          const until = hour < 6 ? 6 - hour : 30 - hour;
          simulate(d, until);
          note(d, 'Sabaha kadar uyudun.', 'info');
        }),

      reset: () => set(() => ({ ...initialState(), farmName: get().farmName })),
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      migrate: (persisted, version) => migrate(persisted, version),
      // Every load is checked and mended, whatever version it was saved by.
      merge: (persisted, current) => ({ ...current, ...repair({ ...current, ...(persisted as Partial<GameState>) } as GameState) }),
      storage: createJSONStorage(() => guardedStorage),
      // Only data is saved; the actions are rebuilt on load.
      partialize: (s) =>
        Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')) as GameState,
    },
  ),
);

/** A meal counts as served once the whole herd has eaten in its slot. */
function markMeal(d: Draft) {
  const day = dayOf(d.minutes);
  if (d.meals.day !== day) d.meals = { day, done: [false, false, false] };
  const slot = currentMeal(hourOf(d.minutes));
  if (slot < 0) return;
  if (!d.animals.some((a) => a.fullness < 95)) d.meals.done[slot] = true;
}

export { MINUTES_PER_DAY };

/** What an animal fetches at market: part of its price, less for the young and the unwell. */
export function animalValue(a: Animal, day: number): number {
  return Math.round(SPECIES[a.species].price * 0.6 * (a.health / 100) * (isAdult(a, day) ? 1 : 0.5));
}

/** How many times a field has been expanded, read off its plot count. */
export function fieldLevel(s: GameState, field: FieldId): number {
  let level = 0;
  let plots = BASE_PLOTS;
  while (level < FIELD_EXPANSIONS.length && s.fields[field].length >= plots + FIELD_EXPANSIONS[level].plots) {
    plots += FIELD_EXPANSIONS[level].plots;
    level++;
  }
  return level;
}

/** Whether a piece of land is the farm's: the first three always, a parcel once bought. */
export function ownsLand(s: GameState, field: FieldId): boolean {
  return !!s.land?.[field];
}

/** Whether a piece of land is owned and used as a field. */
export function ownsField(s: GameState, field: FieldId): boolean {
  return s.land?.[field] === 'field';
}

export function ownedFields(s: GameState) {
  return FIELDS.filter((f) => ownsField(s, f.id));
}

export function ownedLand(s: GameState) {
  return FIELDS.filter((f) => ownsLand(s, f.id));
}

/** How many pieces of land are given over to a use. */
export function landCount(s: GameState, use: LandUse): number {
  return FIELDS.filter((f) => s.land?.[f.id] === use).length;
}

/** What a parcel for sale costs, ready as `use`: a field comes with it, anything else is built on. */
export function landPrice(field: FieldId, use: LandUse): number {
  const def = FIELDS.find((f) => f.id === field)!;
  return (def.land?.price ?? 0) + (use === 'field' ? 0 : LAND_USES[use].cost);
}

/** A building's capacity at its current size. */
export function capacity(s: GameState, facility: FacilityId): number {
  const f = FACILITIES[facility];
  const level = s.upgrades?.[facility] ?? 0;
  return level === 0 ? f.base : f.steps[level - 1].capacity;
}

// The buildings, plus whatever land has been given over to more of them.
export const barnCapacity = (s: GameState) => capacity(s, 'barn') + landCount(s, 'barn') * LAND_USES.barn.adds;
export const coopCapacity = (s: GameState) => capacity(s, 'coop') + landCount(s, 'coop') * LAND_USES.coop.adds;
/** Cows, sheep and goats live in the barn; hens in the coop. */
export const inBarn = (s: GameState) => s.animals.filter((a) => a.species !== 'chicken').length;
/** Young on the way take a place in the barn already. */
const expectingIn = (s: GameState) => s.animals.filter((a) => a.pregnantSince !== null).length;
export const inCoop = (s: GameState) => s.animals.filter((a) => a.species === 'chicken').length;
const eggsIn = (s: GameState) => s.incubator.reduce((n, t) => n + t.eggs, 0);
export const pondCapacity = (s: GameState) => capacity(s, 'pond') + landCount(s, 'pond') * LAND_USES.pond.adds;
export const tankCapacity = (s: GameState) => capacity(s, 'tank') + landCount(s, 'tank') * LAND_USES.tank.adds;

/** The farm's size in dönüm: it grows with every field and building enlarged. */
export function farmArea(s: GameState): number {
  const fields = FIELDS.reduce((n, f) => n + fieldLevel(s, f.id), 0);
  const buildings = (Object.keys(FACILITIES) as FacilityId[]).reduce((n, f) => n + (s.upgrades?.[f] ?? 0), 0);
  const land = FIELDS.filter((f) => f.land && ownsLand(s, f.id)).length;
  return BASE_AREA + fields * 1.5 + buildings * 0.5 + land * LAND_AREA;
}

/**
 * Brings an older save up to date. Version 1 had no breeding or dying: its
 * animals get the new fields at rest, and the incubator starts empty.
 */
export function migrate(persisted: unknown, version: number): GameState {
  const s = persisted as GameState;
  if (version < 2) {
    s.animals = s.animals.map((a) => ({ ...a, pregnantSince: null, sickHours: 0, warnedSick: false }));
    s.incubator = [];
    s.log = s.log.map((l) => ({ ...l, births: 0, deaths: 0 }));
  }
  if (version < 3) {
    // Version 2 farms were all as built: base buildings, eight plots a field.
    s.upgrades = { barn: 0, coop: 0, pond: 0, tank: 0 };
  }
  if (version < 4) {
    s.machines = {};
    s.warned = {};
  }
  // Version 5 adds land to buy around the farm; none of it is owned yet.
  for (const f of FIELDS) s.fields[f.id] ??= [];
  // Version 6 records what each piece of land is used for; until now, all were fields.
  if (version < 6) s.land = Object.fromEntries(FIELDS.filter((f) => s.fields[f.id].length).map((f) => [f.id, 'field']));
  // The starting land is always the farm's, whatever an old save says.
  for (const f of FIELDS) if (!f.land && !s.land[f.id]) s.land[f.id] = s.fields[f.id].length ? 'field' : 'empty';
  // Version 7 brings electricity: nothing built yet, the meter at zero.
  s.power ??= { panels: 0, turbines: 0, used: 0, made: 0, unpaid: 0, history: [] };
  // Version 8 keeps the hens apart, in a coop of their own, built at its first size.
  s.upgrades = { ...s.upgrades, coop: s.upgrades.coop ?? 0 };
  // Version 9: the counter for new ids started inside the starting herd's
  // range, so some animals share an id. Give each repeat a fresh one, and
  // move the counter past every id in use.
  if (version < 9) {
    const used = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    const all = [...s.animals.map((a) => a.id), ...s.pond.batches.map((b) => b.id), ...s.incubator.map((t) => t.id)];
    s.nextId = Math.max(s.nextId, ...all.map(used)) + 1;
    const seen = new Set<string>();
    s.animals = s.animals.map((a) => {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        return a;
      }
      const id = `${a.species}-${s.nextId++}`;
      seen.add(id);
      return { ...a, id };
    });
  }
  if (version < 9) {
    // Hens that used to share the barn get a coop big enough for them.
    const hens = s.animals.filter((a) => a.species === 'chicken').length + s.incubator.reduce((n, t) => n + t.eggs, 0);
    while (s.upgrades.coop < FACILITIES.coop.steps.length && capacity(s, 'coop') < hens) s.upgrades.coop++;
  }
  // Version 10: seasons, workshops, orders, achievements and the day's happenings.
  s.orders ??= [];
  s.stats ??= { harvested: 0, collected: 0, caught: 0, born: 0, orders: 0, crafted: 0 };
  s.achievements ??= [];
  s.claimed ??= [];
  s.workshops ??= {};
  s.happening ??= null;
  s.dog ??= false;
  s.version = 10;
  return s;
}

/** Fed above this, and with water cleaner than SPAWN_QUALITY, grown fish can spawn. */
export const SPAWN_FULLNESS = 50;
export const SPAWN_QUALITY = 60;

/** Whether a batch is in a state to spawn this hour: grown, at least a pair, fed, clean water, room. */
export function canSpawn(b: FishBatch, pond: GameState['pond'], room: number): boolean {
  return b.growth >= 1 && b.count >= 2 && pond.fullness > SPAWN_FULLNESS && pond.quality > SPAWN_QUALITY && room > 0;
}
