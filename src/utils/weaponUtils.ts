import { Weapon, CharacterClass, WeaponType, Projectile, Player, Enemy } from '../types/game';
import { useGameStore } from '../store/gameStore';

// Generate starting weapons based on character class
export const getStartingWeapons = (characterClass: CharacterClass): Weapon[] => {
  switch (characterClass) {
    case 'warrior':
      return [{
        id: 'weapon-sword',
        name: '剣',
        type: 'knife',
        damage: 10,
        cooldown: 300, // Reduced from 600 to 300
        lastFired: 0,
        level: 1,
        projectileSpeed: 300,
        projectileSize: 16,
        passthrough: false
      }];
    
    case 'mage':
      return [{
        id: 'weapon-wand',
        name: '魔法の杖',
        type: 'wand',
        damage: 8,
        cooldown: 250, // Reduced from 500 to 250
        lastFired: 0,
        level: 1,
        projectileSpeed: 350,
        projectileSize: 12,
        passthrough: false
      }];
    
    case 'rogue':
      return [{
        id: 'weapon-dagger',
        name: '投げナイフ',
        type: 'knife',
        damage: 6,
        cooldown: 200, // Reduced from 400 to 200
        lastFired: 0,
        level: 1,
        projectileSpeed: 400,
        projectileSize: 10,
        passthrough: false,
        count: 2
      }];
    
    case 'necromancer':
      return [{
        id: 'weapon-whip',
        name: '闇の鞭',
        type: 'whip',
        damage: 12,
        cooldown: 350, // Reduced from 700 to 350
        lastFired: 0,
        level: 1,
        area: 100,
        duration: 300
      }];
    
    default:
      return [{
        id: 'weapon-basic',
        name: '基本武器',
        type: 'knife',
        damage: 5,
        cooldown: 300, // Reduced from 600 to 300
        lastFired: 0,
        level: 1,
        projectileSpeed: 250,
        projectileSize: 12,
        passthrough: false
      }];
  }
};

// Fire projectiles based on weapon type
export const fireWeapon = (weapon: Weapon, player: Player, enemies: Enemy[]): Projectile[] => {
  const projectiles: Projectile[] = [];
  const now = Date.now();
  
  // Check if weapon is on cooldown
  if (now - weapon.lastFired < weapon.cooldown) {
    return [];
  }
  
  // Handle different weapon types
  switch (weapon.type) {
    case 'knife':
      // Get direction from player's last known direction or current direction
      let direction = { x: 0, y: -1 }; // Default up
      
      if (player.lastDirection) {
        // Use last swipe direction if available
        direction = { ...player.lastDirection };
      } else if (player.direction !== 'idle') {
        // Otherwise use the direction the player is moving
        if (player.direction === 'right') direction = { x: 1, y: 0 };
        else if (player.direction === 'left') direction = { x: -1, y: 0 };
        else if (player.direction === 'down') direction = { x: 0, y: 1 };
        else if (player.direction === 'up') direction = { x: 0, y: -1 };
      }
      
      // Handle multiple projectiles if count is specified
      const count = weapon.count || 1;
      const spread = 0.2; // Angle spread between multiple projectiles
      
      for (let i = 0; i < count; i++) {
        let projectileDirection = { ...direction };
        
        // Add spread for multiple projectiles
        if (count > 1) {
          const angle = -spread * (count - 1) / 2 + i * spread;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          projectileDirection = {
            x: direction.x * cos - direction.y * sin,
            y: direction.x * sin + direction.y * cos
          };
        }
        
        projectiles.push({
          id: `proj-${weapon.id}-${now}-${i}`,
          x: player.x + player.width / 2 - (weapon.projectileSize || 8) / 2,
          y: player.y + player.height / 2 - (weapon.projectileSize || 8) / 2,
          width: weapon.projectileSize || 16,
          height: weapon.projectileSize || 16,
          speed: weapon.projectileSpeed || 300,
          damage: weapon.damage,
          direction: projectileDirection,
          weaponType: weapon.type,
          duration: 2000,
          createdAt: now,
          passthrough: weapon.passthrough || false,
          hitEnemies: []
        });
      }
      break;
    
    case 'axe':
      // Axe is a spinning projectile that returns to player
      projectiles.push({
        id: `proj-${weapon.id}-${now}`,
        x: player.x + player.width / 2 - (weapon.projectileSize || 24) / 2,
        y: player.y + player.height / 2 - (weapon.projectileSize || 24) / 2,
        width: weapon.projectileSize || 24,
        height: weapon.projectileSize || 24,
        speed: weapon.projectileSpeed || 250,
        damage: weapon.damage,
        direction: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
        weaponType: weapon.type,
        duration: 3000,
        createdAt: now,
        passthrough: true,
        hitEnemies: []
      });
      break;
    
    case 'wand':
      // Wand targets the nearest enemy
      if (enemies.length > 0) {
        // Find the closest enemy
        let closest = enemies[0];
        let closestDistance = Math.hypot(
          closest.x - player.x,
          closest.y - player.y
        );
        
        for (let i = 1; i < enemies.length; i++) {
          const distance = Math.hypot(
            enemies[i].x - player.x,
            enemies[i].y - player.y
          );
          
          if (distance < closestDistance) {
            closest = enemies[i];
            closestDistance = distance;
          }
        }
        
        // Calculate direction to the closest enemy
        const dx = closest.x - player.x;
        const dy = closest.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDirection = {
          x: dx / distance,
          y: dy / distance
        };
        
        projectiles.push({
          id: `proj-${weapon.id}-${now}`,
          x: player.x + player.width / 2 - (weapon.projectileSize || 12) / 2,
          y: player.y + player.height / 2 - (weapon.projectileSize || 12) / 2,
          width: weapon.projectileSize || 12,
          height: weapon.projectileSize || 12,
          speed: weapon.projectileSpeed || 350,
          damage: weapon.damage,
          direction: normalizedDirection,
          weaponType: weapon.type,
          duration: 2000,
          createdAt: now,
          passthrough: weapon.passthrough || false,
          hitEnemies: []
        });
      }
      break;
    
    case 'whip':
      // Whip creates an area of effect attack in front of the player
      let whipDirection = { x: 0, y: -1 }; // Default up
      
      if (player.lastDirection) {
        // Use last swipe direction if available
        whipDirection = { ...player.lastDirection };
      } else if (player.direction !== 'idle') {
        // Otherwise use the direction the player is moving
        if (player.direction === 'right') whipDirection = { x: 1, y: 0 };
        else if (player.direction === 'left') whipDirection = { x: -1, y: 0 };
        else if (player.direction === 'down') whipDirection = { x: 0, y: 1 };
        else if (player.direction === 'up') whipDirection = { x: 0, y: -1 };
      }
      
      const whipArea = weapon.area || 100;
      
      projectiles.push({
        id: `proj-${weapon.id}-${now}`,
        x: player.x + player.width / 2 + whipDirection.x * player.width / 2,
        y: player.y + player.height / 2 + whipDirection.y * player.height / 2,
        width: whipArea,
        height: whipArea,
        speed: 0, // Doesn't move
        damage: weapon.damage,
        direction: whipDirection,
        weaponType: weapon.type,
        duration: weapon.duration || 300,
        createdAt: now,
        passthrough: true,
        hitEnemies: []
      });
      break;
    
    case 'bible':
      // Bible creates orbiting projectiles around the player
      const bibleCount = weapon.level + 1; // Number of orbiting projectiles
      const radius = 60; // Distance from player
      
      for (let i = 0; i < bibleCount; i++) {
        const angle = (i / bibleCount) * Math.PI * 2 + now / 1000; // Rotate over time
        
        projectiles.push({
          id: `proj-${weapon.id}-${now}-${i}`,
          x: player.x + player.width / 2 + Math.cos(angle) * radius - (weapon.projectileSize || 16) / 2,
          y: player.y + player.height / 2 + Math.sin(angle) * radius - (weapon.projectileSize || 16) / 2,
          width: weapon.projectileSize || 16,
          height: weapon.projectileSize || 16,
          speed: 0, // Doesn't move independently, moves with player
          damage: weapon.damage,
          direction: { x: 0, y: 0 },
          weaponType: weapon.type,
          duration: 500, // Short duration, will be recreated continuously
          createdAt: now,
          passthrough: true,
          hitEnemies: []
        });
      }
      break;
    
    case 'garlic':
      // Garlic creates an aura around the player
      projectiles.push({
        id: `proj-${weapon.id}-${now}`,
        x: player.x + player.width / 2 - (weapon.area || 100) / 2,
        y: player.y + player.height / 2 - (weapon.area || 100) / 2,
        width: weapon.area || 100,
        height: weapon.area || 100,
        speed: 0, // Doesn't move, follows player
        damage: weapon.damage,
        direction: { x: 0, y: 0 },
        weaponType: weapon.type,
        duration: 1000, // Continuous damage
        createdAt: now,
        passthrough: true,
        hitEnemies: []
      });
      break;
  }
  
  // Update weapon's last fired time
  useGameStore.setState(state => ({
    player: {
      ...state.player,
      weapons: state.player.weapons.map(w => 
        w.id === weapon.id ? { ...w, lastFired: now } : w
      )
    }
  }));
  
  return projectiles;
};

// Get weapon display name
export const getWeaponDisplayName = (type: WeaponType): string => {
  switch (type) {
    case 'knife': return '投げナイフ';
    case 'axe': return '斧';
    case 'wand': return '魔法の杖';
    case 'whip': return '鞭';
    case 'bible': return '聖書';
    case 'garlic': return 'ニンニク';
    default: return '不明な武器';
  }
};

// Get weapon description
export const getWeaponDescription = (type: WeaponType, level: number): string => {
  switch (type) {
    case 'knife':
      return level === 1 
        ? '直線的に飛ぶ基本的な投げナイフ' 
        : `レベル${level}のナイフ - ダメージと速度が向上`;
    
    case 'axe':
      return level === 1 
        ? '複数の敵にヒットできる回転斧' 
        : `レベル${level}の斧 - サイズとダメージが向上`;
    
    case 'wand':
      return level === 1 
        ? '最も近い敵を狙う魔法の杖' 
        : `レベル${level}の杖 - 攻撃速度とダメージが向上`;
    
    case 'whip':
      return level === 1 
        ? '前方の敵にダメージを与える鞭' 
        : `レベル${level}の鞭 - 範囲とダメージが向上`;
    
    case 'bible':
      return level === 1 
        ? '周囲を回転し、敵にダメージを与える聖書' 
        : `レベル${level}の聖書 - ${level + 1}個の軌道を描く`;
    
    case 'garlic':
      return level === 1 
        ? '周囲にダメージを与えるオーラを作り出す' 
        : `レベル${level}のニンニク - 範囲とダメージが向上`;
    
    default:
      return '不明な武器';
  }
};