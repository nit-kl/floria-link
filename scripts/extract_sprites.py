"""
Clean sprite extraction with edge flood-fill, defringe, facing & foot anchor.
"""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "assets" / "art"
OUT = ROOT / "public" / "assets" / "sprites"
POSES = ["idle", "run", "attack", "carry", "hurt"]

# Slightly overlapping cells so tall poses aren't clipped
DEFAULT_CELLS = [
    (4, 4, 385, 735),
    (365, 4, 760, 735),
    (735, 4, 1118, 735),
    (20, 690, 560, 1398),
    (530, 690, 1110, 1398),
]

PER_CHAR_CELLS = {
    1: [
        (25, 15, 440, 510),
        (630, 25, 1110, 510),
        (10, 455, 570, 980),
        (535, 455, 1100, 980),
        (290, 980, 860, 1395),
    ],
}

ROSTER = [
    {"id": 0, "name": "ヴィオラ", "title": "花鎚の魔女", "color": "#9b59d6", "accent": "#d4a5ff", "role": "melee", "desc": "巨大ハンマーで地面を砕く近接アタッカー"},
    {"id": 1, "name": "アクア", "title": "潮騒の詠唱者", "color": "#3aa0e8", "accent": "#9ad8ff", "role": "ranged", "desc": "水弾を連射する遠距離メイジ"},
    {"id": 2, "name": "リリア", "title": "白蓮の守護者", "color": "#6dbf6a", "accent": "#c8f0a8", "role": "support", "desc": "自然魔法で範囲を浄化するヒーラー寄り"},
    {"id": 3, "name": "スプラウト", "title": "新芽の風使い", "color": "#4caf50", "accent": "#a8e6a0", "role": "melee", "desc": "風を纏った杖で素早く斬りつける"},
    {"id": 4, "name": "サンフラ", "title": "陽炎の機械士", "color": "#e6b422", "accent": "#ffe08a", "role": "heavy", "desc": "電撃メイスで高火力を叩き込む"},
    {"id": 5, "name": "エンバー", "title": "紅葉の炎舞", "color": "#e85d3a", "accent": "#ffb08a", "role": "melee", "desc": "炎の杖で広範囲を焼き払う"},
]

ENEMY_ROSTER = [
    {"id": 100, "name": "ドクダケ", "title": "森の毒茸", "color": "#8b5eb8", "accent": "#d2a8ff", "role": "melee", "desc": "胞子を飛ばして攻撃する怪しいキノコ"},
    {"id": 101, "name": "クロメ", "title": "茨の新芽", "color": "#4a3c31", "accent": "#c09ad8", "role": "melee", "desc": "棘の鞭で攻撃する黒い新芽の魔獣"},
    {"id": 102, "name": "ロゼッタ", "title": "闇薔薇の魔女", "color": "#a83279", "accent": "#ff8ad6", "role": "ranged", "desc": "闇の薔薇魔法で遠距離から攻撃する魔女"},
    {"id": 103, "name": "ブロッケン", "title": "鉄棘ゴーレム", "color": "#5c5048", "accent": "#b8a090", "role": "heavy", "desc": "鉄棘の岩でできた頑強なゴーレム"},
]

PER_ENEMY_CELLS = {
    100: [
        (10, 10, 340, 500),      # idle
        (340, 10, 660, 500),     # run
        (660, 10, 1010, 500),    # attack
        (50, 510, 500, 1010),    # carry
        (500, 510, 980, 1010),   # hurt
    ],
    101: [
        (10, 10, 340, 500),      # idle
        (340, 10, 660, 500),     # run
        (660, 10, 1010, 500),    # attack
        (50, 510, 500, 1010),    # carry
        (500, 510, 980, 1010),   # hurt
    ],
    102: [
        (10, 10, 340, 500),      # idle
        (340, 10, 660, 500),     # run
        (660, 10, 1010, 500),    # attack
        (50, 510, 500, 1010),    # carry
        (500, 510, 980, 1010),   # hurt
    ],
    103: [
        (10, 10, 340, 500),      # idle
        (340, 10, 660, 500),     # run
        (660, 10, 1010, 500),    # attack
        (50, 510, 500, 1010),    # carry
        (500, 510, 980, 1010),   # hurt
    ]
}

# Manual native facing from visual inspection (-1=left, 1=right)
FACING_OVERRIDE = {
    0: {"idle": 1, "run": -1, "attack": 1, "carry": 1, "hurt": -1},
    1: {"idle": 1, "run": -1, "attack": -1, "carry": -1, "hurt": 1},
    2: {"idle": 1, "run": -1, "attack": 1, "carry": 1, "hurt": -1},
    3: {"idle": 1, "run": -1, "attack": -1, "carry": 1, "hurt": -1},
    4: {"idle": 1, "run": -1, "attack": 1, "carry": 1, "hurt": -1},
    5: {"idle": -1, "run": -1, "attack": -1, "carry": 1, "hurt": -1},
}

ENEMY_FACING_OVERRIDE = {
    100: {"idle": 1, "run": -1, "attack": 1, "carry": 1, "hurt": 1},
    101: {"idle": 1, "run": 1, "attack": 1, "carry": 1, "hurt": 1},
    102: {"idle": 1, "run": 1, "attack": 1, "carry": 1, "hurt": 1},
    103: {"idle": 1, "run": 1, "attack": 1, "carry": 1, "hurt": 1},
}


def is_bg_rgb(r: int, g: int, b: int, thr: int = 248) -> bool:
    return r >= thr and g >= thr and b >= thr


def flood_background_mask(rgb: np.ndarray, thr: int = 248) -> np.ndarray:
    h, w, _ = rgb.shape
    bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or visited[y, x]:
            return
        r, g, b = map(int, rgb[y, x])
        if is_bg_rgb(r, g, b, thr):
            visited[y, x] = True
            bg[y, x] = True
            q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                visited[ny, nx] = True
                r, g, b = map(int, rgb[ny, nx])
                if is_bg_rgb(r, g, b, thr):
                    bg[ny, nx] = True
                    q.append((nx, ny))
    return bg


def largest_component(fg: np.ndarray, min_area: int = 800):
    h, w = fg.shape
    labels = np.zeros((h, w), dtype=np.int32)
    best_lab, best_area = 0, 0
    label = 0
    for y in range(h):
        row = fg[y]
        for x in range(w):
            if not row[x] or labels[y, x]:
                continue
            label += 1
            stack = [(x, y)]
            area = 0
            while stack:
                cx, cy = stack.pop()
                if cx < 0 or cy < 0 or cx >= w or cy >= h:
                    continue
                if labels[cy, cx] or not fg[cy, cx]:
                    continue
                labels[cy, cx] = label
                area += 1
                stack.extend(((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)))
            if area > best_area:
                best_area = area
                best_lab = label
    if best_area < min_area:
        return None, labels
    return best_lab, labels


def keep_main_and_nearby(fg: np.ndarray, pose: str, max_gap: int = 10) -> np.ndarray:
    lab, labels = largest_component(fg)
    if lab is None:
        return fg
    out = labels == lab
    # Only attack/hurt keep nearby VFX; run/idle/carry stay body-only
    if pose not in ("attack", "hurt", "carry"):
        return out
    ys, xs = np.where(out)
    minx, maxx, miny, maxy = xs.min(), xs.max(), ys.min(), ys.max()
    for other in range(1, int(labels.max()) + 1):
        if other == lab:
            continue
        cy, cx = np.where(labels == other)
        area = len(cx)
        if area < 80 or area > 12000:
            continue
        # must overlap main bbox significantly
        if (
            cx.min() <= maxx + max_gap
            and cx.max() >= minx - max_gap
            and cy.min() <= maxy + max_gap
            and cy.max() >= miny - max_gap
        ):
            # reject skinny vertical strips on far left/right (neighbor bleed)
            ow = cx.max() - cx.min() + 1
            oh = cy.max() - cy.min() + 1
            if ow < 18 and (cx.max() < minx + 8 or cx.min() > maxx - 8):
                continue
            out[labels == other] = True
    return out


def defringe(rgba: np.ndarray) -> np.ndarray:
    """Remove white matte fringe left by cutting from white background."""
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    a = out[:, :, 3].astype(np.float32) / 255.0

    # Un-matte from white
    mask = a > 0.02
    am = np.maximum(a, 0.02)
    for c in range(3):
        rgb[:, :, c] = np.where(mask, (rgb[:, :, c] - (1.0 - a) * 255.0) / am, 0)
    rgb = np.clip(rgb, 0, 255)

    # Kill leftover near-white edge glow
    whiteness = np.min(rgb, axis=2)
    edge = mask.copy()
    # pixels with transparent neighbor
    pad = np.pad(a > 0.05, 1)
    opaque_n = (
        pad[0:-2, 1:-1].astype(np.uint8)
        + pad[2:, 1:-1]
        + pad[1:-1, 0:-2]
        + pad[1:-1, 2:]
    )
    has_clear = opaque_n < 4
    fringe = mask & has_clear & (whiteness > 200)
    a = a.copy()
    a[fringe] *= 0.15
    # slightly shrink very bright low-alpha fringe
    weak = mask & (a < 0.35) & (whiteness > 180)
    a[weak] *= 0.5

    out[:, :, :3] = rgb.astype(np.uint8)
    out[:, :, 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    return out


def foot_anchor_x(rgba: np.ndarray) -> float:
    """Horizontal foot/body pivot as fraction of width (0-1)."""
    a = rgba[:, :, 3] > 24
    h, w = a.shape
    band = a[int(h * 0.62) :, :]
    if band.sum() < 20:
        band = a[int(h * 0.45) :, :]
    mass = band.sum(axis=0).astype(np.float64)
    if mass.sum() < 1:
        return 0.5
    xs = np.arange(w)
    cx = (mass * xs).sum() / mass.sum()
    return float(np.clip(cx / w, 0.2, 0.8))


def extract_cell(cell_rgb: np.ndarray, pose: str) -> np.ndarray | None:
    bg = flood_background_mask(cell_rgb, thr=247)
    fg = keep_main_and_nearby(~bg, pose=pose)
    ys, xs = np.where(fg)
    if len(xs) < 200:
        return None
    pad = 3
    x0, x1 = max(0, xs.min() - pad), min(cell_rgb.shape[1], xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(cell_rgb.shape[0], ys.max() + pad + 1)
    crop = cell_rgb[y0:y1, x0:x1]
    crop_fg = fg[y0:y1, x0:x1]
    alpha = np.zeros(crop_fg.shape, dtype=np.uint8)
    alpha[crop_fg] = 255
    rgba = np.dstack([crop, alpha])
    rgba = defringe(rgba)
    # final tight
    a = rgba[:, :, 3] > 8
    ys, xs = np.where(a)
    if len(xs) == 0:
        return None
    return rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]


def extract_one(index: int, is_enemy: bool = False) -> dict:
    prefix = "enemy" if is_enemy else "character"
    src_idx = index - 100 if is_enemy else index
    src = ART / f"{prefix}-{src_idx}.png"
    img = Image.open(src).convert("RGB")
    arr = np.asarray(img).copy()
    
    if is_enemy:
        cells = PER_ENEMY_CELLS.get(index, DEFAULT_CELLS)
    else:
        cells = PER_CHAR_CELLS.get(index, DEFAULT_CELLS)

    out_dir_name = f"enemy-{src_idx}" if is_enemy else f"char-{index}"
    out_dir = OUT / out_dir_name
    out_dir.mkdir(parents=True, exist_ok=True)
    
    roster_item = ENEMY_ROSTER[src_idx] if is_enemy else ROSTER[index]
    meta = {"id": index, "poses": {}, **roster_item}

    ov = ENEMY_FACING_OVERRIDE if is_enemy else FACING_OVERRIDE
    char_ov = ov.get(index, {})

    for pose, (cx0, cy0, cx1, cy1) in zip(POSES, cells):
        rgba = extract_cell(arr[cy0:cy1, cx0:cx1], pose)
        if rgba is None:
            print(f"  {pose}: EMPTY")
            continue
        facing = char_ov.get(pose, -1)
        anchor = foot_anchor_x(rgba)
        sprite = Image.fromarray(rgba, "RGBA")
        path = out_dir / f"{pose}.png"
        sprite.save(path, optimize=True)
        meta["poses"][pose] = {
            "file": f"assets/sprites/{out_dir_name}/{pose}.png",
            "w": sprite.width,
            "h": sprite.height,
            "nativeFacing": facing,
            "anchorX": round(anchor, 3),
        }
        print(f"  {pose}: {sprite.width}x{sprite.height} face={'L' if facing < 0 else 'R'} anchor={anchor:.2f}")

    meta["artFacing"] = meta["poses"].get("run", {}).get("nativeFacing", -1)
    return meta


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = {"characters": [], "enemies": [], "roster": ROSTER, "enemy_roster": ENEMY_ROSTER}
    for i in range(6):
        print(f"Extracting character-{i}...")
        catalog["characters"].append(extract_one(i))
    
    for i in range(len(ENEMY_ROSTER)):
        enemy_id = 100 + i
        print(f"Extracting enemy-{i}...")
        catalog["enemies"].append(extract_one(enemy_id, is_enemy=True))

    (OUT / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Done ->", OUT)


if __name__ == "__main__":
    main()
