from __future__ import annotations
import json
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "assets" / "supports"
ART.mkdir(parents=True, exist_ok=True)
SRC = ROOT / "public" / "assets" / "supports_src"

# List of generated support card source images
SOURCES = {
    k: str(SRC / f"{k}.png")
    for k in [
        "anemo", "kagerou", "hanagane", "lunaria", "mitsuba",
        "tsuyuhime", "hiyori", "ibara", "koharu", "shion"
    ]
}

def is_bg_rgb(r: int, g: int, b: int, thr: int = 245) -> bool:
    return r >= thr and g >= thr and b >= thr

def flood_background_mask(rgb: np.ndarray, thr: int = 245) -> np.ndarray:
    h, w, _ = rgb.shape
    bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or visited[y, x]:
            return
        r, g, b = rgb[y, x]
        if is_bg_rgb(int(r), int(g), int(b), thr):
            visited[y, x] = True
            bg[y, x] = True
            q.append((x, y))

    # seed from all border pixels
    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or visited[ny, nx]:
                continue
            visited[ny, nx] = True
            r, g, b = rgb[ny, nx]
            if is_bg_rgb(int(r), int(g), int(b), thr):
                bg[ny, nx] = True
                q.append((nx, ny))
    return bg

def process_image(src_path: str, out_path: str):
    print(f"Processing {src_path} -> {out_path}")
    img = Image.open(src_path).convert("RGB")
    arr = np.asarray(img).copy()
    
    bg = flood_background_mask(arr, thr=248)
    fg = ~bg
    
    # Crop tightly on foreground
    ys, xs = np.where(fg)
    if len(xs) == 0:
        print("  Empty image?")
        return
    
    x0, x1 = max(0, xs.min() - 5), min(img.width, xs.max() + 6)
    y0, y1 = max(0, ys.min() - 5), min(img.height, ys.max() + 6)
    
    cropped_rgb = arr[y0:y1, x0:x1]
    cropped_bg = flood_background_mask(cropped_rgb, thr=248)
    
    h, w, _ = cropped_rgb.shape
    alpha = np.full((h, w), 255, dtype=np.uint8)
    alpha[cropped_bg] = 0
    
    # Soft alpha fringe logic
    whiteness = np.min(cropped_rgb.astype(np.int16), axis=2)
    near = (whiteness >= 220) & ~cropped_bg
    if near.any():
        pad = np.pad(cropped_bg, 1, constant_values=False)
        neigh = (
            pad[0:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, 0:-2] | pad[1:-1, 2:]
            | pad[0:-2, 0:-2] | pad[0:-2, 2:] | pad[2:, 0:-2] | pad[2:, 2:]
        )
        fringe = near & neigh
        a = ((248 - whiteness[fringe]) / 28.0 * 255).clip(0, 255).astype(np.uint8)
        alpha[fringe] = a
        
    rgba = np.dstack([cropped_rgb, alpha])
    out_img = Image.fromarray(rgba, "RGBA")
    
    # Scale height to 256 for a nice compact card image
    target_h = 256
    target_w = int(w * (target_h / h))
    out_img = out_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    out_img.save(out_path, optimize=True)

def main():
    for name, path in SOURCES.items():
        out_path = ART / f"{name}.png"
        try:
            process_image(path, str(out_path))
        except Exception as e:
            print(f"Error processing {name}: {e}")

if __name__ == "__main__":
    main()
