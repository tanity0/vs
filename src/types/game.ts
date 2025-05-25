// Game state types
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

// Character class types
export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'necromancer';

// Player types
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  experience: number;
  level: number;
  experienceToNextLevel: number;
  weapons: Weapon[];
  characterClass: CharacterClass;
  direction: Direction;
  isMoving: boolean;
  invulnerable: boolean;
  invulnerableTime: number;
  lastDirection: { x: number; y: number } | null;
}

// Movement direction
export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

// Enemy types
export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  type: EnemyType;
  experienceValue: number;
  lastHit: number;
}

export type EnemyType = 'basic' | 'fast' | 'tank' | 'ranged' | 'boss';

// Weapon types
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  cooldown: number;
  lastFired: number;
  level: number;
  projectileSpeed?: number;
  projectileSize?: number;
  area?: number;
  duration?: number;
  passthrough?: boolean;
  count?: number;
}

export type WeaponType = 'knife' | 'axe' | 'wand' | 'whip' | 'bible' | 'garlic';

// Projectile types
export interface Projectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  damage: number;
  direction: { x: number; y: number };
  weaponType: WeaponType;
  duration: number;
  createdAt: number;
  passthrough: boolean;
  hitEnemies: string[];
}

// Pickup types
export interface Pickup {
  id: string;
  x: number;
  y: number;
  type: PickupType;
  value: number;
}

export type PickupType = 'experience' | 'health' | 'magnet';

// Upgrade options
export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'passive';
  weaponType?: WeaponType;
  passiveType?: PassiveType;
  level: number;
}

export type PassiveType = 'maxHealth' | 'speed' | 'might' | 'area' | 'cooldown' | 'duration' | 'amount';

// Game statistics
export interface GameStats {
  timeAlive: number;
  enemiesKilled: number;
  damageDealt: number;
  experienceCollected: number;
  maxLevel: number;
}

// Input state
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

// Game area bounds
export interface GameBounds {
  width: number;
  height: number;
}