import { useEffect, useRef, useState } from 'react';
import { useGameStore, INVULN_MS } from '../store/gameStore';
import {
  checkProjectileEnemyCollisions,
  checkPlayerEnemyCollisions,
  checkPlayerPickupCollisions,
  checkProjectilePlayerCollisions
} from '../utils/collisionUtils';
import {
  createEnemyProjectile,
  generateEnemy,
  getEnemyFireProfile,
  getEnemySpawnCount,
  getEnemySpawnInterval
} from '../utils/enemyUtils';
import { consumeDueWaves, newConsumedWaves } from '../utils/stageDirector';
import { fireWeapon } from '../utils/weaponUtils';

export const useGameLoop = (onGameOver: () => void) => {
  const [fps, setFps] = useState(0);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastCheck: 0 });
  // Scripted-wave consumption set; survives across frames within one run
  // and is reset whenever gameTime rolls back to ~0 (i.e. a fresh game).
  const consumedWavesRef = useRef(newConsumedWaves());
  const lastSeenGameTimeRef = useRef(0);
  
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
  const reflectProjectile = useGameStore(state => state.reflectProjectile);
  const addProjectile = useGameStore(state => state.addProjectile);
  const collectPickup = useGameStore(state => state.collectPickup);
  const addPickup = useGameStore(state => state.addPickup);
  const setGameTime = useGameStore(state => state.setGameTime);
  const updateGameStats = useGameStore(state => state.updateGameStats);
  const setCameraPosition = useGameStore(state => state.setCameraPosition);
  
  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      // The game can sit idle (tab in background, game-over screen, paused
      // mid-render, etc.) for arbitrary amounts of time. We must NOT pass
      // huge deltas into the simulation — they cause physics teleports
      // (every enemy slammed into the player, projectiles flying off the
      // map, gameTime jumping minutes). On the very first frame after a
      // (re)mount, lastFrameTimeRef is 0 and `timestamp - 0` is the entire
      // page-lifetime, which is the worst case. Establish the time origin
      // and skip the simulation step on that frame.
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
        frameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const rawDelta = (timestamp - lastFrameTimeRef.current) / 1000;
      const deltaTime = Math.min(0.05, rawDelta);
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
        const newGameTime = gameTime + deltaTime * 1000;
        setGameTime(newGameTime);
        updateGameStats({ timeAlive: gameTime / 1000 });

        // Detect a fresh run (gameTime rewound to ~0) and reset scripted
        // wave consumption so the same player can re-fight the schedule.
        if (newGameTime < lastSeenGameTimeRef.current) {
          consumedWavesRef.current = newConsumedWaves();
        }
        lastSeenGameTimeRef.current = newGameTime;

        // Update player invulnerability
        if (player.invulnerable && Date.now() - player.invulnerableTime > INVULN_MS) {
          useGameStore.setState(state => ({
            player: {
              ...state.player,
              invulnerable: false
            }
          }));
        }

        // Move player based on input or swipe direction
        movePlayer(inputState, deltaTime);

        // Infinite-world camera: center the player exactly.
        const targetCameraX = player.x - gameBounds.width / 2 + player.width / 2;
        const targetCameraY = player.y - gameBounds.height / 2 + player.height / 2;
        setCameraPosition(targetCameraX, targetCameraY);
        
        // Fire weapons
        player.weapons.forEach(weapon => {
          const newProjectiles = fireWeapon(weapon, player, enemies);
          newProjectiles.forEach(proj => useGameStore.getState().addProjectile(proj));
        });
        
        // Update enemies
        updateEnemies(deltaTime);
        
        // Update projectiles
        updateProjectiles(deltaTime);

        // Every enemy that has a fire profile periodically lobs a hostile
        // projectile at the player. Each type has its own cadence/range
        // so grunts shoot rarely and ranged/boss shoot often. We read the
        // enemies/player fresh from the store here because updateEnemies
        // just mutated them — the React closure values are one frame
        // stale, and a stale `lastShot` would have us refire on enemies
        // that already shot earlier in this very frame.
        const now = Date.now();
        const liveEnemies = useGameStore.getState().enemies;
        const livePlayer = useGameStore.getState().player;
        const firedIds: string[] = [];
        liveEnemies.forEach(enemy => {
          const profile = getEnemyFireProfile(enemy);
          if (!profile) return;
          if (now - enemy.lastShot < profile.interval) return;
          const dx = livePlayer.x - enemy.x;
          const dy = livePlayer.y - enemy.y;
          if (Math.hypot(dx, dy) > profile.range) return;

          addProjectile(createEnemyProjectile(enemy, livePlayer));
          firedIds.push(enemy.id);
        });
        if (firedIds.length > 0) {
          useGameStore.setState(state => ({
            enemies: state.enemies.map(e =>
              firedIds.includes(e.id) ? { ...e, lastShot: now } : e
            )
          }));
        }

        // Hostile projectiles vs player. If the counter window is currently
        // open (the player just lifted their finger / tapped Space), reflect
        // the bolt back at the firing enemy. Otherwise it does damage.
        const liveProjectiles = useGameStore.getState().projectiles;
        const incoming = checkProjectilePlayerCollisions(liveProjectiles, player);
        for (const proj of incoming) {
          const currentPlayer = useGameStore.getState().player;
          if (now <= currentPlayer.counterWindowEnd) {
            reflectProjectile(proj.id);
            useGameStore.setState(state => ({
              player: { ...state.player, lastCounterSuccessTime: now }
            }));
          } else {
            const playerDied = damagePlayer(proj.damage);
            removeProjectile(proj.id);
            if (playerDied) {
              onGameOver();
            }
          }
        }

        // Check for collisions between projectiles and enemies
        const projectileEnemyCollisions = checkProjectileEnemyCollisions(useGameStore.getState().projectiles, enemies);
        
        projectileEnemyCollisions.forEach(({ projectileId, enemyId, damage }) => {
          const enemyKilled = damageEnemy(enemyId, damage);
          
          // Get the projectile
          const projectile = projectiles.find(p => p.id === projectileId);
          
          // If the projectile isn't passthrough or the enemy was killed, remove the projectile
          if (projectile && (!projectile.passthrough || enemyKilled)) {
            removeProjectile(projectileId);
          }
          
          // If enemy was killed, spawn pickups. VS-style drop table:
          //   - always an XP gem; its `value` becomes the gem tier.
          //   - rare chicken (HP), magnet, bomb. Elites/giantbats roll richer.
          if (enemyKilled) {
            const enemy = enemies.find(e => e.id === enemyId);
            if (enemy) {
              addPickup({
                id: `pickup-xp-${enemy.id}`,
                x: enemy.x + enemy.width / 2 - 8,
                y: enemy.y + enemy.height / 2 - 8,
                type: 'experience',
                value: enemy.experienceValue
              });
              const isElite = enemy.type === 'pumpkin' || enemy.type === 'giantbat';
              const chickenChance = isElite ? 0.35 : 0.015;
              const magnetChance = isElite ? 0.15 : 0.004;
              const bombChance = isElite ? 0.1 : 0.002;
              if (Math.random() < chickenChance) {
                addPickup({
                  id: `pickup-chicken-${enemy.id}`,
                  x: enemy.x + enemy.width / 2 - 8,
                  y: enemy.y + enemy.height / 2 - 8 + 18,
                  type: 'health',
                  value: 30
                });
              }
              if (Math.random() < magnetChance) {
                addPickup({
                  id: `pickup-magnet-${enemy.id}`,
                  x: enemy.x + enemy.width / 2 - 8 + 14,
                  y: enemy.y + enemy.height / 2 - 8,
                  type: 'magnet',
                  value: 0
                });
              }
              if (Math.random() < bombChance) {
                addPickup({
                  id: `pickup-bomb-${enemy.id}`,
                  x: enemy.x + enemy.width / 2 - 8 - 14,
                  y: enemy.y + enemy.height / 2 - 8,
                  type: 'bomb',
                  value: 0
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
        
        // Continuous spawner — drip enemies onto the field from off-screen.
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

        // Scripted wave/elite events (5min pumpkin, 7min bat horde, 30min
        // Reaper, etc.). consumeDueWaves fires each event exactly once.
        const waveEnemies = consumeDueWaves(
          gameTime,
          consumedWavesRef.current,
          player,
          gameBounds
        );
        waveEnemies.forEach(addEnemy);

        // Limit enemy count to keep the simulation tractable on phones.
        // Reapers and giant bats are always kept regardless of distance.
        const maxEnemies = Math.min(120, 40 + Math.floor(gameTime / 30000));
        if (enemies.length > maxEnemies) {
          // Find the enemies furthest from the player and remove them,
          // but never cull elites/giantbats/reaper — they're set-pieces.
          const isProtected = (t: string) =>
            t === 'reaper' || t === 'giantbat' || t === 'pumpkin';
          const sortedEnemies = [...enemies]
            .filter(e => !isProtected(e.type))
            .sort((a, b) => {
              const distA = Math.hypot(a.x - player.x, a.y - player.y);
              const distB = Math.hypot(b.x - player.x, b.y - player.y);
              return distB - distA;
            });

          const toRemove = sortedEnemies.slice(0, enemies.length - maxEnemies);
          toRemove.forEach(enemy => {
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
    addProjectile,
    damageEnemy,
    damagePlayer,
    removeProjectile,
    reflectProjectile,
    collectPickup,
    addPickup,
    setGameTime,
    updateGameStats,
    setCameraPosition,
    onGameOver
  ]);
  
  return { fps };
};