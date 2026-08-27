import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  HelpCircle,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  User,
  Zap,
} from 'lucide-react';
import { AudioFX } from '../game/AudioSystem';
import { SPECIALIZATION_PATHS } from '../game/SpecializationRegistry';
import { PlayerPath, UserProfile, ZodiacSign } from '../game/types';
import { ELEMENT_COLORS, getZodiacSignFromDate, ZODIAC_SIGNS } from '../game/ZodiacRegistry';

interface OnboardingModalProps {
  isOpen: boolean;
  onSave: (name: string, birthDate: string, path: PlayerPath) => void;
  initialProfile?: UserProfile;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onSave,
  initialProfile,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialProfile?.name || 'AstralWarrior');
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate || '2000-03-25');
  const [selectedPath, setSelectedPath] = useState<PlayerPath>(initialProfile?.path || 'bomb_master');

  if (!isOpen) return null;

  // Calculate Zodiac from birthDate
  const parts = birthDate.split('-');
  let calculatedSign: ZodiacSign = 'Aries';
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(m) && !isNaN(d)) {
      calculatedSign = getZodiacSignFromDate(m, d);
    }
  }

  const zInfo = ZODIAC_SIGNS[calculatedSign];
  const elemColor = ELEMENT_COLORS[zInfo.element];
  const pathInfo = SPECIALIZATION_PATHS[selectedPath];
  const allPaths = Object.values(SPECIALIZATION_PATHS);

  const handleProceedToAwakening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    AudioFX.playUiClick();
    setStep(2);
  };

  const handleFinalSubmit = () => {
    AudioFX.playVictory();
    onSave(name.trim() || 'AstralWarrior', birthDate, selectedPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-100 flex flex-col gap-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-xs font-black flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
              {step === 1 ? 'Step 1 • Astrological Identity' : 'Step 2 • Zodiac Awakening'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-semibold">
            {step === 1 ? 'Date of Birth Registration' : 'Choose Your Specialization'}
          </span>
        </div>

        {step === 1 ? (
          /* STEP 1: PILOT INFO & BIRTHDATE CALCULATION */
          <form onSubmit={handleProceedToAwakening} className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-black text-slate-100">Awaken Your Zodiac Core</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Your birth date anchors your celestial identity and grants your innate{' '}
                <strong className="text-amber-400">Legendary Zodiac Power</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Player Call-Sign
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  required
                  placeholder="Enter pilot name"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Calculated Zodiac Preview Banner */}
            <div
              className="p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 transition-all relative overflow-hidden"
              style={{
                backgroundColor: elemColor.bg,
                borderColor: elemColor.border,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black border shadow-lg shrink-0"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  color: zInfo.themeColor,
                  borderColor: zInfo.themeColor,
                }}
              >
                {zInfo.symbol}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-base font-black text-slate-100">{zInfo.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ★ LEGENDARY POWER
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase rounded"
                    style={{ backgroundColor: elemColor.border, color: '#FFF' }}
                  >
                    {zInfo.element} Element
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{zInfo.description}</p>
                <p className="text-[11px] text-amber-300 font-semibold mt-1">
                  ⚡ <strong>{zInfo.powerTitle}:</strong> {zInfo.primaryEffect}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <span>Proceed to Path Specialization</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2: ZODIAC AWAKENING & PATH SELECTION */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Identity Banner */}
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-black border"
                  style={{
                    color: zInfo.themeColor,
                    borderColor: zInfo.themeColor,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  }}
                >
                  {zInfo.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-100">{zInfo.name}</span>
                    <span className="px-2 py-0.2 text-[9px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      LEGENDARY IDENTITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pilot: <span className="text-cyan-400 font-bold">{name}</span> • Born:{' '}
                    <span className="text-slate-300">{birthDate}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-semibold"
              >
                Change Date
              </button>
            </div>

            {/* Path Selection Instructions */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Choose Your Specialization Path
                </h3>
                <span className="text-[11px] text-slate-400">4 Balanced Archetypes</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                All 12 signs are equal in power budget. Your path dictates how your abilities are deployed in combat.
              </p>
            </div>

            {/* 4 Paths Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPaths.map((p) => {
                const isSelected = selectedPath === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      AudioFX.playUiClick();
                      setSelectedPath(p.id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                            {p.name}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                          </h4>
                          <span className="text-[10px] text-cyan-400 font-bold uppercase">{p.style}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-[10px] text-amber-400 font-bold">
                        {'★'.repeat(p.difficulty)}
                        {'☆'.repeat(5 - p.difficulty)}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">{p.tagline}</p>

                    <div className="space-y-1 text-[10px] border-t border-slate-800/80 pt-2">
                      <div className="text-emerald-400 font-medium flex items-center gap-1">
                        <span>+</span>
                        <span>{p.primaryAdvantage}</span>
                      </div>
                      <div className="text-rose-400 font-medium flex items-center gap-1">
                        <span>-</span>
                        <span>{p.tradeoff}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Power Budget Balance Preview */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Power Budget Distribution ({pathInfo.name})</span>
                <span className="font-mono text-cyan-400 font-black">100 / 100 PTS</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Offense</span>
                  <span className="text-amber-400 font-black text-xs font-mono">
                    {pathInfo.powerBudget.offense}%
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Mobility</span>
                  <span className="text-sky-400 font-black text-xs font-mono">
                    {pathInfo.powerBudget.mobility}%
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Utility</span>
                  <span className="text-emerald-400 font-black text-xs font-mono">
                    {pathInfo.powerBudget.utility}%
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Survival</span>
                  <span className="text-purple-400 font-black text-xs font-mono">
                    {pathInfo.powerBudget.survival}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors shrink-0"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Confirm Awakening & Enter Arena</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
