// Sprite loading + atlas support.
//
// Primary source is a single `atlas.png` containing every non-player sprite
// in a 6×4 grid of 256px cells. When the atlas is loaded and the requested
// name has a known cell, we draw via the 9-arg `drawImage` sub-rect form.
// Otherwise we fall back to per-file PNGs at `public/sprites/<name>.png` —
// this is how the hand-picked `player.png` keeps rendering even though it
// isn't in the atlas.

const cache = new Map<string, HTMLImageElement | null>();

const base = import.meta.env.BASE_URL; // resolves to '/vs/' in production

export const spritePath = (name: string): string => `${base}sprites/${name}.png`;

const ATLAS_NAME = 'atlas';
const ATLAS_CELL = 256;
// Pull samples in by a few pixels so cell-edge antialiasing / fringe pixels
// from neighbouring sprites never bleed into the result.
const ATLAS_INSET = 4;

// Cell coordinates inside the atlas. `player` is deliberately omitted so it
// falls through to the per-file loader.
const ATLAS_CELLS: Record<string, { col: number; row: number }> = {
  bat:               { col: 1, row: 0 },
  skeleton:          { col: 2, row: 0 },
  zombie:            { col: 3, row: 0 },
  plant:             { col: 4, row: 0 },
  ghost:             { col: 5, row: 0 },
  werewolf:          { col: 0, row: 1 },
  pumpkin:           { col: 1, row: 1 },
  giantbat:          { col: 2, row: 1 },
  reaper:            { col: 3, row: 1 },
  tree:              { col: 4, row: 1 },
  'pickup-xp-blue':  { col: 0, row: 2 },
  'pickup-xp-green': { col: 1, row: 2 },
  'pickup-xp-red':   { col: 2, row: 2 },
  'pickup-health':   { col: 3, row: 2 },
  'pickup-magnet':   { col: 4, row: 2 },
  'pickup-bomb':     { col: 5, row: 2 },
  'pickup-chest':    { col: 0, row: 3 },
};

export const getSprite = (name: string): HTMLImageElement | null => {
  const path = spritePath(name);
  if (cache.has(path)) return cache.get(path) ?? null;
  cache.set(path, null);
  const img = new Image();
  img.onload = () => cache.set(path, img);
  img.onerror = () => cache.set(path, null);
  img.src = path;
  return null;
};

// Eagerly kick off loads for a set of names so they're cached before the
// first frame that needs them. Call once at app startup. The atlas is
// always preloaded as well so the very first frame can already use it.
export const preloadSprites = (names: string[]) => {
  getSprite(ATLAS_NAME);
  names.forEach(getSprite);
};

// Draw a sprite. Atlas first (for any name that has a cell), then per-file
// fallback (player and anything not in the atlas). Smoothing is disabled so
// pixel edges stay crisp at any scale. Returns true if something was drawn.
export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  flipH = false
): boolean => {
  const cell = ATLAS_CELLS[name];
  const atlas = cell ? getSprite(ATLAS_NAME) : null;
  if (cell && atlas) {
    const sx = cell.col * ATLAS_CELL + ATLAS_INSET;
    const sy = cell.row * ATLAS_CELL + ATLAS_INSET;
    const ss = ATLAS_CELL - ATLAS_INSET * 2;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flipH) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(atlas, sx, sy, ss, ss, 0, 0, width, height);
    } else {
      ctx.drawImage(atlas, sx, sy, ss, ss, x, y, width, height);
    }
    ctx.restore();
    return true;
  }

  const img = getSprite(name);
  if (!img) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flipH) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, width, height);
  } else {
    ctx.drawImage(img, x, y, width, height);
  }
  ctx.restore();
  return true;
};
