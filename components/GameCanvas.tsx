import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Player, Entity, Boss, Particle, Projectile, MobileInputState, CharacterType } from '../types';
import { getBossTaunt } from '../services/geminiService';

// --- Constants ---
const GRAVITY = 0.5;
const FRICTION = 0.90;
const OIL_FRICTION = 0.99; // Slippery
const ACCEL = 0.8;
const MAX_SPEED = 15;

// Super Constants
const SUPER_ACCEL = 1.5;
const SUPER_MAX_SPEED = 25;
const SUPER_JUMP_FORCE = -15;

const JUMP_FORCE = -12;
const BOSS_MAX_HP = 100;
const PLAYER_DAMAGE = 20; 
const SUPER_PLAYER_DAMAGE = 50; 
const TOWER_HP = 200;
const TOWER_DAMAGE = 30; 
const DAMAGE_COOLDOWN = 120; 

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  rings: number;
  setRings: React.Dispatch<React.SetStateAction<number>>;
  setBossMessage: (msg: string) => void;
  mobileInput: MobileInputState;
  currentLevel: number;
  onLevelComplete: () => void;
  superUnlocked: boolean;
  selectedCharacter: CharacterType;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  setScore, 
  rings,
  setRings,
  setBossMessage,
  mobileInput,
  currentLevel,
  onLevelComplete,
  superUnlocked,
  selectedCharacter
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // Game State Refs
  const playerRef = useRef<Player>({
    id: 'p1', pos: { x: 100, y: 300 }, vel: { x: 0, y: 0 },
    width: 40, height: 40, type: 'player', active: true,
    character: 'sonic',
    isGrounded: false, isJumping: false, isSpinning: false, 
    facingRight: true, invulnerableTime: 0, ringCollectCooldown: 0, lastLoopExitTime: 0, isSuper: false,
    abilityActiveTime: 0, abilityCooldown: 0, lastTapTime: 0, lastTapKey: ''
  });
  
  const ringsRef = useRef(rings);
  useEffect(() => { ringsRef.current = rings; }, [rings]);
  
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef({ x: 0 });
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]); 
  const bossRef = useRef<Boss | null>(null);
  const ringDrainTimer = useRef(0);
  
  // --- Character Hot-Swap Effect ---
  // Updates character prop immediately when user selects from HUD
  useEffect(() => {
    if (playerRef.current) {
        playerRef.current.character = selectedCharacter;
        // Optionally auto-trigger super state if switching to Super Sonic with rings
        if (selectedCharacter === 'supersonic' && ringsRef.current >= 50) {
            playerRef.current.isSuper = true;
        } else if (selectedCharacter !== 'supersonic' && !superUnlocked) {
            // Only force disable super if they haven't unlocked it properly or manually switched
            // But we allow playerRef.current.isSuper to persist if logic allows (e.g. Sonic transformation)
            if (playerRef.current.character !== 'supersonic' && playerRef.current.character !== 'sonic') {
                 playerRef.current.isSuper = false;
            }
        }
    }
  }, [selectedCharacter, superUnlocked]);

  // --- Initialization ---
  const initLevel = useCallback(() => {
    // Reset Player
    const startIsSuper = selectedCharacter === 'supersonic';
    playerRef.current = {
      id: 'p1', pos: { x: 50, y: 300 }, vel: { x: 0, y: 0 },
      width: 40, height: 40, type: 'player', active: true,
      character: selectedCharacter,
      isGrounded: false, isJumping: false, isSpinning: false, 
      facingRight: true, invulnerableTime: 0, ringCollectCooldown: 0, lastLoopExitTime: 0,
      isSuper: startIsSuper,
      lastStablePos: { x: 50, y: 300 },
      abilityActiveTime: 0, abilityCooldown: 0, lastTapTime: 0, lastTapKey: ''
    };

    if (startIsSuper) {
        setRings(50);
    }

    cameraRef.current.x = 0;
    bossRef.current = null;
    projectilesRef.current = [];
    particlesRef.current = [];
    
    // Build Level based on currentLevel
    const entities: Entity[] = [];
    
    if (currentLevel === 1) {
        // Level 1: Industrial / Loop
        for (let i = 0; i < 60; i++) {
            entities.push({ id: `floor-${i}`, pos: { x: i * 100, y: 500 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0, y:0} });
        }
        entities.push({ id: 'plat1', pos: { x: 600, y: 400 }, width: 200, height: 20, type: 'platform', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'box1', pos: { x: 700, y: 360 }, width: 30, height: 30, type: 'box', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'loop1', pos: { x: 2000, y: 300 }, width: 200, height: 200, type: 'loop', active: true, vel: {x:0, y:0} });
        for (let i = 0; i < 20; i++) {
            entities.push({ id: `floor-postloop-${i}`, pos: { x: 2200 + i * 100, y: 500 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0, y:0} });
        }
    } else if (currentLevel === 2) {
        // Level 2: Water Zone
        for (let i = 0; i < 80; i++) {
            entities.push({ id: `floor-${i}`, pos: { x: i * 100, y: 500 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0, y:0} });
        }
        entities.push({ id: 'plat1', pos: { x: 500, y: 350 }, width: 100, height: 20, type: 'platform', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'plat2', pos: { x: 900, y: 250 }, width: 100, height: 20, type: 'platform', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'box1', pos: { x: 520, y: 310 }, width: 30, height: 30, type: 'box', active: true, vel: {x:0, y:0} });
    } else if (currentLevel === 3) {
        // Level 3: Forest Zone
         for (let i = 0; i < 80; i++) {
            entities.push({ id: `floor-${i}`, pos: { x: i * 100, y: 500 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0, y:0} });
        }
        entities.push({ id: 'plat1', pos: { x: 400, y: 400 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'plat2', pos: { x: 800, y: 300 }, width: 200, height: 200, type: 'platform', active: true, vel: {x:0, y:0} });
        entities.push({ id: 'box1', pos: { x: 850, y: 260 }, width: 30, height: 30, type: 'box', active: true, vel: {x:0, y:0} });
    } else if (currentLevel === 4) {
        // Level 4: Base Zone (Oil)
        for (let i = 0; i < 120; i++) {
            if (i > 20 && i < 30) {
               entities.push({ id: `oil-${i}`, pos: { x: i * 100, y: 520 }, width: 100, height: 80, type: 'oil', active: true, vel: {x:0, y:0} });
            } else if (i > 50 && i < 70 && i % 2 !== 0) {
               // Gaps
            } else {
               const isOil = i > 40 && i < 50;
               entities.push({ 
                   id: `floor-${i}`, 
                   pos: { x: i * 100, y: 500 }, 
                   width: 100, height: 100, 
                   type: isOil ? 'oil' : 'platform', 
                   active: true, 
                   vel: {x:0, y:0} 
               });
            }
        }
        const capX = 3500;
        entities.push({ id: 'cap-base', pos: { x: capX, y: 400 }, width: 300, height: 20, type: 'platform', active: true, vel: {x:0,y:0} });
        entities.push({ id: 'cap-top', pos: { x: capX + 50, y: 250 }, width: 200, height: 20, type: 'platform', active: true, vel: {x:0,y:0} });
        entities.push({ id: 'box-cap', pos: { x: capX + 135, y: 210 }, width: 30, height: 30, type: 'box', active: true, vel: {x:0,y:0} });
        entities.push({ id: 'oil-plat-1', pos: { x: 1500, y: 400 }, width: 200, height: 20, type: 'oil', active: true, vel: {x:0,y:0} });
        entities.push({ id: 'oil-plat-2', pos: { x: 1900, y: 300 }, width: 200, height: 20, type: 'oil', active: true, vel: {x:0,y:0} });
    }

    const ringCount = currentLevel === 4 ? 80 : 50;
    for(let i=0; i<ringCount; i++) {
        entities.push({ id: `r-${i}`, pos: { x: 300 + i*60, y: 450 - (i%3)*40 }, width: 20, height: 20, type: 'ring', active: true, vel: {x:0, y:0} });
    }
    
    if (currentLevel !== 2) {
        entities.push({ id: 'e1', pos: { x: 900, y: 460 }, width: 40, height: 30, type: 'enemy', active: true, vel: {x: -2, y: 0} });
        entities.push({ id: 'e2', pos: { x: 1600, y: 460 }, width: 40, height: 30, type: 'enemy', active: true, vel: {x: -2, y: 0} });
        if (currentLevel === 4) {
             entities.push({ id: 'e3', pos: { x: 2500, y: 460 }, width: 40, height: 30, type: 'enemy', active: true, vel: {x: -3, y: 0} });
             entities.push({ id: 'e4', pos: { x: 3800, y: 460 }, width: 40, height: 30, type: 'enemy', active: true, vel: {x: -3, y: 0} });
        }
    }

    entitiesRef.current = entities;
  }, [currentLevel, setScore, setRings, selectedCharacter]); 

  const spawnBoss = useCallback(() => {
    const startX = playerRef.current.pos.x + 400;
    const bossCommon = {
      id: 'boss', pos: { x: startX, y: 200 }, vel: { x: 0, y: 0 },
      width: 80, height: 80, type: 'boss' as const, active: true,
      maxHp: BOSS_MAX_HP, moveTimer: 0, arenaStartX: startX - 300, shieldActive: false
    };

    if (currentLevel === 1) {
        bossRef.current = { ...bossCommon, hp: 100, phase: 'shooting' };
        getBossTaunt("I have arrived to destroy you!").then(setBossMessage);
    } else if (currentLevel === 2) {
        bossRef.current = { ...bossCommon, pos: { x: startX, y: 350 }, hp: 100, phase: 'shielded', shieldActive: true };
        entitiesRef.current.push({ id: 'tower1', pos: { x: startX - 250, y: 400 }, width: 50, height: 100, type: 'tower', active: true, hp: TOWER_HP, maxHp: TOWER_HP, vel: {x:0,y:0} });
        entitiesRef.current.push({ id: 'tower2', pos: { x: startX + 250, y: 400 }, width: 50, height: 100, type: 'tower', active: true, hp: TOWER_HP, maxHp: TOWER_HP, vel: {x:0,y:0} });
        getBossTaunt("My shield is impenetrable! Destroy my towers if you dare!").then(setBossMessage);
    } else if (currentLevel === 3) {
        bossRef.current = { ...bossCommon, pos: { x: startX, y: 440 }, width: 120, height: 60, hp: 150, phase: 'driving' };
        getBossTaunt("You can't outrun my Egg-Mobile!").then(setBossMessage);
    } else if (currentLevel === 4) {
        // Start running from left of arena to mech
        bossRef.current = { ...bossCommon, pos: { x: startX - 300, y: 420 }, width: 50, height: 80, hp: 200, phase: 'running_to_mech' };
        entitiesRef.current.push({ id: 'mech-empty', pos: { x: startX, y: 400 }, width: 100, height: 100, type: 'platform', active: true, vel: {x:0,y:0} });
        getBossTaunt("Welcome to my Base! Time to finish this!").then(setBossMessage);
    }
  }, [setBossMessage, currentLevel]);

  const fireProjectile = (source: Entity, target: Player, speed: number = 7) => {
      const dx = (target.pos.x + target.width/2) - (source.pos.x + source.width/2);
      const dy = (target.pos.y + target.height/2) - (source.pos.y + source.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      projectilesRef.current.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          pos: { x: source.pos.x + source.width/2, y: source.pos.y + source.height/2 },
          vel: { x: (dx/dist)*speed, y: (dy/dist)*speed },
          width: 20, height: 20, type: 'projectile', active: true, life: 200
      });
  };

  const respawnPlayer = () => {
    playerRef.current.pos = { x: 50, y: 300 };
    playerRef.current.vel = { x: 0, y: 0 };
    playerRef.current.invulnerableTime = 120;
    playerRef.current.ringCollectCooldown = 0;
    if (selectedCharacter !== 'supersonic') {
        playerRef.current.isSuper = false; 
    }
    playerRef.current.abilityActiveTime = 0;
    setRings(selectedCharacter === 'supersonic' ? 50 : 0);
    particlesRef.current.push({ x: 50, y: 300, vx: 0, vy: 0, life: 30, color: '#ffffff', size: 100 });
  };

  const softRespawnPlayer = () => {
      const p = playerRef.current;
      p.pos = p.lastStablePos ? { ...p.lastStablePos } : { x: 50, y: 300 };
      p.pos.y -= 50; 
      p.vel = { x: 0, y: 0 };
      p.invulnerableTime = 120;
      p.ringCollectCooldown = 0;
      p.abilityActiveTime = 0;
      setRings(r => Math.max(0, r - 10)); 
      for(let i=0; i<10; i++) particlesRef.current.push({ x: p.pos.x, y: p.pos.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 40, color: '#ef4444', size: 5 });
      setBossMessage("Watch your step!");
  };

  const handleDamage = () => {
      const player = playerRef.current;
      if (player.isSuper) return;
      if (player.abilityActiveTime > 0 && player.character === 'shadow') return; // Shadow invincible in ability

      const currentRings = ringsRef.current;
      if (currentRings > 0) {
          const ringsToDrop = Math.min(currentRings, 10);
          for (let i=0; i < ringsToDrop; i++) {
              particlesRef.current.push({
                  x: player.pos.x, y: player.pos.y,
                  vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                  life: 60, color: '#fbbf24', size: 4
              });
          }
          player.vel.y = -5;
          player.vel.x = -player.vel.x * 1.5;
          player.invulnerableTime = 120;
          player.ringCollectCooldown = DAMAGE_COOLDOWN; 
          setRings(0);
      } else {
          respawnPlayer();
      }
  };

  // --- Input Handling & Double Tap ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
        
        const now = Date.now();
        const p = playerRef.current;
        const isJumpKey = (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW');

        // Double Tap / Action Logic
        if (!keysRef.current[e.code]) {
            if (p.lastTapKey === e.code && now - p.lastTapTime < 300) {
                // Double Tap Detected
                if (p.character === 'shadow' && (e.code === 'ArrowRight' || e.code === 'KeyD')) {
                    p.abilityActiveTime = 600; // 10 seconds
                    for(let i=0; i<20; i++) particlesRef.current.push({x:p.pos.x, y:p.pos.y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:30, color:'#ef4444', size:6});
                }
                if (p.character === 'silver' && isJumpKey) {
                    p.pos.x += 300;
                    p.vel.y = 0;
                    for(let i=0; i<20; i++) particlesRef.current.push({x:p.pos.x, y:p.pos.y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:30, color:'#67e8f9', size:6});
                }
                if (p.character === 'knuckles' && isJumpKey) {
                    p.vel.y = -25;
                    for(let i=0; i<20; i++) particlesRef.current.push({x:p.pos.x, y:p.pos.y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:30, color:'#dc2626', size:6});
                }
            }
            p.lastTapKey = e.code;
            p.lastTapTime = now;
            
            // Sonic Transformation Check (Jump button while in air)
            if (isJumpKey && !p.isGrounded && p.character === 'sonic' && superUnlocked && !p.isSuper) {
                 if (ringsRef.current >= 50) {
                     p.isSuper = true;
                     p.vel.y = -10; // Transform float
                     for(let i=0; i<30; i++) particlesRef.current.push({
                         x:p.pos.x, y:p.pos.y, 
                         vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, 
                         life:60, color:'#facc15', size:8
                     });
                 }
            }
        }

        keysRef.current[e.code] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [superUnlocked]);

  // --- Main Game Loop ---
  const update = useCallback(() => {
    frameCountRef.current++;
    if (gameState !== GameState.PLAYING && gameState !== GameState.BOSS_FIGHT) return;

    const player = playerRef.current;
    
    if (player.isSuper) {
        ringDrainTimer.current++;
        if (ringDrainTimer.current >= 60) {
            ringDrainTimer.current = 0;
            if (player.character !== 'supersonic') {
                setRings(prev => {
                    if (prev <= 1) {
                        player.isSuper = false;
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }
    }

    if (player.abilityActiveTime > 0) player.abilityActiveTime--;

    // 1. Player Stats
    let charAccel = ACCEL;
    let charMaxSpeed = MAX_SPEED;
    let charJumpForce = JUMP_FORCE;
    let charFriction = FRICTION;

    if (player.character === 'shadow') {
        charAccel = ACCEL * 1.3; 
        charMaxSpeed = MAX_SPEED * 1.1; 
        if (player.abilityActiveTime > 0) {
            charMaxSpeed = 30; // VERY FAST
            charAccel = 3.0;
        }
    } else if (player.character === 'tails') {
        charJumpForce = JUMP_FORCE * 1.1; 
    } else if (player.character === 'knuckles') {
        charAccel = ACCEL * 0.7; 
        charFriction = 0.85; 
    } else if (player.character === 'silver') {
        charJumpForce = JUMP_FORCE * 0.9; 
    } else if (player.character === 'supersonic') {
        charAccel = SUPER_ACCEL;
        charMaxSpeed = SUPER_MAX_SPEED;
        charJumpForce = SUPER_JUMP_FORCE;
        player.isSuper = true;
    }

    const accel = player.isSuper ? SUPER_ACCEL : charAccel;
    let currentFriction = charFriction;
    
    const standingOn = entitiesRef.current.find(e => 
        e.type === 'oil' && 
        player.pos.x < e.pos.x + e.width && player.pos.x + player.width > e.pos.x &&
        Math.abs((player.pos.y + player.height) - e.pos.y) < 5
    );
    if (standingOn) currentFriction = OIL_FRICTION;

    const friction = currentFriction;
    const maxSpeed = player.isSuper ? SUPER_MAX_SPEED : charMaxSpeed;
    const jumpForce = player.isSuper ? SUPER_JUMP_FORCE : charJumpForce;

    if (player.loopState && player.loopState.active) {
        const ls = player.loopState;
        ls.progress += 0.15;
        player.pos.x = ls.centerX + Math.cos(ls.progress + Math.PI/2) * ls.radius;
        player.pos.y = ls.centerY + Math.sin(ls.progress + Math.PI/2) * ls.radius;
        if (ls.progress >= Math.PI * 2) {
            player.loopState.active = false;
            player.lastLoopExitTime = Date.now();
            player.vel.x = maxSpeed;
            player.vel.y = 0;
            player.pos.y = 500 - 40;
        }
    } else {
        const left = keysRef.current['KeyA'] || keysRef.current['ArrowLeft'] || mobileInput.left;
        const right = keysRef.current['KeyD'] || keysRef.current['ArrowRight'] || mobileInput.right;
        const up = keysRef.current['KeyW'] || keysRef.current['ArrowUp'] || keysRef.current['Space'] || mobileInput.up;
        const down = keysRef.current['KeyS'] || keysRef.current['ArrowDown'] || mobileInput.down;

        if (right) {
            player.vel.x += accel;
            player.facingRight = true;
        } else if (left) {
            player.vel.x -= accel;
            player.facingRight = false;
        } else {
            player.vel.x *= friction;
        }

        if (down && Math.abs(player.vel.x) > 1) {
            player.isSpinning = true;
        } else if (!player.isJumping) {
            player.isSpinning = false;
        }

        if (up && player.isGrounded) {
            player.vel.y = jumpForce;
            player.isGrounded = false;
            player.isJumping = true;
            player.isSpinning = true;
        }

        player.vel.y += GRAVITY;
        player.vel.x = Math.max(Math.min(player.vel.x, maxSpeed), -maxSpeed);
        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
    }

    // Collision
    player.isGrounded = false;
    if (player.pos.y > 1000) {
        if (currentLevel === 4 && ringsRef.current > 0) softRespawnPlayer();
        else respawnPlayer();
    }

    entitiesRef.current.forEach(ent => {
      if (!ent.active) return;
      const isColliding = (
        player.pos.x < ent.pos.x + ent.width &&
        player.pos.x + player.width > ent.pos.x &&
        player.pos.y < ent.pos.y + ent.height &&
        player.pos.y + player.height > ent.pos.y
      );

      if (ent.type === 'platform' || ent.type === 'oil') {
        if (isColliding && player.vel.y > 0 && player.pos.y + player.height - player.vel.y <= ent.pos.y) {
          player.pos.y = ent.pos.y - player.height;
          player.vel.y = 0;
          player.isGrounded = true;
          player.isJumping = false;
          if (Math.abs(player.vel.x) < 2) player.lastStablePos = { x: player.pos.x, y: player.pos.y };
        }
      } else if (ent.type === 'ring' && isColliding) {
        if (player.ringCollectCooldown <= 0) {
            ent.active = false;
            setRings(r => r + 1);
            setScore(s => s + 100);
        }
      } else if (ent.type === 'box' && isColliding) {
          if (player.isSpinning || player.vel.y > 0 || player.isSuper) {
              ent.active = false;
              setScore(s => s + 500);
              setRings(r => r + 10);
              player.vel.y = -5;
          }
      } else if (ent.type === 'loop' && isColliding) {
         const timeSinceExit = Date.now() - (player.lastLoopExitTime || 0);
         if (!player.loopState?.active && Math.abs(player.vel.x) > 8 && timeSinceExit > 1000) {
             player.loopState = {
                 active: true, progress: 0,
                 centerX: ent.pos.x + ent.width/2, centerY: ent.pos.y + ent.height/2 - 50, radius: 100
             };
         }
      } else if (ent.type === 'enemy' && isColliding) {
          if (player.isSuper || (player.character === 'shadow' && player.abilityActiveTime > 0)) {
              ent.active = false; 
              setScore(s => s + 1000);
          } else if (player.isSpinning || player.isJumping) {
              ent.active = false;
              setScore(s => s + 500);
              player.vel.y = -5;
          } else if (player.invulnerableTime <= 0) {
              handleDamage();
          }
      } else if (ent.type === 'tower') {
          const isTop = (player.vel.y > 0 && player.pos.y + player.height - player.vel.y <= ent.pos.y);
          if (isColliding && isTop) {
             player.pos.y = ent.pos.y - player.height;
             player.vel.y = 0;
             player.isGrounded = true;
          } else if (isColliding) {
               if (player.vel.x > 0) player.pos.x = ent.pos.x - player.width;
               if (player.vel.x < 0) player.pos.x = ent.pos.x + ent.width;
               player.vel.x = 0;
          }

          if (isColliding && (player.isSpinning || player.isJumping || player.isSuper)) {
              if (ent.hp && ent.hp > 0) {
                 ent.hp -= player.isSuper ? SUPER_PLAYER_DAMAGE : TOWER_DAMAGE;
                 player.vel.y = -6; 
                 if (ent.hp <= 0) {
                     ent.active = false;
                     for(let i=0; i<15; i++) particlesRef.current.push({x: ent.pos.x+25, y: ent.pos.y+50, vx:(Math.random()-0.5)*15, vy:(Math.random()-0.5)*15, life:40, color:'#555', size:8});
                 }
              }
          }
      }
    });

    entitiesRef.current.forEach(ent => {
        if (ent.type === 'enemy' && ent.active) {
            ent.pos.x += ent.vel.x;
            if (ent.pos.x % 200 > 190) ent.vel.x *= -1;
        }
        if (ent.type === 'tower' && ent.active) {
            if (Math.random() < 0.01) fireProjectile(ent, player, 5);
        }
    });

    if (bossRef.current && bossRef.current.active) {
        const boss = bossRef.current;
        boss.moveTimer++;
        const arenaMin = boss.arenaStartX;
        const arenaMax = boss.arenaStartX + 600;

        if (currentLevel === 1) {
            if (boss.pos.x < arenaMin) boss.pos.x = arenaMin;
            if (boss.pos.x > arenaMax) boss.pos.x = arenaMax;
            if (boss.phase === 'shooting') {
                boss.pos.y = 200 + Math.sin(boss.moveTimer * 0.05) * 30;
                boss.pos.x += Math.cos(boss.moveTimer * 0.02) * 3; 
                if (boss.moveTimer % 80 === 0) fireProjectile(boss, player);
                if (boss.moveTimer > 500) { boss.moveTimer = 0; boss.phase = 'descending'; }
            } else if (boss.phase === 'descending') {
                boss.pos.y += 3;
                if (boss.pos.y >= 460) { boss.pos.y = 460; boss.phase = 'vulnerable'; boss.moveTimer = 0; }
            } else if (boss.phase === 'vulnerable') {
                if (boss.moveTimer > 300) boss.phase = 'ascending';
            } else if (boss.phase === 'ascending') {
                boss.pos.y -= 3;
                if (boss.pos.y <= 200) { boss.phase = 'shooting'; boss.moveTimer = 0; }
            } else if (boss.phase === 'hurt') {
                 if (boss.moveTimer > 30) boss.phase = 'ascending'; 
            }
        } else if (currentLevel === 2) {
            const activeTowers = entitiesRef.current.filter(e => e.type === 'tower' && e.active).length;
            if (activeTowers > 0) {
                boss.shieldActive = true;
                boss.phase = 'shielded';
                boss.pos.y = 350 + Math.sin(boss.moveTimer * 0.05) * 10;
                if (boss.moveTimer % 120 === 0) fireProjectile(boss, player);
            } else {
                 if (boss.shieldActive) {
                     boss.shieldActive = false;
                     boss.phase = 'vulnerable';
                     boss.pos.y = 460; 
                     getBossTaunt("My shield! Noooo!").then(setBossMessage);
                 }
                 if (boss.phase === 'hurt') {
                     if (boss.moveTimer > 30) { boss.phase = 'vulnerable'; boss.moveTimer = 0; }
                 } else {
                     boss.phase = 'vulnerable';
                     boss.pos.y = 460;
                 }
            }
        } else if (currentLevel === 3) {
            const speed = 8;
            if (boss.vel.x === 0) boss.vel.x = speed;
            boss.pos.x += boss.vel.x;
            if (boss.pos.x > arenaMax && boss.vel.x > 0) boss.vel.x = -speed;
            if (boss.pos.x < arenaMin && boss.vel.x < 0) boss.vel.x = speed;
            if (boss.moveTimer % 60 === 0) fireProjectile(boss, player, 9);
        } else if (currentLevel === 4) {
            if (boss.phase === 'running_to_mech') {
                boss.vel.x = 5;
                boss.pos.x += boss.vel.x;
                // Target is startX + 300. startX is arenaStartX + 300. So Target is arenaStartX + 600.
                if (boss.pos.x >= boss.arenaStartX + 600) {
                    boss.phase = 'entering_mech';
                    boss.moveTimer = 0;
                    const mech = entitiesRef.current.find(e => e.id === 'mech-empty');
                    if (mech) mech.active = false;
                    boss.width = 100; boss.height = 100; boss.pos.y = 400;
                }
            } else if (boss.phase === 'entering_mech') {
                if (boss.moveTimer > 60) { boss.phase = 'flying_up'; getBossTaunt("Systems Online! Prepare to die!").then(setBossMessage); }
            } else if (boss.phase === 'flying_up') {
                boss.pos.y -= 2;
                if (boss.pos.y < 200) { boss.phase = 'aerial_battle'; boss.moveTimer = 0; }
            } else if (boss.phase === 'aerial_battle' || boss.phase === 'hurt') {
                // Fly around
                boss.pos.x = boss.arenaStartX + 300 + Math.sin(boss.moveTimer * 0.02) * 250;
                boss.pos.y = 200 + Math.cos(boss.moveTimer * 0.03) * 50;
                
                if (boss.moveTimer % 60 === 0) fireProjectile(boss, player, 6);
                if (boss.phase === 'hurt' && boss.moveTimer > 30) boss.phase = 'aerial_battle';
            }
        }

        projectilesRef.current.forEach(proj => {
            proj.pos.x += proj.vel.x;
            proj.pos.y += proj.vel.y;
            proj.life--;
            const isCollidingProj = (
                player.pos.x < proj.pos.x + proj.width &&
                player.pos.x + player.width > proj.pos.x &&
                player.pos.y < proj.pos.y + proj.height &&
                player.pos.y + player.height > proj.pos.y
            );
            if(isCollidingProj) {
                if (player.isSuper || (player.character === 'shadow' && player.abilityActiveTime > 0)) {
                     proj.active = false;
                } else if (player.invulnerableTime <= 0) {
                    handleDamage();
                    proj.active = false;
                }
            }
        });
        projectilesRef.current = projectilesRef.current.filter(p => p.life > 0 && p.active);

        const isCollidingBoss = (
            player.pos.x < boss.pos.x + boss.width &&
            player.pos.x + player.width > boss.pos.x &&
            player.pos.y < boss.pos.y + boss.height &&
            player.pos.y + player.height > boss.pos.y
        );

        if (isCollidingBoss) {
            // Shadow Ability acts like Super for damage
            const isPowerful = player.isSuper || (player.character === 'shadow' && player.abilityActiveTime > 0);

            if (isPowerful) {
                 if (!boss.shieldActive) {
                    boss.hp -= 2;
                    if (currentLevel === 4 && Math.random() < 0.2) {
                        setRings(r => r + 5); 
                        setScore(s => s + 500);
                    }
                    if (boss.hp <= 0 && boss.active) {
                        boss.active = false;
                        setScore(s => s + 10000);
                        getBossTaunt("I can't believe this power!").then(setBossMessage);
                        setTimeout(onLevelComplete, 2000);
                    }
                 }
            } else {
                if (currentLevel === 3) {
                      if (player.vel.y > 0 && player.pos.y < boss.pos.y) {
                            boss.hp -= PLAYER_DAMAGE;
                            player.vel.y = -8;
                            boss.phase = 'hurt';
                      } else if (player.invulnerableTime <= 0) {
                          handleDamage();
                      }
                } else if (currentLevel === 4) {
                     if ((player.isSpinning || player.isJumping) && boss.phase !== 'running_to_mech') {
                         if (boss.phase !== 'hurt') {
                             boss.hp -= PLAYER_DAMAGE;
                             boss.phase = 'hurt'; boss.moveTimer = 0;
                             player.vel.y = -8; player.vel.x = -player.vel.x;
                             setRings(r => r + 2);
                         }
                     } else if (player.invulnerableTime <= 0 && boss.phase !== 'running_to_mech') {
                         handleDamage();
                     }
                } else if (boss.shieldActive) {
                    if (player.invulnerableTime <= 0) {
                        player.vel.x = -player.vel.x * 2;
                        handleDamage();
                    }
                } else {
                    const isJumpAttack = (player.isSpinning || player.isJumping) && player.vel.y > 0;
                    if (isJumpAttack && boss.phase !== 'hurt') {
                        boss.hp -= PLAYER_DAMAGE;
                        boss.phase = 'hurt'; boss.moveTimer = 0;
                        player.vel.y = -8; player.vel.x = -player.vel.x;
                    } else if (player.invulnerableTime <= 0 && boss.phase !== 'hurt') {
                        handleDamage();
                    }
                }
            }
            if (boss.hp <= 0 && boss.active) {
                boss.active = false;
                setScore(s => s + 10000);
                getBossTaunt("Impossible! System Failure!").then(setBossMessage);
                setTimeout(onLevelComplete, 2000);
            }
        }
    }

    if (player.invulnerableTime > 0) player.invulnerableTime--;
    if (player.ringCollectCooldown > 0) player.ringCollectCooldown--;

    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    const targetCamX = player.pos.x - 300;
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;

    if (gameState === GameState.PLAYING && player.pos.x > (currentLevel === 4 ? 4000 : 3200) && !bossRef.current) {
        setGameState(GameState.BOSS_FIGHT);
        spawnBoss();
    }
  }, [gameState, setGameState, setRings, setScore, spawnBoss, setBossMessage, mobileInput, currentLevel, onLevelComplete]);

  // --- Visuals Helper ---
  const drawCharacter = (ctx: CanvasRenderingContext2D, p: Player, x: number, y: number) => {
      const time = frameCountRef.current;
      const isRunning = Math.abs(p.vel.x) > 1;
      const runOffset = isRunning ? Math.sin(time * 0.5) * 5 : 0;
      
      // Determine Colors
      let bodyColor = '#2563eb'; // Sonic Blue
      let shoeColor = '#dc2626'; // Red
      let skinColor = '#fde68a'; // Peach
      let eyeColor = '#fff';
      
      if (p.character === 'shadow') {
          bodyColor = '#1f2937'; // Dark Gray/Black
          skinColor = '#d1d5db'; // Light Gray
      } else if (p.character === 'knuckles') {
          bodyColor = '#dc2626';
          shoeColor = '#facc15'; // Yellow shoes detail
      } else if (p.character === 'silver') {
          bodyColor = '#e5e7eb'; // Silver
          shoeColor = '#3b82f6'; // Blue shoes
      } else if (p.character === 'tails') {
          bodyColor = '#f97316'; // Orange
          skinColor = '#fff';
      } else if (p.character === 'supersonic' || p.isSuper) {
          bodyColor = '#facc15'; // Gold
          shoeColor = '#dc2626';
          // Aura
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(x + 20, y + 20, 35 + Math.sin(time*0.5)*5, 0, Math.PI*2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      }
      
      if (p.isSpinning) {
          ctx.fillStyle = bodyColor;
          ctx.beginPath(); ctx.arc(x + 20, y + 20, 20, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = skinColor; ctx.lineWidth = 2; ctx.stroke();
          return;
      }

      // Draw Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(x + 20, y + 25, 12, 15, 0, 0, Math.PI*2);
      ctx.fill();

      // Draw Head
      ctx.beginPath();
      ctx.arc(x + 20, y + 15, 15, 0, Math.PI*2);
      ctx.fill();

      // Spikes
      ctx.beginPath();
      if (p.character === 'sonic' || p.character === 'supersonic') {
         ctx.moveTo(x+10, y+10); ctx.lineTo(x-5, y+20); ctx.lineTo(x+10, y+25);
         ctx.moveTo(x+10, y+5); ctx.lineTo(x-5, y+5); ctx.lineTo(x+10, y+15);
      } else if (p.character === 'shadow') {
         ctx.moveTo(x+10, y+10); ctx.lineTo(x-5, y+5); ctx.lineTo(x+10, y+15); // Upward spikes
      } else if (p.character === 'knuckles') {
          ctx.moveTo(x+10, y+25); ctx.lineTo(x-5, y+35); ctx.lineTo(x+15, y+30); // Dreadlocks look
      }
      ctx.fill();

      // Face/Muzzle
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(x + 24, y + 18, 8, 0, Math.PI*2); 
      ctx.fill();

      // Eyes
      ctx.fillStyle = eyeColor;
      ctx.beginPath(); ctx.ellipse(x + 22, y + 14, 4, 6, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 28, y + 14, 4, 6, 0.2, 0, Math.PI*2); ctx.fill();
      
      // Pupils
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(x + 23 + (p.facingRight?2:-1), y + 14, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 29 + (p.facingRight?2:-1), y + 14, 1.5, 0, Math.PI*2); ctx.fill();

      // Shoes / Legs
      ctx.lineWidth = 3;
      ctx.strokeStyle = bodyColor;
      // Leg 1
      ctx.beginPath(); ctx.moveTo(x+15, y+35); ctx.lineTo(x+15 - runOffset, y+45); ctx.stroke();
      // Leg 2
      ctx.beginPath(); ctx.moveTo(x+25, y+35); ctx.lineTo(x+25 + runOffset, y+45); ctx.stroke();
      
      // Feet
      ctx.fillStyle = shoeColor;
      ctx.fillRect(x+10 - runOffset, y+43, 10, 5);
      ctx.fillRect(x+20 + runOffset, y+43, 10, 5);
      
      // Arms
      ctx.strokeStyle = skinColor;
      ctx.beginPath(); ctx.moveTo(x+15, y+25); ctx.lineTo(x+10 - runOffset, y+35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+25, y+25); ctx.lineTo(x+30 + runOffset, y+35); ctx.stroke();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (currentLevel === 1) { gradient.addColorStop(0, "#3b82f6"); gradient.addColorStop(1, "#93c5fd"); }
    else if (currentLevel === 2) { gradient.addColorStop(0, "#0891b2"); gradient.addColorStop(1, "#22d3ee"); }
    else if (currentLevel === 3) { gradient.addColorStop(0, "#15803d"); gradient.addColorStop(1, "#86efac"); }
    else { gradient.addColorStop(0, "#1e1b4b"); gradient.addColorStop(1, "#4c1d95"); }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    // Entities Drawing
    entitiesRef.current.forEach(ent => {
        if (ent.type === 'loop') {
             ctx.beginPath(); ctx.arc(ent.pos.x + ent.width/2, ent.pos.y + ent.height/2 - 50, 100, 0, Math.PI * 2);
             ctx.lineWidth = 20; ctx.strokeStyle = '#eab308'; ctx.stroke();
             ctx.beginPath(); ctx.arc(ent.pos.x + ent.width/2, ent.pos.y + ent.height/2 - 50, 90, 0, Math.PI * 2);
             ctx.lineWidth = 2; ctx.strokeStyle = '#713f12'; ctx.stroke();
        } else if (ent.type === 'platform' || ent.type === 'oil') {
            if (currentLevel === 4) {
                 ctx.fillStyle = ent.type === 'oil' ? '#312e81' : '#374151';
                 ctx.fillRect(ent.pos.x, ent.pos.y, ent.width, ent.height);
                 // Hazard stripes for base
                 if (ent.type === 'platform') {
                     ctx.fillStyle = 'rgba(0,0,0,0.3)';
                     for(let i=0; i<ent.width; i+=20) ctx.fillRect(ent.pos.x + i, ent.pos.y, 10, ent.height);
                 }
            } else {
                 ctx.fillStyle = currentLevel === 2 ? '#0e7490' : (currentLevel === 3 ? '#3f6212' : '#166534');
                 ctx.fillRect(ent.pos.x, ent.pos.y, ent.width, ent.height);
                 // Grass top
                 ctx.fillStyle = currentLevel === 2 ? '#67e8f9' : '#84cc16';
                 ctx.fillRect(ent.pos.x, ent.pos.y, ent.width, 10);
            }
        } else if (ent.type === 'ring' && ent.active) {
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ent.pos.x + 10, ent.pos.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
            // Shine
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(ent.pos.x + 8, ent.pos.y + 8, 2, 0, Math.PI*2); ctx.fill();
        } else if (ent.type === 'enemy' && ent.active) {
             ctx.fillStyle = '#ef4444'; // Red body
             ctx.beginPath(); ctx.arc(ent.pos.x + 20, ent.pos.y + 15, 15, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = 'gray'; // Wheel
             ctx.beginPath(); ctx.arc(ent.pos.x + 10, ent.pos.y + 30, 8, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(ent.pos.x + 30, ent.pos.y + 30, 8, 0, Math.PI*2); ctx.fill();
             // Eyes
             ctx.fillStyle = 'white'; ctx.fillRect(ent.pos.x + 10, ent.pos.y + 10, 10, 5);
             ctx.fillStyle = 'black'; ctx.fillRect(ent.pos.x + 12, ent.pos.y + 11, 3, 3);
        } else if (ent.type === 'box' && ent.active) {
             ctx.fillStyle = '#475569'; ctx.fillRect(ent.pos.x, ent.pos.y, ent.width, ent.height);
             ctx.strokeStyle = 'white'; ctx.strokeRect(ent.pos.x, ent.pos.y, ent.width, ent.height);
             // Screen
             ctx.fillStyle = '#3b82f6'; ctx.fillRect(ent.pos.x+5, ent.pos.y+5, 20, 20);
             ctx.fillStyle = 'yellow'; ctx.font = '10px Arial'; ctx.fillText('?', ent.pos.x+12, ent.pos.y+20);
        } else if (ent.type === 'tower' && ent.active) {
             ctx.fillStyle = '#52525b'; ctx.fillRect(ent.pos.x, ent.pos.y, ent.width, ent.height);
             // Structure lines
             ctx.strokeStyle = '#27272a'; ctx.beginPath(); ctx.moveTo(ent.pos.x, ent.pos.y+50); ctx.lineTo(ent.pos.x+ent.width, ent.pos.y+50); ctx.stroke();
             ctx.fillStyle = 'red'; ctx.fillRect(ent.pos.x, ent.pos.y - 10, (ent.hp! / ent.maxHp!) * ent.width, 5);
        }
    });

    if (bossRef.current && bossRef.current.active) {
        const b = bossRef.current;
        if (currentLevel === 3) {
            ctx.fillStyle = '#dc2626'; 
            ctx.fillRect(b.pos.x, b.pos.y+20, b.width, b.height-20); // Car body
            ctx.fillStyle = '#4b5563';
            ctx.beginPath(); ctx.arc(b.pos.x+20, b.pos.y+b.height, 15, 0, Math.PI*2); ctx.fill(); // Wheel
            ctx.beginPath(); ctx.arc(b.pos.x+b.width-20, b.pos.y+b.height, 15, 0, Math.PI*2); ctx.fill();
            // Eggman head
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(b.pos.x+b.width/2, b.pos.y+20, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'orange'; ctx.fillRect(b.pos.x+b.width/2-10, b.pos.y+15, 20, 5); // Mustache
        } else if (currentLevel === 4 && b.phase !== 'running_to_mech') {
             ctx.fillStyle = '#5b21b6'; ctx.beginPath(); ctx.arc(b.pos.x + 50, b.pos.y + 50, 50, 0, Math.PI * 2); ctx.fill();
             // Cockpit
             ctx.fillStyle = '#bef264'; ctx.beginPath(); ctx.arc(b.pos.x + 50, b.pos.y + 40, 20, 0, Math.PI * 2); ctx.fill();
             // Legs
             ctx.strokeStyle = '#4c1d95'; ctx.lineWidth=8; 
             ctx.beginPath(); ctx.moveTo(b.pos.x+20, b.pos.y+80); ctx.lineTo(b.pos.x+10, b.pos.y+120); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(b.pos.x+80, b.pos.y+80); ctx.lineTo(b.pos.x+90, b.pos.y+120); ctx.stroke();
        } else {
            ctx.fillStyle = b.phase === 'hurt' ? '#fca5a5' : '#475569';
            ctx.beginPath(); ctx.arc(b.pos.x + 40, b.pos.y + 40, 40, 0, Math.PI * 2); ctx.fill();
            // Eggmobile detail
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(b.pos.x+40, b.pos.y+40, 40, 0, Math.PI, false); ctx.fill();
            ctx.fillStyle = '#eab308'; ctx.fillRect(b.pos.x+10, b.pos.y+35, 60, 5);
        }
        if (b.shieldActive) {
            ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.pos.x + b.width/2, b.pos.y + b.height/2, 60, 0, Math.PI*2); ctx.stroke();
        }
    }

    // Player (Procedural Sprite)
    const p = playerRef.current;
    if (p.invulnerableTime % 4 < 2) {
        drawCharacter(ctx, p, p.pos.x, p.pos.y);
        
        // Ability Visuals
        if (p.abilityActiveTime > 0) {
             ctx.strokeStyle = p.character === 'shadow' ? '#ef4444' : '#fff';
             ctx.lineWidth = 3;
             ctx.strokeRect(p.pos.x-5, p.pos.y-5, p.width+10, p.height+10);
        }
        if (p.ringCollectCooldown > 0) {
             ctx.strokeStyle = 'red'; ctx.lineWidth = 2; ctx.strokeRect(p.pos.x - 5, p.pos.y - 5, p.width + 10, p.height + 10);
        }
    }
    
    // Projectiles & Particles
    projectilesRef.current.forEach(p => { ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 10, 0, Math.PI*2); ctx.fill(); });
    particlesRef.current.forEach(part => { ctx.fillStyle = part.color; ctx.beginPath(); ctx.arc(part.x, part.y, part.size, 0, Math.PI*2); ctx.fill(); });

    ctx.restore();
  }, [gameState, currentLevel]);

  useEffect(() => { initLevel(); }, [currentLevel, initLevel]);

  useEffect(() => {
    const animate = () => { update(); draw(); requestRef.current = requestAnimationFrame(animate); };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, draw, gameState]);

  return (
    <canvas ref={canvasRef} width={800} height={600} className="w-full max-w-[800px] h-auto border-4 border-gray-800 rounded-lg shadow-2xl bg-black block mx-auto touch-none" />
  );
};