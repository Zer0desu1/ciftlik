import { afterEach, describe, expect, it, vi } from 'vitest';

import { seeded } from '../clock';
import { ACHIEVEMENTS, CROPS, FIELDS, FISH, ITEMS, LAND_USES, MACHINES, MAX_ORDERS, SPECIES, WORKSHOP_SLOTS, WORKSHOPS, type WorkshopId, type CropId, type FieldId, type ItemId, type LandUse, type MachineId, type SpeciesId } from '../data';
import {
  barnCapacity,
  coopCapacity,
  inBarn,
  inCoop,
  initialState,
  pondCapacity,
  tankCapacity,
  useGame,
  type GameState,
} from '../store';

/**
 * A long, random playthrough: a player doing anything at all, in any order,
 * for weeks of game time. After every move the farm must still make sense.
 */

const S = () => useGame.getState();
let now = 1_000_000_000_000;

function problems(s: GameState): string[] {
  const out: string[] = [];
  const num = (label: string, v: unknown) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) out.push(`${label} sayı değil: ${String(v)}`);
  };
  num('coins', s.coins);
  num('xp', s.xp);
  num('tank', s.tank);
  num('minutes', s.minutes);
  if (s.coins < 0) out.push(`coins eksi: ${s.coins}`);
  if (s.tank < -0.001 || s.tank > tankCapacity(s) + 0.001) out.push(`tank sınır dışı: ${s.tank} / ${tankCapacity(s)}`);
  for (const [item, n] of Object.entries(s.inventory)) {
    num(`envanter ${item}`, n);
    if ((n ?? 0) < 0) out.push(`envanter eksi: ${item} ${n}`);
    if (!(item in ITEMS)) out.push(`bilinmeyen eşya: ${item}`);
  }
  for (const f of FIELDS) {
    const use = s.land[f.id];
    const plots = s.fields[f.id];
    if (!Array.isArray(plots)) out.push(`${f.id} parsel dizisi yok`);
    else if (use === 'field' && plots.length === 0) out.push(`${f.id} tarla ama parsel yok`);
    else if (use !== 'field' && plots.length > 0) out.push(`${f.id} tarla değil (${use}) ama ${plots.length} parsel var`);
    plots?.forEach((p, i) => {
      num(`${f.id}[${i}].moisture`, p.moisture);
      num(`${f.id}[${i}].growth`, p.growth);
      if (p.growth < 0 || p.growth > 1) out.push(`${f.id}[${i}] growth ${p.growth}`);
      if (p.moisture < 0 || p.moisture > 100) out.push(`${f.id}[${i}] moisture ${p.moisture}`);
      if (p.crop && !(p.crop in CROPS)) out.push(`${f.id}[${i}] bilinmeyen ürün ${p.crop}`);
    });
    if (f.land === undefined && !use) out.push(`${f.id} ilk tarla sahipsiz kaldı`);
  }
  const ids = new Set<string>();
  for (const a of s.animals) {
    if (ids.has(a.id)) out.push(`aynı id iki hayvanda: ${a.id}`);
    ids.add(a.id);
    for (const k of ['fullness', 'health', 'happiness'] as const) {
      num(`${a.id}.${k}`, a[k]);
      if (a[k] < 0 || a[k] > 100) out.push(`${a.id}.${k} = ${a[k]}`);
    }
    num(`${a.id}.product`, a.product);
    if (!(a.species in SPECIES)) out.push(`bilinmeyen tür ${a.species}`);
  }
  if (inBarn(s) > barnCapacity(s)) out.push(`ahır taştı: ${inBarn(s)} / ${barnCapacity(s)}`);
  if (inCoop(s) > coopCapacity(s)) out.push(`kümes taştı: ${inCoop(s)} / ${coopCapacity(s)}`);
  const fish = s.pond.batches.reduce((n, b) => n + b.count, 0);
  if (fish > pondCapacity(s)) out.push(`havuz taştı: ${fish} / ${pondCapacity(s)}`);
  for (const b of s.pond.batches) {
    if (b.count <= 0) out.push(`boş balık sürüsü kaldı: ${b.id}`);
    num(`balık ${b.id}.growth`, b.growth);
  }
  num('pond.quality', s.pond.quality);
  num('pond.fullness', s.pond.fullness);
  num('power.used', s.power.used);
  num('power.made', s.power.made);
  if (s.power.unpaid < 0) out.push(`fatura eksi: ${s.power.unpaid}`);
  if (s.orders.length > MAX_ORDERS) out.push(`çok sipariş: ${s.orders.length}`);
  for (const o of s.orders) if (!(o.qty > 0) || !(o.reward > 0) || !(o.item in ITEMS)) out.push(`bozuk sipariş ${o.id}`);
  for (const [id, w] of Object.entries(s.workshops)) if ((w?.jobs.length ?? 0) > WORKSHOP_SLOTS) out.push(`atölye taştı: ${id}`);
  for (const id of s.claimed) if (!s.achievements.includes(id)) out.push(`açılmamış ödül alındı: ${id}`);
  for (const l of s.log) {
    num(`log ${l.day} income`, l.income);
    num(`log ${l.day} expense`, l.expense);
  }
  return out;
}

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

function randomMove(r: () => number): string {
  const s = S();
  const a = S();
  const fieldIds = FIELDS.map((f) => f.id);
  const f: FieldId = pick(r, fieldIds);
  const crops = Object.keys(CROPS) as CropId[];
  const species = Object.keys(SPECIES) as SpeciesId[];
  const uses = Object.keys(LAND_USES) as LandUse[];
  const items = Object.keys(ITEMS) as ItemId[];
  const machines = Object.keys(MACHINES) as MachineId[];
  const i = Math.floor(r() * 16);
  const animal = s.animals.length ? pick(r, s.animals) : null;
  const moves: [string, () => void][] = [
    ['plant', () => a.plant(f, i, pick(r, crops))],
    ['water', () => a.water(f, i)],
    ['waterField', () => a.waterField(f)],
    ['fertilize', () => a.fertilize(f, i)],
    ['weed', () => a.weed(f, i)],
    ['harvest', () => a.harvest(f, i)],
    ['harvestField', () => a.harvestField(f)],
    ['clearPlot', () => a.clearPlot(f, i)],
    ['tidyField', () => a.tidyField(f)],
    ['expandField', () => a.expandField(f)],
    ['buyLand', () => a.buyLand(f, pick(r, uses))],
    ['convertLand', () => a.convertLand(f, pick(r, uses), r() < 0.5)],
    ['swapLand', () => a.swapLand(f, pick(r, fieldIds))],
    ['feedSpecies', () => a.feedSpecies(pick(r, species))],
    ['feedAll', () => a.feedAll()],
    ['collect', () => a.collect(pick(r, species))],
    ['collectAll', () => a.collectAll()],
    ['pet', () => animal && a.pet(animal.id)],
    ['heal', () => animal && a.heal(animal.id)],
    ['petMany', () => a.petMany(s.animals.filter(() => r() < 0.5).map((x) => x.id))],
    ['healMany', () => a.healMany(s.animals.filter(() => r() < 0.5).map((x) => x.id))],
    ['sellAnimals', () => a.sellAnimals(s.animals.filter(() => r() < 0.1).map((x) => x.id))],
    ['sellAnimal', () => animal && a.sellAnimal(animal.id)],
    ['cleanBarn', () => a.cleanBarn()],
    ['buyAnimal', () => a.buyAnimal(pick(r, species))],
    ['incubate', () => a.incubate(1 + Math.floor(r() * 6))],
    ['feedFish', () => a.feedFish()],
    ['cleanPond', () => a.cleanPond()],
    ['stockFish', () => a.stockFish(pick(r, Object.keys(FISH) as (keyof typeof FISH)[]), 1 + Math.floor(r() * 10))],
    ['catchFish', () => s.pond.batches.length && a.catchFish(pick(r, s.pond.batches).id, r() < 0.5 ? 1 + Math.floor(r() * 5) : undefined)],
    ['buy', () => a.buy(pick(r, items), 1 + Math.floor(r() * 10))],
    ['sell', () => a.sell(pick(r, items), 1 + Math.floor(r() * 10))],
    ['sellKind', () => a.sellKind(pick(r, ['crop', 'produce', 'fish'] as const))],
    ['pump', () => a.pump()],
    ['upgrade', () => a.upgrade(pick(r, ['barn', 'coop', 'pond', 'tank'] as const))],
    ['buyMachine', () => a.buyMachine(pick(r, machines))],
    ['toggleMachine', () => a.toggleMachine(pick(r, machines))],
    ['buyPower', () => a.buyPower(r() < 0.5 ? 'panel' : 'turbine')],
    ['payBill', () => a.payBill()],
    ['sleep', () => a.sleep()],
    ['deliver', () => s.orders.length && a.deliver(pick(r, s.orders).id)],
    ['buyWorkshop', () => a.buyWorkshop(pick(r, Object.keys(WORKSHOPS) as WorkshopId[]))],
    ['craft', () => a.craft(pick(r, Object.keys(WORKSHOPS) as WorkshopId[]))],
    ['buyDog', () => a.buyDog()],
    ['claim', () => a.claim(pick(r, ACHIEVEMENTS).id)],
  ];
  const [name, run] = pick(r, moves);
  run();
  return name;
}

afterEach(() => vi.restoreAllMocks());

describe('a long random playthrough', () => {
  for (const seed of Array.from({ length: Number(process.env.SOAK_SEEDS ?? 6) }, (_, i) => i + 1)) {
    it(`keeps the farm sound (seed ${seed})`, () => {
      const r = seeded(seed * 7919);
      vi.spyOn(Math, 'random').mockImplementation(seeded(seed * 104729));
      now = 1_000_000_000_000;
      useGame.setState({ ...initialState(now), coins: seed % 2 ? 3000 : 200, xp: seed % 3 ? 2100 : 0 });
      const history: string[] = [];
      for (let step = 0; step < Number(process.env.SOAK_STEPS ?? 3000); step++) {
        const move = randomMove(r);
        history.push(move);
        // Time passes between moves: mostly minutes, now and then most of a day.
        now += (r() < 0.05 ? 6 + r() * 30 : r() * 2) * 60 * 60 * 1000 / 60;
        S().tick(now);
        const bad = problems(S());
        if (bad.length) {
          throw new Error(`adım ${step} (${history.slice(-6).join(' → ')}): ${bad.slice(0, 5).join('; ')}`);
        }
      }
      expect(S().minutes).toBeGreaterThan(24 * 60 * 5);
    });
  }
});
