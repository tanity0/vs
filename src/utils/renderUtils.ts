import { Player, Enemy, Projectile, Pickup, WeaponType, EnemyType } from '../types/game';
import { getEnemyColor } from './enemyUtils';

interface RenderProps {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  width: number;
  height: number;
  camera: {
    x: number;
    y: number;
  };
}

// Main render function
export const renderGame = (
  ctx: CanvasRenderingContext2D,
  { player, enemies, projectiles, pickups, width, height, camera }: RenderProps
) => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background
  drawBackground(ctx, width, height, camera);
  
  // Draw touch swipe guide for mobile
  if (window.innerWidth < 768) {
    drawSwipeGuide(ctx, width, height);
  }
  
  // Draw pickups
  pickups.forEach(pickup => drawPickup(ctx, pickup, camera));
  
  // Draw enemies
  enemies.forEach(enemy => drawEnemy(ctx, enemy, camera));
  
  // Draw projectiles
  projectiles.forEach(projectile => drawProjectile(ctx, projectile, camera));
  
  // Draw player
  drawPlayer(ctx, player, camera);
};

// Draw background
const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: {
    x: number;
    y: number;
  }
) => {
  // Draw grid
  ctx.strokeStyle = 'rgba(50, 50, 60, 0.2)';
  ctx.lineWidth = 1;
  
  const gridSize = 50;
  
  // Calculate grid offset based on camera position
  const offsetX = camera.x % gridSize;
  const offsetY = camera.y % gridSize;
  
  // Vertical lines
  for (let x = -offsetX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = -offsetY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

// Draw swipe guide on first few seconds of mobile game
const drawSwipeGuide = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // Only show guide for first 5 seconds
  if (Date.now() % 10000 < 5000) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.15;
    
    // Draw semi-transparent circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw arrows indicating swipe directions
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    
    // Draw animated arrows based on time
    const time = Date.now() / 500;
    const directions = [
      { x: Math.cos(time), y: Math.sin(time) },
      { x: Math.cos(time + Math.PI), y: Math.sin(time + Math.PI) }
    ];
    
    directions.forEach(dir => {
      const startX = centerX;
      const startY = centerY;
      const endX = centerX + dir.x * radius * 0.8;
      const endY = centerY + dir.y * radius * 0.8;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Draw arrowhead
      const arrowSize = 8;
      const angle = Math.atan2(dir.y, dir.x);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });
    
    // Add text guide
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('スワイプして移動', centerX, centerY + radius + 20);
  }
};

// Draw player
const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: {
    x: number;
    y: number;
  }
) => {
  // If player is invulnerable, draw with transparency
  if (player.invulnerable) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 50);
  }
  
  // Draw player body
  ctx.fillStyle = '#8B5CF6'; // Primary purple
  ctx.beginPath();
  ctx.arc(
    player.x + player.width / 2 - camera.x,
    player.y + player.height / 2 - camera.y,
    player.width / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Draw player direction indicator
  ctx.fillStyle = '#F3F4F6';
  
  const indicatorSize = player.width / 4;
  const centerX = player.x + player.width / 2 - camera.x;
  const centerY = player.y + player.height / 2 - camera.y;
  const distance = player.width / 2 - indicatorSize / 2;
  
  let indicatorX = centerX;
  let indicatorY = centerY;
  
  switch (player.direction) {
    case 'up':
      indicatorY = centerY - distance;
      break;
    case 'down':
      indicatorY = centerY + distance;
      break;
    case 'left':
      indicatorX = centerX - distance;
      break;
    case 'right':
      indicatorX = centerX + distance;
      break;
  }
  
  if (player.direction !== 'idle') {
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Reset alpha
  ctx.globalAlpha = 1;
};

// Draw enemy
const drawEnemy = (
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camera: {
    x: number;
    y: number;
  }
) => {
  // Get enemy color based on type
  const color = getEnemyColor(enemy.type);
  
  // Draw enemy body
  ctx.fillStyle = color;
  
  // Different shapes for different enemy types
  switch (enemy.type) {
    case 'basic':
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 - camera.x,
        enemy.y + enemy.height / 2 - camera.y,
        enemy.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
    
    case 'fast':
      // Triangle shape for fast enemies
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2 - camera.x, enemy.y - camera.y);
      ctx.lineTo(enemy.x + enemy.width - camera.x, enemy.y + enemy.height - camera.y);
      ctx.lineTo(enemy.x - camera.x, enemy.y + enemy.height - camera.y);
      ctx.closePath();
      ctx.fill();
      break;
    
    case 'tank':
      // Square shape for tank enemies
      ctx.fillRect(enemy.x - camera.x, enemy.y - camera.y, enemy.width, enemy.height);
      break;
    
    case 'ranged':
      // Diamond shape for ranged enemies
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2 - camera.x, enemy.y - camera.y);
      ctx.lineTo(enemy.x + enemy.width - camera.x, enemy.y + enemy.height / 2 - camera.y);
      ctx.lineTo(enemy.x + enemy.width / 2 - camera.x, enemy.y + enemy.height - camera.y);
      ctx.lineTo(enemy.x - camera.x, enemy.y + enemy.height / 2 - camera.y);
      ctx.closePath();
      ctx.fill();
      break;
    
    case 'boss':
      // Star shape for boss enemies
      const centerX = enemy.x + enemy.width / 2 - camera.x;
      const centerY = enemy.y + enemy.height / 2 - camera.y;
      const outerRadius = enemy.width / 2;
      const innerRadius = enemy.width / 4;
      const spikes = 8;
      
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / spikes;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      break;
    
    default:
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 - camera.x,
        enemy.y + enemy.height / 2 - camera.y,
        enemy.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
  }
  
  // Draw health bar
  const healthBarWidth = enemy.width;
  const healthBarHeight = 4;
  const healthPercent = enemy.health / enemy.maxHealth;
  
  // Health bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(
    enemy.x - camera.x,
    enemy.y - healthBarHeight - 2 - camera.y,
    healthBarWidth,
    healthBarHeight
  );
  
  // Health bar fill
  ctx.fillStyle = enemy.health < enemy.maxHealth * 0.3 ? '#EF4444' : '#10B981';
  ctx.fillRect(
    enemy.x - camera.x,
    enemy.y - healthBarHeight - 2 - camera.y,
    healthBarWidth * healthPercent,
    healthBarHeight
  );
  
  // If enemy was hit recently, add hit flash effect
  if (Date.now() - enemy.lastHit < 100) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    switch (enemy.type) {
      case 'basic':
        ctx.beginPath();
        ctx.arc(
          enemy.x + enemy.width / 2 - camera.x,
          enemy.y + enemy.height / 2 - camera.y,
          enemy.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        break;
      
      case 'fast':
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2 - camera.x, enemy.y - camera.y);
        ctx.lineTo(enemy.x + enemy.width - camera.x, enemy.y + enemy.height - camera.y);
        ctx.lineTo(enemy.x - camera.x, enemy.y + enemy.height - camera.y);
        ctx.closePath();
        ctx.fill();
        break;
      
      case 'tank':
        ctx.fillRect(enemy.x - camera.x, enemy.y - camera.y, enemy.width, enemy.height);
        break;
      
      case 'ranged':
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2 - camera.x, enemy.y - camera.y);
        ctx.lineTo(enemy.x + enemy.width - camera.x, enemy.y + enemy.height / 2 - camera.y);
        ctx.lineTo(enemy.x + enemy.width / 2 - camera.x, enemy.y + enemy.height - camera.y);
        ctx.lineTo(enemy.x - camera.x, enemy.y + enemy.height / 2 - camera.y);
        ctx.closePath();
        ctx.fill();
        break;
      
      case 'boss':
        ctx.beginPath();
        ctx.arc(
          enemy.x + enemy.width / 2 - camera.x,
          enemy.y + enemy.height / 2 - camera.y,
          enemy.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        break;
    }
  }
};

// Draw projectile
const drawProjectile = (
  ctx: CanvasRenderingContext2D,
  projectile: Projectile,
  camera: {
    x: number;
    y: number;
  }
) => {
  // Different colors and shapes based on weapon type
  switch (projectile.weaponType) {
    case 'knife':
      // Knife - elongated shape
      ctx.fillStyle = '#E5E7EB';
      
      // Rotate based on direction
      const angle = Math.atan2(projectile.direction.y, projectile.direction.x);
      
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(angle);
      
      // Draw knife shape
      ctx.fillRect(
        -projectile.width / 2,
        -projectile.height / 4,
        projectile.width,
        projectile.height / 2
      );
      
      ctx.restore();
      break;
    
    case 'axe':
      // Axe - spinning shape
      ctx.fillStyle = '#A78BFA';
      
      // Spinning animation
      const rotationSpeed = 0.01;
      const rotationAngle = (Date.now() * rotationSpeed) % (Math.PI * 2);
      
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(rotationAngle);
      
      // Draw axe shape
      ctx.beginPath();
      ctx.moveTo(0, -projectile.height / 2);
      ctx.lineTo(projectile.width / 2, 0);
      ctx.lineTo(0, projectile.height / 2);
      ctx.lineTo(-projectile.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      break;
    
    case 'wand':
      // Magic wand - glowing orb
      const gradient = ctx.createRadialGradient(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        0,
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        projectile.width / 2
      );
      
      gradient.addColorStop(0, '#F9A8D4');
      gradient.addColorStop(1, '#A78BFA');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        projectile.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = '#F9A8D4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        projectile.width / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    
    case 'whip':
      // Whip - arc shape
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 3;
      
      // Animate whip by changing its length over time
      const progress = Math.min(1, (Date.now() - projectile.createdAt) / 200);
      const whipLength = projectile.width * progress;
      
      // Draw arc in the direction of the attack
      ctx.beginPath();
      
      const centerX = projectile.x + projectile.width / 2 - camera.x;
      const centerY = projectile.y + projectile.height / 2 - camera.y;
      
      const arcStartAngle = Math.atan2(projectile.direction.y, projectile.direction.x) - Math.PI / 3;
      const arcEndAngle = Math.atan2(projectile.direction.y, projectile.direction.x) + Math.PI / 3;
      
      ctx.arc(centerX, centerY, whipLength / 2, arcStartAngle, arcEndAngle);
      ctx.stroke();
      break;
    
    case 'bible':
      // Bible - rotating square
      ctx.fillStyle = '#FBBF24';
      
      const bibleRotation = (Date.now() * 0.005) % (Math.PI * 2);
      
      ctx.save();
      ctx.translate(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y
      );
      ctx.rotate(bibleRotation);
      
      ctx.fillRect(
        -projectile.width / 2,
        -projectile.height / 2,
        projectile.width,
        projectile.height
      );
      
      // Add cross design
      ctx.fillStyle = '#F3F4F6';
      const crossWidth = projectile.width * 0.2;
      const crossHeight = projectile.height * 0.6;
      
      ctx.fillRect(
        -crossWidth / 2,
        -crossHeight / 2,
        crossWidth,
        crossHeight
      );
      
      ctx.fillRect(
        -crossHeight / 2,
        -crossWidth / 2,
        crossHeight,
        crossWidth
      );
      
      ctx.restore();
      break;
    
    case 'garlic':
      // Garlic - pulsing circle aura
      const pulseRate = 0.003;
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() * pulseRate);
      const radius = (projectile.width / 2) * pulse;
      
      const garlicGradient = ctx.createRadialGradient(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        0,
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        radius
      );
      
      garlicGradient.addColorStop(0, 'rgba(109, 40, 217, 0.2)');
      garlicGradient.addColorStop(0.7, 'rgba(109, 40, 217, 0.1)');
      garlicGradient.addColorStop(1, 'rgba(109, 40, 217, 0)');
      
      ctx.fillStyle = garlicGradient;
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.width / 2 - camera.x,
        projectile.y + projectile.height / 2 - camera.y,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
    
    default:
      // Default projectile
      ctx.fillStyle = '#F3F4F6';
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
};

// Draw pickup
const drawPickup = (
  ctx: CanvasRenderingContext2D,
  pickup: Pickup,
  camera: {
    x: number;
    y: number;
  }
) => {
  const centerX = pickup.x + 8 - camera.x;
  const centerY = pickup.y + 8 - camera.y;
  const size = 16;
  
  // Draw different pickup types
  switch (pickup.type) {
    case 'experience':
      // Experience gem
      ctx.fillStyle = '#10B981';
      
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(centerX, pickup.y - camera.y);
      ctx.lineTo(pickup.x + size - camera.x, centerY);
      ctx.lineTo(centerX, pickup.y + size - camera.y);
      ctx.lineTo(pickup.x - camera.x, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Add shimmer effect
      const shimmerOpacity = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.fillStyle = `rgba(243, 244, 246, ${shimmerOpacity})`;
      
      ctx.beginPath();
      ctx.moveTo(centerX, pickup.y + 4 - camera.y);
      ctx.lineTo(pickup.x + size - 4 - camera.x, centerY);
      ctx.lineTo(centerX, pickup.y + size - 4 - camera.y);
      ctx.lineTo(pickup.x + 4 - camera.x, centerY);
      ctx.closePath();
      ctx.fill();
      break;
    
    case 'health':
      // Health potion
      ctx.fillStyle = '#EF4444';
      
      // Rounded rectangle for bottle
      const bottleWidth = 10;
      const bottleHeight = 14;
      const bottleX = centerX - bottleWidth / 2;
      const bottleY = centerY - bottleHeight / 2;
      
      ctx.beginPath();
      ctx.moveTo(bottleX + 3, bottleY);
      ctx.lineTo(bottleX + bottleWidth - 3, bottleY);
      ctx.quadraticCurveTo(bottleX + bottleWidth, bottleY, bottleX + bottleWidth, bottleY + 3);
      ctx.lineTo(bottleX + bottleWidth, bottleY + bottleHeight - 3);
      ctx.quadraticCurveTo(bottleX + bottleWidth, bottleY + bottleHeight, bottleX + bottleWidth - 3, bottleY + bottleHeight);
      ctx.lineTo(bottleX + 3, bottleY + bottleHeight);
      ctx.quadraticCurveTo(bottleX, bottleY + bottleHeight, bottleX, bottleY + bottleHeight - 3);
      ctx.lineTo(bottleX, bottleY + 3);
      ctx.quadraticCurveTo(bottleX, bottleY, bottleX + 3, bottleY);
      ctx.closePath();
      ctx.fill();
      
      // Bottle neck
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(centerX - 2, bottleY - 3, 4, 3);
      
      // Cross symbol
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX - 3, centerY);
      ctx.lineTo(centerX + 3, centerY);
      ctx.moveTo(centerX, centerY - 3);
      ctx.lineTo(centerX, centerY + 3);
      ctx.stroke();
      break;
    
    case 'magnet':
      // Magnet
      ctx.fillStyle = '#3B82F6';
      
      // Horseshoe magnet shape
      ctx.beginPath();
      ctx.moveTo(centerX - 5, centerY - 5);
      ctx.lineTo(centerX - 5, centerY + 5);
      ctx.quadraticCurveTo(centerX, centerY + 8, centerX + 5, centerY + 5);
      ctx.lineTo(centerX + 5, centerY - 5);
      ctx.stroke();
      
      // Magnet poles
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(centerX - 7, centerY - 7, 4, 4);
      
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(centerX + 3, centerY - 7, 4, 4);
      break;
  }
  
  // Add floating animation
  const floatOffset = Math.sin(Date.now() / 300) * 2;
  ctx.save();
  ctx.translate(0, floatOffset);
  
  // Add subtle glow
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 5;
  
  ctx.restore();
};

// Format time (seconds to MM:SS)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};