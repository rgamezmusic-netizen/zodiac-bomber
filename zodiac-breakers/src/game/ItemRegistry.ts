import { Item, ItemRarity } from './types';

export const ITEMS_DATABASE: Record<string, Item> = {
  // COMMON ITEMS
  astral_spark: {
    id: 'astral_spark',
    name: 'Astral Spark',
    rarity: 'common',
    description: '+1 Maximum Bomb capacity.',
    icon: '💣',
    stats: { bombCountBonus: 1 },
  },
  pyro_prism: {
    id: 'pyro_prism',
    name: 'Pyro Prism',
    rarity: 'common',
    description: '+1 Explosion Blast Radius.',
    icon: '💥',
    stats: { bombRadiusBonus: 1 },
  },
  mercury_boots: {
    id: 'mercury_boots',
    name: 'Mercury Boots',
    rarity: 'common',
    description: '+12 Movement Speed.',
    icon: '👟',
    stats: { speedBonus: 12 },
  },
  meteor_fragment: {
    id: 'meteor_fragment',
    name: 'Meteor Fragment',
    rarity: 'common',
    description: '+15 Max HP and instantly heals 15 HP.',
    icon: '❤️',
    stats: { hpBonus: 15 },
  },
  celestial_shard: {
    id: 'celestial_shard',
    name: 'Celestial Shard',
    rarity: 'common',
    description: '+8 Armor (Mitigates blast and enemy damage).',
    icon: '🛡️',
    stats: { armorBonus: 8 },
  },

  // RARE ITEMS
  stellar_accelerator: {
    id: 'stellar_accelerator',
    name: 'Stellar Accelerator',
    rarity: 'rare',
    description: '+18 Speed and +1.0s to Combo Window duration.',
    icon: '⚡',
    stats: { speedBonus: 18, comboDurationBonus: 1.0 },
  },
  supernova_core: {
    id: 'supernova_core',
    name: 'Supernova Core',
    rarity: 'rare',
    description: '+2 Blast Radius and +12 Bomb Damage.',
    icon: '🔥',
    stats: { bombRadiusBonus: 2, damageBonus: 12 },
  },
  aegis_plating: {
    id: 'aegis_plating',
    name: 'Aegis Plating',
    rarity: 'rare',
    description: '+25 Max HP and +15 Armor.',
    icon: '🔰',
    stats: { hpBonus: 25, armorBonus: 15 },
  },
  chronos_hourglass: {
    id: 'chronos_hourglass',
    name: 'Chronos Hourglass',
    rarity: 'rare',
    description: 'Reduces Active Ability cooldown by 20%.',
    icon: '⏳',
    stats: { cooldownReduction: 0.20 },
  },

  // EPIC ITEMS
  phoenix_tether: {
    id: 'phoenix_tether',
    name: 'Phoenix Tether',
    rarity: 'epic',
    description: 'When dropping below 35% HP, instantly gains a 35 HP protective barrier.',
    icon: '🦅',
    stats: { critShieldPercent: 35, hpBonus: 20 },
  },
  void_catalyst: {
    id: 'void_catalyst',
    name: 'Void Catalyst',
    rarity: 'epic',
    description: '+2 Bombs, +1 Radius, and +15% cooldown speed.',
    icon: '🔮',
    stats: { bombCountBonus: 2, bombRadiusBonus: 1, cooldownReduction: 0.15 },
  },

  // LEGENDARY ITEMS
  astral_dominion_crown: {
    id: 'astral_dominion_crown',
    name: 'Crown of Astral Dominion',
    rarity: 'legendary',
    description: '+50 HP, +20 Armor, +2 Bombs, +2 Radius, and +15 Speed.',
    icon: '👑',
    stats: {
      hpBonus: 50,
      armorBonus: 20,
      bombCountBonus: 2,
      bombRadiusBonus: 2,
      speedBonus: 15,
      cooldownReduction: 0.25,
    },
  },
};

export const RARITY_CONFIG: Record<ItemRarity, { label: string; color: string; bg: string; border: string }> = {
  common: { label: 'Common', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', border: '#475569' },
  rare: { label: 'Rare', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: '#0284C7' },
  epic: { label: 'Epic', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: '#7E22CE' },
  legendary: { label: 'Legendary', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)', border: '#B45309' },
};

/**
 * Returns a weighted random item based on combo multiplier and tier probabilities.
 */
export function getRandomLootItem(comboTier = 1): Item {
  const roll = Math.random();
  const comboBonus = Math.min(0.35, (comboTier - 1) * 0.08);

  if (roll < 0.03 + comboBonus * 0.15) {
    return ITEMS_DATABASE['astral_dominion_crown'];
  } else if (roll < 0.15 + comboBonus * 0.3) {
    const epicKeys = ['phoenix_tether', 'void_catalyst'];
    const key = epicKeys[Math.floor(Math.random() * epicKeys.length)];
    return ITEMS_DATABASE[key];
  } else if (roll < 0.45 + comboBonus * 0.3) {
    const rareKeys = ['stellar_accelerator', 'supernova_core', 'aegis_plating', 'chronos_hourglass'];
    const key = rareKeys[Math.floor(Math.random() * rareKeys.length)];
    return ITEMS_DATABASE[key];
  } else {
    const commonKeys = ['astral_spark', 'pyro_prism', 'mercury_boots', 'meteor_fragment', 'celestial_shard'];
    const key = commonKeys[Math.floor(Math.random() * commonKeys.length)];
    return ITEMS_DATABASE[key];
  }
}
