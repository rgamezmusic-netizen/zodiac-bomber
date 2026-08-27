import React from 'react';
import { Award, Flame, RotateCcw, Shield, Sparkles, Swords, Trophy, Zap } from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { MatchStats, UserProfile } from '../game/types';
import { ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface PostMatchModalProps {
  stats: MatchStats | null;
  profile: UserProfile;
  onRematch: () => void;
  onReturnToHub: () => void;
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  stats,
  profile,
  onRematch,
  onReturnToHub,
}) => {
  if (!stats) return null;

  const won = stats.playerWon;
  const zInfo = ZODIAC_SIGNS[profile.sign];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-2xl flex flex-col gap-6">
        {/* Banner Header */}
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg ${
              won ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {won ? <Trophy className="w-8 h-8" /> : <Flame className="w-8 h-8" />}
          </div>

          <h2
            className={`text-3xl font-black uppercase tracking-wider ${
              won ? 'text-cyan-400' : 'text-rose-500'
            }`}
          >
            {won ? 'Celestial Victory!' : 'Match Defeat'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {won
              ? 'You shattered the rival arena and claimed cosmic dominance.'
              : 'The rival outmaneuvered your tactical defenses. Refine your deck and return stronger.'}
          </p>
        </div>

        {/* Rating & MMR Change Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              {zInfo.symbol}
            </span>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400">Competitive Tier</div>
              <div className="text-sm font-extrabold text-slate-100">{profile.tier}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase font-bold text-slate-400">MMR Rating</div>
            <div className="text-base font-black font-mono flex items-center gap-1 justify-end">
              <span>{profile.mmr}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                  stats.mmrChange >= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {stats.mmrChange >= 0 ? `+${stats.mmrChange}` : stats.mmrChange}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 font-semibold">Damage Dealt</div>
            <div className="text-base font-black text-slate-100 mt-0.5">{stats.damageDealtPlayer}</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 font-semibold">Walls Broken</div>
            <div className="text-base font-black text-cyan-400 mt-0.5">{stats.wallsDestroyedPlayer}</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 font-semibold">Max Combo</div>
            <div className="text-base font-black text-amber-400 mt-0.5">x{stats.maxComboPlayer}</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 font-semibold">Loot Gathered</div>
            <div className="text-base font-black text-purple-400 mt-0.5">{stats.lootCollectedPlayer}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              AudioFX.playUiClick();
              onRematch();
            }}
            className="flex-1 py-3 px-4 bg-cyan-400 hover:bg-cyan-300 active:scale-98 text-slate-950 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch Duel</span>
          </button>

          <button
            onClick={() => {
              AudioFX.playUiClick();
              onReturnToHub();
            }}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2 border border-slate-700"
          >
            <span>Return to Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
