import type { Href } from 'expo-router';

import { dayOf, hourOf } from './clock';
import { FIELDS, ITEMS, SPECIES, type FieldId, type ItemId, type SpeciesId } from './data';
import { currentMeal, sellPrice, type GameState, type Plot } from './store';

export type Stage = 0 | 1 | 2 | 3 | 4;

/** Which drawing a plot gets: bare soil, sprout, young, grown, ripe. */
export function plotStage(p: Plot): Stage {
  if (!p.crop) return 0;
  if (p.growth >= 1) return 4;
  if (p.growth >= 0.55) return 3;
  if (p.growth >= 0.2) return 2;
  return 1;
}

export type FieldSummary = {
  planted: number;
  empty: number;
  ripe: number;
  thirsty: number;
  weeds: number;
  dead: number;
  moisture: number;
};

export function summarizeField(plots: Plot[]): FieldSummary {
  const live = plots.filter((p) => p.crop && !p.dead);
  return {
    planted: live.length,
    empty: plots.filter((p) => !p.crop).length,
    ripe: live.filter((p) => p.growth >= 1).length,
    thirsty: live.filter((p) => p.growth < 1 && p.moisture < 30).length,
    weeds: live.filter((p) => p.weeds).length,
    dead: plots.filter((p) => p.dead).length,
    moisture: live.length ? Math.round(live.reduce((n, p) => n + p.moisture, 0) / live.length) : 0,
  };
}

export function herdOf(state: GameState, species: SpeciesId) {
  return state.animals.filter((a) => a.species === species);
}

export function fishCount(state: GameState): number {
  return state.pond.batches.reduce((n, b) => n + b.count, 0);
}

export function plantedCount(state: GameState): number {
  return FIELDS.reduce((n, f) => n + state.fields[f.id].filter((p) => p.crop && !p.dead).length, 0);
}

export function averageMoisture(state: GameState): number {
  const live = FIELDS.flatMap((f) => state.fields[f.id].filter((p) => p.crop && !p.dead));
  if (!live.length) return 0;
  return Math.round(live.reduce((n, p) => n + p.moisture, 0) / live.length);
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 100);

/**
 * One number for "how is the farm doing": soil, herd, barn and pond, weighted
 * toward the living things.
 */
export function farmHealth(state: GameState): number {
  const soil = Math.min(100, averageMoisture(state) * 1.4);
  const herd = avg(state.animals.map((a) => (a.health * 2 + a.fullness) / 3));
  const pond = state.pond.batches.length ? state.pond.quality : 100;
  return Math.round(soil * 0.25 + herd * 0.4 + state.barnClean * 0.15 + pond * 0.2);
}

export function healthLabel(score: number): { label: string; note: string } {
  if (score >= 85) return { label: 'Çok iyi', note: 'Her şey yolunda' };
  if (score >= 65) return { label: 'İyi', note: 'Birkaç işe göz at' };
  if (score >= 45) return { label: 'Dikkat', note: 'İlgi bekleyen işler var' };
  return { label: 'Kötü', note: 'Çiftlik yardım istiyor' };
}

export function inventoryValue(state: GameState): number {
  const day = dayOf(state.minutes);
  return (Object.keys(state.inventory) as ItemId[]).reduce((n, id) => {
    const kind = ITEMS[id].kind;
    if (kind === 'seed' || kind === 'supply') return n;
    return n + sellPrice(day, id) * (state.inventory[id] ?? 0);
  }, 0);
}

export function productReady(state: GameState, species: SpeciesId): number {
  return state.animals.filter((a) => a.species === species && a.product >= 1).length;
}

export type Task = { id: string; text: string; tone: 'urgent' | 'ready' | 'info'; href: Href };

/** What needs doing, most pressing first. Drives the home screen's list. */
export function tasks(state: GameState): Task[] {
  const out: Task[] = [];
  const hour = hourOf(state.minutes);
  const slot = currentMeal(hour);
  const today = dayOf(state.minutes);
  const hungry = state.animals.filter((a) => a.fullness < 35).length;

  const sick = state.animals.filter((a) => a.health < 15);
  if (sick.length) {
    out.push({ id: 'sick', text: sick.length === 1 ? `${sick[0].name} çok hasta, ilaç ver` : `${sick.length} hayvan çok hasta`, tone: 'urgent', href: sick.length === 1 ? `/animal/${sick[0].id}` : '/livestock' });
  }

  if (slot >= 0 && state.meals.day === today && !state.meals.done[slot] && state.animals.some((a) => a.fullness < 95)) {
    out.push({ id: 'meal', text: 'Öğün zamanı: hayvanları besle', tone: 'urgent', href: '/livestock' });
  } else if (hungry) {
    out.push({ id: 'hungry', text: `${hungry} hayvan aç`, tone: 'urgent', href: '/livestock' });
  }

  for (const f of FIELDS) {
    const s = summarizeField(state.fields[f.id]);
    if (s.thirsty) out.push({ id: `dry-${f.id}`, text: `${f.name}: ${s.thirsty} parsel susuz`, tone: 'urgent', href: `/field/${f.id}` });
    if (s.ripe) out.push({ id: `ripe-${f.id}`, text: `${f.name}: ${s.ripe} parsel hasada hazır`, tone: 'ready', href: `/field/${f.id}` });
    if (s.weeds) out.push({ id: `weed-${f.id}`, text: `${f.name}: yabani ot temizle`, tone: 'info', href: `/field/${f.id}` });
    if (s.dead) out.push({ id: `dead-${f.id}`, text: `${f.name}: ${s.dead} ölü bitkiyi temizle`, tone: 'info', href: `/field/${f.id}` });
  }

  (Object.keys(SPECIES) as SpeciesId[]).forEach((sp) => {
    const n = productReady(state, sp);
    if (n) {
      const product = ITEMS[SPECIES[sp].product].name.toLowerCase();
      out.push({ id: `prod-${sp}`, text: `${n} ${SPECIES[sp].name.toLowerCase()} ${product} vermeye hazır`, tone: 'ready', href: '/livestock' });
    }
  });

  if (state.pond.fullness < 30 && state.pond.batches.length) out.push({ id: 'fish-hungry', text: 'Balıklar aç', tone: 'urgent', href: '/pond' });
  if (state.pond.quality < 40) out.push({ id: 'pond-dirty', text: 'Havuzun suyu bulanık', tone: 'urgent', href: '/pond' });
  const adults = state.pond.batches.filter((b) => b.growth >= 1).reduce((n, b) => n + b.count, 0);
  if (adults) out.push({ id: 'fish-ready', text: `${adults} balık tutulmaya hazır`, tone: 'ready', href: '/pond' });
  if (state.barnClean < 40) out.push({ id: 'barn', text: 'Ahır temizlik bekliyor', tone: 'info', href: '/livestock' });
  if (state.tank < 200) out.push({ id: 'tank', text: 'Su deposu azaldı', tone: 'info', href: '/water' });

  const order = { urgent: 0, ready: 1, info: 2 } as const;
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}

export function fieldName(id: FieldId): string {
  return FIELDS.find((f) => f.id === id)?.name ?? id;
}
