import { Player, Enemy, Projectile, Pickup, VisualEffect } from '../types/game';
import { getEnemyColor } from './enemyUtils';
import { drawSprite, preloadSprites } from './spriteLoader';

// Kick off image loads as soon as the renderer module is imported. The
// names map 1:1 to PNG filenames under `public/sprites/`.
preloadSprites([
  'player',
  'bat', 'skeleton', 'zombie', 'plant', 'ghost', 'werewolf',
  'pumpkin', 'giantbat', 'reaper',
  'pickup-xp-blue', 'pickup-xp-green', 'pickup-xp-red',
  'pickup-health', 'pickup-magnet', 'pickup-bomb', 'pickup-chest',
  'tree'
]);

// Counter ring visualization. Visible only while the counter window is open
// after a finger release; a successful reflect adds a brief gold flash.
const drawCounterShield = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: { x: number; y: number }
) => {
  const cx = player.x + player.width / 2 - camera.x;
  const cy = player.y + player.height / 2 - camera.y;
  const baseRadius = player.width * 0.95;
  const now = Date.now();

  if (now - player.lastCounterSuccessTime < 280) {
    const t = 1 - (now - player.lastCounterSuccessTime) / 280;
    ctx.save();
    ctx.globalAlpha = t;
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * (1.4 + (1 - t) * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (now <= player.counterWindowEnd) {
    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FBBF24';
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (now < player.counterCooldownEnd) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

interface RenderProps {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  effects: VisualEffect[];
  width: number;
  height: number;
  camera: { x: number; y: number };
}

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  { player, enemies, projectiles, pickups, effects, width, height, camera }: RenderProps
) => {
  ctx.clearRect(0, 0, width, height);
  drawForestBackground(ctx, width, height, camera);

  // World-space effects under sprites (trails)
  effects.forEach(e => {
    if (e.kind === 'trail') drawTrailEffect(ctx, e, camera);
  });

  pickups.forEach(pickup => drawPickup(ctx, pickup, camera));
  enemies.forEach(enemy => drawEnemy(ctx, enemy, camera));
  projectiles.forEach(projectile => drawProjectile(ctx, projectile, camera));
  drawPlayer(ctx, player, camera);

  // World-space effects on top of sprites (particles, rings, damage numbers)
  effects.forEach(e => {
    if (e.kind === 'particle') drawParticleEffect(ctx, e, camera);
    else if (e.kind === 'ring') drawRingEffect(ctx, e, camera);
    else if (e.kind === 'damageNumber') drawDamageNumberEffect(ctx, e, camera);
  });

  // Screen-space flashes overlay everything
  effects.forEach(e => {
    if (e.kind === 'flash') drawFlashEffect(ctx, e, width, height);
  });
};

const drawParticleEffect = (
  ctx: CanvasRenderingContext2D,
  e: Extract<VisualEffect, { kind: 'particle' }>,
  camera: { x: number; y: number }
) => {
  const t = (Date.now() - e.createdAt) / e.duration;
  const alpha = Math.max(0, 1 - t);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(e.x - camera.x, e.y - camera.y, e.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawRingEffect = (
  ctx: CanvasRenderingContext2D,
  e: Extract<VisualEffect, { kind: 'ring' }>,
  camera: { x: number; y: number }
) => {
  const t = Math.min(1, (Date.now() - e.createdAt) / e.duration);
  const radius = e.startRadius + (e.endRadius - e.startRadius) * t;
  const alpha = 1 - t;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = e.color;
  ctx.lineWidth = e.width;
  ctx.beginPath();
  ctx.arc(e.x - camera.x, e.y - camera.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawDamageNumberEffect = (
  ctx: CanvasRenderingContext2D,
  e: Extract<VisualEffect, { kind: 'damageNumber' }>,
  camera: { x: number; y: number }
) => {
  const t = (Date.now() - e.createdAt) / e.duration;
  const alpha = Math.max(0, 1 - t);
  const scale = e.crit ? 1.35 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${e.crit ? 'bold ' : ''}${Math.round(12 * scale)}px ui-rounded, -apple-system, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(String(e.value), e.x - camera.x + 1, e.y - camera.y + 1);
  ctx.fillStyle = e.color;
  ctx.fillText(String(e.value), e.x - camera.x, e.y - camera.y);
  ctx.restore();
};

const drawTrailEffect = (
  ctx: CanvasRenderingContext2D,
  e: Extract<VisualEffect, { kind: 'trail' }>,
  camera: { x: number; y: number }
) => {
  const t = Math.min(1, (Date.now() - e.createdAt) / e.duration);
  const cx = e.fromX + (e.toX - e.fromX) * t;
  const cy = e.fromY + (e.toY - e.fromY) * t;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.fromX - camera.x, e.fromY - camera.y);
  ctx.lineTo(cx - camera.x, cy - camera.y);
  ctx.stroke();
  ctx.restore();
};

const drawFlashEffect = (
  ctx: CanvasRenderingContext2D,
  e: Extract<VisualEffect, { kind: 'flash' }>,
  width: number,
  height: number
) => {
  const t = (Date.now() - e.createdAt) / e.duration;
  const alpha = Math.max(0, 1 - t);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = e.color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

// Mad Forest backdrop. We paint a green ground, then a grid of darker
// patches and a sparse field of "tree" circles whose positions are derived
// from world coordinates so they stay anchored as the camera moves.
const drawForestBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: { x: number; y: number }
) => {
  // Solid grass base.
  ctx.fillStyle = '#1b3a18';
  ctx.fillRect(0, 0, width, height);

  // Darker grass clumps — every 64px world cell gets a chance, hashed from
  // its world coords so the pattern is deterministic per location.
  const cell = 64;
  const startX = Math.floor(camera.x / cell) * cell;
  const startY = Math.floor(camera.y / cell) * cell;
  const endX = startX + width + cell;
  const endY = startY + height + cell;
  for (let wx = startX; wx <= endX; wx += cell) {
    for (let wy = startY; wy <= endY; wy += cell) {
      const h = hash2(wx, wy);
      if (h < 0.18) {
        ctx.fillStyle = '#172e15';
        ctx.fillRect(wx - camera.x, wy - camera.y, cell, cell);
      } else if (h < 0.28) {
        ctx.fillStyle = '#214a1f';
        ctx.fillRect(wx - camera.x, wy - camera.y, cell, cell);
      }
    }
  }

  // Trees: a much coarser grid (200px), with occasional triplets per cell.
  const tcell = 200;
  const tStartX = Math.floor((camera.x - tcell) / tcell) * tcell;
  const tStartY = Math.floor((camera.y - tcell) / tcell) * tcell;
  const tEndX = tStartX + width + tcell * 2;
  const tEndY = tStartY + height + tcell * 2;
  for (let wx = tStartX; wx <= tEndX; wx += tcell) {
    for (let wy = tStartY; wy <= tEndY; wy += tcell) {
      const h = hash2(wx + 13, wy - 7);
      if (h < 0.35) {
        const ox = (hash2(wx, wy + 1) - 0.5) * tcell;
        const oy = (hash2(wx + 1, wy) - 0.5) * tcell;
        drawTree(ctx, wx + tcell / 2 + ox - camera.x, wy + tcell / 2 + oy - camera.y);
      }
    }
  }

  // Subtle vignette
  const vg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
};

// Deterministic 2D hash → [0,1)
const hash2 = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  // Sprite-first
  if (drawSprite(ctx, 'tree', x - 24, y - 32, 48, 64)) return;
  // Trunk
  ctx.fillStyle = '#3b2410';
  ctx.fillRect(x - 4, y, 8, 16);
  // Canopy
  ctx.fillStyle = '#0c2a0c';
  ctx.beginPath();
  ctx.arc(x, y - 6, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#143d14';
  ctx.beginPath();
  ctx.arc(x - 8, y - 10, 12, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 8, 14, 0, Math.PI * 2);
  ctx.fill();
};

const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: { x: number; y: number }
) => {
  const cx = player.x + player.width / 2 - camera.x;
  const cy = player.y + player.height / 2 - camera.y;

  if (player.invulnerable) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 50);
  }

  // Sprite-first: if a player.png exists, draw it (flipped when facing
  // left). Otherwise fall back to the procedural cape/head/hat figure.
  // The visual is rendered larger than the hitbox so the sprite's pixels
  // read as chunky pixel art instead of being downscaled into mush. The
  // collision box stays at player.width/height.
  const flipH = player.direction === 'left'
    || (player.lastDirection && player.lastDirection.x < 0);
  const PLAYER_VISUAL_SCALE = 1.7;
  const visW = player.width * PLAYER_VISUAL_SCALE;
  const visH = player.height * PLAYER_VISUAL_SCALE;
  const visX = (player.x + player.width / 2) - visW / 2 - camera.x;
  const visY = (player.y + player.height / 2) - visH / 2 - camera.y;
  const drewSprite = drawSprite(
    ctx, 'player',
    visX, visY,
    visW, visH,
    !!flipH
  );
  if (!drewSprite) {
    // Cape / body
    ctx.fillStyle = '#3a2a55';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#e9d5b3';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, player.width / 3.2, 0, Math.PI * 2);
    ctx.fill();
    // Hat
    ctx.fillStyle = '#1a1024';
    ctx.fillRect(cx - 9, cy - 12, 18, 4);
    ctx.fillRect(cx - 14, cy - 9, 28, 3);
  }

  ctx.globalAlpha = 1;
  drawCounterShield(ctx, player, camera);
};

// Tiny bat silhouette that floats above bosses. Drawn with a subtle bob so
// it animates without depending on per-frame state.
const drawBossMarker = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  glowColor: string
) => {
  const bob = Math.sin(Date.now() / 220) * 2;
  const baseY = topY - 10 + bob;
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#0f0f14';
  // Body
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 3, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings — two stubby triangles. Tip apex is offset to make them readable
  // even at 1× zoom.
  ctx.beginPath();
  ctx.moveTo(cx - 2, baseY);
  ctx.lineTo(cx - 9, baseY - 3);
  ctx.lineTo(cx - 5, baseY + 1);
  ctx.closePath();
  ctx.moveTo(cx + 2, baseY);
  ctx.lineTo(cx + 9, baseY - 3);
  ctx.lineTo(cx + 5, baseY + 1);
  ctx.closePath();
  ctx.fill();
  // Eye spark
  ctx.shadowBlur = 0;
  ctx.fillStyle = glowColor;
  ctx.fillRect(cx - 1, baseY - 1, 1, 1);
  ctx.fillRect(cx + 1, baseY - 1, 1, 1);
  ctx.restore();
};

const drawHealthBar = (
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camera: { x: number; y: number }
) => {
  if (enemy.health >= enemy.maxHealth) return;
  const w = enemy.width;
  const h = 3;
  const x = enemy.x - camera.x;
  const y = enemy.y - h - 2 - camera.y;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, h);
  const pct = enemy.health / enemy.maxHealth;
  ctx.fillStyle = pct < 0.3 ? '#ef4444' : '#10b981';
  ctx.fillRect(x, y, w * pct, h);
};

const drawEnemy = (
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camera: { x: number; y: number }
) => {
  const cx = enemy.x + enemy.width / 2 - camera.x;
  const cy = enemy.y + enemy.height / 2 - camera.y;
  const color = getEnemyColor(enemy.type);
  const w = enemy.width;
  const h = enemy.height;

  ctx.save();
  if (enemy.type === 'ghost') ctx.globalAlpha = 0.65;

  // Sprite-first. If the file exists in public/sprites/{type}.png the
  // renderer uses it and skips the procedural shape; otherwise we draw
  // the hand-built fallback below.
  const drewSprite = drawSprite(
    ctx, enemy.type,
    enemy.x - camera.x, enemy.y - camera.y,
    w, h
  );
  if (drewSprite) {
    ctx.restore();
    drawHealthBar(ctx, enemy, camera);
    if (enemy.type === 'pumpkin' || enemy.type === 'giantbat' || enemy.type === 'reaper') {
      drawBossMarker(ctx, cx, enemy.y - camera.y - 6, enemy.type === 'reaper' ? '#ef4444' : '#fde68a');
    }
    if (Date.now() - enemy.lastHit < 90) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  switch (enemy.type) {
    case 'bat': {
      ctx.fillStyle = color;
      // Body
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 3, h / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings flap with time
      const wing = (Math.sin(Date.now() / 80) + 1) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - w / 2 - wing * 4, cy - h / 3);
      ctx.lineTo(cx - w / 3, cy + 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w / 2 + wing * 4, cy - h / 3);
      ctx.lineTo(cx + w / 3, cy + 1);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 3, cy - 2, 2, 2);
      ctx.fillRect(cx + 1, cy - 2, 2, 2);
      break;
    }
    case 'skeleton': {
      // Body/cloak
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(cx - w / 3, cy - h / 4, (w / 3) * 2, h / 2);
      // Skull
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy - h / 4, w / 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Sockets
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(cx - 4, cy - h / 4 - 1, 3, 3);
      ctx.fillRect(cx + 1, cy - h / 4 - 1, 3, 3);
      break;
    }
    case 'zombie': {
      ctx.fillStyle = color;
      ctx.fillRect(cx - w / 2.5, cy - h / 2.2, (w / 2.5) * 2, (h / 2.2) * 2);
      // Darker head
      ctx.fillStyle = '#3f5326';
      ctx.fillRect(cx - w / 3, cy - h / 2.2, (w / 3) * 2, h / 2.5);
      // Eyes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 5, cy - h / 3, 3, 3);
      ctx.fillRect(cx + 2, cy - h / 3, 3, 3);
      break;
    }
    case 'plant': {
      // Pot
      ctx.fillStyle = '#5c3a1c';
      ctx.fillRect(cx - w / 3, cy + h / 6, (w / 3) * 2, h / 3);
      // Stem
      ctx.fillStyle = '#1f5a1f';
      ctx.fillRect(cx - 1, cy - h / 6, 2, h / 3);
      // Bulb
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy - h / 4, w / 3, 0, Math.PI * 2);
      ctx.fill();
      // Teeth/maw
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, cy - h / 5, 2, 3);
      ctx.fillRect(cx + 2, cy - h / 5, 2, 3);
      break;
    }
    case 'ghost': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2.4, cy + h / 2);
      ctx.lineTo(cx - w / 2.4, cy);
      ctx.arc(cx, cy, w / 2.4, Math.PI, 0);
      ctx.lineTo(cx + w / 2.4, cy + h / 2);
      // Wavy bottom
      const wave = Math.sin(Date.now() / 120) * 2;
      ctx.lineTo(cx + w / 4, cy + h / 2 - 4 + wave);
      ctx.lineTo(cx, cy + h / 2 + wave);
      ctx.lineTo(cx - w / 4, cy + h / 2 - 4 - wave);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 4, cy - 2, 2, 4);
      ctx.fillRect(cx + 2, cy - 2, 2, 4);
      break;
    }
    case 'werewolf': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2.5, h / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(cx - w / 3, cy - h / 3);
      ctx.lineTo(cx - w / 4, cy - h / 2);
      ctx.lineTo(cx - w / 5, cy - h / 3);
      ctx.moveTo(cx + w / 3, cy - h / 3);
      ctx.lineTo(cx + w / 4, cy - h / 2);
      ctx.lineTo(cx + w / 5, cy - h / 3);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 5, cy - 2, 3, 3);
      ctx.fillRect(cx + 2, cy - 2, 3, 3);
      // Fangs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 3, cy + 4, 2, 4);
      ctx.fillRect(cx + 1, cy + 4, 2, 4);
      break;
    }
    case 'pumpkin': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2.1, h / 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ridges
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - w / 3, cy - h / 4);
      ctx.lineTo(cx - w / 3, cy + h / 4);
      ctx.moveTo(cx, cy - h / 3);
      ctx.lineTo(cx, cy + h / 3);
      ctx.moveTo(cx + w / 3, cy - h / 4);
      ctx.lineTo(cx + w / 3, cy + h / 4);
      ctx.stroke();
      // Face
      ctx.fillStyle = '#fde047';
      const triangle = (px: number, py: number, s: number) => {
        ctx.beginPath();
        ctx.moveTo(px, py - s);
        ctx.lineTo(px + s, py + s);
        ctx.lineTo(px - s, py + s);
        ctx.closePath();
        ctx.fill();
      };
      triangle(cx - 7, cy - 3, 4);
      triangle(cx + 7, cy - 3, 4);
      ctx.fillRect(cx - 7, cy + 5, 14, 3);
      // Stem
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx - 3, cy - h / 2 - 2, 6, 5);
      break;
    }
    case 'giantbat': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2.5, h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      const flap = (Math.sin(Date.now() / 90) + 1) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - w / 1.5 - flap * 10, cy - h / 3);
      ctx.lineTo(cx - w / 2.5, cy + h / 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w / 1.5 + flap * 10, cy - h / 3);
      ctx.lineTo(cx + w / 2.5, cy + h / 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 7, cy - 4, 4, 4);
      ctx.fillRect(cx + 3, cy - 4, 4, 4);
      break;
    }
    case 'reaper': {
      // Cloak
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - h / 2.5);
      ctx.quadraticCurveTo(cx, cy - h / 2, cx + w / 2, cy - h / 2.5);
      ctx.lineTo(cx + w / 2.2, cy + h / 2);
      ctx.lineTo(cx - w / 2.2, cy + h / 2);
      ctx.closePath();
      ctx.fill();
      // Glowing eyes
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 14 * pulse;
      ctx.fillRect(cx - 12, cy - 6, 6, 6);
      ctx.fillRect(cx + 6, cy - 6, 6, 6);
      ctx.shadowBlur = 0;
      // Scythe
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + w / 2, cy + h / 2);
      ctx.lineTo(cx + w / 1.5, cy - h / 2.5);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cx + w / 1.5, cy - h / 2.5);
      ctx.quadraticCurveTo(cx + w, cy - h / 2.2, cx + w / 1.2, cy - h / 1.8);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
  drawHealthBar(ctx, enemy, camera);

  // Boss marker: a small bat silhouette hovers above pumpkins, giant bats,
  // and the reaper. Bobs gently so the eye finds them in the crowd.
  if (enemy.type === 'pumpkin' || enemy.type === 'giantbat' || enemy.type === 'reaper') {
    drawBossMarker(ctx, cx, enemy.y - camera.y - 6, enemy.type === 'reaper' ? '#ef4444' : '#fde68a');
  }

  if (Date.now() - enemy.lastHit < 90) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(w, h) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

const drawProjectile = (
  ctx: CanvasRenderingContext2D,
  projectile: Projectile,
  camera: { x: number; y: number }
) => {
  // Scheduled projectiles (whip chain's second slash) are inactive — skip.
  if (projectile.createdAt > Date.now()) return;
  if (projectile.reflected) {
    const cx = projectile.x + projectile.width / 2 - camera.x;
    const cy = projectile.y + projectile.height / 2 - camera.y;
    ctx.save();
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#FCD34D';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(projectile.width, projectile.height) * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  switch (projectile.weaponType) {
    case 'knife': {
      ctx.fillStyle = '#e5e7eb';
      const angle = Math.atan2(projectile.direction.y, projectile.direction.x);
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(angle);
      ctx.fillRect(-projectile.width / 2, -projectile.height / 4, projectile.width, projectile.height / 2);
      ctx.restore();
      break;
    }
    case 'axe': {
      ctx.fillStyle = '#a78bfa';
      const rot = (Date.now() * 0.012) % (Math.PI * 2);
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -projectile.height / 2);
      ctx.lineTo(projectile.width / 2, 0);
      ctx.lineTo(0, projectile.height / 2);
      ctx.lineTo(-projectile.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'wand': {
      const cx = projectile.x + projectile.width / 2 - camera.x;
      const cy = projectile.y + projectile.height / 2 - camera.y;
      const r = projectile.width / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, '#f9a8d4');
      g.addColorStop(1, '#a78bfa');
      ctx.fillStyle = g;
      ctx.shadowColor = '#f9a8d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'whip': {
      // Slash slab — fade-in then fade-out across the projectile's duration.
      const t = (Date.now() - projectile.createdAt) / Math.max(50, projectile.duration);
      const alpha = Math.max(0, 1 - Math.abs(t - 0.4) * 2);
      ctx.save();
      ctx.globalAlpha = alpha;
      const px = projectile.x - camera.x;
      const py = projectile.y - camera.y;
      const grad = ctx.createLinearGradient(px, py, px + projectile.width, py);
      if (projectile.direction.x >= 0) {
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(252, 211, 77, 0.9)');
      } else {
        grad.addColorStop(0, 'rgba(252, 211, 77, 0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, projectile.width, projectile.height);
      ctx.restore();
      break;
    }
    case 'bible': {
      ctx.fillStyle = '#fbbf24';
      const rot = (Date.now() * 0.005) % (Math.PI * 2);
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(rot);
      ctx.fillRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
      ctx.fillStyle = '#f3f4f6';
      const cw = projectile.width * 0.2;
      const ch = projectile.height * 0.6;
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      ctx.fillRect(-ch / 2, -cw / 2, ch, cw);
      ctx.restore();
      break;
    }
    case 'enemy_bolt': {
      if (projectile.reflected) break;
      const cx = projectile.x + projectile.width / 2 - camera.x;
      const cy = projectile.y + projectile.height / 2 - camera.y;
      const r = projectile.width / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, '#fca5a5');
      g.addColorStop(1, '#7f1d1d');
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'garlic': {
      const cx = projectile.x + projectile.width / 2 - camera.x;
      const cy = projectile.y + projectile.height / 2 - camera.y;
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.005);
      const r = (projectile.width / 2) * pulse;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(253, 230, 138, 0.25)');
      g.addColorStop(0.6, 'rgba(253, 230, 138, 0.12)');
      g.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        projectile.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
    }
  }
};

// Gem tier colors derived from value: 1 = blue, 2-4 = green, 5+ = red.
const gemColorFor = (value: number): { fill: string; shimmer: string } => {
  if (value >= 5) return { fill: '#ef4444', shimmer: '#fecaca' };
  if (value >= 2) return { fill: '#10b981', shimmer: '#a7f3d0' };
  return { fill: '#3b82f6', shimmer: '#bfdbfe' };
};

const drawPickup = (
  ctx: CanvasRenderingContext2D,
  pickup: Pickup,
  camera: { x: number; y: number }
) => {
  const cx = pickup.x + 8 - camera.x;
  const cy = pickup.y + 8 - camera.y;
  const size = 16;
  const floatOffset = Math.sin(Date.now() / 300 + pickup.x * 0.01) * 2;
  const drawY = cy + floatOffset;

  // Sprite-first. XP gems pick the tier name from the value so the
  // blue/green/red sprites get the right slot. Other pickup types use
  // their direct name.
  const spriteName =
    pickup.type === 'experience'
      ? (pickup.value >= 5 ? 'pickup-xp-red' : pickup.value >= 2 ? 'pickup-xp-green' : 'pickup-xp-blue')
      : `pickup-${pickup.type}`;
  if (drawSprite(ctx, spriteName, pickup.x - camera.x, pickup.y - camera.y + floatOffset, size, size)) {
    return;
  }

  switch (pickup.type) {
    case 'experience': {
      const { fill, shimmer } = gemColorFor(pickup.value);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(cx, drawY - size / 2);
      ctx.lineTo(cx + size / 2, drawY);
      ctx.lineTo(cx, drawY + size / 2);
      ctx.lineTo(cx - size / 2, drawY);
      ctx.closePath();
      ctx.fill();
      const a = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.fillStyle = shimmer;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(cx, drawY - 4);
      ctx.lineTo(cx + 4, drawY);
      ctx.lineTo(cx, drawY + 4);
      ctx.lineTo(cx - 4, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'health': {
      // Roasted chicken pickup. Drum-shaped body with a bone.
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx, drawY + 1, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - 1, drawY - 7, 2, 5);
      ctx.beginPath();
      ctx.arc(cx, drawY - 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'magnet': {
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, drawY + 1, 6, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 8, drawY, 4, 5);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(cx + 4, drawY, 4, 5);
      break;
    }
    case 'chest': {
      // Treasure chest — pulsing gold rim plus a small box.
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 220);
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14 * pulse;
      // Wooden body
      ctx.fillStyle = '#7c4a1b';
      ctx.fillRect(cx - 8, drawY - 4, 16, 11);
      // Gold lid
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(cx - 9, drawY - 4);
      ctx.lineTo(cx + 9, drawY - 4);
      ctx.lineTo(cx + 8, drawY - 8);
      ctx.lineTo(cx - 8, drawY - 8);
      ctx.closePath();
      ctx.fill();
      // Latch
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(cx - 2, drawY - 5, 4, 4);
      // Rim highlight
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 8, drawY - 4, 16, 11);
      ctx.restore();
      break;
    }
    case 'bomb': {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, drawY + 1, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 1, drawY - 8, 2, 4);
      // Spark
      const spark = (Math.sin(Date.now() / 80) + 1) * 0.5;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, drawY - 10, 2 + spark * 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
