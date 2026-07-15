/** Keyboard / touch input */
export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();

    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space"].includes(e.key) ||
          e.code.startsWith("Key")) {
        e.preventDefault();
      }
      const code = e.code === "Space" ? "Space" : e.code;
      if (!this.down.has(code)) this.pressed.add(code);
      this.down.add(code);
      // aliases
      if (e.key === "a" || e.key === "A") this._downAlias("ArrowLeft", true);
      if (e.key === "d" || e.key === "D") this._downAlias("ArrowRight", true);
      if (e.key === "w" || e.key === "W") this._downAlias("ArrowUp", true);
      if (e.key === "s" || e.key === "S") this._downAlias("ArrowDown", true);
      if (e.key === "z" || e.key === "Z") this._downAlias("KeyZ", true);
      if (e.key === "x" || e.key === "X") this._downAlias("KeyX", true);
      if (e.key === "c" || e.key === "C") this._downAlias("KeyC", true);
    });

    window.addEventListener("keyup", (e) => {
      const code = e.code === "Space" ? "Space" : e.code;
      this.down.delete(code);
      this.released.add(code);
      if (e.key === "a" || e.key === "A") this._downAlias("ArrowLeft", false);
      if (e.key === "d" || e.key === "D") this._downAlias("ArrowRight", false);
      if (e.key === "w" || e.key === "W") this._downAlias("ArrowUp", false);
      if (e.key === "s" || e.key === "S") this._downAlias("ArrowDown", false);
      if (e.key === "z" || e.key === "Z") this._downAlias("KeyZ", false);
      if (e.key === "x" || e.key === "X") this._downAlias("KeyX", false);
      if (e.key === "c" || e.key === "C") this._downAlias("KeyC", false);
    });

    this._bindTouch();
  }

  _downAlias(code, isDown) {
    if (isDown) {
      if (!this.down.has(code)) this.pressed.add(code);
      this.down.add(code);
    } else {
      this.down.delete(code);
      this.released.add(code);
    }
  }

  _bindTouch() {
    const root = document.getElementById("touch");
    if (!root) return;
    const bind = (btn) => {
      const code = btn.dataset.key;
      const on = (e) => {
        e.preventDefault();
        if (!this.down.has(code)) this.pressed.add(code);
        this.down.add(code);
      };
      const off = (e) => {
        e.preventDefault();
        this.down.delete(code);
        this.released.add(code);
      };
      btn.addEventListener("pointerdown", on);
      btn.addEventListener("pointerup", off);
      btn.addEventListener("pointerleave", off);
      btn.addEventListener("pointercancel", off);
    };
    root.querySelectorAll("button").forEach(bind);
  }

  held(code) { return this.down.has(code); }
  just(code) { return this.pressed.has(code); }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}
