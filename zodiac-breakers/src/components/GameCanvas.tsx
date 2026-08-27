import React, { useEffect, useRef, useState } from 'react';
import { Bomb, Zap, Pause, Crosshair, Coins, ShoppingBag, Sparkles, Swords, AlertTriangle, ArrowDownToLine, Flame, Gift } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { GameRenderer } from '../game/GameRenderer';
import { BombSlot, MatchPhase, MatchStats, ShopItem, UserProfile, ZodiacSign } from '../game/types';
import { ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface GameCanvasProps {
  playerSign: ZodiacSign;
  botSign: ZodiacSign;
  profile: UserProfile;
  onMatchEnd: (stats: MatchStats) => void;
  onExitMatch: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerSign,
  botSign,
  profile,
  onMatchEnd,
  onExitMatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer>(new GameRenderer());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchDirection = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // UI state synchronized with engine
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('maze_blocks');
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(0);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [playerCarriedCoins, setPlayerCarriedCoins] = useState(0);

  const [allyHp, setAllyHp] = useState(100);
  const [allyMaxHp, setAllyMaxHp] = useState(100);
  const [allyShield, setAllyShield] = useState(0);
  const [allySign, setAllySign] = useState<ZodiacSign>('Leo');
  const [allyName, setAllyName] = useState('BOT 2');

  const [botHp, setBotHp] = useState(100);
  const [botMaxHp, setBotMaxHp] = useState(100);
  const [botShield, setBotShield] = useState(0);
  const [botName, setBotName] = useState('BOT 3');

  const [bot2Hp, setBot2Hp] = useState(100);
  const [bot2MaxHp, setBot2MaxHp] = useState(100);
  const [bot2Shield, setBot2Shield] = useState(0);
  const [bot2Sign, setBot2Sign] = useState<ZodiacSign>('Sagittarius');
  const [bot2Name, setBot2Name] = useState('BOT 4');

  const [bombCount, setBombCount] = useState(1);
  const [maxBombs, setMaxBombs] = useState(1);
  const [playerMagazine, setPlayerMagazine] = useState<BombSlot[]>([]);
  const [skillCd, setSkillCd] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [portalSoloTimer, setPortalSoloTimer] = useState(8);
  const [vaultCombatTimer, setVaultCombatTimer] = useState(10);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(0);

  const pInfo = ZODIAC_SIGNS[playerSign];
  const bInfo = ZODIAC_SIGNS[botSign];
  const allyInfo = ZODIAC_SIGNS[allySign];
  const bot2Info = ZODIAC_SIGNS[bot2Sign];

  // Initialize Game Simulation
  useEffect(() => {
    const engine = new GameEngine(
      playerSign,
      botSign,
      profile.equippedCardId,
      profile.path || 'bomb_master',
      'blast_force',
      (stats) => {
        onMatchEnd(stats);
      }
    );

    engineRef.current = engine;
    if (engine.bot) {
      setBotName(engine.bot.name);
    }
    if (engine.ally) {
      setAllySign(engine.ally.sign);
      setAllyName(engine.ally.name);
    }
    if (engine.bot2) {
      setBot2Sign(engine.bot2.sign);
      setBot2Name(engine.bot2.name);
    }
    setShopItems([...engine.shopItems]);
    lastTimeRef.current = performance.now();

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      // Space -> Place Bomb
      if (e.code === 'Space') {
        e.preventDefault();
        if (engineRef.current && !isPaused) {
          engineRef.current.placeBomb(engineRef.current.player);
        }
      }

      // Key E or Key Q -> Trigger Active Skill
      if (e.code === 'KeyE' || e.code === 'KeyQ') {
        e.preventDefault();
        if (engineRef.current && !isPaused) {
          engineRef.current.triggerSkill(engineRef.current.player);
        }
      }

      // Escape -> Pause
      if (e.code === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main 60fps simulation & render loop
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas && !isPaused) {
        // Calculate movement vector from keyboard & touch
        let dirX = 0;
        let dirY = 0;

        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dirY -= 1;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dirY += 1;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dirX -= 1;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dirX += 1;

        if (touchDirection.current.x !== 0 || touchDirection.current.y !== 0) {
          dirX = touchDirection.current.x;
          dirY = touchDirection.current.y;
        }

        // Advance simulation
        engine.update(dt, { x: dirX, y: dirY });

        // Update UI React States
        setMatchPhase(engine.phase);
        setPlayerHp(Math.round(engine.player.hp));
        setPlayerMaxHp(engine.player.maxHp);
        setPlayerShield(Math.round(engine.player.shield));
        setPlayerCoins(engine.player.coins);
        setPlayerCarriedCoins(engine.player.carriedCoins);

        if (engine.ally) {
          setAllyHp(Math.round(engine.ally.hp));
          setAllyMaxHp(engine.ally.maxHp);
          setAllyShield(Math.round(engine.ally.shield));
        }

        setBotHp(Math.round(engine.bot.hp));
        setBotMaxHp(engine.bot.maxHp);
        setBotShield(Math.round(engine.bot.shield));

        if (engine.bot2) {
          setBot2Hp(Math.round(engine.bot2.hp));
          setBot2MaxHp(engine.bot2.maxHp);
          setBot2Shield(Math.round(engine.bot2.shield));
        }

        setBombCount(engine.player.bombCount);
        setMaxBombs(engine.player.maxBombs);
        setPlayerMagazine([...engine.player.magazine]);
        setSkillCd(engine.player.activeSkillCooldown);
        setComboCount(engine.combo.count);
        setTimeRemaining(Math.ceil(engine.matchTimeRemaining));
        setPortalSoloTimer(Math.ceil(engine.portalSoloTimer));
        setVaultCombatTimer(Math.ceil(engine.vaultCombatTimer));
        setShopItems([...engine.shopItems]);
        setInventoryCount(engine.player.inventory.length);

        // Render Canvas Frame
        const ctx = canvas.getContext('2d');
        if (ctx) {
          rendererRef.current.draw(ctx, canvas.width, canvas.height, engine);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerSign, botSign, isPaused, onMatchEnd, profile.equippedCardId]);

  const handlePlaceBombClick = () => {
    if (engineRef.current && !isPaused) {
      engineRef.current.placeBomb(engineRef.current.player);
    }
  };

  const handleSkillClick = () => {
    if (engineRef.current && !isPaused) {
      engineRef.current.triggerSkill(engineRef.current.player);
    }
  };

  const handleBuyShopItem = (itemId: string) => {
    if (engineRef.current) {
      engineRef.current.buyShopItem(itemId);
      setShopItems([...engineRef.current.shopItems]);
      setPlayerCoins(engineRef.current.player.coins);
      setPlayerHp(Math.round(engineRef.current.player.hp));
      setPlayerMaxHp(engineRef.current.player.maxHp);
      setPlayerShield(Math.round(engineRef.current.player.shield));
      setPlayerMagazine([...engineRef.current.player.magazine]);
    }
  };

  const handleStartFinalShowdown = () => {
    if (engineRef.current) {
      engineRef.current.startFinalShowdown();
      setMatchPhase('final_showdown');
    }
  };

  const isPlayerCrit = playerHp <= playerMaxHp * 0.35;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = (timeRemaining % 60).toString().padStart(2, '0');
  const weightSlowPct = Math.min(50, Math.round((playerCarriedCoins / 75) * 50));

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-3 select-none">
      {/* PHASE HEADER BADGE */}
      <div className="w-full max-w-6xl mb-2 flex items-center justify-between gap-3 px-4 py-2 rounded-xl border bg-slate-900/95 border-slate-800 text-xs shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          {matchPhase === 'maze_blocks' && (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Fase 1: Gran Laberinto 2 vs 2 • ¡Rompe bloques con tu aliado y abrid paso a los Portales Secretos 🚪!</span>
            </span>
          )}

          {matchPhase === 'portal_warehouse' && (
            <span className="flex items-center gap-1.5 text-cyan-300 font-black animate-pulse">
              <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
              <span>
                Fase 2: ¡ALMACÉN ASTRAL! Recoge lingotes y guardadlos en las Bóvedas Azules 📥 (Rivales entran en {portalSoloTimer}s)
              </span>
            </span>
          )}

          {matchPhase === 'vault_combat' && (
            <span className="flex items-center gap-1.5 text-rose-400 font-black animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>
                ¡RIVALES EN EL ALMACÉN! ({vaultCombatTimer}s restantes) • ¡Recoged oro y detonad bombas estratégicas!
              </span>
            </span>
          )}

          {matchPhase === 'astral_shop' && (
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>Tienda Cósmica • Gasta tus monedas de equipo en mejoras definitivas</span>
            </span>
          )}

          {matchPhase === 'final_showdown' && (
            <span className="flex items-center gap-2 text-rose-400 font-black tracking-wide">
              <Swords className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>Fase 3: ¡GRAN DUELO 2 vs 2 A MUERTE! ☄️ Meteoritos • 🫧 Grasa Resbaladiza • 🎁 Airdrops</span>
            </span>
          )}
        </div>

        {/* Coins Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {(matchPhase === 'portal_warehouse' || matchPhase === 'vault_combat') && playerCarriedCoins > 0 && (
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded-lg">
              <span>🎒 Carga: {playerCarriedCoins} 🪙 (-{weightSlowPct}% Vel)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 font-bold font-mono text-yellow-400 bg-yellow-950/80 border border-yellow-500/50 px-2.5 py-0.5 rounded-lg">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{playerCoins} Guardadas</span>
          </div>
        </div>
      </div>

      {/* TOP 2v2 TEAM COMBAT HUD */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg items-center">
        {/* WHITE TEAM (Player 1 + Ally) */}
        <div className="md:col-span-2 flex flex-col gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-400/30">
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-white border-b border-slate-700/60 pb-1">
            <span className="flex items-center gap-1.5">⚪ TEAM WHITE</span>
            <span className="font-mono text-slate-400">TÚ & ALIADO</span>
          </div>

          {/* Player 1 Health Bar */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm border bg-slate-950 shrink-0"
              style={{ color: pInfo.themeColor, borderColor: pInfo.themeColor }}
            >
              {pInfo.symbol}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 mb-0.5">
                <span className="truncate text-white font-extrabold">{profile.name} (TÚ)</span>
                <span className="text-slate-400 font-mono">
                  {playerHp > 0 ? `${playerHp}/${playerMaxHp}` : '☠️ CAÍDO'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-150 ${isPlayerCrit ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ally (Player 2 AI) Health Bar */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm border bg-slate-950 shrink-0"
              style={{ color: allyInfo.themeColor, borderColor: allyInfo.themeColor }}
            >
              {allyInfo.symbol}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 mb-0.5">
                <span className="truncate text-slate-300">{allyName} ({allyInfo.sign})</span>
                <span className="text-slate-400 font-mono">
                  {allyHp > 0 ? `${allyHp}/${allyMaxHp}` : '☠️ CAÍDO'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-slate-300 transition-all duration-150"
                  style={{ width: `${Math.max(0, (allyHp / allyMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Match Timer, Combo & 2v2 Badge */}
        <div className="md:col-span-1 flex flex-col items-center justify-center p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-0.5">2 vs 2 ARENA</span>
          <span className="text-lg font-black font-mono text-slate-100">
            {matchPhase === 'portal_warehouse'
              ? `RIVAL ${portalSoloTimer}s`
              : matchPhase === 'vault_combat'
              ? `COMBAT ${vaultCombatTimer}s`
              : matchPhase === 'final_showdown'
              ? '💀 DUELO'
              : `${minutes}:${seconds}`}
          </span>
          {comboCount > 1 ? (
            <span className="text-[10px] font-black uppercase text-amber-400 animate-bounce mt-0.5">
              COMBO x{comboCount}
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 font-semibold uppercase">Mapa Ampliado</span>
          )}
        </div>

        {/* BLACK TEAM (Rival 1 + Rival 2) */}
        <div className="md:col-span-2 flex flex-col gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-300 border-b border-slate-700/60 pb-1">
            <span className="font-mono text-slate-400">RIVALES</span>
            <span className="flex items-center gap-1.5">⚫ TEAM BLACK</span>
          </div>

          {/* Rival 1 (Bot 1) Health Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 mb-0.5">
                <span className="text-slate-400 font-mono">
                  {botHp > 0 ? `${botHp}/${botMaxHp}` : '☠️ CAÍDO'}
                </span>
                <span className="truncate text-rose-300 font-semibold">{botName} ({bInfo.sign})</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-150 ml-auto"
                  style={{ width: `${Math.max(0, (botHp / botMaxHp) * 100)}%` }}
                />
              </div>
            </div>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm border bg-slate-950 shrink-0"
              style={{ color: bInfo.themeColor, borderColor: bInfo.themeColor }}
            >
              {bInfo.symbol}
            </div>
          </div>

          {/* Rival 2 (Bot 2) Health Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 mb-0.5">
                <span className="text-slate-400 font-mono">
                  {bot2Hp > 0 ? `${bot2Hp}/${bot2MaxHp}` : '☠️ CAÍDO'}
                </span>
                <span className="truncate text-rose-300 font-semibold">{bot2Name} ({bot2Info.sign})</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-600 transition-all duration-150 ml-auto"
                  style={{ width: `${Math.max(0, (bot2Hp / bot2MaxHp) * 100)}%` }}
                />
              </div>
            </div>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm border bg-slate-950 shrink-0"
              style={{ color: bot2Info.themeColor, borderColor: bot2Info.themeColor }}
            >
              {bot2Info.symbol}
            </div>
          </div>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative w-full max-w-7xl flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={1404} // 27 tiles * 52px
          height={988} // 19 tiles * 52px
          className="w-full max-h-[72vh] object-contain rounded-xl aspect-[27/19]"
        />

        {/* Adrenaline Critical HP Border Vignette */}
        {isPlayerCrit && (
          <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/40 animate-pulse rounded-xl" />
        )}

        {/* Tactical Rule Notice Pill */}
        <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[10px] font-bold flex items-center gap-1 shadow">
            <span>⚠️ Bombas Rivales: Tiempo Oculto</span>
          </span>
        </div>

        {/* Warehouse Carried Coins Helper Indicator */}
        {(matchPhase === 'portal_warehouse' || matchPhase === 'vault_combat') && playerCarriedCoins > 0 && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-300 flex items-center gap-2 shadow-xl animate-bounce">
            <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
            <span>
              Llevas <strong>{playerCarriedCoins} monedas</strong>. ¡Llévalas a una de las <strong>BÓVEDAS AZULES</strong> en tus esquinas para guardarlas!
            </span>
          </div>
        )}

        {/* ASTRAL SHOP MODAL OVERLAY */}
        {matchPhase === 'astral_shop' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-30 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-100">BÓVEDA & TIENDA ASTRAL (2 vs 2)</h3>
                    <p className="text-xs text-slate-400">
                      Gasta tus monedas en mejoras permanentes antes del Gran Duelo a Muerte.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-950/80 border border-yellow-500/50 rounded-lg text-yellow-300 font-bold font-mono text-sm">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>{playerCoins} Monedas Disponibles</span>
                </div>
              </div>

              {/* Store Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {shopItems.map((item) => {
                  const canAfford = playerCoins >= item.cost;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        item.bought
                          ? 'bg-slate-950/60 border-slate-800 opacity-60'
                          : canAfford
                          ? 'bg-slate-950/90 border-slate-700 hover:border-amber-500/50'
                          : 'bg-slate-950/40 border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0 p-1 bg-slate-900 rounded-lg border border-slate-800">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{item.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                            {item.description}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 mt-1">
                            🪙 {item.cost} Oro
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyShopItem(item.id)}
                        disabled={item.bought || !canAfford}
                        className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                          item.bought
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {item.bought ? 'Adquirido' : 'Comprar'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Ready to Final Showdown Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Ambos equipos se preparan para el combate final.
                </span>
                <button
                  onClick={handleStartFinalShowdown}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Swords className="w-4 h-4" />
                  <span>¡ENTRAR AL DUELO 2 vs 2 A MUERTE!</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-2xl font-black text-slate-100">MATCH PAUSED</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg text-sm transition-all"
              >
                Resume
              </button>
              <button
                onClick={onExitMatch}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-sm transition-all"
              >
                Surrender Match
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MATCH HUD CONTROLS & BOMB MAGAZINE BAR */}
      <div className="w-full max-w-6xl mt-3 flex flex-col gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
        {/* TOP ROW: Magazine Chamber Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              Cargador de Bombas:
            </span>
            <div className="flex items-center gap-2">
              {playerMagazine.map((slot, index) => {
                const reloadProgress =
                  !slot.isReady && slot.rechargeTimer > 0
                    ? Math.max(0, 1 - slot.rechargeTimer / slot.maxRechargeTime)
                    : 0;
                const isPlaced = !slot.isReady && slot.rechargeTimer === 0;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      slot.isReady
                        ? slot.isEmpowered
                          ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 shadow-sm'
                          : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                        : isPlaced
                        ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                        : 'bg-slate-950 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{slot.isEmpowered ? '⚡' : '💣'}</span>
                      <span className="font-mono text-[11px]">
                        Cámara {index + 1}
                        {slot.isEmpowered && <span className="text-amber-400 font-bold ml-1">SUPER</span>}
                      </span>
                    </div>

                    {slot.isReady ? (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        {index === 0 ? 'LISTA (⚡INSTANTÁNEA)' : 'LISTA'}
                      </span>
                    ) : isPlaced ? (
                      <span className="px-1.5 py-0.2 text-[10px] font-medium bg-slate-800 text-slate-400 rounded">
                        EN ARENA
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className={`h-full transition-all duration-100 ${
                              index === 0 ? 'bg-cyan-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${reloadProgress * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {slot.rechargeTimer.toFixed(1)}s
                        </span>
                        {index > 0 && (
                          <span className="text-[9px] text-amber-400/80 font-mono">
                            (+50% t)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-slate-500">Regla de Recarga:</span>
            <span className="font-semibold text-cyan-300">1ª Cámara (¡Instantánea al Explotar!)</span>
            <span className="text-slate-500">• 2ª (+50% t)</span>
          </div>
        </div>

        {/* BOTTOM ROW: Action Buttons & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Bomb & Skill Controls */}
          <div className="flex items-center gap-2">
            {/* Place Bomb Button */}
            <button
              onClick={handlePlaceBombClick}
              disabled={bombCount <= 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow ${
                bombCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Bomb className={`w-4 h-4 ${bombCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
              <span>Colocar Bomba ({bombCount}/{maxBombs})</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-950 border border-slate-700 rounded text-slate-400 font-mono">
                SPACE
              </kbd>
            </button>

            {/* Active Zodiac Skill Button */}
            <button
              onClick={handleSkillClick}
              disabled={skillCd > 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border shadow ${
                skillCd <= 0
                  ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white border-purple-400/50'
                  : 'bg-slate-800/60 text-slate-500 border-slate-800 cursor-not-allowed'
              }`}
            >
              <Zap className={`w-4 h-4 ${skillCd <= 0 ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>
                {pInfo.activeName} {skillCd > 0 ? `(${skillCd.toFixed(1)}s)` : 'LISTO'}
              </span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-950 border border-slate-700 rounded text-slate-400 font-mono">
                E
              </kbd>
            </button>
          </div>

          {/* Right: Collected Items & Pause */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Loot Recogido:</span>
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-cyan-400 font-bold">
                {inventoryCount} Items
              </span>
            </div>

            <button
              onClick={() => setIsPaused(true)}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Pause Match"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
