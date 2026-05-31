import { create } from 'zustand';
import { generateUpgradeOptions } from '../utils/upgradeUtils';
import {
  Player, Enemy, Projectile, Pickup, GameStats,
  InputState, UpgradeOption, GameBounds, CharacterClass,
  Weapon, WeaponType
} from '../types/game';
import { getStartingWeapons, getWeaponDisplayName } from '../utils/weaponUtils';

// Stat templates for new weapons gained via level-up. Mirrors the starting
// weapon stats so a wand acquired mid-run isn't crippled compared to a
// wand started with.
const newWeaponTemplate = (type: WeaponType): Weapon => {
  const id = `weapon-${type}-${Date.now()}`;
  const name = getWeaponDisplayName(type);
  switch (type) {
    case 'whip':
      return { id, name, type, damage: 10, cooldown: 1200, lastFired: 0, level: 1, area: 120, duration: 220 };
    case 'wand':
      return { id, name, type, damage: 8, cooldown: 1100, lastFired: 0, level: 1, projectileSpeed: 360, projectileSize: 14, passthrough: false };
    case 'knife':
      return { id, name, type, damage: 7, cooldown: 700, lastFired: 0, level: 1, projectileSpeed: 420, projectileSize: 12, passthrough: false, count: 1 };
    case 'axe':
      return { id, name, type, damage: 14, cooldown: 1500, lastFired: 0, level: 1, projectileSpeed: 280, projectileSize: 22 };
    case 'bible':
      return { id, name, type, damage: 9, cooldown: 1800, lastFired: 0, level: 1, projectileSize: 18 };
    case 'garlic':
      return { id, name, type, damage: 4, cooldown: 800, lastFired: 0, level: 1, area: 110 };
    default:
      return { id, name, type, damage: 8, cooldown: 700, lastFired: 0, level: 1, projectileSpeed: 320, projectileSize: 14 };
  }
};

// Counter-on-release tuning. The counter window opens the moment the player
// lifts their finger (or presses Space on PC) and stays open briefly. Any
// hostile projectile that hits the player during the window is reflected.
export const COUNTER_WINDOW = 240; // ms the window stays open after trigger
export const COUNTER_COOLDOWN = 420; // ms between counters (anti-spam)
export const REFLECT_DAMAGE_MULTIPLIER = 2.5;
export const REFLECT_SPEED_MULTIPLIER = 1.4;

// Player base stats tuned to feel like Vampire Survivors' Antonio: slower
// than the previous build (so weapons matter more), modest HP, small body.
export const PLAYER_BASE_SPEED = 130;
export const PLAYER_BASE_HP = 120;
export const PLAYER_HITBOX = 28;
export const INVULN_MS = 700;

// World is effectively infinite. We still need a finite number for spawn
// math elsewhere, but we use a very large clamp to remove the wall feel.
export const WORLD_HALF_EXTENT = 200000;

// Magnet pickup pulls every XP gem to the player. Bomb clears every enemy
// currently on screen.
export const MAGNET_DURATION_MS = 1; // we just sweep the field once, no timer needed

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
  triggerCounter: () => void;
  
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
  reflectProjectile: (id: string, multiplier?: number) => void;
  
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
    width: PLAYER_HITBOX,
    height: PLAYER_HITBOX,
    speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HP,
    maxHealth: PLAYER_BASE_HP,
    experience: 0,
    level: 1,
    experienceToNextLevel: 5,
    weapons: [],
    characterClass: 'warrior',
    direction: 'idle',
    isMoving: false,
    invulnerable: false,
    invulnerableTime: 0,
    lastDirection: null,
    counterWindowEnd: 0,
    counterCooldownEnd: 0,
    lastCounterSuccessTime: 0
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
      const moveSpeed = player.speed;

      // Handle movement based on input state (keyboard) or swipe direction (touch)
      if (swipeDirection) {
        // Move based on swipe direction
        newX += swipeDirection.x * moveSpeed * deltaTime;
        newY += swipeDirection.y * moveSpeed * deltaTime;
        
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
          newY -= moveSpeed * deltaTime;
          direction = 'up';
          isMoving = true;
          dirY = -1;
        }
        if (input.down) {
          newY += moveSpeed * deltaTime;
          direction = 'down';
          isMoving = true;
          dirY = 1;
        }
        if (input.left) {
          newX -= moveSpeed * deltaTime;
          direction = 'left';
          isMoving = true;
          dirX = -1;
        }
        if (input.right) {
          newX += moveSpeed * deltaTime;
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
      
      // World is effectively infinite — no clamp. Mad Forest is open.
      void gameBounds;
      
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
  
  triggerCounter: () => {
    set(state => {
      const { player } = state;
      const now = Date.now();
      // Respect cooldown
      if (now < player.counterCooldownEnd) return {};
      return {
        player: {
          ...player,
          counterWindowEnd: now + COUNTER_WINDOW,
          counterCooldownEnd: now + COUNTER_WINDOW + COUNTER_COOLDOWN
        }
      };
    });
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
          invulnerable: amount > 0,
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
      // VS-style ramp: cheap levels early so the upgrade menu shows up often,
      // then progressively steeper. +2 per level for levels 1-9, then a
      // smaller multiplier afterward.
      const stepLinear = newLevel < 10 ? 2 : 0;
      const newExpToNextLevel = Math.floor(player.experienceToNextLevel * (newLevel < 10 ? 1.1 : 1.18) + stepLinear);
      
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
    const { player } = get();
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
          // Add new weapon. Use per-type templates so each weapon enters
          // play with sensible stats and behavior (whip = AoE slab,
          // wand = auto-target, axe = arc, etc.) rather than a knife-shaped
          // generic.
          const template = newWeaponTemplate(upgrade.weaponType);
          return {
            player: {
              ...player,
              weapons: [...player.weapons, template]
            },
            showUpgradeMenu: false,
            isPaused: false
          };
        }
      }
      
      // Handle passive upgrades. Player-stat passives mutate the player;
      // weapon-stat passives mutate every weapon's relevant field.
      if (upgrade.type === 'passive' && upgrade.passiveType) {
        const updatedPlayer = { ...player };
        switch (upgrade.passiveType) {
          case 'maxHealth':
            updatedPlayer.maxHealth += 20;
            updatedPlayer.health = Math.min(updatedPlayer.health + 20, updatedPlayer.maxHealth);
            break;
          case 'speed':
            updatedPlayer.speed = Math.round(updatedPlayer.speed * 1.1);
            break;
          case 'might':
            updatedPlayer.weapons = updatedPlayer.weapons.map(w => ({
              ...w, damage: w.damage * 1.1
            }));
            break;
          case 'area':
            updatedPlayer.weapons = updatedPlayer.weapons.map(w => ({
              ...w,
              area: w.area ? w.area * 1.1 : w.area,
              projectileSize: w.projectileSize ? w.projectileSize * 1.05 : w.projectileSize
            }));
            break;
          case 'cooldown':
            updatedPlayer.weapons = updatedPlayer.weapons.map(w => ({
              ...w, cooldown: Math.max(80, w.cooldown * 0.92)
            }));
            break;
          case 'duration':
            updatedPlayer.weapons = updatedPlayer.weapons.map(w => ({
              ...w, duration: w.duration ? w.duration * 1.15 : w.duration
            }));
            break;
          case 'amount':
            updatedPlayer.weapons = updatedPlayer.weapons.map(w => ({
              ...w, count: (w.count || 1) + 1
            }));
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
      const { enemies, player } = state;

      const updatedEnemies = enemies.map(enemy => {
        // Plants are nearly stationary — they shuffle slightly toward the
        // player but mostly hold ground and spit seeds. Everything else
        // does the standard VS straight-line chase.
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        const dirX = dx / distance;
        const dirY = dy / distance;

        const speed = enemy.type === 'plant' ? enemy.speed * 0.25 : enemy.speed;

        return {
          ...enemy,
          x: enemy.x + dirX * speed * deltaTime,
          y: enemy.y + dirY * speed * deltaTime
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

  reflectProjectile: (id, multiplier = REFLECT_DAMAGE_MULTIPLIER) => {
    set(state => ({
      projectiles: state.projectiles.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          direction: { x: -p.direction.x, y: -p.direction.y },
          speed: p.speed * REFLECT_SPEED_MULTIPLIER,
          damage: p.damage * multiplier,
          hostile: false,
          reflected: true,
          hitEnemies: [],
          createdAt: Date.now()
        };
      })
    }));
  },
  
  updateProjectiles: (deltaTime) => {
    const currentTime = Date.now();
    
    set(state => {
      const { projectiles, player, gameBounds } = state;

      const cullRadius = Math.max(gameBounds.width, gameBounds.height);
      const updatedProjectiles = projectiles
        .filter(p => {
          // Remove expired projectiles
          if (currentTime - p.createdAt > p.duration) {
            return false;
          }
          // Cull projectiles that drift far from the camera (world is
          // effectively infinite so we can't use absolute bounds).
          const dx = p.x - player.x;
          const dy = p.y - player.y;
          if (Math.hypot(dx, dy) > cullRadius) return false;
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
      case 'magnet': {
        // VS magnet: collect every XP gem currently on the field. We sum
        // their value in one go and remove them.
        const gems = get().pickups.filter(p => p.type === 'experience');
        const total = gems.reduce((s, g) => s + g.value, 0);
        if (total > 0) get().gainExperience(total);
        set(state => ({
          pickups: state.pickups.filter(p => p.type !== 'experience' || p.id === id)
        }));
        break;
      }
      case 'bomb': {
        // VS rosary: kill every enemy currently on screen by zeroing their
        // HP. We don't grant experience for this — it's a panic button.
        const reachable = get().enemies.filter(e => e.type !== 'reaper');
        set(state => ({
          enemies: state.enemies.filter(e => e.type === 'reaper'),
          gameStats: {
            ...state.gameStats,
            enemiesKilled: state.gameStats.enemiesKilled + reachable.length
          }
        }));
        // Drop XP gems where each killed enemy was so the cleanup feels
        // rewarding even though we skipped the damage path.
        reachable.forEach(enemy => {
          get().addPickup({
            id: `pickup-bomb-${enemy.id}`,
            x: enemy.x + enemy.width / 2 - 8,
            y: enemy.y + enemy.height / 2 - 8,
            type: 'experience',
            value: enemy.experienceValue
          });
        });
        break;
      }
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
      void state;
      // World is infinite; player starts at the origin and the camera
      // follows. No need to pre-center within bounds.
      return {
        player: {
          x: 0,
          y: 0,
          width: PLAYER_HITBOX,
          height: PLAYER_HITBOX,
          speed: PLAYER_BASE_SPEED,
          health: PLAYER_BASE_HP,
          maxHealth: PLAYER_BASE_HP,
          experience: 0,
          level: 1,
          experienceToNextLevel: 5,
          weapons: startingWeapons,
          characterClass: validClass,
          direction: 'idle',
          isMoving: false,
          invulnerable: false,
          invulnerableTime: 0,
          lastDirection: null,
          counterWindowEnd: 0,
          counterCooldownEnd: 0,
          lastCounterSuccessTime: 0
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
    // Infinite world: the camera follows the player one-to-one with no clamp.
    set({ camera: { x, y } });
  }
}));