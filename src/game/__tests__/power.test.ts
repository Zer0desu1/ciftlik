import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { weatherFor } from '../clock';
import { LAND_USES, LEVELS, MACHINES, POWER } from '../data';
import { initialState, migrate, powerBalance, powerMade, powerUsed, useGame, type GameState } from '../store';

/** Electricity: the meter, the bill at midnight, panels, turbines and selling the surplus. */

const T0 = 1_000_000_000_000;
let now = T0;
const S = () => useGame.getState();
const MAX_XP = LEVELS[LEVELS.length - 1];
const DAY = 24;

function start(patch: Partial<GameState> = {}) {
  now = T0;
  // 00:00 of day 1, which is always sunny.
  useGame.setState({ ...initialState(T0), minutes: 0, events: [], coins: 10_000, xp: MAX_XP, animals: [], ...patch });
}
function advance(hours: number) {
  now += hours * 60_000;
  S().tick(now);
}
const latest = () => S().power.history[0];

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  start();
});
afterEach(() => vi.restoreAllMocks());

describe('the meter', () => {
  it('the house alone draws power all day, and the bill is paid at midnight', () => {
    expect(powerUsed(S())).toBe(POWER.house);
    expect(powerMade(S())).toBe(0);
    advance(DAY);
    const bill = Math.round(POWER.house * DAY * POWER.buy);
    expect(latest()).toMatchObject({ day: 1, used: POWER.house * DAY, made: 0, net: bill });
    expect(S().coins).toBe(10_000 - bill);
    expect(S().power.used).toBeLessThan(0.01);
    expect(S().events.some((e) => e.text === `Elektrik faturası ödendi: ${bill} altın.`)).toBe(true);
  });

  it('each machine that is on adds its draw', () => {
    useGame.setState({ machines: { harvester: { on: true }, weeder: { on: false } } });
    expect(powerUsed(S())).toBeCloseTo(POWER.house + MACHINES.harvester.power);
  });
});

describe('making power', () => {
  it('panels make nothing at night and most at noon, in full sun', () => {
    useGame.setState({ power: { ...S().power, panels: 2 } });
    expect(weatherFor(1).kind).toBe('sunny');
    expect(powerMade(S(), 2 * 60)).toBe(0);
    expect(powerMade(S(), 13 * 60)).toBeCloseTo(2 * POWER.panel.kwh);
  });

  it('turbines turn day and night', () => {
    useGame.setState({ power: { ...S().power, turbines: 1 } });
    expect(powerMade(S(), 2 * 60)).toBeGreaterThan(0);
  });

  it('a solar field makes as much as its blurb says', () => {
    useGame.setState({ land: { ...S().land, east: 'solar' } });
    expect(powerMade(S(), 13 * 60)).toBeCloseTo(LAND_USES.solar.adds);
  });

  it('a surplus is sold at midnight', () => {
    useGame.setState({ power: { ...S().power, panels: 6, turbines: 3 } });
    advance(DAY);
    expect(latest().net).toBeLessThan(0);
    expect(S().coins).toBe(10_000 - latest().net);
    expect(S().events.some((e) => /Fazla elektrik şebekeye satıldı/.test(e.text))).toBe(true);
    expect(S().log.find((l) => l.day === 1)!.income).toBe(-latest().net);
  });

  it('the running balance shows what midnight will bring', () => {
    useGame.setState({ power: { ...S().power, used: 10, made: 4 } });
    expect(powerBalance(S())).toBe(6 * POWER.buy);
    useGame.setState({ power: { ...S().power, used: 4, made: 10 } });
    expect(powerBalance(S())).toBe(-Math.round(6 * POWER.sell));
  });
});

describe('building', () => {
  it('panels and turbines cost their price, up to a limit', () => {
    S().buyPower('panel');
    expect(S().power.panels).toBe(1);
    expect(S().coins).toBe(10_000 - POWER.panel.price);
    for (let i = 0; i < 10; i++) S().buyPower('panel');
    expect(S().power.panels).toBe(POWER.panel.max);
  });

  it('turbines need their level', () => {
    start({ xp: 0 });
    S().buyPower('turbine');
    expect(S().power.turbines).toBe(0);
  });
});

describe('an unpaid bill', () => {
  it('stops the machines until it is paid', () => {
    start({ coins: 0, inventory: { hay: 50 }, machines: { cleaner: { on: true } } });
    advance(DAY);
    expect(S().power.unpaid).toBeGreaterThan(0);
    expect(powerUsed(S())).toBe(POWER.house);
    useGame.setState({ barnClean: 10 });
    advance(1);
    expect(S().barnClean).toBeLessThan(50);
    useGame.setState({ coins: 1000 });
    S().payBill();
    expect(S().power.unpaid).toBe(0);
    advance(1);
    expect(S().barnClean).toBe(100);
  });

  it('a bill not paid is added to the next one', () => {
    start({ coins: 0 });
    advance(DAY);
    const first = S().power.unpaid;
    useGame.setState({ coins: 5 });
    advance(DAY);
    expect(S().power.unpaid).toBe(first + Math.round(POWER.house * DAY * POWER.buy));
  });
});

describe('old saves', () => {
  it('a version-6 save gets electricity, nothing built', () => {
    const old = { ...initialState(T0), version: 6, power: undefined } as unknown as GameState;
    const s = migrate(old, 6);
    expect(s.version).toBe(9);
    expect(s.power).toEqual({ panels: 0, turbines: 0, used: 0, made: 0, unpaid: 0, history: [] });
  });
});
