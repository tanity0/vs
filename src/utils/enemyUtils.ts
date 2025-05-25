import { Enemy, EnemyType, GameBounds, Player } from '../types/game';

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
        lastHit: 0
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
        lastHit: 0
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
        lastHit: 0
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
        lastHit: 0
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
        lastHit: 0
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
        lastHit: 0
      };
  }
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