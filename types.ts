
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  BOSS_INTRO = 'BOSS_INTRO',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

export interface Vector {
  x: number;
  y: number;
}

export type CharacterType = 'sonic' | 'tails' | 'knuckles' | 'shadow' | 'silver' | 'supersonic';

export interface Entity {
  id: string;
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
  type: 'player' | 'platform' | 'ring' | 'enemy' | 'loop' | 'boss' | 'projectile' | 'box' | 'tower' | 'oil';
  active: boolean;
  hp?: number; // For towers
  maxHp?: number;
}

export interface Player extends Entity {
  type: 'player';
  character: CharacterType;
  isGrounded: boolean;
  isJumping: boolean;
  isSpinning: boolean;
  facingRight: boolean;
  invulnerableTime: number;
  ringCollectCooldown: number;
  lastLoopExitTime?: number;
  loopState?: {
    active: boolean;
    progress: number;
    centerX: number;
    centerY: number;
    radius: number;
  };
  isSuper: boolean;
  lastStablePos?: Vector;
  
  // Ability Props
  abilityActiveTime: number; // Duration left for active abilities (Shadow)
  abilityCooldown: number;
  lastTapTime: number;
  lastTapKey: string;
}

export interface Boss extends Entity {
  type: 'boss';
  hp: number;
  maxHp: number;
  phase: 'shooting' | 'descending' | 'vulnerable' | 'ascending' | 'hurt' | 'shielded' | 'driving' | 'running_to_mech' | 'entering_mech' | 'flying_up' | 'aerial_battle';
  moveTimer: number;
  arenaStartX: number; // To keep him in the zone
  shieldActive: boolean; // For Level 2
}

export interface Projectile extends Entity {
  type: 'projectile';
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export type Language = 'en' | 'pt';

export interface GameSettings {
  language: Language;
  mobileMode: boolean;
}

export interface MobileInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}
