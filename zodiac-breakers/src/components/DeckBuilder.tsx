import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Compass,
  Cpu,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Percent,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { ZODIAC_CARDS_DATABASE } from '../game/CardRegistry';
import { ITEMS_DATABASE, RARITY_CONFIG } from '../game/ItemRegistry';
import { SPECIALIZATION_PATHS, SYNERGY_ARCHETYPES } from '../game/SpecializationRegistry';
import { PlayerPath, UserProfile, ZodiacCard, ZodiacSign } from '../game/types';
import { ELEMENT_COLORS, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface DeckBuilderProps {
  profile: UserProfile;
  onEquipCard: (cardId: string) => void;
  onSelectPath?: (path: PlayerPath) => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  profile,
  onEquipCard,
  onSelectPath,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'paths' | 'synergies' | 'codex' | 'items'>('build');
  const [selectedCardId, setSelectedCardId] = useState<string>(profile.equippedCardId || 'card_aries_prime');
  const [inspectedSign, setInspectedSign] = useState<ZodiacSign>(profile.sign);

  const playerSignInfo = ZODIAC_SIGNS[profile.sign];
  const playerElemColor = ELEMENT_COLORS[playerSignInfo.element];
  const currentPath = profile.path || 'bomb_master';
  const currentPathInfo = SPECIALIZATION_PATHS[currentPath];
  const inspectedSignInfo = ZODIAC_SIGNS[inspectedSign];

  const cardsList = Object.values(ZODIAC_CARDS_DATABASE);
  const itemsList = Object.values(ITEMS_DATABASE);
  const activeCard = ZODIAC_CARDS_DATABASE[selectedCardId] || cardsList[0];

  // Calculate live combined combat stats
  const baseHp = playerSignInfo.baseHp;
  const pathHp = currentPathInfo.stats.hpBonus || 0;
  const cardHp = activeCard.stats?.hpBonus || 0;
  const totalHp = baseHp + pathHp + cardHp;

  const baseSpeed = playerSignInfo.baseSpeed;
  const pathSpeed = currentPathInfo.stats.speedBonus || 0;
  const cardSpeed = activeCard.stats?.speedBonus || 0;
  const totalSpeed = baseSpeed + pathSpeed + cardSpeed;

  const baseArmor = playerSignInfo.baseArmor;
  const pathArmor = currentPathInfo.stats.armorBonus || 0;
  const cardArmor = activeCard.stats?.armorBonus || 0;
  const totalArmor = baseArmor + pathArmor + cardArmor;

  const baseBombs = playerSignInfo.baseBombCount;
  const pathBombs = currentPathInfo.stats.bombCountBonus || 0;
  const cardBombs = activeCard.stats?.bombCountBonus || 0;
  const totalBombs = baseBombs + pathBombs + cardBombs;

  const baseRadius = playerSignInfo.baseBombRadius;
  const pathRadius = currentPathInfo.stats.bombRadiusBonus || 0;
  const cardRadius = activeCard.stats?.bombRadiusBonus || 0;
  const totalRadius = baseRadius + pathRadius + cardRadius;

  const baseDamage = playerSignInfo.baseBombDamage;
  const pathDamage = currentPathInfo.stats.damageBonus || 0;
  const cardDamage = activeCard.stats?.damageBonus || 0;
  const totalDamage = baseDamage + pathDamage + cardDamage;

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
              Identity • Specialization • Build Craft
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ALL 12 LEGENDARY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Zodiac Loadout & Synergy Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            <strong className="text-slate-200">Zodiac = Identity</strong> (Birth Date) •{' '}
            <strong className="text-cyan-300">Path = Specialization</strong> (Playstyle) •{' '}
            <strong className="text-amber-300">Synergy = Mastery</strong>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => {
              AudioFX.playUiClick();
              setActiveTab('build');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'build' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Build Matrix
          </button>
          <button
            onClick={() => {
              AudioFX.playUiClick();
              setActiveTab('paths');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'paths' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4 Specialization Paths
          </button>
          <button
            onClick={() => {
              AudioFX.playUiClick();
              setActiveTab('synergies');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'synergies' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Synergy Archetypes
          </button>
          <button
            onClick={() => {
              AudioFX.playUiClick();
              setActiveTab('codex');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'codex' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12 Legendaries Codex
          </button>
          <button
            onClick={() => {
              AudioFX.playUiClick();
              setActiveTab('items');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'items' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Item Codex
          </button>
        </div>
      </div>

      {/* TAB 1: BUILD MATRIX (CURRENT LOADOUT OVERVIEW) */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Zodiac Identity & Power Budget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                1. Innate Identity
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LEGENDARY CORE
              </span>
            </div>

            <div
              className="p-4 rounded-xl border flex items-center gap-4"
              style={{ backgroundColor: playerElemColor.bg, borderColor: playerElemColor.border }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black border shadow-inner shrink-0"
                style={{
                  color: playerSignInfo.themeColor,
                  borderColor: playerSignInfo.themeColor,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                }}
              >
                {playerSignInfo.symbol}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-100 truncate">{playerSignInfo.name}</h3>
                <span className="text-xs text-amber-300 font-bold block">{playerSignInfo.powerTitle}</span>
                <span className="text-[11px] text-slate-400">
                  {playerSignInfo.element} Element • {playerSignInfo.dateRange}
                </span>
              </div>
            </div>

            {/* Power Mechanics */}
            <div className="space-y-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-emerald-400 font-bold block">Primary Effect:</span>
                <span className="text-slate-300">{playerSignInfo.primaryEffect}</span>
              </div>
              <div>
                <span className="text-sky-400 font-bold block">Secondary Effect:</span>
                <span className="text-slate-300">{playerSignInfo.secondaryEffect}</span>
              </div>
              <div>
                <span className="text-rose-400 font-bold block">Limitation:</span>
                <span className="text-slate-300">{playerSignInfo.limitation}</span>
              </div>
            </div>

            {/* Power Budget Bars */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Power Budget (100 pts)</span>
                <span className="font-mono text-cyan-400">Balanced 1:1</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Offense</span>
                  <span className="text-amber-400 font-mono font-bold">{playerSignInfo.powerBudget.offense}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${playerSignInfo.powerBudget.offense}%` }} />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Mobility</span>
                  <span className="text-sky-400 font-mono font-bold">{playerSignInfo.powerBudget.mobility}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: `${playerSignInfo.powerBudget.mobility}%` }} />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Utility</span>
                  <span className="text-emerald-400 font-mono font-bold">{playerSignInfo.powerBudget.utility}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${playerSignInfo.powerBudget.utility}%` }} />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Survival</span>
                  <span className="text-purple-400 font-mono font-bold">{playerSignInfo.powerBudget.survival}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${playerSignInfo.powerBudget.survival}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Selected Specialization Path */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                2. Specialization Path
              </span>
              <button
                onClick={() => {
                  AudioFX.playUiClick();
                  setActiveTab('paths');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                Change Path
              </button>
            </div>

            <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-900/50 border border-cyan-400 flex items-center justify-center text-3xl shadow shrink-0">
                {currentPathInfo.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-100">{currentPathInfo.name}</h3>
                  <span className="text-xs text-amber-400 font-bold">
                    {'★'.repeat(currentPathInfo.difficulty)}
                  </span>
                </div>
                <span className="text-xs text-cyan-400 font-bold uppercase">{currentPathInfo.style}</span>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{currentPathInfo.tagline}</p>
              </div>
            </div>

            {/* Path Tradeoffs */}
            <div className="space-y-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-medium">
                <span className="font-bold block">Primary Advantage:</span>
                <span>{currentPathInfo.primaryAdvantage}</span>
              </div>
              <div className="text-sky-400 font-medium">
                <span className="font-bold block">Secondary Advantage:</span>
                <span>{currentPathInfo.secondaryAdvantage}</span>
              </div>
              <div className="text-rose-400 font-medium">
                <span className="font-bold block">Trade-off / Penalty:</span>
                <span>{currentPathInfo.tradeoff}</span>
              </div>
            </div>

            {/* Quick Switch Path Bar */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Quick Switch Path</span>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.values(SPECIALIZATION_PATHS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      AudioFX.playUiClick();
                      onSelectPath?.(p.id);
                    }}
                    className={`py-2 px-1 rounded-lg border text-center transition-all ${
                      currentPath === p.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-base leading-none mb-1">{p.icon}</div>
                    <div className="text-[10px] font-bold truncate">{p.name.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Total Arena Combat Stats Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                3. Total Effective Arena Stats
              </span>
              <span className="text-xs text-emerald-400 font-bold">Ready for Match</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
              {/* Stat 1: Max HP */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  Total Vitality (HP)
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseHp}</span>
                  {pathHp !== 0 && <span className={pathHp > 0 ? 'text-emerald-400' : 'text-rose-400'}>{pathHp > 0 ? `+${pathHp}` : pathHp}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalHp} HP</span>
                </div>
              </div>

              {/* Stat 2: Move Speed */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  Sprint Speed
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseSpeed}</span>
                  {pathSpeed !== 0 && <span className={pathSpeed > 0 ? 'text-emerald-400' : 'text-rose-400'}>{pathSpeed > 0 ? `+${pathSpeed}` : pathSpeed}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalSpeed} px/s</span>
                </div>
              </div>

              {/* Stat 3: Armor */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Base Armor
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseArmor}</span>
                  {pathArmor !== 0 && <span className="text-emerald-400">+{pathArmor}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalArmor} Armor</span>
                </div>
              </div>

              {/* Stat 4: Bomb Stock */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Bomb Magazine Stock
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseBombs}</span>
                  {pathBombs !== 0 && <span className="text-emerald-400">+{pathBombs}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalBombs} Bombs</span>
                </div>
              </div>

              {/* Stat 5: Blast Radius */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Primary Blast Radius
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseRadius}</span>
                  {pathRadius !== 0 && <span className="text-emerald-400">+{pathRadius}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalRadius} Tiles</span>
                </div>
              </div>

              {/* Stat 6: Blast Damage */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-rose-500" />
                  Explosion Base Damage
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500">{baseDamage}</span>
                  {pathDamage !== 0 && <span className="text-emerald-400">+{pathDamage}</span>}
                  <span className="text-slate-200 text-sm font-black">= {totalDamage} DMG</span>
                </div>
              </div>
            </div>

            {/* Active Synergy Tag */}
            <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">Identified Synergy Archetype</span>
                <span className="text-xs font-black text-slate-100">
                  {currentPath === 'bomb_master'
                    ? '💣 Demolition Siege Build'
                    : currentPath === 'velocity'
                    ? '⚡ Astral Assassin Build'
                    : currentPath === 'blast_force'
                    ? '💥 Zone Denial Siege Build'
                    : '🛡️ Cosmic Fortress Build'}
                </span>
              </div>
              <button
                onClick={() => {
                  AudioFX.playUiClick();
                  setActiveTab('synergies');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0"
              >
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 4 SPECIALIZATION PATHS IN-DEPTH */}
      {activeTab === 'paths' && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xl font-black text-slate-100">The 4 Specialization Paths</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Every player starts with their birth-derived Zodiac Identity. Your chosen path shapes how your powers materialize inside the arena. Two players with the same Zodiac sign will feel completely distinct when choosing different paths.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SPECIALIZATION_PATHS).map((p) => {
              const isSelected = currentPath === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                    isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-2xl bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shrink-0 shadow">
                          {p.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-100">{p.name}</h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-cyan-500 text-slate-950">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-cyan-400 font-bold uppercase">{p.style}</span>
                        </div>
                      </div>

                      <div className="text-xs text-amber-400 font-bold">
                        {'★'.repeat(p.difficulty)}
                        {'☆'.repeat(5 - p.difficulty)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">{p.tagline}</p>

                    {/* Breakdown */}
                    <div className="mt-3 space-y-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-emerald-400 font-bold block">Primary Advantage:</span>
                        <span className="text-slate-300">{p.primaryAdvantage}</span>
                      </div>
                      <div>
                        <span className="text-sky-400 font-bold block">Secondary Advantage:</span>
                        <span className="text-slate-300">{p.secondaryAdvantage}</span>
                      </div>
                      <div>
                        <span className="text-rose-400 font-bold block">Trade-off Penalty:</span>
                        <span className="text-slate-300">{p.tradeoff}</span>
                      </div>
                    </div>

                    {/* Power budget mini-bar */}
                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block">Offense</span>
                        <span className="text-amber-400 font-bold font-mono">{p.powerBudget.offense}%</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block">Mobility</span>
                        <span className="text-sky-400 font-bold font-mono">{p.powerBudget.mobility}%</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block">Utility</span>
                        <span className="text-emerald-400 font-bold font-mono">{p.powerBudget.utility}%</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block">Survival</span>
                        <span className="text-purple-400 font-bold font-mono">{p.powerBudget.survival}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      AudioFX.playUiClick();
                      onSelectPath?.(p.id);
                    }}
                    disabled={isSelected}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 cursor-default'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg hover:shadow-cyan-500/25'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Currently Equipped</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Equip {p.name} Specialization</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYNERGY ARCHETYPES */}
      {activeTab === 'synergies' && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xl font-black text-slate-100">Synergy Archetype Codex</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Combine your Zodiac Sign's innate power with your Specialization Path to execute game-winning combat strategies in the arena.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYNERGY_ARCHETYPES.map((syn) => {
              const isRecommendedSign = syn.recommendedSigns.includes(profile.sign);
              const isMatchingPath = syn.recommendedPath === currentPath;
              const isFullSynergy = isRecommendedSign && isMatchingPath;

              return (
                <div
                  key={syn.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-3 transition-all ${
                    isFullSynergy
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{syn.icon}</span>
                        <div>
                          <h3 className="text-sm font-black text-slate-100">{syn.name}</h3>
                          <span className="text-[10px] text-cyan-400 font-bold uppercase">{syn.style}</span>
                        </div>
                      </div>

                      {isFullSynergy && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cyan-500 text-slate-950">
                          PERFECT FIT
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{syn.description}</p>

                    {/* Synergy Recipe */}
                    <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Synergy Ingredients:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {syn.recipe.map((rec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-medium text-slate-200"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Recommended Signs:</span>
                    <div className="flex items-center gap-1 font-bold text-slate-200">
                      {syn.recommendedSigns.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {ZODIAC_SIGNS[s].symbol} {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 12 LEGENDARY ZODIACS CODEX */}
      {activeTab === 'codex' && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">The 12 Legendary Zodiac Powers</h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Strict Parity (100 PTS)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                No rarity hierarchies exist. Every astrological sign is Legendary with an identical 100-point total power budget.
              </p>
            </div>

            {/* Quick selector of inspected sign */}
            <div className="flex items-center gap-1 flex-wrap">
              {Object.keys(ZODIAC_SIGNS).map((s) => {
                const isSelected = inspectedSign === s;
                const signData = ZODIAC_SIGNS[s as ZodiacSign];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      AudioFX.playUiClick();
                      setInspectedSign(s as ZodiacSign);
                    }}
                    className={`w-8 h-8 rounded-lg font-black text-sm border transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {signData.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspected Sign Detail Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black border shadow-inner shrink-0"
                  style={{
                    color: inspectedSignInfo.themeColor,
                    borderColor: inspectedSignInfo.themeColor,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  }}
                >
                  {inspectedSignInfo.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-100">{inspectedSignInfo.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      LEGENDARY POWER
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400 font-bold mt-0.5">{inspectedSignInfo.powerTitle}</p>
                  <p className="text-[11px] text-slate-400">
                    {inspectedSignInfo.element} Element • {inspectedSignInfo.dateRange} • Style: {inspectedSignInfo.playstyle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300">
                  Base HP: {inspectedSignInfo.baseHp} • Speed: {inspectedSignInfo.baseSpeed} px/s
                </span>
              </div>
            </div>

            {/* Mechanics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">Primary Advantage:</span>
                <span className="text-slate-200 leading-relaxed">{inspectedSignInfo.primaryEffect}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-sky-400 font-bold block mb-1">Secondary Advantage:</span>
                <span className="text-slate-200 leading-relaxed">{inspectedSignInfo.secondaryEffect}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-rose-400 font-bold block mb-1">Limitation / Tradeoff:</span>
                <span className="text-slate-200 leading-relaxed">{inspectedSignInfo.limitation}</span>
              </div>
            </div>

            {/* Key Stats Bullets */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Key Combat Parameters</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {inspectedSignInfo.keyStats.map((stat, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-200 font-medium">
                    • {stat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ITEMS CODEX */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsList.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-100">{item.name}</h4>
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: RARITY_CONFIG[item.rarity].color }}
                    >
                      {item.rarity} Item
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
