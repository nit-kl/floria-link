import { GOALS, STAT_KEYS } from "./constants.js";

export function emptyGrowth() {
  return { speed: 50, stamina: 50, power: 50, harmony: 50, wit: 50 };
}

export function rankFromStats(stats) {
  const total = STAT_KEYS.reduce((s, k) => s + (stats[k] || 0), 0);
  if (total >= 4200) return "SS";
  if (total >= 3600) return "S";
  if (total >= 3000) return "A";
  if (total >= 2400) return "B";
  if (total >= 1800) return "C";
  if (total >= 1200) return "D";
  return "G";
}

export function nextGoal(turn) {
  return GOALS.find((g) => g.turn >= turn) || GOALS[GOALS.length - 1];
}

export function failChance(energy, cost) {
  if (energy < cost) return 1;
  const after = energy - cost;
  if (after >= 50) return 0;
  if (after >= 30) return 0.08;
  if (after >= 15) return 0.22;
  return 0.4;
}

/** Map training stats to battle multipliers. Pure — safe to unit-test. */
export function growthToBattleMods(growth) {
  if (!growth) {
    return { hp: 1, atk: 1, speed: 1, range: 1, recharge: 1, cost: 1, linkBonus: 0 };
  }
  const s = (k) => growth[k] || 50;
  return {
    hp: 1 + (s("stamina") - 50) / 800,
    atk: 1 + (s("power") - 50) / 750,
    speed: 1 + (s("speed") - 50) / 900,
    range: 1 + (s("harmony") - 50) / 1000,
    recharge: Math.max(0.55, 1 - (s("wit") - 50) / 1100),
    cost: Math.max(0.75, 1 - (s("wit") - 50) / 2000),
    linkBonus: Math.floor((s("harmony") - 50) / 80),
  };
}
