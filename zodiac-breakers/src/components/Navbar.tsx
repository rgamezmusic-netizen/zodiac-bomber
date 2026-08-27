import React, { useState } from 'react';
import { Check, Copy, Globe, Share2, Sparkles, Swords, Users, Volume2, VolumeX } from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { DICTIONARY, Language } from '../game/i18n';
import { UserProfile } from '../game/types';
import { ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onQuickPlay: () => void;
  profile: UserProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onUpdateLanguage?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onQuickPlay,
  profile,
  isMuted,
  onToggleMute,
  onUpdateLanguage,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const lang: Language = profile.language || 'es';
  const t = DICTIONARY[lang];

  const zInfo = ZODIAC_SIGNS[profile.sign];
  const roomCode = profile.roomCode || 'ASTRAL-7';
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const handleCopyInvite = () => {
    AudioFX.playUiClick();
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleLanguage = () => {
    AudioFX.playUiClick();
    const nextLang: Language = lang === 'es' ? 'en' : 'es';
    onUpdateLanguage?.(nextLang);
  };

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title */}
        <div
          onClick={() => {
            AudioFX.playUiClick();
            onSelectTab('arena');
          }}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg border border-slate-700 bg-slate-900 group-hover:scale-105 transition-transform"
            style={{ color: zInfo.themeColor }}
          >
            {zInfo.symbol}
          </span>
          <span className="font-extrabold text-base tracking-wider text-slate-100 uppercase hidden sm:inline">
            Zodiac Breakers
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'arena', label: t.navArena },
            { id: 'lobby', label: t.navLobby },
            { id: 'deck', label: t.navDeck },
            { id: 'ranked', label: t.navRanked },
            { id: 'profile', label: t.navProfile },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  AudioFX.playUiClick();
                  onSelectTab(tab.id);
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher Button */}
          <button
            onClick={handleToggleLanguage}
            title={lang === 'es' ? 'Cambiar a English' : 'Cambiar a Español'}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-amber-300 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'es' ? 'ES' : 'EN'}</span>
          </button>

          <button
            onClick={handleCopyInvite}
            title={lang === 'es' ? 'Copiar Carta de Invitación (Enlace del Servidor)' : 'Copy Invitation Link'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-500/40'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? t.navCopied : t.navCopyInvite}</span>
          </button>

          <button
            onClick={() => {
              onToggleMute();
              AudioFX.playUiClick();
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              AudioFX.playUiClick();
              onQuickPlay();
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-md shadow transition-all whitespace-nowrap"
          >
            <Swords className="w-4 h-4" />
            <span>Play 2v2</span>
          </button>
        </div>
      </div>
    </header>
  );
};
