/** localStorage-backed careers; swap later for a remote API. */
export const STORAGE_KEY = "floria-bloom-careers-v1";

export function loadCareers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveCareers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCareer(charId) {
  const all = loadCareers();
  return all[String(charId)] || null;
}
