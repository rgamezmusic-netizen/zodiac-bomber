import React, { useState } from 'react';
import { Compass, Flame, Play, Shield, Sparkles, Swords, Trophy, Users, Zap } from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { ZODIAC_CARDS_DATABASE } from '../game/CardRegistry';
import { DICTIONARY, Language } from '../game/i18n';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { UserProfile, ZodiacSign } from '../game/types';
import { ELEMENT_COLORS, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface ArenaHubProps {
  profile: UserProfile;
  onStartMatch: (rivalSign: ZodiacSign) => void;
  onNavigateTab: (tab: string) => void;
}

export const ArenaHub: React.FC<ArenaHubProps> = ({
  profile,
  onStartMatch,
  onNavigateTab,
}) => {
  const [selectedRivalSign, setSelectedRivalSign] = useState<ZodiacSign>('Leo');
  const lang: Language = profile.language || 'es';
  const t = DICTIONARY[lang];

  const zInfo = ZODIAC_SIGNS[profile.sign];
  const rivalInfo = ZODIAC_SIGNS[selectedRivalSign];
  const elemColor = ELEMENT_COLORS[profile.element];
  const currentPath = profile.path || 'bomb_master';
  const pathInfo = SPECIALIZATION_PATHS[currentPath];
  const equippedCard = profile.equippedCardId ? ZODIAC_CARDS_DATABASE[profile.equippedCardId] : null;

  const allSigns: ZodiacSign[] = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Top Banner Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div
          className="absolute -right-10 -bottom-10 text-[200px] font-black opacity-5 pointer-events-none"
          style={{ color: zInfo.themeColor }}
        >
          {zInfo.symbol}
        </div>

        <div className="flex-1 z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {lang === 'es' ? 'Temporada 1 Activa' : 'Season 1 Active'}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ★ {lang === 'es' ? '12 SIGNOS LEGENDARIOS' : 'ALL 12 SIGNS LEGENDARY'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {lang === 'es' ? 'Arena Táctica 2 vs 2 & 1 vs 1' : 'Competitive 2v2 & 1v1 Arena'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 uppercase tracking-tight">
            {t.arenaTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            {lang === 'es'
              ? `Aprovecha el poder ${zInfo.powerTitle} de tu signo natal, tu especialización ${pathInfo.name}, destruye bloques astrales para abrir la Cámara Secreta y triunfa en el Duelo Final!`
              : `Harness your birth sign's ${zInfo.powerTitle}, customize your ${pathInfo.name} specialization, shatter astral blocks to uncover the Secret Portals, and claim victory in the Final Showdown!`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => {
                AudioFX.playUiClick();
                onNavigateTab('lobby');
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-98 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <Users className="w-5 h-5" />
              <span>{t.arenaPlay2v2Btn}</span>
            </button>

            <button
              onClick={() => {
                AudioFX.playUiClick();
                onStartMatch(selectedRivalSign);
              }}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-100 font-bold rounded-xl text-sm uppercase tracking-wider flex items-center gap-2 border border-slate-700 shadow transition-all"
            >
              <Swords className="w-5 h-5 text-cyan-400" />
              <span>{t.arenaQuickMatchBtn} {selectedRivalSign}</span>
            </button>

            <button
              onClick={() => {
                AudioFX.playUiClick();
                onNavigateTab('deck');
              }}
              className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>{t.navDeck}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Matchup Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Player Loadout & Active Sign */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {lang === 'es' ? 'Identidad de Combate Activa' : 'Your Active Combat Identity'}
            </h2>
            <span
              className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full"
              style={{ backgroundColor: elemColor.bg, color: elemColor.primary }}
            >
              {profile.element} {lang === 'es' ? 'Elemento' : 'Element'}
            </span>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-black border shrink-0"
              style={{
                color: zInfo.themeColor,
                borderColor: zInfo.themeColor,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
              }}
            >
              {zInfo.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100">{profile.name}</h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {pathInfo.icon} {pathInfo.name}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-bold">{zInfo.powerTitle}</p>
              <p className="text-xs text-slate-400 mt-1">{zInfo.primaryEffect}</p>
            </div>
          </div>

          {/* Traits */}
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-200">{lang === 'es' ? 'Pasiva Astral' : 'Passive'}: {zInfo.passiveName}</b>
                <p className="text-slate-400 mt-0.5">{zInfo.passiveDesc}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-200">{lang === 'es' ? 'Habilidad Activa (Tecla E)' : 'Active Skill (Key E)'}: {zInfo.activeName}</b>
                <p className="text-slate-400 mt-0.5">{zInfo.activeDesc}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/30 flex items-start gap-2">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-cyan-300">{lang === 'es' ? 'Ruta de Especialización' : 'Specialization Path'}: {pathInfo.name}</b>
                <p className="text-slate-400 mt-0.5">{pathInfo.tagline} (+{pathInfo.primaryAdvantage})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rival Selector & Tactical Scouting */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              {t.arenaRivalSelect}
            </h2>
            <span className="text-xs font-semibold text-slate-400 font-mono">{lang === 'es' ? '12 Signos Listos' : '12 Signs Available'}</span>
          </div>

          {/* 12 Signs Grid Selector */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {allSigns.map((sign) => {
              const info = ZODIAC_SIGNS[sign];
              const isSelected = sign === selectedRivalSign;

              return (
                <button
                  key={sign}
                  onClick={() => {
                    AudioFX.playUiClick();
                    setSelectedRivalSign(sign);
                  }}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500/50 shadow'
                      : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                  }`}
                >
                  <span className="text-xl font-bold" style={{ color: info.themeColor }}>
                    {info.symbol}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                    {sign}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Rival Scouting Details */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-100">
                {rivalInfo.name} ({rivalInfo.element} {lang === 'es' ? 'Elemento' : 'Element'})
              </span>
              <span className="text-[11px] font-semibold text-rose-400">Rival Bot</span>
            </div>
            <p className="text-xs text-slate-300">{rivalInfo.description}</p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <b className="text-slate-300">{lang === 'es' ? 'Estilo' : 'Playstyle'}:</b> {rivalInfo.playstyle} •{' '}
              <b className="text-slate-300">{lang === 'es' ? 'Debilidad' : 'Weakness'}:</b> {rivalInfo.weakness}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
