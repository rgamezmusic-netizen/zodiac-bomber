/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArenaHub } from './components/ArenaHub';
import { BalanceSandbox } from './components/BalanceSandbox';
import { DeckBuilder } from './components/DeckBuilder';
import { GameCanvas } from './components/GameCanvas';
import { LeaderboardView } from './components/LeaderboardView';
import { LobbyView } from './components/LobbyView';
import { Navbar } from './components/Navbar';
import { OnboardingModal } from './components/OnboardingModal';
import { PostMatchModal } from './components/PostMatchModal';
import { ProfileView } from './components/ProfileView';
import { AudioFX } from './game/AudioSystem';
import { RoomState } from './game/MultiplayerManager';
import {
  loadLeaderboard,
  loadUserProfile,
  recordMatchResult,
  saveLeaderboard,
  saveUserProfile,
  syncRankingWithMatch,
  updateProfileBirthdateAndPath,
  updateProfileLanguage,
} from './game/StorageManager';
import { MatchStats, PlayerPath, RankedPlayer, UserProfile, ZodiacSign } from './game/types';
import { Language } from './game/i18n';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [ladder, setLadder] = useState<RankedPlayer[]>(loadLeaderboard);
  const [currentTab, setCurrentTab] = useState<string>('arena');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('ASTRAL-7');

  // In-match & modal states
  const [isPlayingMatch, setIsPlayingMatch] = useState<boolean>(false);
  const [activeRivalSign, setActiveRivalSign] = useState<ZodiacSign>('Leo');
  const [recentMatchStats, setRecentMatchStats] = useState<MatchStats | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Sync Audio mute state & check URL room parameter + mandatory onboarding
  useEffect(() => {
    AudioFX.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        const cleanRoom = roomParam
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, '')
          .slice(0, 12);
        if (cleanRoom) {
          setInitialRoomCode(cleanRoom);
          setCurrentTab('lobby');
        }
      }
    } catch {
      // ignore
    }

    // Mandatory onboarding check: if user hasn't finished onboarding or default name/birthdate
    if (!profile.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    AudioFX.setMuted(nextMuted);
  };

  const handleStartMatch = (rivalSign: ZodiacSign) => {
    setActiveRivalSign(rivalSign);
    setRecentMatchStats(null);
    setIsPlayingMatch(true);
  };

  const handleStartMatch2v2 = (
    team: 'team_blue' | 'team_red',
    slot: number,
    roomState?: RoomState | null
  ) => {
    setActiveRivalSign('Sagittarius');
    setRecentMatchStats(null);
    setIsPlayingMatch(true);
  };

  const handleMatchEnd = (stats: MatchStats) => {
    setRecentMatchStats(stats);
    setIsPlayingMatch(false);

    // Record results into persistent profile
    const updated = recordMatchResult(
      profile,
      stats.playerWon,
      `Rival (${activeRivalSign})`,
      activeRivalSign,
      'blast_force',
      stats.score,
      stats.matchDuration,
      stats.damageDealtPlayer,
      stats.wallsDestroyedPlayer,
      stats.lootCollectedPlayer,
      stats.maxComboPlayer,
      stats.mmrChange
    );
    setProfile(updated);

    // Dynamic Ranking Calibration with the 4-bot match outcomes
    const nextLadder = syncRankingWithMatch(ladder, updated, activeRivalSign, stats.playerWon);
    setLadder(nextLadder);
  };

  const handleUpdateLanguage = (newLang: Language) => {
    const updated = updateProfileLanguage(profile, newLang);
    setProfile(updated);
  };

  const handleEquipCard = (cardId: string) => {
    const updated: UserProfile = {
      ...profile,
      equippedCardId: cardId,
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleSelectPath = (path: PlayerPath) => {
    const updated: UserProfile = {
      ...profile,
      path,
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleUpdateSignAndPath = (sign: ZodiacSign, path: PlayerPath) => {
    const updated: UserProfile = {
      ...profile,
      sign,
      path,
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleToggleFollow = (playerId: string) => {
    const updatedLadder = ladder.map((p) => {
      if (p.id === playerId) {
        return { ...p, isFollowing: !p.isFollowing };
      }
      return p;
    });
    setLadder(updatedLadder);
    saveLeaderboard(updatedLadder);
  };

  const handleSaveOnboarding = (name: string, birthDate: string, path: PlayerPath) => {
    const updated = updateProfileBirthdateAndPath(profile, name, birthDate, path);
    setProfile(updated);
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsPlayingMatch(false);
          setCurrentTab(tab);
        }}
        onQuickPlay={() => {
          setIsPlayingMatch(false);
          handleStartMatch('Leo');
        }}
        profile={profile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onUpdateLanguage={handleUpdateLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {isPlayingMatch ? (
          <GameCanvas
            playerSign={profile.sign}
            botSign={activeRivalSign}
            profile={profile}
            onMatchEnd={handleMatchEnd}
            onExitMatch={() => setIsPlayingMatch(false)}
          />
        ) : (
          <>
            {currentTab === 'arena' && (
              <ArenaHub
                profile={profile}
                onStartMatch={handleStartMatch}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'lobby' && (
              <LobbyView
                profile={profile}
                initialRoomCode={initialRoomCode}
                onStartMatch2v2={handleStartMatch2v2}
                onUpdateProfile={handleUpdateSignAndPath}
              />
            )}

            {currentTab === 'deck' && (
              <DeckBuilder
                profile={profile}
                onEquipCard={handleEquipCard}
                onSelectPath={handleSelectPath}
              />
            )}

            {currentTab === 'ranked' && (
              <LeaderboardView
                ladder={ladder}
                profile={profile}
                onToggleFollow={handleToggleFollow}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                profile={profile}
                onOpenEditOnboarding={() => setShowOnboarding(true)}
                onSelectPath={handleSelectPath}
                onUpdateLanguage={handleUpdateLanguage}
              />
            )}

            {currentTab === 'balance' && <BalanceSandbox />}
          </>
        )}
      </main>

      {/* Post Match Telemetry & Rewards Modal */}
      {recentMatchStats && (
        <PostMatchModal
          stats={recentMatchStats}
          profile={profile}
          onRematch={() => handleStartMatch(activeRivalSign)}
          onReturnToHub={() => setRecentMatchStats(null)}
        />
      )}

      {/* Onboarding & Astrological Recalculator Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onSave={handleSaveOnboarding}
        initialProfile={profile}
      />
    </div>
  );
}
