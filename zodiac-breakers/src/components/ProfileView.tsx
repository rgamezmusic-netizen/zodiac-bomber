import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Check,
  Compass,
  Copy,
  Edit3,
  Flame,
  Globe,
  History,
  Languages,
  Share2,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { DICTIONARY, Language } from '../game/i18n';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { PlayerPath, UserProfile } from '../game/types';
import { ELEMENT_COLORS, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface ProfileViewProps {
  profile: UserProfile;
  onOpenEditOnboarding: () => void;
  onSelectPath?: (path: PlayerPath) => void;
  onUpdateLanguage?: (lang: Language) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onOpenEditOnboarding,
  onSelectPath,
  onUpdateLanguage,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const lang: Language = profile.language || 'es';
  const t = DICTIONARY[lang];

  const zInfo = ZODIAC_SIGNS[profile.sign];
  const elemColor = ELEMENT_COLORS[profile.element];
  const currentPath = profile.path || 'bomb_master';
  const pathInfo = SPECIALIZATION_PATHS[currentPath];
  const roomCode = profile.roomCode || 'ASTRAL-7';

  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const handleCopyLink = () => {
    AudioFX.playUiClick();
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleLanguageChange = (selectedLang: Language) => {
    AudioFX.playUiClick();
    onUpdateLanguage?.(selectedLang);
  };

  const winRate =
    profile.matchesPlayed > 0
      ? ((profile.wins / profile.matchesPlayed) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        {/* Background zodiac symbol watermark */}
        <div
          className="absolute -right-6 -bottom-10 text-[180px] font-black opacity-5 pointer-events-none select-none"
          style={{ color: zInfo.themeColor }}
        >
          {zInfo.symbol}
        </div>

        {/* Identity Details */}
        <div className="flex items-center gap-5 z-10">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black border shadow-2xl shrink-0"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: zInfo.themeColor,
              borderColor: zInfo.themeColor,
            }}
          >
            {zInfo.symbol}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{profile.name}</h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ★ {lang === 'es' ? 'PODER LEGENDARIO' : 'LEGENDARY POWER'}
              </span>
              <span
                className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full"
                style={{
                  backgroundColor: elemColor.bg,
                  color: elemColor.primary,
                  border: `1px solid ${elemColor.border}`,
                }}
              >
                {profile.element} • {profile.sign}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {lang === 'es' ? 'Nacimiento:' : 'DOB:'} {profile.birthDate}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                {profile.followersCount} {lang === 'es' ? 'Seguidores' : 'Followers'}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs font-semibold text-slate-300">
                {profile.title}
              </span>
              <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-bold text-cyan-400">
                {profile.tier} ({profile.mmr} MMR)
              </span>
              <span className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-xs font-bold text-cyan-300 flex items-center gap-1">
                <span>{pathInfo.icon}</span>
                <span>{lang === 'es' ? 'Ruta:' : 'Path:'} {pathInfo.name}</span>
              </span>
            </div>

            {/* Carta de Invitación (1-Click Copy) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 p-2.5 bg-slate-950/90 rounded-xl border border-cyan-500/30 shadow-md">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                <Share2 className="w-3.5 h-3.5" />
                <span>{t.profileCopyInviteCard}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate max-w-[200px] sm:max-w-[280px]">
                {inviteUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow ${
                  isCopied
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? t.profileCopied : t.profileCopyBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action CTAs & Language Switcher */}
        <div className="z-10 flex flex-col gap-3 shrink-0 w-full sm:w-auto">
          {/* LANGUAGE SELECTOR - PROMINENT & EASY */}
          <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 shadow flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 uppercase tracking-wider">
              <Languages className="w-3.5 h-3.5" />
              <span>{t.profileLanguage}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  lang === 'es'
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white font-black shadow-md border border-amber-400 ring-1 ring-amber-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <span>🇪🇸</span>
                <span>Español</span>
                {lang === 'es' && <Check className="w-3 h-3 ml-0.5" />}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black shadow-md border border-cyan-400 ring-1 ring-cyan-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
                {lang === 'en' && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-black transition-all shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>{isCopied ? `✓ ${t.profileCopied}` : t.profileCopyInviteCard.split(':')[0]}</span>
          </button>

          <button
            onClick={() => {
              AudioFX.playUiClick();
              onOpenEditOnboarding();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>{t.profileRecalculateBtn}</span>
          </button>
        </div>
      </div>

      {/* Specialization Path & Power Budget Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Path Box */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                {t.profileSpecialization}
              </span>
              <span className="text-xs text-amber-400 font-bold">
                {'★'.repeat(pathInfo.difficulty)} {lang === 'es' ? 'Dificultad' : 'Difficulty'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl">{pathInfo.icon}</span>
              <div>
                <h3 className="text-base font-black text-slate-100">{pathInfo.name}</h3>
                <span className="text-xs text-cyan-400 font-bold uppercase">{pathInfo.style}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2">{pathInfo.tagline}</p>

            <div className="mt-3 space-y-1.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-medium">
                <span className="font-bold block">{lang === 'es' ? 'Ventaja:' : 'Advantage:'}</span>
                <span>{pathInfo.primaryAdvantage}</span>
              </div>
              <div className="text-rose-400 font-medium">
                <span className="font-bold block">{lang === 'es' ? 'Compensación:' : 'Tradeoff:'}</span>
                <span>{pathInfo.tradeoff}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {Object.values(SPECIALIZATION_PATHS).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  AudioFX.playUiClick();
                  onSelectPath?.(p.id);
                }}
                className={`py-1.5 rounded-lg border text-center text-xs font-bold transition-all ${
                  currentPath === p.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div>{p.icon}</div>
                <div className="text-[10px] truncate">{p.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Innate Legendary Power Box */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                {lang === 'es' ? 'Poder Innato Legendario' : 'Innate Legendary Power'} ({zInfo.name.split(' ')[0]})
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">100 / 100 PTS</span>
            </div>

            <h3 className="text-base font-black text-amber-300 mt-3">{zInfo.powerTitle}</h3>
            <p className="text-xs text-slate-300 mt-1">{zInfo.primaryEffect}</p>

            <div className="mt-3 space-y-1.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-sky-400 font-medium">
                <span className="font-bold block">{lang === 'es' ? 'Aura Secundaria:' : 'Secondary Aura:'}</span>
                <span>{zInfo.secondaryEffect}</span>
              </div>
              <div className="text-rose-400 font-medium">
                <span className="font-bold block">{lang === 'es' ? 'Limitación:' : 'Limitation:'}</span>
                <span>{zInfo.limitation}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">{lang === 'es' ? 'Ataque' : 'Offense'}</span>
              <span className="text-amber-400 font-bold text-xs font-mono">{zInfo.powerBudget.offense}%</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">{lang === 'es' ? 'Movilidad' : 'Mobility'}</span>
              <span className="text-sky-400 font-bold text-xs font-mono">{zInfo.powerBudget.mobility}%</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">{lang === 'es' ? 'Utilidad' : 'Utility'}</span>
              <span className="text-emerald-400 font-bold text-xs font-mono">{zInfo.powerBudget.utility}%</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">{lang === 'es' ? 'Defensa' : 'Survival'}</span>
              <span className="text-purple-400 font-bold text-xs font-mono">{zInfo.powerBudget.survival}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 shadow">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            {t.profileWinRate}
          </span>
          <span className="text-2xl font-black font-mono text-amber-400">{winRate}%</span>
          <span className="text-[10px] text-slate-500 font-mono">
            {profile.wins}W - {profile.losses}L ({profile.matchesPlayed} {t.profileMatches})
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 shadow">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            {lang === 'es' ? 'Daño Total' : 'Total Damage'}
          </span>
          <span className="text-2xl font-black font-mono text-rose-400">
            {profile.totalDamage.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{lang === 'es' ? 'Impactos de Combate' : 'Arena Combat Score'}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 shadow">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {lang === 'es' ? 'Muros Destruidos' : 'Walls Shattered'}
          </span>
          <span className="text-2xl font-black font-mono text-orange-400">
            {profile.totalWallsDestroyed.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{lang === 'es' ? 'Destrucción de Bloques' : 'Destruction Metric'}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 shadow">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {lang === 'es' ? 'Combo Máximo' : 'Highest Combo'}
          </span>
          <span className="text-2xl font-black font-mono text-cyan-400">
            x{profile.maxComboEver}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{lang === 'es' ? 'Cadena de Detonaciones' : 'Peak Chain Detonation'}</span>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1.5">
            <History className="w-4 h-4" />
            {t.profileMatchHistory}
          </span>
          <span className="text-xs text-slate-400">{lang === 'es' ? 'Últimas 10 Partidas' : 'Last 10 Matches'}</span>
        </div>

        {profile.recentMatches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-semibold">
            {t.profileNoMatches}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-2">{lang === 'es' ? 'Resultado' : 'Result'}</th>
                  <th className="pb-2">{lang === 'es' ? 'Rival' : 'Rival'}</th>
                  <th className="pb-2">{lang === 'es' ? 'Duración' : 'Duration'}</th>
                  <th className="pb-2">{lang === 'es' ? 'Combo Máx' : 'Peak Combo'}</th>
                  <th className="pb-2">{lang === 'es' ? 'Puntos' : 'Score'}</th>
                  <th className="pb-2">MMR</th>
                  <th className="pb-2 text-right">{lang === 'es' ? 'Fecha' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {profile.recentMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          m.won
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {m.won ? t.profileVictory : t.profileDefeat}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200 font-bold">
                      {ZODIAC_SIGNS[m.opponentSign]?.symbol} {m.opponentName}
                    </td>
                    <td className="py-2.5 text-slate-300">{m.duration}s</td>
                    <td className="py-2.5 text-cyan-400 font-bold">x{m.maxCombo}</td>
                    <td className="py-2.5 text-amber-300">{m.score.toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className={m.mmrChange >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {m.mmrChange >= 0 ? `+${m.mmrChange}` : m.mmrChange}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-500 text-[11px]">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
