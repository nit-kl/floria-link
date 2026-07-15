import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  failChance,
  growthToBattleMods,
  rankFromStats,
} from "../public/js/train/formulas.js";

describe("rankFromStats", () => {
  it("returns G for baseline totals", () => {
    assert.equal(
      rankFromStats({ speed: 50, stamina: 50, power: 50, harmony: 50, wit: 50 }),
      "G"
    );
  });

  it("returns A around 3000 total", () => {
    assert.equal(
      rankFromStats({ speed: 600, stamina: 600, power: 600, harmony: 600, wit: 600 }),
      "A"
    );
  });
});

describe("failChance", () => {
  it("is 1 when energy is below cost", () => {
    assert.equal(failChance(10, 18), 1);
  });

  it("is 0 when remaining energy stays high", () => {
    assert.equal(failChance(100, 18), 0);
  });
});

describe("growthToBattleMods", () => {
  it("returns identity mods when growth is missing", () => {
    assert.deepEqual(growthToBattleMods(null), {
      hp: 1,
      atk: 1,
      speed: 1,
      range: 1,
      recharge: 1,
      cost: 1,
      linkBonus: 0,
    });
  });

  it("increases atk when power is trained", () => {
    const mods = growthToBattleMods({
      speed: 50,
      stamina: 50,
      power: 200,
      harmony: 50,
      wit: 50,
    });
    assert.ok(mods.atk > 1);
    assert.equal(mods.hp, 1);
  });

  it("shortens recharge when wit is high", () => {
    const mods = growthToBattleMods({
      speed: 50,
      stamina: 50,
      power: 50,
      harmony: 50,
      wit: 500,
    });
    assert.ok(mods.recharge < 1);
  });
});
