import React, { useState } from 'react';
import { Award, Compass, Flame, Heart, Shield, Sparkles, Trophy, UserCheck, UserPlus, Users } from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { DICTIONARY, Language } from '../game/i18n';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { RankedPlayer, UserProfile } from '../game/types';
import { ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface LeaderboardViewProps {
  ladder: RankedPlayer[];
  profile: UserProfile;
  onToggleFollow: (playerId: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  ladder,
  profile,
  onToggleFollow,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RankedPlayer | null>(null);
  const lang: Language = profile.language || 'es';
  const t = DICTIONARY[lang];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 text-slate-100 flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            {lang === 'es' ? 'Circuito Celestial - Temporada 1' : 'Celestial Circuit Season 1'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            {t.rankedTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.rankedSubtitle}
          </p>
        </div>

        {/* Current User Tier Badge */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-400 uppercase">{t.rankedStanding}</div>
            <div className="text-sm font-black text-cyan-400">{profile.tier}</div>
          </div>
          <div className="px-2.5 py-1 bg-slate-950 rounded font-mono font-bold text-sm text-slate-100 border border-slate-800">
            {profile.mmr} MMR
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">{t.rankedRank}</th>
                <th className="py-3.5 px-4">{t.rankedBreaker}</th>
                <th className="py-3.5 px-4">{t.rankedSign}</th>
                <th className="py-3.5 px-4">{t.rankedTier}</th>
                <th className="py-3.5 px-4 text-center">{t.rankedWinRate}</th>
                <th className="py-3.5 px-4 text-center">{t.rankedWL}</th>
                <th className="py-3.5 px-4 text-right">{t.rankedMMR}</th>
                <th className="py-3.5 px-4 text-center w-28">{t.rankedAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ladder.map((player) => {
                const zInfo = ZODIAC_SIGNS[player.sign];
                const isUser = player.id === 'player_self' || player.name === profile.name;

                return (
                  <tr
                    key={player.id}
                    className={`transition-colors cursor-pointer ${
                      isUser
                        ? 'bg-cyan-950/40 hover:bg-cyan-900/40 border-l-4 border-l-cyan-400 font-bold'
                        : 'hover:bg-slate-800/40'
                    }`}
                    onClick={() => {
                      AudioFX.playUiClick();
                      setSelectedPlayer(player);
                    }}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-black">
                      {player.rank === 1 && <span className="text-amber-400 text-base">🥇 #1</span>}
                      {player.rank === 2 && <span className="text-slate-300 text-base">🥈 #2</span>}
                      {player.rank === 3 && <span className="text-amber-600 text-base">🥉 #3</span>}
                      {player.rank > 3 && <span className="text-slate-400 font-mono">#{player.rank}</span>}
                    </td>

                    {/* Breaker Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{player.avatarBadge}</span>
                        <span>{player.name}</span>
                        {isUser && (
                          <span className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 rounded text-[10px] font-black uppercase">
                            {lang === 'es' ? 'TÚ' : 'YOU'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sign & Path */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            color: zInfo?.themeColor || '#38bdf8',
                            border: `1px solid ${zInfo?.themeColor || '#38bdf8'}40`,
                          }}
                        >
                          <span>{zInfo?.symbol || '⭐'}</span>
                          <span>{player.sign}</span>
                        </span>
                        {player.path && (
                          <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] font-bold text-cyan-300">
                            {SPECIALIZATION_PATHS[player.path]?.icon} {SPECIALIZATION_PATHS[player.path]?.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {player.tier}
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-400">
                      {player.winRate}%
                    </td>

                    {/* Record */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                      <span className="text-emerald-400">{player.wins}W</span> /{' '}
                      <span className="text-rose-400">{player.losses}L</span>
                    </td>

                    {/* MMR */}
                    <td className="py-3.5 px-4 text-right font-black font-mono text-amber-400">
                      {player.mmr}
                    </td>

                    {/* Follow Action */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isUser ? (
                        <button
                          onClick={() => {
                            AudioFX.playUiClick();
                            onToggleFollow(player.id);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 mx-auto ${
                            player.isFollowing
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {player.isFollowing ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t.rankedFollowing}</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t.rankedFollow}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Inspect Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl font-black text-amber-400">
                  {selectedPlayer.avatarBadge}
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-100">{selectedPlayer.name}</h3>
                  <p className="text-xs text-cyan-400 font-bold uppercase">
                    Rank #{selectedPlayer.rank} • {selectedPlayer.tier}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-slate-800 font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">MMR Score</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{selectedPlayer.mmr}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">Win Rate</div>
                <div className="text-xl font-black text-cyan-400 mt-0.5">{selectedPlayer.winRate}%</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {selectedPlayer.path && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Specialization Path:</span>
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <span>{SPECIALIZATION_PATHS[selectedPlayer.path]?.icon}</span>
                    <span>{SPECIALIZATION_PATHS[selectedPlayer.path]?.name}</span>
                  </span>
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Signature Zodiac Power:</span>
                <span className="font-bold text-amber-300">{selectedPlayer.favoriteCard}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Core Item Affinity:</span>
                <span className="font-bold text-slate-100">{selectedPlayer.favoriteItem}</span>
              </div>
            </div>

            <button
              onClick={() => {
                AudioFX.playUiClick();
                onToggleFollow(selectedPlayer.id);
                setSelectedPlayer({ ...selectedPlayer, isFollowing: !selectedPlayer.isFollowing });
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                selectedPlayer.isFollowing
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              }`}
            >
              {selectedPlayer.isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Following Player</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Follow Player Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
