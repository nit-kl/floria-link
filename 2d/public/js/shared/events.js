/** Thin wrappers around window CustomEvents used by battle ↔ UI. */
export function emitGameHud(detail) {
  window.dispatchEvent(new CustomEvent("game:hud", { detail }));
}

export function emitGameResult(detail) {
  window.dispatchEvent(new CustomEvent("game:result", { detail }));
}

export function emitSeasonBanner(detail) {
  window.dispatchEvent(new CustomEvent("game:season", { detail }));
}

export function onGameHud(handler) {
  window.addEventListener("game:hud", handler);
}

export function onGameResult(handler) {
  window.addEventListener("game:result", handler);
}

export function onSeasonBanner(handler) {
  window.addEventListener("game:season", handler);
}
