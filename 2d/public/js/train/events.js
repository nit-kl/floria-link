/** Mid-career branch events for campaign drama */

export const BRANCH_EVENTS = [
  {
    id: "dew-choice",
    turn: 2,
    prompt: "朝露が残っている。どうする？",
    options: [
      {
        id: "drink",
        label: "露を飲む（活力と根気）",
        apply: (career) => {
          career.energy = Math.min(100, career.energy + 20);
          career.gainStat("stamina", 12);
          return "甘い露が体を潤した。";
        },
      },
      {
        id: "share",
        label: "仲間に分ける（調和と絆）",
        apply: (career) => {
          career.gainStat("harmony", 14);
          for (const s of career.supports) s.bond = Math.min(100, s.bond + 10);
          career.shiftMood(1);
          return "分け合った露が、心を近づけた。";
        },
      },
    ],
  },
  {
    id: "blight-scent",
    turn: 3,
    prompt: "腐海の匂いが近い。備えは？",
    options: [
      {
        id: "train-hard",
        label: "剛力を練る",
        apply: (career) => {
          career.gainStat("power", 16);
          career.energy = Math.max(0, career.energy - 8);
          return "拳に花鋼の感触が残る。";
        },
      },
      {
        id: "study",
        label: "叡智で对策を練る",
        apply: (career) => {
          career.gainStat("wit", 16);
          career.gainStat("harmony", 6);
          return "弱点の糸口が見えた気がする。";
        },
      },
    ],
  },
  {
    id: "link-dream",
    turn: 5,
    prompt: "夢で光の線が見えた。何を信じる？",
    options: [
      {
        id: "bond",
        label: "調和——つながる力",
        apply: (career) => {
          career.gainStat("harmony", 18);
          career.shiftMood(1);
          return "響きが胸に残った。";
        },
      },
      {
        id: "speed",
        label: "疾走——先に立つ",
        apply: (career) => {
          career.gainStat("speed", 18);
          return "足先が軽い。戦場で先に並べそうだ。";
        },
      },
    ],
  },
];

export function pickBranchEvent(career) {
  const fired = career.firedBranches || new Set();
  if (career.skipGoals && career.maxTurns <= 4) {
    // prologue: only the dew choice
    const ev = BRANCH_EVENTS.find((e) => e.id === "dew-choice" && e.turn === career.turn);
    return ev && !fired.has(ev.id) ? ev : null;
  }
  const ev = BRANCH_EVENTS.find((e) => e.turn === career.turn);
  return ev && !fired.has(ev.id) ? ev : null;
}
