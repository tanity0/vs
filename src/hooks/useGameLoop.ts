import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { checkProjectileEnemyCollisions, checkPlayerEnemyCollisions, checkPlayerPickupCollisions } from '../utils/collisionUtils';
import { generateEnemy, getEnemySpawnCount, getEnemySpawnInterval } from '../utils/enemyUtils';
import { fireWeapon } from '../utils/weaponUtils';

export const useGameLoop = (onGameOver: () => void) => {
  const [fps, setFps] = useState(0);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastCheck: 0 });
  
  // Game state
  const isPaused = useGameStore(state => state.isPaused);
  const gameTime = useGameStore(state => state.gameTime);
  const player = useGameStore(state => state.player);
  const enemies = useGameStore(state => state.enemies);
  const projectiles = useGameStore(state => state.projectiles);
  const pickups = useGameStore(state => state.pickups);
  const inputState = useGameStore(state => state.inputState);
  const swipeDirection = useGameStore(state => state.swipeDirection);
  const gameBounds = useGameStore(state => state.gameBounds);
  
  // Game actions
  const movePlayer = useGameStore(state => state.movePlayer);
  const fireWeapons = useGameStore(state => state.fireWeapons);
  const updateEnemies = useGameStore(state => state.updateEnemies);
  const updateProjectiles = useGameStore(state => state.updateProjectiles);
  const addEnemy = useGameStore(state => state.addEnemy);
  const damageEnemy = useGameStore(state => state.damageEnemy);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const removeProjectile = useGameStore(state => state.removeProjectile);
  const collectPickup = useGameStore(state => state.collectPickup);
  const addPickup = useGameStore(state => state.addPickup);
  const setGameTime = useGameStore(state => state.setGameTime);
  const updateGameStats = useGameStore(state => state.updateGameStats);
  const setCameraPosition = useGameStore(state => state.setCameraPosition);
  
  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      // Calculate delta time
      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;
      
      // Update FPS counter
      fpsCounterRef.current.frames++;
      if (timestamp - fpsCounterRef.current.lastCheck >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastCheck = timestamp;
      }
      
      // Skip updates if game is paused
      if (!isPaused) {
        // Update game time
        setGameTime(gameTime + deltaTime * 1000);
        updateGameStats({ timeAlive: gameTime / 1000 });
        
        // Update player invulnerability
        if (player.invulnerable && Date.now() - player.invulnerableTime > 1000) {
          useGameStore.setState(state => ({
            player: {
              ...state.player,
              invulnerable: false
            }
          }));
        }
        
        // Move player based on input or swipe direction
        movePlayer(inputState, deltaTime);
        
        // Update camera position to follow player with smoother movement and bounds
        const targetCameraX = Math.max(0, player.x - gameBounds.width / 2 + player.width / 2);
        const targetCameraY = Math.max(0, player.y - gameBounds.height / 2 + player.height / 2);
        
        // Limit camera to game area (with buffer)
        const maxCameraX = Math.max(0, gameBounds.width * 0.5);
        const maxCameraY = Math.max(0, gameBounds.height * 0.5);
        
        const boundedCameraX = Math.min(maxCameraX, targetCameraX);
        const boundedCameraY = Math.min(maxCameraY, targetCameraY);
        
        setCameraPosition(boundedCameraX, boundedCameraY);
        
        // Fire weapons
        player.weapons.forEach(weapon => {
          const newProjectiles = fireWeapon(weapon, player, enemies);
          newProjectiles.forEach(proj => useGameStore.getState().addProjectile(proj));
        });
        
        // Update enemies
        updateEnemies(deltaTime);
        
        // Update projectiles
        updateProjectiles(deltaTime);
        
        // Check for collisions between projectiles and enemies
        const projectileEnemyCollisions = checkProjectileEnemyCollisions(projectiles, enemies);
        
        projectileEnemyCollisions.forEach(({ projectileId, enemyId, damage }) => {
          const enemyKilled = damageEnemy(enemyId, damage);
          
          // Get the projectile
          const projectile = projectiles.find(p => p.id === projectileId);
          
          // If the projectile isn't passthrough or the enemy was killed, remove the projectile
          if (projectile && (!projectile.passthrough || enemyKilled)) {
            removeProjectile(projectileId);
          }
          
          // If enemy was killed, spawn experience pickup
          if (enemyKilled) {
            const enemy = enemies.find(e => e.id === enemyId);
            
            if (enemy) {
              addPickup({
                id: `pickup-${Date.now()}-${Math.random()}`,
                x: enemy.x + enemy.width / 2 - 8,
                y: enemy.y + enemy.height / 2 - 8,
                type: 'experience',
                value: enemy.experienceValue
              });
              
              // Occasionally spawn health pickup
              if (Math.random() < 0.05) {
                addPickup({
                  id: `pickup-health-${Date.now()}-${Math.random()}`,
                  x: enemy.x + enemy.width / 2 - 8,
                  y: enemy.y + enemy.height / 2 - 8 + 20,
                  type: 'health',
                  value: 10
                });
              }
            }
          }
        });
        
        // Check for collisions between player and enemies
        const playerEnemyCollisions = checkPlayerEnemyCollisions(player, enemies);
        
        playerEnemyCollisions.forEach(enemy => {
          const playerDied = damagePlayer(enemy.damage);
          
          if (playerDied) {
            onGameOver();
          }
        });
        
        // Check for collisions between player and pickups
        const pickupCollisions = checkPlayerPickupCollisions(player, pickups);
        
        // Collect all pickups that collide with the player
        if (pickupCollisions.length > 0) {
          pickupCollisions.forEach(pickupId => {
            collectPickup(pickupId);
          });
        }
        
        // Spawn enemies
        if (
          timestamp - lastEnemySpawnRef.current > getEnemySpawnInterval(gameTime)
        ) {
          const spawnCount = getEnemySpawnCount(gameTime);
          
          for (let i = 0; i < spawnCount; i++) {
            const enemy = generateEnemy(gameTime, player, gameBounds);
            addEnemy(enemy);
          }
          
          lastEnemySpawnRef.current = timestamp;
        }
        
        // Limit enemy count to prevent lag
        const maxEnemies = Math.min(50, 20 + Math.floor(gameTime / 30000));
        if (enemies.length > maxEnemies) {
          // Find the enemies furthest from the player and remove them
          const sortedEnemies = [...enemies].sort((a, b) => {
            const distA = Math.hypot(a.x - player.x, a.y - player.y);
            const distB = Math.hypot(b.x - player.x, b.y - player.y);
            return distB - distA; // Sort descending (furthest first)
          });
          
          const enemiesToRemove = sortedEnemies.slice(0, enemies.length - maxEnemies);
          enemiesToRemove.forEach(enemy => {
            useGameStore.getState().removeEnemy(enemy.id);
          });
        }
      }
      
      // Request next frame
      frameRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start game loop
    frameRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [
    isPaused,
    gameTime,
    player,
    enemies,
    projectiles,
    pickups,
    inputState,
    swipeDirection,
    gameBounds,
    movePlayer,
    fireWeapons,
    updateEnemies,
    updateProjectiles,
    addEnemy,
    damageEnemy,
    damagePlayer,
    removeProjectile,
    collectPickup,
    addPickup,
    setGameTime,
    updateGameStats,
    setCameraPosition,
    onGameOver
  ]);
  
  return { fps };
};