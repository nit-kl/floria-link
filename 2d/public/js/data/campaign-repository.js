import { getNextChapter } from "./campaign/chapters.js";

export const CAMPAIGN_STORAGE_KEY = "floria-campaign-v1";

const DEFAULT_PROGRESS = {
  version: 1,
  completedChapters: [],
  unlockedPlots: [],
  currentChapterId: "prologue",
  seenIntro: false,
  freeMode: false,
  updatedAt: 0,
};

export function loadCampaign() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object") {
      return { ...DEFAULT_PROGRESS, completedChapters: [], unlockedPlots: [] };
    }
    return {
      ...DEFAULT_PROGRESS,
      ...raw,
      completedChapters: Array.isArray(raw.completedChapters) ? raw.completedChapters : [],
      unlockedPlots: Array.isArray(raw.unlockedPlots) ? raw.unlockedPlots : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS, completedChapters: [], unlockedPlots: [] };
  }
}

export function saveCampaign(progress) {
  const next = { ...progress, updatedAt: Date.now() };
  localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function completeChapter(chapterId, plotId) {
  const progress = loadCampaign();
  if (!progress.completedChapters.includes(chapterId)) {
    progress.completedChapters.push(chapterId);
  }
  if (plotId && !progress.unlockedPlots.includes(plotId)) {
    progress.unlockedPlots.push(plotId);
  }
  const next = getNextChapter(progress);
  progress.currentChapterId = next?.id || chapterId;
  if (!next) progress.freeMode = true;
  return saveCampaign(progress);
}

export function resetCampaign() {
  localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
  return loadCampaign();
}

export function markIntroSeen() {
  const progress = loadCampaign();
  progress.seenIntro = true;
  return saveCampaign(progress);
}
