/** Story / tip overlay — click or Enter to advance */
export function createStoryUi() {
  const overlay = document.getElementById("story-screen");
  const body = document.getElementById("story-body");
  const titleEl = document.getElementById("story-title");
  const btn = document.getElementById("btn-story-next");
  const progressEl = document.getElementById("story-progress");

  let lines = [];
  let index = 0;
  let resolveFn = null;

  function showLines(title, textLines) {
    return new Promise((resolve) => {
      resolveFn = resolve;
      lines = textLines.filter(Boolean);
      index = 0;
      titleEl.textContent = title || "";
      overlay.classList.remove("hidden");
      paint();
      overlay.focus?.();
    });
  }

  function paint() {
    // restart fade
    body.style.animation = "none";
    void body.offsetWidth;
    body.style.animation = "";
    body.textContent = lines[index] || "";
    btn.textContent = index >= lines.length - 1 ? "進む" : "次へ";
    if (progressEl) {
      progressEl.innerHTML = lines
        .map((_, i) => `<span class="story-dot ${i === index ? "on" : ""}"></span>`)
        .join("");
    }
  }

  function advance() {
    if (!resolveFn) return;
    if (index < lines.length - 1) {
      index += 1;
      paint();
      return;
    }
    overlay.classList.add("hidden");
    const done = resolveFn;
    resolveFn = null;
    done?.();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    advance();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === btn) return;
    advance();
  });

  window.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      advance();
    }
  });

  function showTip(text, ms = 3200) {
    const tip = document.getElementById("battle-tip");
    if (!tip) return;
    tip.textContent = text;
    tip.classList.remove("show");
    void tip.offsetWidth;
    tip.classList.add("show");
    clearTimeout(tip._timer);
    tip._timer = setTimeout(() => tip.classList.remove("show"), ms);
  }

  return { showLines, showTip, overlay };
}
