import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Flame,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Share2,
  Shield,
  Sparkles,
  Swords,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { DICTIONARY, Language } from '../game/i18n';
import {
  multiplayerManager,
  PlayerSession,
  RoomState,
} from '../game/MultiplayerManager';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { PlayerPath, UserProfile, ZodiacSign } from '../game/types';
import { ELEMENT_COLORS, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface LobbyViewProps {
  profile: UserProfile;
  onStartMatch2v2: (
    team: 'team_blue' | 'team_red',
    slot: number,
    roomState?: RoomState | null
  ) => void;
  onUpdateProfile: (sign: ZodiacSign, path: PlayerPath) => void;
  initialRoomCode?: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  onStartMatch2v2,
  onUpdateProfile,
  initialRoomCode = 'ASTRAL-7',
}) => {
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode.toUpperCase());
  const [roomInput, setRoomInput] = useState<string>(initialRoomCode.toUpperCase());
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(true);
  const [fillBots, setFillBots] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<0 | 1 | 2 | 3>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const lang: Language = profile.language || 'es';
  const t = DICTIONARY[lang];

  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  // Connect and join room on mount or when roomCode changes
  useEffect(() => {
    let isMounted = true;
    setIsConnecting(true);

    multiplayerManager
      .joinRoom(
        roomCode,
        profile.name,
        profile.sign,
        profile.path,
        profile.equippedCardId
      )
      .then(() => {
        if (isMounted) setIsConnecting(false);
      })
      .catch((err) => {
        console.warn('Fallback to local offline lobby mode:', err);
        if (isMounted) setIsConnecting(false);
      });

    const unsubRoom = multiplayerManager.onRoomState((state) => {
      if (isMounted) {
        setRoomState(state);
        setFillBots(state.fillBots);
        if (
          multiplayerManager.localPlayerId &&
          state.players[multiplayerManager.localPlayerId]
        ) {
          const p = state.players[multiplayerManager.localPlayerId];
          setSelectedSlot(p.slot);
          setIsReady(p.isReady);
        }
      }
    });

    const unsubStart = multiplayerManager.onGameStart((data) => {
      if (isMounted) {
        AudioFX.playVictory();
        const team = selectedSlot < 2 ? 'team_blue' : 'team_red';
        onStartMatch2v2(team, selectedSlot, roomState);
      }
    });

    return () => {
      isMounted = false;
      unsubRoom();
      unsubStart();
    };
  }, [roomCode, profile.name, profile.sign, profile.path]);

  const handleCopyInvite = () => {
    AudioFX.playUiClick();
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSwitchSlot = (targetSlot: 0 | 1 | 2 | 3) => {
    AudioFX.playUiClick();
    setSelectedSlot(targetSlot);
    multiplayerManager.switchSlot(targetSlot);
  };

  const handleToggleReady = () => {
    AudioFX.playUiClick();
    const nextReady = !isReady;
    setIsReady(nextReady);
    multiplayerManager.setReady(nextReady);
  };

  const handleToggleBots = () => {
    AudioFX.playUiClick();
    const nextVal = !fillBots;
    setFillBots(nextVal);
    multiplayerManager.toggleBots(nextVal);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    AudioFX.playUiClick();
    multiplayerManager.sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleJoinNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = roomInput.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
    if (cleaned && cleaned !== roomCode) {
      AudioFX.playUiClick();
      setRoomCode(cleaned);
    }
  };

  const handleLaunchGame = () => {
    AudioFX.playVictory();
    if (roomState && Object.keys(roomState.players).length > 1) {
      multiplayerManager.startGame();
    } else {
      // Local 2v2 match with smart bots
      const team = selectedSlot < 2 ? 'team_blue' : 'team_red';
      onStartMatch2v2(team, selectedSlot, roomState);
    }
  };

  // Build slot occupancy representation
  const playersBySlot: Record<number, PlayerSession | null> = {
    0: null,
    1: null,
    2: null,
    3: null,
  };

  if (roomState) {
    Object.values(roomState.players).forEach((p: PlayerSession) => {
      playersBySlot[p.slot] = p;
    });
  } else {
    // Local preview slot
    playersBySlot[selectedSlot] = {
      id: 'local',
      name: profile.name,
      sign: profile.sign,
      path: profile.path,
      team: selectedSlot < 2 ? 'team_blue' : 'team_red',
      slot: selectedSlot,
      isReady: isReady,
      isHost: true,
      ping: 0,
    };
  }

  const isHost =
    !roomState ||
    (multiplayerManager.localPlayerId &&
      roomState.hostId === multiplayerManager.localPlayerId);

  const whiteSlots: (0 | 1)[] = [0, 1];
  const blackSlots: (2 | 3)[] = [2, 3];

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* TOP HEADER: ROOM CODE & 1-CLICK INVITATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-black uppercase rounded-full bg-slate-950 border border-cyan-500/40 text-cyan-400">
              {lang === 'es' ? 'Lobby 2 vs 2 Multijugador' : '2 vs 2 Multiplayer Lobby'}
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {lang === 'es' ? 'Servidor Activo' : 'Live Server'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {lang === 'es' ? 'Sala' : 'Room'}: <strong className="text-slate-100">{roomCode}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <span>{t.lobbyTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {lang === 'es'
              ? 'Invita a tus amigos con la carta de invitación. Elige tu equipo: ⚪ Team White o ⚫ Team Black.'
              : 'Invite your friends using the invitation link. Choose your squad: ⚪ Team White or ⚫ Team Black.'}
          </p>
        </div>

        {/* INVITATION LINK 1-CLICK CARD */}
        <div className="w-full lg:w-auto bg-slate-950 p-4 rounded-xl border border-cyan-500/30 flex flex-col gap-2 shadow-lg z-10 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              {t.lobbyInviteCard}
            </span>
            {isCopied && (
              <span className="text-[10px] font-bold text-emerald-400 animate-in fade-in flex items-center gap-1">
                <Check className="w-3 h-3" /> {t.lobbyLinkCopied}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-300 truncate max-w-[240px] sm:max-w-[320px]">
              {inviteUrl}
            </span>
            <button
              onClick={handleCopyInvite}
              className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95 shadow'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? t.lobbyLinkCopied : t.lobbyCopyBtn}</span>
            </button>
          </div>

          <form onSubmit={handleJoinNewRoom} className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              placeholder={lang === 'es' ? 'Código de Sala' : 'Room Code'}
              maxLength={12}
              className="bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-200 font-mono w-32 uppercase focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition-colors"
            >
              {lang === 'es' ? 'Cambiar Sala' : 'Change Room'}
            </button>
          </form>
        </div>
      </div>

      {/* 2 TEAMS CONTAINER: TEAM WHITE (⚪) VS TEAM BLACK (⚫) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEAM WHITE ⚪ */}
        <div className="bg-slate-900/90 border-2 border-slate-300/30 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white shadow-md shadow-white/50 border border-slate-300" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {t.lobbyTeamWhite}
              </h2>
            </div>
            <button
              onClick={() => handleSwitchSlot(0)}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-lg shadow transition-all active:scale-95 flex items-center gap-1"
            >
              <span>⚪ {t.lobbyMoveWhite}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {whiteSlots.map((slotNum) => {
              const p = playersBySlot[slotNum];
              const isLocal =
                p &&
                (p.id === 'local' ||
                  p.id === multiplayerManager.localPlayerId);
              const zInfo = p ? ZODIAC_SIGNS[p.sign] : null;
              const pathInfo = p ? SPECIALIZATION_PATHS[p.path] : null;

              return (
                <div
                  key={slotNum}
                  onClick={() => !p && handleSwitchSlot(slotNum)}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[145px] ${
                    p
                      ? isLocal
                        ? 'bg-slate-950 border-white ring-1 ring-white/50 shadow-lg'
                        : 'bg-slate-950 border-slate-700'
                      : 'bg-slate-950/50 border-dashed border-slate-700 hover:border-white/50 cursor-pointer flex items-center justify-center text-center'
                  }`}
                >
                  {p ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xl border shadow"
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              color: zInfo?.themeColor,
                              borderColor: zInfo?.themeColor,
                            }}
                          >
                            {zInfo?.symbol}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-slate-100 truncate max-w-[120px]">
                                {p.name}
                              </span>
                              {isLocal && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-white text-slate-950">
                                  {lang === 'es' ? 'TÚ' : 'YOU'}
                                </span>
                              )}
                              {p.isHost && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {zInfo?.name} • {pathInfo?.name}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            p.isReady
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {p.isReady ? t.lobbyReadyState : t.lobbyWaitingState}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{t.lobbySlotLabel} {slotNum + 1} (Team White)</span>
                        <span className="text-cyan-400 font-semibold">{pathInfo?.icon} {pathInfo?.style}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-3 text-slate-400">
                      <span className="text-xl">⚪</span>
                      <div className="text-center">
                        <span className="text-xs font-black text-slate-200 block">
                          {t.lobbySlotLabel} {slotNum + 1}: BOT {slotNum + 1}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5">
                          {t.lobbyClickToOccupy}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {t.lobbyBotActiveDesc}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM BLACK ⚫ */}
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md shadow-slate-950 border border-slate-600" />
              <h2 className="text-lg font-black text-slate-200 uppercase tracking-wider">
                {t.lobbyTeamBlack}
              </h2>
            </div>
            <button
              onClick={() => handleSwitchSlot(2)}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 font-black text-xs rounded-lg border border-slate-700 shadow transition-all active:scale-95 flex items-center gap-1"
            >
              <span>⚫ {t.lobbyMoveBlack}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {blackSlots.map((slotNum) => {
              const p = playersBySlot[slotNum];
              const isLocal =
                p &&
                (p.id === 'local' ||
                  p.id === multiplayerManager.localPlayerId);
              const zInfo = p ? ZODIAC_SIGNS[p.sign] : null;
              const pathInfo = p ? SPECIALIZATION_PATHS[p.path] : null;

              return (
                <div
                  key={slotNum}
                  onClick={() => !p && handleSwitchSlot(slotNum)}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[145px] ${
                    p
                      ? isLocal
                        ? 'bg-slate-950 border-rose-500 ring-1 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-950 border-slate-800'
                      : 'bg-slate-950/50 border-dashed border-slate-800 hover:border-slate-600 cursor-pointer flex items-center justify-center text-center'
                  }`}
                >
                  {p ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xl border shadow"
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              color: zInfo?.themeColor,
                              borderColor: zInfo?.themeColor,
                            }}
                          >
                            {zInfo?.symbol}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-slate-100 truncate max-w-[120px]">
                                {p.name}
                              </span>
                              {isLocal && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-rose-500 text-slate-950">
                                  {lang === 'es' ? 'TÚ' : 'YOU'}
                                </span>
                              )}
                              {p.isHost && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {zInfo?.name} • {pathInfo?.name}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            p.isReady
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {p.isReady ? t.lobbyReadyState : t.lobbyWaitingState}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{t.lobbySlotLabel} {slotNum + 1} (Team Black)</span>
                        <span className="text-rose-400 font-semibold">{pathInfo?.icon} {pathInfo?.style}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-3 text-slate-400">
                      <span className="text-xl">⚫</span>
                      <div className="text-center">
                        <span className="text-xs font-black text-slate-200 block">
                          {t.lobbySlotLabel} {slotNum + 1}: BOT {slotNum + 1}
                        </span>
                        <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
                          {t.lobbyClickToOccupy}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {t.lobbyBotActiveDesc}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOBBY CONTROLS, QUICK LOADOUT, & CHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTION CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{t.lobbyMatchControls}</span>
            </h3>

            <div className="mt-4 space-y-3">
              <button
                onClick={handleToggleReady}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow ${
                  isReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isReady ? `✓ ${t.lobbyMarkReady}` : t.lobbyMarkReady}</span>
              </button>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer select-none">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {t.lobbyFillBotsLabel}
                </span>
                <input
                  type="checkbox"
                  checked={fillBots}
                  onChange={handleToggleBots}
                  disabled={!isHost}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleLaunchGame}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-base uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            <span>{t.lobbyStartBattleBtn}</span>
          </button>
        </div>

        {/* QUICK SIGN & PATH SELECTOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{t.lobbyQuickSign}</span>
          </h3>

          <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[190px] pr-1">
            {(Object.keys(ZODIAC_SIGNS) as ZodiacSign[]).map((signKey) => {
              const info = ZODIAC_SIGNS[signKey];
              const isCurrent = profile.sign === signKey;

              return (
                <button
                  key={signKey}
                  onClick={() => {
                    AudioFX.playUiClick();
                    onUpdateProfile(signKey, profile.path);
                    multiplayerManager.updateProfile(signKey, profile.path);
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-slate-800 border-cyan-400 shadow'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <span className="text-base font-bold block" style={{ color: info.themeColor }}>
                    {info.symbol}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 truncate block">
                    {signKey}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800">
            {Object.values(SPECIALIZATION_PATHS).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  AudioFX.playUiClick();
                  onUpdateProfile(profile.sign, p.id);
                  multiplayerManager.updateProfile(profile.sign, p.id);
                }}
                className={`py-1 rounded text-center text-[10px] font-bold border transition-all ${
                  profile.path === p.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>{p.icon}</div>
                <div className="truncate">{p.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LOBBY CHAT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{t.lobbyChatTitle}</span>
          </h3>

          <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
            {roomState?.chatMessages && roomState.chatMessages.length > 0 ? (
              roomState.chatMessages.map((msg) => {
                const isWhite = msg.senderTeam === 'team_blue';
                return (
                  <div key={msg.id} className="leading-tight">
                    <span
                      className={`font-bold mr-1.5 ${
                        isWhite ? 'text-white' : 'text-rose-400'
                      }`}
                    >
                      {isWhite ? '⚪' : '⚫'} {msg.senderName}:
                    </span>
                    <span className="text-slate-300">{msg.text}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-500 py-6 text-xs italic">
                {t.lobbyChatPlaceholder}
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={lang === 'es' ? 'Mensaje de equipo...' : 'Team message...'}
              maxLength={100}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
