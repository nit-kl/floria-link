/**
 * 花園奪還キャンペーン定義。
 * E1 では prologue を本線実装。以降の章はハブに見せてロック。
 */
export const CAMPAIGN_CHAPTERS = [
  {
    id: "prologue",
    order: 0,
    title: "プロローグ・芽吹き",
    subtitle: "最初の共振",
    blurb: "腐海に侵された庭で、花精を少し育て、リンクの光を知る。",
    plotId: "plot-0",
    traineeId: 0,
    trainTurns: 3,
    supportDeck: ["koharu"],
    skipSupportDeck: true,
    battle: {
      mode: "tutorial",
      allyHp: 1100,
      enemyHp: 520,
      money: 280,
      nectar: 20,
      spawnMul: 0.45,
      courierMul: 1.4,
      tip: "違う花精を近くに出すと、共振リンクが敵を削る",
    },
    intro: [
      "腐海が広がった。花園の色が、ひとつずつ消えていく。",
      "それでも種は残っている。ヴィオラよ——小さくても、咲こう。",
    ],
    trainLead: "三日だけ、芽を伸ばそう。その力が戦場で光になる。",
    battleLead: "出撃だ。別の花精を近づけ、光の線——共振リンクを繋げ。",
    scenarioGoal: { text: "芽を伸ばせ（どの特訓でも可）", preferStat: null },
    outro: [
      "最初の区画に、色が戻った。",
      "これが奪還の始まりだ。園の見取り図が開く。",
    ],
  },
  {
    id: "chapter-1",
    order: 1,
    title: "第一章・潮騒",
    subtitle: "水辺のリンク",
    blurb: "雨の季節。遠距離とリンクで水路を押し返す。",
    plotId: "plot-1",
    traineeId: 1,
    trainTurns: 8,
    supportDeck: ["anemo", "tsuyuhime"],
    skipSupportDeck: true,
    battle: {
      mode: "standard",
      allyHp: 1300,
      enemyHp: 1400,
      money: 220,
      tip: "アクアを活かしつつ、別属性とリンクを繋ごう",
    },
    lockedHint: "プロローグをクリアで解放",
    scenarioGoal: { text: "疾走か叡智を伸ばし、水辺を駆けよ", preferStat: "speed" },
    intro: ["潮の音が近い。アクアの力が欲しい。"],
    trainLead: "雨の章。足取りと知恵が、水路の鍵になる。",
    battleLead: "汀を取り戻せ。リンクの線を水のように渡して。",
    outro: ["水路に花が戻った。次は陽だまりだ。"],
  },
  {
    id: "chapter-2",
    order: 2,
    title: "第二章・向日葵",
    subtitle: "温室と盾",
    blurb: "陽の下で拠点を守り、経済と重装で押し切る。",
    plotId: "plot-2",
    traineeId: 4,
    trainTurns: 8,
    supportDeck: ["hiyori", "kagerou"],
    skipSupportDeck: true,
    battle: {
      mode: "standard",
      allyHp: 1500,
      enemyHp: 1700,
      money: 200,
      tip: "温室を上げつつ、サンフラで前線を支えよ",
    },
    lockedHint: "第一章クリアで解放",
    scenarioGoal: { text: "根気を鍛え、盾となれる体へ", preferStat: "stamina" },
    intro: ["陽が強い。サンフラの根を張ろう。"],
    trainLead: "日照りの章。倒れない花が、園を守る。",
    battleLead: "温室を育て、重装で道を開け。",
    outro: ["温室が息を吹き返した。紫の霧が近い。"],
  },
  {
    id: "chapter-3",
    order: 3,
    title: "第三章・紫苑",
    subtitle: "高密度の響き",
    blurb: "狭い戦場でリンクをつなぎ続けるパズル戦。",
    plotId: "plot-3",
    traineeId: 0,
    trainTurns: 10,
    supportDeck: ["lunaria", "shion"],
    skipSupportDeck: true,
    battle: {
      mode: "standard",
      allyHp: 1300,
      enemyHp: 1900,
      money: 240,
      tip: "リンクを切らさない配置を意識しよう",
    },
    lockedHint: "第二章クリアで解放",
    scenarioGoal: { text: "調和を高め、共振の核となれ", preferStat: "harmony" },
    intro: ["紫の霧。リンクだけが道標になる。"],
    trainLead: "響きの章。一人では届かない光を、つなぐ。",
    battleLead: "線を保て。霧の向こうに巣がある。",
    outro: ["霧の向こうに巣が見えた。終章へ。"],
  },
  {
    id: "finale",
    order: 4,
    title: "終章・腐海の巣",
    subtitle: "奪還の終わりに",
    blurb: "巣を落とすか、全区画を咲かせるか——選ぶ勝利。",
    plotId: "plot-boss",
    traineeId: 5,
    trainTurns: 10,
    supportDeck: ["hanagane", "ibara", "mitsuba"],
    skipSupportDeck: true,
    battle: {
      mode: "boss",
      allyHp: 1400,
      enemyHp: 2200,
      money: 260,
      tip: "巣を壊すか、花畑をすべて咲かせるか——両道あり",
    },
    lockedHint: "第三章クリアで解放",
    scenarioGoal: { text: "剛力と調和、両方を戦場へ", preferStat: "power" },
    intro: ["ここが最後だ。育てた花精たちよ、響け。"],
    trainLead: "終章の前に、炎の花精を鍛えよう。",
    battleLead: "腐海の巣へ。育てたすべてをぶつけろ。",
    outro: ["花園は、また季節を迎えられる。ありがとう。"],
  },
];

/** Positions tuned to garden_hub.png glowing clearings */
export const GARDEN_PLOTS = [
  { id: "plot-0", chapterId: "prologue", name: "芽吹きの畦", x: 24, y: 30 },
  { id: "plot-1", chapterId: "chapter-1", name: "潮騒の汀", x: 38, y: 48 },
  { id: "plot-2", chapterId: "chapter-2", name: "陽だまり畑", x: 50, y: 58 },
  { id: "plot-3", chapterId: "chapter-3", name: "紫苑の小径", x: 58, y: 46 },
  { id: "plot-boss", chapterId: "finale", name: "巣への道", x: 76, y: 56 },
];

export function getChapter(id) {
  return CAMPAIGN_CHAPTERS.find((c) => c.id === id) || null;
}

export function getNextChapter(progress) {
  const done = new Set(progress.completedChapters || []);
  return CAMPAIGN_CHAPTERS.find((c) => !done.has(c.id)) || null;
}

export function isChapterUnlocked(chapter, progress) {
  if (chapter.id === "prologue") return true;
  const idx = CAMPAIGN_CHAPTERS.findIndex((c) => c.id === chapter.id);
  if (idx <= 0) return true;
  const prev = CAMPAIGN_CHAPTERS[idx - 1];
  return (progress.completedChapters || []).includes(prev.id);
}
