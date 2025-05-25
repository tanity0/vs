import { Player, Enemy, Projectile, Pickup } from '../types/game';

// Check collision between two rectangles
export const checkCollision = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Check collisions between projectiles and enemies
export const checkProjectileEnemyCollisions = (
  projectiles: Projectile[], 
  enemies: Enemy[]
): { projectileId: string; enemyId: string; damage: number }[] => {
  const collisions: { projectileId: string; enemyId: string; damage: number }[] = [];
  
  projectiles.forEach(projectile => {
    enemies.forEach(enemy => {
      // Skip if already hit by this projectile (for passthrough weapons)
      if (projectile.hitEnemies.includes(enemy.id)) {
        return;
      }
      
      if (checkCollision(projectile, enemy)) {
        collisions.push({
          projectileId: projectile.id,
          enemyId: enemy.id,
          damage: projectile.damage
        });
        
        // Add to hit enemies list for passthrough weapons
        if (projectile.passthrough) {
          projectile.hitEnemies.push(enemy.id);
        }
      }
    });
  });
  
  return collisions;
};

// Check collisions between player and enemies
export const checkPlayerEnemyCollisions = (
  player: Player, 
  enemies: Enemy[]
): Enemy[] => {
  return enemies.filter(enemy => checkCollision(player, enemy));
};

// Check collisions between player and pickups
export const checkPlayerPickupCollisions = (
  player: Player, 
  pickups: Pickup[]
): string[] => {
  // Expand player hitbox for pickups to make collection easier
  const expandedPlayer = {
    x: player.x - 120, // Greatly increased from 40 to 120
    y: player.y - 120, // Greatly increased from 40 to 120
    width: player.width + 240, // Greatly increased from 80 to 240
    height: player.height + 240 // Greatly increased from 80 to 240
  };
  
  return pickups
    .filter(pickup => checkCollision(expandedPlayer, pickup))
    .map(pickup => pickup.id);
};

// Calculate distance between two points
export const getDistance = (
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};