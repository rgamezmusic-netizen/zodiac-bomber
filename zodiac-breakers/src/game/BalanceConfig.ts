/**
 * Central Balance Configuration for Zodiac Breakers
 * All core constants are declared here to ensure single source of truth and easy tuning.
 */

export const BALANCE = {
  // Arena Grid Setup (Grand 2v2 Battle Arena)
  GRID_WIDTH: 27, // 27 columns for grand tactical lanes
  GRID_HEIGHT: 19, // 19 rows for 4-corner multi-team spawns
  TILE_SIZE: 52, // Canvas pixels per tile (Crisp and spacious rendering)

  // 1v1 Classic Grid Setup (optional)
  GRID_WIDTH_1V1: 17,
  GRID_HEIGHT_1V1: 13,

  // Player Baseline
  PLAYER_MAX_HP: 100,
  BASE_SPEED: 210, // Pixels per second
  BASE_ARMOR: 10,
  BASE_BOMB_COUNT: 1,
  BASE_BOMB_RADIUS: 2,
  BASE_BOMB_DAMAGE: 48,
  BASE_IFRAMES_DURATION: 1.0, // Seconds of invulnerability after hit

  // Bomb Timing & Physics
  BOMB_TIMER: 2.7, // Seconds before detonation
  BOMB_EXPLOSION_DURATION: 0.45, // Seconds fire lingers on grid
  BOMB_CHAIN_DELAY: 0.08, // Delay when one explosion triggers another bomb
  BOMB_KNOCKBACK_FORCE: 160,
  BOMB_RELOAD_PRIMARY_TIME: 0.0, // Primary bomb (chamber 1) reloads INSTANTLY as soon as it detonates!
  BOMB_RELOAD_SECONDARY_TIME: 2.2, // 2nd bomb chamber reloads in 2.2s
  BOMB_RELOAD_TERTIARY_TIME: 3.3, // 3rd bomb chamber reloads in 3.3s (+50% penalty)
  EMPOWERED_BOMB_BONUS_RADIUS: 1, // Bonus blast radius for upgraded super bombs
  EMPOWERED_BOMB_BONUS_DAMAGE: 18, // Bonus damage for upgraded super bombs

  // Warehouse Portal & Bank Mechanics
  PORTAL_SOLO_DURATION: 8.0, // Seconds the player has alone in the warehouse before rival enters
  VAULT_COMBAT_DURATION: 10.0, // Exactly 10 seconds of rival arrival + combat coin rush
  COIN_VALUE_GOLD: 15,
  COIN_VALUE_GEM: 45,
  COIN_WEIGHT_MAX_PENALTY: 0.50, // Carried coins slow the player up to -50% speed
  COIN_WEIGHT_CAP_THRESHOLD: 75, // Carrying 75+ coins reaches max weight penalty

  // Final Showdown Sky Hazards & Airdrops
  GREASE_SPAWN_INTERVAL_MIN: 2.5,
  GREASE_SPAWN_INTERVAL_MAX: 4.5,
  GREASE_PUDDLE_DURATION: 7.0,
  GREASE_SLIP_DURATION: 0.52, // Slide duration in seconds
  GREASE_SLIP_SPEED_MULTIPLIER: 1.45, // Sliding momentum boost

  // Meteors from the Sky
  METEOR_SPAWN_INTERVAL_MIN: 3.5,
  METEOR_SPAWN_INTERVAL_MAX: 5.5,
  METEOR_DURATION: 1.3, // Warning target lingers for 1.3s before impact
  METEOR_BLAST_RADIUS: 48,
  METEOR_DAMAGE: 45,

  // Airdrop Power-ups Falling from the Sky
  AIRDROP_SPAWN_INTERVAL_MIN: 6.0,
  AIRDROP_SPAWN_INTERVAL_MAX: 9.5,
  AIRDROP_DURATION: 1.8,
  AIRDROP_LIFETIME: 14.0,

  // Critical HP & Adrenaline Mechanic
  CRITICAL_HP_THRESHOLD: 0.35, // Below 35% HP (35/100)
  ADRENALINE_SPEED_BOOST: 1.22, // +22% speed in critical state
  ADRENALINE_COOLDOWN_BOOST: 1.25, // 25% faster active ability cooldowns

  // Destruction & Loot Mechanics
  WALL_DESTRUCTIBLE_HP: 1,
  LOOT_DROP_CHANCE: 0.65, // 65% chance when breaking a block
  LOOT_PICKUP_RADIUS: 28,
  LOOT_LIFETIME: 18.0, // Seconds before uncollected loot fades

  // Combo System
  COMBO_WINDOW_SECONDS: 3.2,
  COMBO_MAX_MULTIPLIER: 3.5,
  COMBO_LOOT_QUALITY_BOOST_PER_TIER: 0.15,

  // Combat Damage Mitigation Formula
  calculateDamage: (rawDamage: number, armor: number): number => {
    const effectiveArmor = Math.max(0, armor);
    const mitigation = 100 / (100 + effectiveArmor * 1.4);
    return Math.round(rawDamage * mitigation);
  },

  // Bot Tuning
  BOT_REACTION_TIME_MIN: 0.18,
  BOT_REACTION_TIME_MAX: 0.40,
  BOT_DANGER_AVOID_THRESHOLD: 1.8, // Seconds of bomb timer left to flee
  BOT_BOMB_COOLDOWN: 1.4,

  // Match Configuration
  MATCH_TIME_LIMIT: 180, // 3 minutes standard match
  MMR_WIN_BASE: 25,
  MMR_LOSS_BASE: 18,
};

export type BalanceConfig = typeof BALANCE;
