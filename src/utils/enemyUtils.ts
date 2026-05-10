import { Enemy, EnemyType, GameBounds, Player, Projectile } from '../types/game';

// Generate a random enemy outside the visible area
export const generateEnemy = (
  gameTime: number, 
  player: Player, 
  gameBounds: GameBounds
): Enemy => {
  // Increase difficulty based on game time
  const difficulty = Math.min(1 + gameTime / 60000, 5);
  
  // Determine spawn position outside the visible area
  const spawnSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  let x = 0;
  let y = 0;
  const buffer = 50; // Distance outside the visible area
  
  // Get the camera-aware spawn position
  // We'll spawn enemies relative to the player's position rather than the viewport
  const viewportWidth = gameBounds.width;
  const viewportHeight = gameBounds.height;
  
  // Spawn outside the player's view but within the game world
  switch (spawnSide) {
    case 0: // Top
      x = player.x - viewportWidth / 4 - buffer + Math.random() * (viewportWidth / 2 + buffer * 2);
      y = player.y - viewportHeight / 4 - buffer;
      break;
    case 1: // Right
      x = player.x + viewportWidth / 4 + buffer;
      y = player.y - viewportHeight / 4 - buffer + Math.random() * (viewportHeight / 2 + buffer * 2);
      break;
    case 2: // Bottom
      x = player.x - viewportWidth / 4 - buffer + Math.random() * (viewportWidth / 2 + buffer * 2);
      y = player.y + viewportHeight / 4 + buffer;
      break;
    case 3: // Left
      x = player.x - viewportWidth / 4 - buffer;
      y = player.y - viewportHeight / 4 - buffer + Math.random() * (viewportHeight / 2 + buffer * 2);
      break;
  }
  
  // Keep enemies within the game bounds
  x = Math.max(0, Math.min(gameBounds.width * 1.5 - 32, x));
  y = Math.max(0, Math.min(gameBounds.height * 1.5 - 32, y));
  
  // Determine enemy type based on game time
  const enemyTypes: EnemyType[] = ['basic'];
  
  if (gameTime > 30000) enemyTypes.push('fast');
  if (gameTime > 60000) enemyTypes.push('tank');
  if (gameTime > 120000) enemyTypes.push('ranged');
  if (gameTime > 300000 && Math.random() < 0.05) enemyTypes.push('boss');
  
  const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
  
  // Create enemy based on type
  switch (type) {
    case 'basic':
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 24,
        height: 24,
        speed: 80 * difficulty,
        health: 20 * difficulty,
        maxHealth: 20 * difficulty,
        damage: 10,
        type: 'basic',
        experienceValue: 1,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };

    case 'fast':
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 20,
        height: 20,
        speed: 60 * difficulty, // Reduced from 90 to 60
        health: 15 * difficulty,
        maxHealth: 15 * difficulty,
        damage: 5,
        type: 'fast',
        experienceValue: 2,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };
    
    case 'tank':
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 32,
        height: 32,
        speed: 50 * difficulty,
        health: 50 * difficulty,
        maxHealth: 50 * difficulty,
        damage: 15,
        type: 'tank',
        experienceValue: 5,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };
    
    case 'ranged':
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 22,
        height: 22,
        speed: 70 * difficulty,
        health: 25 * difficulty,
        maxHealth: 25 * difficulty,
        damage: 8,
        type: 'ranged',
        experienceValue: 3,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };
    
    case 'boss':
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 48,
        height: 48,
        speed: 40 * difficulty,
        health: 200 * difficulty,
        maxHealth: 200 * difficulty,
        damage: 25,
        type: 'boss',
        experienceValue: 20,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };
    
    default:
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        width: 24,
        height: 24,
        speed: 80 * difficulty,
        health: 20 * difficulty,
        maxHealth: 20 * difficulty,
        damage: 10,
        type: 'basic',
        experienceValue: 1,
        lastHit: 0,
        lastShot: Date.now() - Math.random() * 1500
      };
  }
};

// Configuration for enemy attacks. Every enemy type fires now, but the
// dedicated `ranged` and `boss` types fire much more often.
export const ENEMY_PROJECTILE_DURATION = 4000;

// Per-type fire profile. `range` is squared distance budget — enemies
// only fire when the player is at least this close. Returns `null` for
// enemies that should never fire.
interface FireProfile {
  interval: number; // ms between shots
  range: number;    // px max distance to player
  speed: number;
  damage: number;
  size: number;
}

export const getEnemyFireProfile = (enemy: Enemy): FireProfile | null => {
  switch (enemy.type) {
    case 'basic':
      return { interval: 4500, range: 320, speed: 180, damage: 6, size: 12 };
    case 'fast':
      return { interval: 3200, range: 300, speed: 260, damage: 5, size: 10 };
    case 'tank':
      return { interval: 5000, range: 280, speed: 160, damage: 12, size: 16 };
    case 'ranged':
      return { interval: 1800, range: 400, speed: 240, damage: 8, size: 14 };
    case 'boss':
      return { interval: 1200, range: 480, speed: 260, damage: 18, size: 18 };
    default:
      return null;
  }
};

// Create a hostile projectile fired by an enemy toward the player.
export const createEnemyProjectile = (
  enemy: Enemy,
  player: Player
): Projectile => {
  const profile = getEnemyFireProfile(enemy) ?? {
    speed: 200,
    damage: 6,
    size: 12,
    interval: 0,
    range: 0
  };
  const ex = enemy.x + enemy.width / 2;
  const ey = enemy.y + enemy.height / 2;
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;

  const dx = px - ex;
  const dy = py - ey;
  const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
  const dir = { x: dx / dist, y: dy / dist };

  return {
    id: `proj-enemy-${enemy.id}-${Date.now()}-${Math.random()}`,
    x: ex - profile.size / 2,
    y: ey - profile.size / 2,
    width: profile.size,
    height: profile.size,
    speed: profile.speed,
    damage: profile.damage,
    direction: dir,
    weaponType: 'enemy_bolt',
    duration: ENEMY_PROJECTILE_DURATION,
    createdAt: Date.now(),
    passthrough: false,
    hitEnemies: [],
    hostile: true,
    reflected: false
  };
};

// Get enemy color based on type
export const getEnemyColor = (type: EnemyType): string => {
  switch (type) {
    case 'basic': return '#DC2626'; // Red
    case 'fast': return '#F97316'; // Orange
    case 'tank': return '#7C3AED'; // Purple
    case 'ranged': return '#10B981'; // Green
    case 'boss': return '#F59E0B'; // Amber
    default: return '#DC2626'; // Default red
  }
};

// Determine number of enemies to spawn based on game time
export const getEnemySpawnCount = (gameTime: number): number => {
  // Base spawn rate increases over time
  const baseCount = 1 + Math.floor(gameTime / 30000);
  
  // Add randomness
  const randomFactor = Math.random() * 2;
  
  return Math.floor(baseCount + randomFactor);
};

// Determine spawn interval based on game time
export const getEnemySpawnInterval = (gameTime: number): number => {
  // Start with 2 seconds, decrease to minimum of 0.5 seconds
  const baseInterval = Math.max(500, 2000 - gameTime / 15000);
  
  // Add randomness
  const randomFactor = Math.random() * 500;
  
  return baseInterval + randomFactor;
};