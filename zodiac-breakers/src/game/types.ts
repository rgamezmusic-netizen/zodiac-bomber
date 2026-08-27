export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type ElementType = 'Fire' | 'Earth' | 'Air' | 'Water';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PlayerPath = 'bomb_master' | 'velocity' | 'blast_force' | 'guardian';

export interface PowerBudget {
  offense: number; // 0 - 100
  mobility: number; // 0 - 100
  utility: number; // 0 - 100
  survival: number; // 0 - 100
  total: number; // strictly 100
}

export interface SpecializationPath {
  id: PlayerPath;
  name: string;
  icon: string;
  tagline: string;
  difficulty: number; // 1 - 5 stars
  style: string;
  primaryAdvantage: string;
  secondaryAdvantage: string;
  tradeoff: string;
  powerBudget: PowerBudget;
  stats: ItemStats;
}

export interface ZodiacInfo {
  sign: ZodiacSign;
  name: string;
  symbol: string;
  element: ElementType;
  dateRange: string;
  themeColor: string;
  accentColor: string;
  description: string;
  rarity: 'legendary'; // ALL 12 Zodiac Powers are strictly LEGENDARY
  powerTitle: string; // e.g. "Ram's Ignition", "Venomous Retribution"
  primaryEffect: string; // 1 clear concise sentence
  secondaryEffect: string; // 1 clear concise sentence
  limitation: string; // tradeoff or condition
  keyStats: string[]; // 3-4 concise stat points
  playstyle: string;
  passiveName: string;
  passiveDesc: string;
  activeName: string;
  activeDesc: string;
  activeCooldown: number; // in seconds
  powerBudget: PowerBudget;
  baseHp: number;
  baseSpeed: number;
  baseArmor: number;
  baseBombCount: number;
  baseBombRadius: number;
  baseBombDamage: number;
}

export interface SynergyArchetype {
  id: string;
  name: string;
  icon: string;
  title: string;
  style: string;
  recipe: string[];
  description: string;
  recommendedSigns: ZodiacSign[];
  recommendedPath: PlayerPath;
}

export interface ItemStats {
  hpBonus?: number;
  damageBonus?: number;
  armorBonus?: number;
  speedBonus?: number;
  bombCountBonus?: number;
  bombRadiusBonus?: number;
  cooldownReduction?: number; // 0.1 = 10%
  comboDurationBonus?: number; // in seconds
  critShieldPercent?: number; // grants shield when below critical HP
}

export interface Item {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  icon: string;
  stats: ItemStats;
  elementAffinity?: ElementType;
}

export interface ZodiacCard {
  id: string;
  sign: ZodiacSign;
  name: string;
  rarity: 'legendary';
  type: 'active' | 'passive' | 'ultimate';
  description: string;
  powerTitle: string;
  primaryEffect: string;
  secondaryEffect: string;
  limitation: string;
  cooldown?: number;
  synergyElement?: ElementType;
  stats?: ItemStats;
  abilityKey: string;
  isUnlocked: boolean;
}

export type MatchPhase = 'maze_blocks' | 'portal_warehouse' | 'vault_combat' | 'astral_shop' | 'final_showdown';

export interface SecretDoor {
  id: string;
  gridX: number;
  gridY: number;
  doorNumber: 1 | 2;
  isRevealed: boolean;
  isEntered: boolean;
  name: string;
}

export interface CoinPickup {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  value: number;
  life: number;
  bobPhase: number;
  isGem?: boolean;
}

export interface GreasePuddle {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  radius: number;
  duration: number;
  maxDuration: number;
}

export interface FallingGrease {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  gridX: number;
  gridY: number;
  progress: number;
  duration: number;
}

export interface Meteor {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  gridX: number;
  gridY: number;
  progress: number;
  duration: number;
  radius: number;
  damage: number;
}

export interface AirdropPickup {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  progress: number;
  duration: number;
  isLanded: boolean;
  type: 'shield' | 'heal' | 'super_bomb' | 'speed_boost';
  title: string;
  icon: string;
  color: string;
  bobPhase: number;
  life: number;
}

export interface BankZone {
  ownerId: 'player' | 'bot';
  gridX: number;
  gridY: number;
  widthTiles: number;
  heightTiles: number;
  label: string;
  color: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
  effectKey: 'extra_bomb' | 'shield_boost' | 'speed_boost' | 'damage_boost' | 'heal_maxhp' | 'traction_boots';
  bought: boolean;
}

export interface BombSlot {
  slotIndex: number;
  isReady: boolean;
  rechargeTimer: number; // remaining seconds to recharge
  maxRechargeTime: number; // slot 0: 0s (instant), slot 1: 2.2s, slot 2: 3.3s (+50% penalty)
  isEmpowered: boolean; // if upgraded or has extra power
  powerBonusRadius: number; // extra radius e.g. +1
  powerBonusDamage: number; // extra damage e.g. +18
  activeBombId?: string;
}

export type GameMode = '2v2' | '1v1';

export interface Entity {
  id: string;
  name: string;
  isBot: boolean;
  teamId: 'team_blue' | 'team_red';
  sign: ZodiacSign;
  path?: PlayerPath;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  speed: number;
  armor: number;
  bombCount: number;
  maxBombs: number;
  magazine: BombSlot[];
  bombRadius: number;
  bombDamage: number;
  isAlive: boolean;
  iFrames: number; // remaining invulnerability time
  activeSkillCooldown: number;
  activeSkillMaxCooldown: number;
  isPhasing?: boolean; // Pisces mistwalk
  inventory: Item[];
  equippedCard?: ZodiacCard;
  statusEffects: StatusEffect[];
  // Coin & Shop & Slip Mechanics
  coins: number;
  carriedCoins: number;
  bankedCoins: number;
  slipTimer: number;
  slipVx: number;
  slipVy: number;
  tractionBonus: number;
  hasEnteredDoor: boolean;
}

export interface StatusEffect {
  type: 'poison' | 'slow' | 'speed_boost' | 'shield' | 'stun';
  duration: number;
  magnitude: number;
}

export interface Bomb {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
  ownerId: string;
  ownerSign: ZodiacSign;
  slotIndex?: number;
  isEmpowered?: boolean;
  isScorpioPoison?: boolean;
}

export interface ExplosionSegment {
  gridX: number;
  gridY: number;
  isCenter: boolean;
  dir: 'center' | 'up' | 'down' | 'left' | 'right';
}

export interface Explosion {
  id: string;
  centerGridX: number;
  centerGridY: number;
  segments: ExplosionSegment[];
  duration: number;
  maxDuration: number;
  damage: number;
  ownerId: string;
  ownerSign: ZodiacSign;
  isScorpioPoison?: boolean;
}

export type TileType = 'empty' | 'wall_destructible' | 'wall_indestructible' | 'hazard' | 'spawn';

export interface Tile {
  type: TileType;
  hp: number;
  maxHp: number;
  itemDrop?: Item;
  cracked?: boolean;
}

export interface LootPickup {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  item: Item;
  life: number;
  bobPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'spark' | 'ring' | 'star';
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

export interface ComboState {
  count: number;
  timer: number;
  maxTimer: number;
  multiplier: number;
}

export interface MatchStats {
  winnerId: string | null;
  playerWon: boolean;
  gameMode?: GameMode;
  matchDuration: number;
  damageDealtPlayer: number;
  damageDealtAlly?: number;
  damageDealtBot: number;
  damageDealtBot2?: number;
  wallsDestroyedPlayer: number;
  wallsDestroyedBot: number;
  bombsPlacedPlayer: number;
  lootCollectedPlayer: number;
  maxComboPlayer: number;
  score: number;
  mmrChange: number;
}

export interface RankedPlayer {
  id: string;
  rank: number;
  name: string;
  sign: ZodiacSign;
  path: PlayerPath;
  tier: string;
  mmr: number;
  wins: number;
  losses: number;
  winRate: number;
  matchesPlayed: number;
  favoriteCard: string;
  favoriteItem: string;
  isFollowing: boolean;
  avatarBadge: string;
}

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  sign: ZodiacSign;
  path: PlayerPath;
  element: ElementType;
  title: string;
  tier: string;
  mmr: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  totalDamage: number;
  totalWallsDestroyed: number;
  totalLootCollected: number;
  maxComboEver: number;
  equippedCardId: string;
  inventoryItemIds: string[];
  unlockedCardIds: string[];
  followersCount: number;
  followingIds: string[];
  recentMatches: MatchHistoryEntry[];
  hasCompletedOnboarding?: boolean;
  roomCode?: string;
  language?: 'es' | 'en';
}

export interface MatchHistoryEntry {
  id: string;
  date: string;
  opponentName: string;
  opponentSign: ZodiacSign;
  opponentPath?: PlayerPath;
  won: boolean;
  score: number;
  duration: number;
  maxCombo: number;
  mmrChange: number;
}
