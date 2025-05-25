import { create } from 'zustand';
import { generateUpgradeOptions } from '../utils/upgradeUtils';
import { 
  Player, Enemy, Projectile, Pickup, GameStats, 
  InputState, UpgradeOption, GameBounds, CharacterClass
} from '../types/game';
import { getStartingWeapons } from '../utils/weaponUtils';

interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  gameTime: number;
  isPaused: boolean;
  showUpgradeMenu: boolean;
  upgradeOptions: UpgradeOption[];
  inputState: InputState;
  swipeDirection: { x: number; y: number } | null;
  gameBounds: GameBounds;
  gameStats: GameStats;
  characterClass: CharacterClass;
  camera: {
    x: number;
    y: number;
  };
  
  // Player actions
  movePlayer: (input: InputState, deltaTime: number) => void;
  setSwipeDirection: (direction: { x: number; y: number } | null) => void;
  setLastDirection: (direction: { x: number; y: number } | null) => void;
  damagePlayer: (amount: number) => boolean;
  gainExperience: (amount: number) => void;
  levelUp: () => void;
  
  // Weapon actions
  fireWeapons: (currentTime: number) => void;
  selectUpgrade: (upgrade: UpgradeOption) => void;
  
  // Enemy actions
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, amount: number) => boolean;
  updateEnemies: (deltaTime: number) => void;
  
  // Projectile actions
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  updateProjectiles: (deltaTime: number) => void;
  
  // Pickup actions
  addPickup: (pickup: Pickup) => void;
  removePickup: (id: string) => void;
  collectPickup: (id: string) => void;
  
  // Game state actions
  setGameTime: (time: number) => void;
  setPaused: (paused: boolean) => void;
  setGameBounds: (bounds: GameBounds) => void;
  updateGameStats: (stats: Partial<GameStats>) => void;
  resetGame: (characterClass: string) => void;
  setCameraPosition: (x: number, y: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  player: {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    speed: 200,
    health: 100,
    maxHealth: 100,
    experience: 0,
    level: 1,
    experienceToNextLevel: 10,
    weapons: [],
    characterClass: 'warrior',
    direction: 'idle',
    isMoving: false,
    invulnerable: false,
    invulnerableTime: 0,
    lastDirection: null
  },
  enemies: [],
  projectiles: [],
  pickups: [],
  gameTime: 0,
  isPaused: false,
  showUpgradeMenu: false,
  upgradeOptions: [],
  inputState: { up: false, down: false, left: false, right: false },
  swipeDirection: null,
  gameBounds: { width: 800, height: 600 },
  gameStats: {
    timeAlive: 0,
    enemiesKilled: 0,
    damageDealt: 0,
    experienceCollected: 0,
    maxLevel: 1
  },
  characterClass: 'warrior',
  camera: {
    x: 0,
    y: 0
  },
  
  // Player actions
  movePlayer: (input, deltaTime) => {
    set(state => {
      const { player, gameBounds, swipeDirection } = state;
      let newX = player.x;
      let newY = player.y;
      let direction = 'idle';
      let isMoving = false;
      let lastDirection = player.lastDirection;
      
      // Handle movement based on input state (keyboard) or swipe direction (touch)
      if (swipeDirection) {
        // Move based on swipe direction
        newX += swipeDirection.x * player.speed * deltaTime;
        newY += swipeDirection.y * player.speed * deltaTime;
        
        // Set dominant direction for animation
        const absX = Math.abs(swipeDirection.x);
        const absY = Math.abs(swipeDirection.y);
        
        if (absX > absY) {
          direction = swipeDirection.x > 0 ? 'right' : 'left';
        } else {
          direction = swipeDirection.y > 0 ? 'down' : 'up';
        }
        
        isMoving = true;
        // Update last direction when moving
        lastDirection = { ...swipeDirection };
      } else {
        // Traditional directional movement
        let dirX = 0;
        let dirY = 0;
        
        if (input.up) {
          newY -= player.speed * deltaTime;
          direction = 'up';
          isMoving = true;
          dirY = -1;
        }
        if (input.down) {
          newY += player.speed * deltaTime;
          direction = 'down';
          isMoving = true;
          dirY = 1;
        }
        if (input.left) {
          newX -= player.speed * deltaTime;
          direction = 'left';
          isMoving = true;
          dirX = -1;
        }
        if (input.right) {
          newX += player.speed * deltaTime;
          direction = 'right';
          isMoving = true;
          dirX = 1;
        }
        
        // Update last direction when moving with keyboard
        if (isMoving) {
          // Normalize the direction vector
          const length = Math.sqrt(dirX * dirX + dirY * dirY);
          if (length > 0) {
            lastDirection = {
              x: dirX / length,
              y: dirY / length
            };
          }
        }
      }
      
      // Ensure player stays within bounds
      newX = Math.max(0, Math.min(gameBounds.width * 1.5 - player.width, newX));
      newY = Math.max(0, Math.min(gameBounds.height * 1.5 - player.height, newY));
      
      return {
        player: {
          ...player,
          x: newX,
          y: newY,
          direction: direction as any,
          isMoving,
          lastDirection
        }
      };
    });
  },
  
  setSwipeDirection: (direction) => {
    set({ swipeDirection: direction });
  },

  setLastDirection: (direction) => {
    set(state => ({
      player: {
        ...state.player,
        lastDirection: direction
      }
    }));
  },
  
  damagePlayer: (amount) => {
    const { player } = get();
    
    if (player.invulnerable) return false;
    
    set(state => {
      const newHealth = Math.max(0, state.player.health - amount);
      return {
        player: {
          ...state.player,
          health: newHealth,
          invulnerable: true,
          invulnerableTime: Date.now()
        }
      };
    });
    
    // Return whether player is dead
    return get().player.health <= 0;
  },
  
  gainExperience: (amount) => {
    set(state => {
      const { player, gameStats } = state;
      const newExperience = player.experience + amount;
      const newExpCollected = gameStats.experienceCollected + amount;
      
      // Log for debugging
      console.log(`Gained ${amount} experience, total: ${newExperience}`);
      
      return {
        player: {
          ...player,
          experience: newExperience,
        },
        gameStats: {
          ...gameStats,
          experienceCollected: newExpCollected
        }
      };
    });
    
    // Check if player should level up
    const { player } = get();
    if (player.experience >= player.experienceToNextLevel) {
      get().levelUp();
    }
  },
  
  levelUp: () => {
    set(state => {
      const { player } = state;
      const newLevel = player.level + 1;
      const newExpToNextLevel = Math.floor(player.experienceToNextLevel * 1.4);
      
      // Generate upgrade options when leveling up
      const upgradeOptions = generateUpgradeOptions(player);
      
      // Update max level in stats if needed
      const newMaxLevel = Math.max(state.gameStats.maxLevel, newLevel);
      
      return {
        player: {
          ...player,
          level: newLevel,
          experienceToNextLevel: newExpToNextLevel,
          experience: 0
        },
        showUpgradeMenu: true,
        upgradeOptions,
        isPaused: true,
        gameStats: {
          ...state.gameStats,
          maxLevel: newMaxLevel
        }
      };
    });
  },
  
  // Weapon actions
  fireWeapons: (currentTime) => {
    const { player, enemies } = get();
    
    player.weapons.forEach(weapon => {
      if (currentTime - weapon.lastFired >= weapon.cooldown) {
        // Logic to create projectiles based on weapon type will go here
        // We'll implement this in weaponUtils.ts
        
        set(state => ({
          player: {
            ...state.player,
            weapons: state.player.weapons.map(w => 
              w.id === weapon.id ? { ...w, lastFired: currentTime } : w
            )
          }
        }));
      }
    });
  },
  
  selectUpgrade: (upgrade) => {
    set(state => {
      const { player } = state;
      
      // Handle weapon upgrades
      if (upgrade.type === 'weapon' && upgrade.weaponType) {
        const existingWeapon = player.weapons.find(w => w.type === upgrade.weaponType);
        
        if (existingWeapon) {
          // Upgrade existing weapon
          return {
            player: {
              ...player,
              weapons: player.weapons.map(w => 
                w.id === existingWeapon.id 
                  ? { ...w, level: w.level + 1, damage: w.damage * 1.2 } 
                  : w
              )
            },
            showUpgradeMenu: false,
            isPaused: false
          };
        } else {
          // Add new weapon
          const newWeapon = {
            id: `weapon-${Date.now()}`,
            name: upgrade.name,
            type: upgrade.weaponType,
            damage: 10,
            cooldown: 1000,
            lastFired: 0,
            level: 1,
            projectileSpeed: 300,
            projectileSize: 16,
            passthrough: false
          };
          
          return {
            player: {
              ...player,
              weapons: [...player.weapons, newWeapon]
            },
            showUpgradeMenu: false,
            isPaused: false
          };
        }
      }
      
      // Handle passive upgrades
      if (upgrade.type === 'passive' && upgrade.passiveType) {
        let updatedPlayer = { ...player };
        
        switch (upgrade.passiveType) {
          case 'maxHealth':
            updatedPlayer.maxHealth += 20;
            updatedPlayer.health = Math.min(updatedPlayer.health + 20, updatedPlayer.maxHealth);
            break;
          case 'speed':
            updatedPlayer.speed += 20;
            break;
          default:
            // Other passive upgrades will be handled in weaponUtils.ts
            break;
        }
        
        return {
          player: updatedPlayer,
          showUpgradeMenu: false,
          isPaused: false
        };
      }
      
      return {
        showUpgradeMenu: false,
        isPaused: false
      };
    });
  },
  
  // Enemy actions
  addEnemy: (enemy) => {
    set(state => ({
      enemies: [...state.enemies, enemy]
    }));
  },
  
  removeEnemy: (id) => {
    set(state => ({
      enemies: state.enemies.filter(enemy => enemy.id !== id)
    }));
  },
  
  damageEnemy: (id, amount) => {
    let killed = false;
    
    set(state => {
      const { enemies, gameStats } = state;
      const enemy = enemies.find(e => e.id === id);
      
      if (!enemy) return { enemies };
      
      const newHealth = Math.max(0, enemy.health - amount);
      const updatedEnemies = enemies.map(e => 
        e.id === id ? { ...e, health: newHealth, lastHit: Date.now() } : e
      );
      
      // Check if enemy was killed
      if (newHealth === 0) {
        killed = true;
        
        // Update game stats
        const newStats = { 
          ...gameStats,
          enemiesKilled: gameStats.enemiesKilled + 1,
          damageDealt: gameStats.damageDealt + amount
        };
        
        return { 
          enemies: updatedEnemies.filter(e => e.id !== id),
          gameStats: newStats
        };
      }
      
      return { 
        enemies: updatedEnemies,
        gameStats: {
          ...gameStats,
          damageDealt: gameStats.damageDealt + amount
        }
      };
    });
    
    return killed;
  },
  
  updateEnemies: (deltaTime) => {
    set(state => {
      const { enemies, player, gameBounds } = state;
      
      const updatedEnemies = enemies.map(enemy => {
        // Calculate direction to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Move enemy towards player
        let newX = enemy.x + dirX * enemy.speed * deltaTime;
        let newY = enemy.y + dirY * enemy.speed * deltaTime;
        
        // Keep enemies within game bounds
        newX = Math.max(0, Math.min(gameBounds.width * 1.5 - enemy.width, newX));
        newY = Math.max(0, Math.min(gameBounds.height * 1.5 - enemy.height, newY));
        
        return {
          ...enemy,
          x: newX,
          y: newY
        };
      });
      
      return { enemies: updatedEnemies };
    });
  },
  
  // Projectile actions
  addProjectile: (projectile) => {
    set(state => ({
      projectiles: [...state.projectiles, projectile]
    }));
  },
  
  removeProjectile: (id) => {
    set(state => ({
      projectiles: state.projectiles.filter(p => p.id !== id)
    }));
  },
  
  updateProjectiles: (deltaTime) => {
    const currentTime = Date.now();
    
    set(state => {
      const { projectiles, gameBounds } = state;
      
      const updatedProjectiles = projectiles
        .filter(p => {
          // Remove expired projectiles
          if (currentTime - p.createdAt > p.duration) {
            return false;
          }
          
          // Remove projectiles out of bounds (with a larger buffer)
          const buffer = 100;
          if (
            p.x < -p.width - buffer || 
            p.x > gameBounds.width * 1.5 + buffer || 
            p.y < -p.height - buffer || 
            p.y > gameBounds.height * 1.5 + buffer
          ) {
            return false;
          }
          
          return true;
        })
        .map(p => {
          // Update projectile position
          const newX = p.x + p.direction.x * p.speed * deltaTime;
          const newY = p.y + p.direction.y * p.speed * deltaTime;
          
          return {
            ...p,
            x: newX,
            y: newY
          };
        });
      
      return { projectiles: updatedProjectiles };
    });
  },
  
  // Pickup actions
  addPickup: (pickup) => {
    set(state => ({
      pickups: [...state.pickups, pickup]
    }));
  },
  
  removePickup: (id) => {
    set(state => ({
      pickups: state.pickups.filter(p => p.id !== id)
    }));
  },
  
  collectPickup: (id) => {
    const { pickups } = get();
    const pickup = pickups.find(p => p.id === id);
    
    if (!pickup) return;
    
    switch (pickup.type) {
      case 'experience':
        get().gainExperience(pickup.value);
        break;
      case 'health':
        set(state => ({
          player: {
            ...state.player,
            health: Math.min(state.player.health + pickup.value, state.player.maxHealth)
          }
        }));
        break;
      case 'magnet':
        // Implement magnet logic later
        break;
    }
    
    get().removePickup(id);
  },
  
  // Game state actions
  setGameTime: (time) => {
    set({ gameTime: time });
  },
  
  setPaused: (paused) => {
    set({ isPaused: paused });
  },
  
  setGameBounds: (bounds) => {
    set({ gameBounds: bounds });
  },
  
  updateGameStats: (stats) => {
    set(state => ({
      gameStats: { ...state.gameStats, ...stats }
    }));
  },
  
  resetGame: (characterClass) => {
    const validClass = ['warrior', 'mage', 'rogue', 'necromancer'].includes(characterClass) 
      ? characterClass as CharacterClass 
      : 'warrior';
      
    const startingWeapons = getStartingWeapons(validClass);
    
    set(state => {
      // Set player to center of game bounds
      const centerX = state.gameBounds.width / 2 - 16; // 16 is half the player width
      const centerY = state.gameBounds.height / 2 - 16; // 16 is half the player height
      
      return {
        player: {
          x: centerX,
          y: centerY,
          width: 32,
          height: 32,
          speed: 200,
          health: 100,
          maxHealth: 100,
          experience: 0,
          level: 1,
          experienceToNextLevel: 10,
          weapons: startingWeapons,
          characterClass: validClass,
          direction: 'idle',
          isMoving: false,
          invulnerable: false,
          invulnerableTime: 0,
          lastDirection: null
        },
        enemies: [],
        projectiles: [],
        pickups: [],
        gameTime: 0,
        isPaused: false,
        showUpgradeMenu: false,
        upgradeOptions: [],
        swipeDirection: null,
        gameStats: {
          timeAlive: 0,
          enemiesKilled: 0,
          damageDealt: 0,
          experienceCollected: 0,
          maxLevel: 1
        },
        characterClass: validClass,
        camera: {
          x: 0,
          y: 0
        }
      };
    });
  },
  
  setCameraPosition: (x, y) => {
    set(state => {
      const { gameBounds } = state;
      
      // Limit camera to stay within bounds with a small buffer
      const maxX = Math.max(0, gameBounds.width * 0.5);
      const maxY = Math.max(0, gameBounds.height * 0.5);
      
      const clampedX = Math.max(0, Math.min(maxX, x));
      const clampedY = Math.max(0, Math.min(maxY, y));
      
      return {
        camera: { x: clampedX, y: clampedY }
      };
    });
  }
}));