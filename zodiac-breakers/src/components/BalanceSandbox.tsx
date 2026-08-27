import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Compass,
  Cpu,
  Flame,
  Layers,
  Percent,
  RefreshCw,
  RotateCcw,
  Scale,
  Settings2,
  Shield,
  Sliders,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { BALANCE } from '../game/BalanceConfig';
import { ITEMS_DATABASE } from '../game/ItemRegistry';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { PlayerPath, ZodiacSign } from '../game/types';
import { ELEMENT_COLORS, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

export const BalanceSandbox: React.FC = () => {
  // Global arena sliders
  const [playerHp, setPlayerHp] = useState(BALANCE.PLAYER_MAX_HP);
  const [playerSpeed, setPlayerSpeed] = useState(BALANCE.BASE_SPEED);
  const [bombTimer, setBombTimer] = useState(BALANCE.BOMB_TIMER);
  const [bombDamage, setBombDamage] = useState(BALANCE.BASE_BOMB_DAMAGE);
  const [bombRadius, setBombRadius] = useState(BALANCE.BASE_BOMB_RADIUS);
  const [criticalThreshold, setCriticalThreshold] = useState(BALANCE.CRITICAL_HP_THRESHOLD * 100);
  const [lootDropRate, setLootDropRate] = useState(BALANCE.LOOT_DROP_CHANCE * 100);
  const [comboWindow, setComboWindow] = useState(BALANCE.COMBO_WINDOW_SECONDS);
  const [isSaved, setIsSaved] = useState(false);

  // 1v1 Build Simulator State
  const [signA, setSignA] = useState<ZodiacSign>('Aries');
  const [pathA, setPathA] = useState<PlayerPath>('velocity');
  const [itemA, setItemA] = useState<string>('mercury_boots');

  const [signB, setSignB] = useState<ZodiacSign>('Taurus');
  const [pathB, setPathB] = useState<PlayerPath>('guardian');
  const [itemB, setItemB] = useState<string>('aegis_plating');

  const infoA = ZODIAC_SIGNS[signA];
  const pPathA = SPECIALIZATION_PATHS[pathA];
  const itmA = ITEMS_DATABASE[itemA];

  const infoB = ZODIAC_SIGNS[signB];
  const pPathB = SPECIALIZATION_PATHS[pathB];
  const itmB = ITEMS_DATABASE[itemB];

  // Calculated Stats A
  const hpA = infoA.baseHp + (pPathA.stats.hpBonus || 0) + (itmA?.stats.hpBonus || 0);
  const speedA = infoA.baseSpeed + (pPathA.stats.speedBonus || 0) + (itmA?.stats.speedBonus || 0);
  const armorA = infoA.baseArmor + (pPathA.stats.armorBonus || 0) + (itmA?.stats.armorBonus || 0);
  const dmgA = infoA.baseBombDamage + (pPathA.stats.damageBonus || 0) + (itmA?.stats.damageBonus || 0);
  const radiusA = infoA.baseBombRadius + (pPathA.stats.bombRadiusBonus || 0) + (itmA?.stats.bombRadiusBonus || 0);

  // Calculated Stats B
  const hpB = infoB.baseHp + (pPathB.stats.hpBonus || 0) + (itmB?.stats.hpBonus || 0);
  const speedB = infoB.baseSpeed + (pPathB.stats.speedBonus || 0) + (itmB?.stats.speedBonus || 0);
  const armorB = infoB.baseArmor + (pPathB.stats.armorBonus || 0) + (itmB?.stats.armorBonus || 0);
  const dmgB = infoB.baseBombDamage + (pPathB.stats.damageBonus || 0) + (itmB?.stats.damageBonus || 0);
  const radiusB = infoB.baseBombRadius + (pPathB.stats.bombRadiusBonus || 0) + (itmB?.stats.bombRadiusBonus || 0);

  // Combat Simulation Formulas
  const effectiveDmgAonB = BALANCE.calculateDamage(dmgA, armorB);
  const effectiveDmgBonA = BALANCE.calculateDamage(dmgB, armorA);
  const hitsAtoKillB = Math.ceil(hpB / effectiveDmgAonB);
  const hitsBtoKillA = Math.ceil(hpA / effectiveDmgBonA);

  const applyChanges = () => {
    BALANCE.PLAYER_MAX_HP = playerHp;
    BALANCE.BASE_SPEED = playerSpeed;
    BALANCE.BOMB_TIMER = bombTimer;
    BALANCE.BASE_BOMB_DAMAGE = bombDamage;
    BALANCE.BASE_BOMB_RADIUS = bombRadius;
    BALANCE.CRITICAL_HP_THRESHOLD = criticalThreshold / 100;
    BALANCE.LOOT_DROP_CHANCE = lootDropRate / 100;
    BALANCE.COMBO_WINDOW_SECONDS = comboWindow;

    AudioFX.playUiClick();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const applyPreset = (preset: 'competitive' | 'blitz' | 'siege' | 'chaos') => {
    AudioFX.playUiClick();
    if (preset === 'competitive') {
      setPlayerHp(100);
      setPlayerSpeed(210);
      setBombTimer(2.7);
      setBombDamage(48);
      setBombRadius(2);
      setCriticalThreshold(35);
      setLootDropRate(65);
      setComboWindow(3.2);
    } else if (preset === 'blitz') {
      setPlayerHp(80);
      setPlayerSpeed(260);
      setBombTimer(1.8);
      setBombDamage(65);
      setBombRadius(3);
      setCriticalThreshold(40);
      setLootDropRate(80);
      setComboWindow(2.4);
    } else if (preset === 'siege') {
      setPlayerHp(140);
      setPlayerSpeed(180);
      setBombTimer(3.2);
      setBombDamage(42);
      setBombRadius(2);
      setCriticalThreshold(25);
      setLootDropRate(50);
      setComboWindow(4.0);
    } else if (preset === 'chaos') {
      setPlayerHp(100);
      setPlayerSpeed(280);
      setBombTimer(1.4);
      setBombDamage(80);
      setBombRadius(4);
      setCriticalThreshold(50);
      setLootDropRate(95);
      setComboWindow(5.0);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Developer Balance Lab & Power Budget Matrix
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Zodiac Balance & Combat Matchup Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate 1v1 parity across all 12 Legendary signs, 4 specialization paths, and live-tune core physics.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => applyPreset('competitive')}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-cyan-400"
          >
            Competitive 1v1
          </button>
          <button
            onClick={() => applyPreset('blitz')}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-amber-400"
          >
            Blitz Rush
          </button>
          <button
            onClick={() => applyPreset('siege')}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-emerald-400"
          >
            Siege Tank
          </button>
          <button
            onClick={() => applyPreset('chaos')}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-purple-400"
          >
            Cosmic Chaos
          </button>
        </div>
      </div>

      {/* 1V1 BUILD MATCHUP SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
              1v1 Asymmetric Parity Simulator
            </h2>
          </div>
          <span className="text-[11px] text-amber-300 font-bold">
            Simulated Hits-to-Kill: {hitsAtoKillB} vs {hitsBtoKillA}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* BUILD A (PLAYER) */}
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-cyan-400">Combatant A (Build Setup)</span>
              <span className="text-xs text-slate-400 font-mono">Total Budget: 100/100</span>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Zodiac Sign</label>
                <select
                  value={signA}
                  onChange={(e) => setSignA(e.target.value as ZodiacSign)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.keys(ZODIAC_SIGNS).map((s) => (
                    <option key={s} value={s}>
                      {ZODIAC_SIGNS[s as ZodiacSign].symbol} {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Path</label>
                <select
                  value={pathA}
                  onChange={(e) => setPathA(e.target.value as PlayerPath)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.values(SPECIALIZATION_PATHS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Equipped Item</label>
                <select
                  value={itemA}
                  onChange={(e) => setItemA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.values(ITEMS_DATABASE).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.icon} {it.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Stats Matrix */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">HP</span>
                <span className="text-rose-400 font-mono font-bold text-xs">{hpA}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Speed</span>
                <span className="text-sky-400 font-mono font-bold text-xs">{speedA}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Armor</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{armorA}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Dmg</span>
                <span className="text-amber-400 font-mono font-bold text-xs">{dmgA}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Radius</span>
                <span className="text-purple-400 font-mono font-bold text-xs">{radiusA}T</span>
              </div>
            </div>

            {/* Damage against Opponent */}
            <div className="text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Mitigated Hit on Combatant B:</span>
              <span className="font-mono font-bold text-cyan-400">{effectiveDmgAonB} DMG / bomb ({hitsAtoKillB} to KO)</span>
            </div>
          </div>

          {/* BUILD B (RIVAL) */}
          <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-rose-400">Combatant B (Rival Setup)</span>
              <span className="text-xs text-slate-400 font-mono">Total Budget: 100/100</span>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Zodiac Sign</label>
                <select
                  value={signB}
                  onChange={(e) => setSignB(e.target.value as ZodiacSign)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.keys(ZODIAC_SIGNS).map((s) => (
                    <option key={s} value={s}>
                      {ZODIAC_SIGNS[s as ZodiacSign].symbol} {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Path</label>
                <select
                  value={pathB}
                  onChange={(e) => setPathB(e.target.value as PlayerPath)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.values(SPECIALIZATION_PATHS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Equipped Item</label>
                <select
                  value={itemB}
                  onChange={(e) => setItemB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-bold"
                >
                  {Object.values(ITEMS_DATABASE).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.icon} {it.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Stats Matrix */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">HP</span>
                <span className="text-rose-400 font-mono font-bold text-xs">{hpB}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Speed</span>
                <span className="text-sky-400 font-mono font-bold text-xs">{speedB}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Armor</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{armorB}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Dmg</span>
                <span className="text-amber-400 font-mono font-bold text-xs">{dmgB}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Radius</span>
                <span className="text-purple-400 font-mono font-bold text-xs">{radiusB}T</span>
              </div>
            </div>

            {/* Damage against Opponent */}
            <div className="text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Mitigated Hit on Combatant A:</span>
              <span className="font-mono font-bold text-rose-400">{effectiveDmgBonA} DMG / bomb ({hitsBtoKillA} to KO)</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME ARENA TUNING SLIDERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
              Live Arena Physics & Formula Tuning
            </h2>
          </div>
          <button
            onClick={applyChanges}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow"
          >
            {isSaved ? '✓ Applied Live' : 'Apply Live Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Slider 1: Player HP */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Base Max HP</span>
              <span className="font-mono font-black text-cyan-400">{playerHp} HP</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={playerHp}
              onChange={(e) => setPlayerHp(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Slider 2: Movement Speed */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Base Movement Speed</span>
              <span className="font-mono font-black text-cyan-400">{playerSpeed} px/s</span>
            </div>
            <input
              type="range"
              min={150}
              max={320}
              step={5}
              value={playerSpeed}
              onChange={(e) => setPlayerSpeed(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Slider 3: Bomb Detonation Timer */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Bomb Detonation Timer</span>
              <span className="font-mono font-black text-amber-400">{bombTimer}s</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={4.0}
              step={0.1}
              value={bombTimer}
              onChange={(e) => setBombTimer(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* Slider 4: Bomb Damage */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Base Bomb Damage</span>
              <span className="font-mono font-black text-rose-400">{bombDamage} DMG</span>
            </div>
            <input
              type="range"
              min={25}
              max={100}
              step={2}
              value={bombDamage}
              onChange={(e) => setBombDamage(Number(e.target.value))}
              className="w-full accent-rose-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
