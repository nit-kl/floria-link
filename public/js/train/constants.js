export const MAX_TURNS = 12;
export const STAT_MAX = 1200;
export const ENERGY_MAX = 100;
export const MAX_SUPPORTS = 3;
export const BOND_MAX = 100;

export const STAT_KEYS = ["speed", "stamina", "power", "harmony", "wit"];
export const STAT_LABELS = {
  speed: "疾走",
  stamina: "根気",
  power: "剛力",
  harmony: "調和",
  wit: "叡智",
};
export const STAT_COLORS = {
  speed: "#5eb8ff",
  stamina: "#5ed67a",
  power: "#ff7e6a",
  harmony: "#ff9ad4",
  wit: "#c9a0ff",
};

export const MOODS = [
  { id: "awful", label: "不調", mul: 0.8, color: "#7a9bb8", face: "😣" },
  { id: "bad", label: "低調", mul: 0.9, color: "#8ec5ff", face: "😕" },
  { id: "normal", label: "普通", mul: 1.0, color: "#ffffff", face: "😐" },
  { id: "good", label: "好調", mul: 1.1, color: "#ffe08a", face: "😊" },
  { id: "great", label: "絶好調", mul: 1.2, color: "#ff9ad4", face: "😄" },
];

export const TRAIN_OPTS = [
  { id: "speed", stat: "speed", energy: 18, base: 14, label: "疾走", facility: "疾走練習", hint: "移動速度↑", color: "#5eb8ff", pose: "run" },
  { id: "stamina", stat: "stamina", energy: 16, base: 15, label: "根気", facility: "根気練習", hint: "耐久↑", color: "#5ed67a", pose: "carry" },
  { id: "power", stat: "power", energy: 18, base: 14, label: "剛力", facility: "剛力練習", hint: "攻撃↑", color: "#ff7e6a", pose: "attack" },
  { id: "harmony", stat: "harmony", energy: 15, base: 13, label: "調和", facility: "調和練習", hint: "リンク・射程↑", color: "#ff9ad4", pose: "idle" },
  { id: "wit", stat: "wit", energy: 14, base: 13, label: "叡智", facility: "叡智練習", hint: "再出撃短縮", color: "#c9a0ff", pose: "idle" },
];

export const GOALS = [
  { turn: 4, name: "芽吹き試験", require: { total: 280 }, passBonus: { mood: 1, energy: 10 }, failMood: -1 },
  { turn: 8, name: "蕾の競演", require: { total: 520 }, passBonus: { mood: 1, energy: 12, all: 6 }, failMood: -1 },
  { turn: 12, name: "満開審査", require: { total: 780 }, passBonus: { mood: 1, all: 10 }, failMood: -1 },
];

export const EVENTS = [
  { text: "庭で蝶と遊んだ。調子が上がった！", mood: 1, energy: 5, kind: "good" },
  { text: "突然の雨でびしょ濡れ…活力ダウン", mood: -1, energy: -12, kind: "bad" },
  { text: "仲間の花精と語り合った。調和のヒントを得た", bonus: { harmony: 8 }, mood: 1, kind: "good" },
  { text: "温室の実験が成功！叡智が芽吹く", bonus: { wit: 10 }, kind: "good" },
  { text: "食いすぎて眠い…", mood: -1, energy: 8, kind: "bad" },
  { text: "星空を見て決意を新たにした", mood: 1, bonus: { power: 5, speed: 5 }, kind: "good" },
  { text: "腐海の匂いが近い…気が引き締まる", bonus: { stamina: 8 }, mood: 0, kind: "good" },
  { text: "甘い蜜を分けてもらった", energy: 15, mood: 1, kind: "good" },
];
