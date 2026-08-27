import { MatchHistoryEntry, PlayerPath, RankedPlayer, UserProfile, ZodiacSign } from './types';
import { getZodiacSignFromDate, ZODIAC_SIGNS } from './ZodiacRegistry';

const PROFILE_KEY = 'zodiac_breakers_user_profile_v2';
const LADDER_KEY = 'zodiac_breakers_ranked_ladder_v2';

export const DEFAULT_LEADERBOARD: RankedPlayer[] = [
  {
    id: 'rank_1',
    rank: 1,
    name: 'Astraea_Prime',
    sign: 'Virgo',
    path: 'bomb_master',
    tier: 'Celestial Grandmaster',
    mmr: 2840,
    wins: 142,
    losses: 18,
    winRate: 88.7,
    matchesPlayed: 160,
    favoriteCard: 'Calculated Demolition',
    favoriteItem: 'Crown of Astral Dominion',
    isFollowing: false,
    avatarBadge: '👑',
  },
  {
    id: 'rank_2',
    rank: 2,
    name: 'Solaris_Rex',
    sign: 'Leo',
    path: 'blast_force',
    tier: 'Celestial Master',
    mmr: 2690,
    wins: 128,
    losses: 25,
    winRate: 83.6,
    matchesPlayed: 153,
    favoriteCard: 'Solar Dominance',
    favoriteItem: 'Supernova Core',
    isFollowing: false,
    avatarBadge: '♌',
  },
  {
    id: 'rank_3',
    rank: 3,
    name: 'VortexGhost',
    sign: 'Aquarius',
    path: 'bomb_master',
    tier: 'Celestial Master',
    mmr: 2540,
    wins: 115,
    losses: 29,
    winRate: 79.8,
    matchesPlayed: 144,
    favoriteCard: 'Cosmic Singularity',
    favoriteItem: 'Void Catalyst',
    isFollowing: false,
    avatarBadge: '♒',
  },
  {
    id: 'rank_4',
    rank: 4,
    name: 'VenomStrike',
    sign: 'Scorpio',
    path: 'velocity',
    tier: 'Astral Diamond',
    mmr: 2410,
    wins: 104,
    losses: 34,
    winRate: 75.3,
    matchesPlayed: 138,
    favoriteCard: 'Venomous Retribution',
    favoriteItem: 'Mercury Boots',
    isFollowing: false,
    avatarBadge: '♏',
  },
  {
    id: 'rank_5',
    rank: 5,
    name: 'TitanAegis',
    sign: 'Taurus',
    path: 'guardian',
    tier: 'Astral Diamond',
    mmr: 2320,
    wins: 98,
    losses: 37,
    winRate: 72.5,
    matchesPlayed: 135,
    favoriteCard: 'Bastion of the Bull',
    favoriteItem: 'Aegis Plating',
    isFollowing: false,
    avatarBadge: '♉',
  },
  {
    id: 'rank_6',
    rank: 6,
    name: 'PyroClast',
    sign: 'Aries',
    path: 'velocity',
    tier: 'Astral Diamond',
    mmr: 2260,
    wins: 92,
    losses: 41,
    winRate: 69.1,
    matchesPlayed: 133,
    favoriteCard: "Ram's Ignition",
    favoriteItem: 'Pyro Prism',
    isFollowing: false,
    avatarBadge: '♈',
  },
  {
    id: 'rank_7',
    rank: 7,
    name: 'ShadowGemini',
    sign: 'Gemini',
    path: 'bomb_master',
    tier: 'Astral Platinum',
    mmr: 2150,
    wins: 85,
    losses: 45,
    winRate: 65.3,
    matchesPlayed: 130,
    favoriteCard: 'Twin Mirage Engine',
    favoriteItem: 'Astral Spark',
    isFollowing: false,
    avatarBadge: '♊',
  },
  {
    id: 'rank_8',
    rank: 8,
    name: 'TideWeaver',
    sign: 'Pisces',
    path: 'velocity',
    tier: 'Astral Platinum',
    mmr: 2080,
    wins: 80,
    losses: 48,
    winRate: 62.5,
    matchesPlayed: 128,
    favoriteCard: 'Dreamstride Evasion',
    favoriteItem: 'Stellar Accelerator',
    isFollowing: false,
    avatarBadge: '♓',
  },
  {
    id: 'rank_9',
    rank: 9,
    name: 'ZenithBow',
    sign: 'Sagittarius',
    path: 'velocity',
    tier: 'Astral Platinum',
    mmr: 1990,
    wins: 76,
    losses: 52,
    winRate: 59.3,
    matchesPlayed: 128,
    favoriteCard: 'Celestial Ballista',
    favoriteItem: 'Mercury Boots',
    isFollowing: false,
    avatarBadge: '♐',
  },
  {
    id: 'rank_10',
    rank: 10,
    name: 'MoonCrab',
    sign: 'Cancer',
    path: 'guardian',
    tier: 'Astral Gold',
    mmr: 1910,
    wins: 71,
    losses: 55,
    winRate: 56.3,
    matchesPlayed: 126,
    favoriteCard: 'Lunar Carapace',
    favoriteItem: 'Phoenix Tether',
    isFollowing: false,
    avatarBadge: '♋',
  },
];

export function getRankTierFromMMR(mmr: number): string {
  if (mmr >= 2600) return 'Celestial Grandmaster';
  if (mmr >= 2400) return 'Celestial Master';
  if (mmr >= 2100) return 'Astral Diamond';
  if (mmr >= 1800) return 'Astral Platinum';
  if (mmr >= 1500) return 'Astral Gold';
  if (mmr >= 1200) return 'Astral Silver';
  return 'Astral Bronze';
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.path) {
        parsed.path = 'bomb_master';
      }
      return parsed;
    }
  } catch {
    // fallback
  }

  // Initial default profile
  const defaultSign: ZodiacSign = 'Aries';
  const info = ZODIAC_SIGNS[defaultSign];
  return {
    name: 'StarlightBreaker',
    birthDate: '2000-04-10',
    sign: defaultSign,
    path: 'bomb_master',
    element: info.element,
    title: 'Astral Initiate',
    tier: 'Astral Bronze',
    mmr: 1000,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    totalDamage: 0,
    totalWallsDestroyed: 0,
    totalLootCollected: 0,
    maxComboEver: 0,
    equippedCardId: 'card_aries_prime',
    inventoryItemIds: ['astral_spark'],
    unlockedCardIds: [
      'card_aries_prime',
      'card_taurus_aegis',
      'card_gemini_echo',
      'card_cancer_carapace',
      'card_leo_corona',
      'card_virgo_matrix',
      'card_libra_balance',
      'card_scorpio_venom',
      'card_sagittarius_arrow',
      'card_capricorn_colossus',
      'card_aquarius_vortex',
      'card_pisces_dream',
    ],
    hasCompletedOnboarding: false,
    roomCode: 'ASTRAL-7',
    language: 'es',
    followersCount: 14,
    followingIds: [],
    recentMatches: [],
  };
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to persist profile:', err);
  }
}

export function loadLeaderboard(): RankedPlayer[] {
  try {
    const raw = localStorage.getItem(LADDER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEFAULT_LEADERBOARD;
}

export function saveLeaderboard(ladder: RankedPlayer[]): void {
  try {
    localStorage.setItem(LADDER_KEY, JSON.stringify(ladder));
  } catch (err) {
    console.error('Failed to persist ladder:', err);
  }
}

export function recordMatchResult(
  profile: UserProfile,
  won: boolean,
  opponentName: string,
  opponentSign: ZodiacSign,
  opponentPath: PlayerPath,
  score: number,
  duration: number,
  damageDealt: number,
  wallsDestroyed: number,
  lootCollected: number,
  maxCombo: number,
  mmrChange: number
): UserProfile {
  const updated = { ...profile };

  updated.matchesPlayed++;
  if (won) {
    updated.wins++;
  } else {
    updated.losses++;
  }

  updated.mmr = Math.max(100, updated.mmr + mmrChange);
  updated.tier = getRankTierFromMMR(updated.mmr);
  updated.totalDamage += damageDealt;
  updated.totalWallsDestroyed += wallsDestroyed;
  updated.totalLootCollected += lootCollected;
  updated.maxComboEver = Math.max(updated.maxComboEver, maxCombo);

  // New history entry
  const entry: MatchHistoryEntry = {
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    opponentName,
    opponentSign,
    opponentPath,
    won,
    score,
    duration: Math.round(duration),
    maxCombo,
    mmrChange,
  };

  updated.recentMatches = [entry, ...updated.recentMatches.slice(0, 9)];
  saveUserProfile(updated);
  return updated;
}

export function updateProfileBirthdateAndPath(
  profile: UserProfile,
  name: string,
  birthDate: string,
  path: PlayerPath
): UserProfile {
  const parts = birthDate.split('-');
  let sign: ZodiacSign = profile.sign;

  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(m) && !isNaN(d)) {
      sign = getZodiacSignFromDate(m, d);
    }
  }

  const info = ZODIAC_SIGNS[sign];
  const updated: UserProfile = {
    ...profile,
    name: name.trim() || profile.name,
    birthDate,
    sign,
    path,
    element: info.element,
    hasCompletedOnboarding: true,
  };

  saveUserProfile(updated);
  return updated;
}

export function updateProfileLanguage(profile: UserProfile, language: 'es' | 'en'): UserProfile {
  const updated: UserProfile = {
    ...profile,
    language,
  };
  saveUserProfile(updated);
  return updated;
}

export function syncRankingWithMatch(
  currentLadder: RankedPlayer[],
  playerProfile: UserProfile,
  opponentSign: ZodiacSign,
  playerWon: boolean
): RankedPlayer[] {
  const ladderCopy = currentLadder.map((p) => ({ ...p }));

  // Find opponent in ladder if exists or pick a bot
  const oppIndex = ladderCopy.findIndex((p) => p.sign === opponentSign);
  if (oppIndex !== -1) {
    if (playerWon) {
      ladderCopy[oppIndex].losses += 1;
      ladderCopy[oppIndex].mmr = Math.max(100, ladderCopy[oppIndex].mmr - 18);
    } else {
      ladderCopy[oppIndex].wins += 1;
      ladderCopy[oppIndex].mmr += 24;
    }
    ladderCopy[oppIndex].matchesPlayed += 1;
    ladderCopy[oppIndex].winRate = Number(
      ((ladderCopy[oppIndex].wins / ladderCopy[oppIndex].matchesPlayed) * 100).toFixed(1)
    );
    ladderCopy[oppIndex].tier = getRankTierFromMMR(ladderCopy[oppIndex].mmr);
  }

  // Ensure player is ranked or insert player
  const playerInLadderIdx = ladderCopy.findIndex((p) => p.id === 'player_self');
  const playerEntry: RankedPlayer = {
    id: 'player_self',
    rank: 1,
    name: playerProfile.name,
    sign: playerProfile.sign,
    path: playerProfile.path,
    tier: playerProfile.tier,
    mmr: playerProfile.mmr,
    wins: playerProfile.wins,
    losses: playerProfile.losses,
    winRate:
      playerProfile.matchesPlayed > 0
        ? Number(((playerProfile.wins / playerProfile.matchesPlayed) * 100).toFixed(1))
        : 0,
    matchesPlayed: playerProfile.matchesPlayed,
    favoriteCard: playerProfile.equippedCardId,
    favoriteItem: playerProfile.inventoryItemIds[0] || 'Astral Spark',
    isFollowing: false,
    avatarBadge: ZODIAC_SIGNS[playerProfile.sign]?.symbol || '⭐',
  };

  if (playerInLadderIdx !== -1) {
    ladderCopy[playerInLadderIdx] = playerEntry;
  } else {
    ladderCopy.push(playerEntry);
  }

  // Sort by MMR descending
  ladderCopy.sort((a, b) => b.mmr - a.mmr);

  // Re-assign ranks 1..N
  ladderCopy.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  saveLeaderboard(ladderCopy);
  return ladderCopy;
}
