// Lightweight sprite cache. Each path is loaded lazily on first request;
// while the image is loading (or if it 404s) we return null so the caller
// can fall back to procedural drawing. There is no retry on failure — a
// missing sprite stays missing for the session, which keeps the console
// quiet and avoids per-frame churn.

const cache = new Map<string, HTMLImageElement | null>();

const base = import.meta.env.BASE_URL; // resolves to '/vs/' in production

export const spritePath = (name: string): string => `${base}sprites/${name}.png`;

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
// first frame that needs them. Call once at app startup.
export const preloadSprites = (names: string[]) => {
  names.forEach(getSprite);
};

// Draw a sprite centered in a rectangle with smoothing disabled so pixel
// art stays crisp at any scale. Returns true if the sprite was drawn,
// false if it isn't loaded yet (so the caller can fall back).
export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  flipH = false
): boolean => {
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
