export type Language = 'es' | 'en';

export interface Translations {
  // Navigation
  navArena: string;
  navLobby: string;
  navDeck: string;
  navRanked: string;
  navProfile: string;
  navPlay2v2: string;
  navCopyInvite: string;
  navCopied: string;

  // Profile View
  profileTitle: string;
  profileSubtitle: string;
  profileStanding: string;
  profileWins: string;
  profileLosses: string;
  profileWinRate: string;
  profileMatches: string;
  profileMMR: string;
  profileLanguage: string;
  profileLanguageDesc: string;
  profileCopyInviteCard: string;
  profileCopied: string;
  profileCopyBtn: string;
  profileRecalculateBtn: string;
  profileSpecialization: string;
  profileMatchHistory: string;
  profileNoMatches: string;
  profileVictory: string;
  profileDefeat: string;
  profileScore: string;
  profileDuration: string;

  // Lobby
  lobbyTitle: string;
  lobbyBadge: string;
  lobbyServerActive: string;
  lobbyRoom: string;
  lobbySubtitle: string;
  lobbyInviteCard: string;
  lobbyLinkCopied: string;
  lobbyCopyBtn: string;
  lobbyTeamWhite: string;
  lobbyTeamBlack: string;
  lobbyMoveToWhite: string;
  lobbyMoveToBlack: string;
  lobbyMoveWhite: string;
  lobbyMoveBlack: string;
  lobbySlotFree: string;
  lobbyClickToJoin: string;
  lobbyClickToOccupy: string;
  lobbySlotLabel: string;
  lobbyBotActiveDesc: string;
  lobbyMatchControls: string;
  lobbyMarkReady: string;
  lobbyFillBotsLabel: string;
  lobbyStartBattleBtn: string;
  lobbyYou: string;
  lobbyReady: string;
  lobbyWaiting: string;
  lobbyReadyState: string;
  lobbyWaitingState: string;
  lobbyReadyBtn: string;
  lobbyImReady: string;
  lobbyFillBots: string;
  lobbyStartMatch: string;
  lobbyQuickSign: string;
  lobbyChatTitle: string;
  lobbyChatPlaceholder: string;
  lobbyChatEmpty: string;

  // Arena Hub
  arenaTitle: string;
  arenaSubtitle: string;
  arenaPlay2v2Btn: string;
  arenaQuickMatchBtn: string;
  arenaDeckBtn: string;
  arenaRivalSelect: string;

  // Ranked Leaderboard
  rankedTitle: string;
  rankedSubtitle: string;
  rankedRank: string;
  rankedBreaker: string;
  rankedSign: string;
  rankedTier: string;
  rankedWinRate: string;
  rankedWL: string;
  rankedMMR: string;
  rankedAction: string;
  rankedFollow: string;
  rankedFollowing: string;
  rankedStanding: string;

  // Combat HUD & Results
  hudTeamWhite: string;
  hudTeamBlack: string;
  hudYou: string;
  hudAlly: string;
  hudRivals: string;
  hudFallen: string;
  hudTime: string;
  hudPhaseBlocks: string;
  hudPhaseVault: string;
  hudPhaseShowdown: string;
  hudShop: string;
  hudGold: string;
  hudPause: string;
  hudResume: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingNameLabel: string;
  onboardingNamePlaceholder: string;
  onboardingBirthLabel: string;
  onboardingCalculateBtn: string;
  onboardingEnterArenaBtn: string;
  onboardingSignDetected: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  es: {
    // Navigation
    navArena: 'Arena',
    navLobby: '⚪⚫ Lobby 2v2',
    navDeck: 'Mazo Zodiacal',
    navRanked: 'Ranking',
    navProfile: 'Perfil',
    navPlay2v2: 'Jugar 2v2',
    navCopyInvite: 'Invitar',
    navCopied: '¡Copiado!',

    // Profile View
    profileTitle: 'Perfil del Breaker',
    profileSubtitle: 'Gestiona tu identidad cósmica, estadísticas de combate, idioma y carta de invitación.',
    profileStanding: 'Rango Actual',
    profileWins: 'Victorias',
    profileLosses: 'Derrotas',
    profileWinRate: 'Ratio Victoria',
    profileMatches: 'Partidas',
    profileMMR: 'MMR',
    profileLanguage: 'Idioma / Language',
    profileLanguageDesc: 'Selecciona tu idioma preferido para toda la interfaz.',
    profileCopyInviteCard: 'Carta de Invitación (Enlace del Servidor):',
    profileCopied: '¡Enlace Copiado!',
    profileCopyBtn: 'Copiar Enlace',
    profileRecalculateBtn: 'Recalcular Signo & Fecha',
    profileSpecialization: 'Rama de Especialización',
    profileMatchHistory: 'Historial Reciente de Partidas 2v2',
    profileNoMatches: 'Aún no hay registros de combate. ¡Inicia una partida para rankear!',
    profileVictory: 'VICTORIA',
    profileDefeat: 'DERROTA',
    profileScore: 'Puntos',
    profileDuration: 'Segundos',

    // Lobby
    lobbyTitle: 'Sala de Espera Cósmica',
    lobbyBadge: 'Lobby 2 vs 2 Multijugador',
    lobbyServerActive: 'Servidor Activo',
    lobbyRoom: 'Sala',
    lobbySubtitle: 'Invita a tus amigos con la carta de invitación. Elige tu equipo: Team White o Team Black.',
    lobbyInviteCard: 'Carta de Invitación (Enlace de Servidor)',
    lobbyLinkCopied: '¡Copiado con 1 Clic!',
    lobbyCopyBtn: 'Copiar Enlace',
    lobbyTeamWhite: 'Team White (Equipo Blanco)',
    lobbyTeamBlack: 'Team Black (Equipo Negro)',
    lobbyMoveToWhite: '⚪ Moverme a Team White',
    lobbyMoveToBlack: '⚫ Moverme a Team Black',
    lobbyMoveWhite: 'Moverme a Team White',
    lobbyMoveBlack: 'Moverme a Team Black',
    lobbySlotFree: 'Puesto Libre',
    lobbyClickToJoin: '+ Clic para ocupar este Puesto',
    lobbyClickToOccupy: '+ Haz clic para ocupar o invita a un amigo',
    lobbySlotLabel: 'Puesto',
    lobbyBotActiveDesc: 'IA Activa (Se reemplaza al entrar un jugador)',
    lobbyMatchControls: 'Controles de Partida 2v2',
    lobbyMarkReady: 'MARCAR COMO LISTO',
    lobbyFillBotsLabel: 'Rellenar huecos con Bots IA (4 Jugadores)',
    lobbyStartBattleBtn: 'INICIAR BATALLA 2 vs 2',
    lobbyYou: 'TÚ',
    lobbyReady: 'Listo',
    lobbyWaiting: 'Esperando',
    lobbyReadyState: 'Listo',
    lobbyWaitingState: 'Esperando',
    lobbyReadyBtn: 'MARCAR COMO LISTO',
    lobbyImReady: '✓ ¡ESTOY LISTO!',
    lobbyFillBots: 'Rellenar huecos con Bots IA (4 Combatientes)',
    lobbyStartMatch: 'INICIAR BATALLA 2 vs 2',
    lobbyQuickSign: 'Cambio Rápido de Signo Astral',
    lobbyChatTitle: 'Chat de Sala & Estrategia',
    lobbyChatPlaceholder: 'Mensaje de equipo...',
    lobbyChatEmpty: 'La sala está en silencio. ¡Saluda a tu equipo o escribe tu estrategia!',

    // Arena Hub
    arenaTitle: 'Centro de Operaciones Zodiacales',
    arenaSubtitle: 'Compite en arenas tácticas 2 vs 2 con 4 combatientes o entrena en partidas rápidas.',
    arenaPlay2v2Btn: '⚪⚫ Entrar a Sala 2v2 (Team White / Team Black)',
    arenaQuickMatchBtn: 'Partida Rápida vs',
    arenaDeckBtn: 'Mazo Zodiacal',
    arenaRivalSelect: 'Elegir Rival para Partida Rápida:',

    // Ranked Leaderboard
    rankedTitle: 'Clasificación Global Top 10',
    rankedSubtitle: 'Monitorea el ascenso de los mejores breakers, sus estadísticas y cartas favoritas.',
    rankedRank: 'Puesto',
    rankedBreaker: 'Breaker',
    rankedSign: 'Signo & Ruta',
    rankedTier: 'División / Rango',
    rankedWinRate: '% Victoria',
    rankedWL: 'V / D',
    rankedMMR: 'MMR',
    rankedAction: 'Seguimiento',
    rankedFollow: 'Seguir',
    rankedFollowing: 'Siguiendo',
    rankedStanding: 'Tu Posición',

    // Combat HUD & Results
    hudTeamWhite: '⚪ TEAM WHITE',
    hudTeamBlack: '⚫ TEAM BLACK',
    hudYou: 'TÚ',
    hudAlly: 'ALIADO',
    hudRivals: 'RIVALES',
    hudFallen: 'CAÍDO',
    hudTime: 'Tiempo',
    hudPhaseBlocks: 'Fase 1: Laberinto Astral',
    hudPhaseVault: 'Fase 2: Cámara Secreta',
    hudPhaseShowdown: 'Fase 3: Gran Duelo Final',
    hudShop: 'Tienda Astral (B)',
    hudGold: 'Oro',
    hudPause: 'Pausa',
    hudResume: 'Reanudar',

    // Onboarding
    onboardingTitle: 'Iniciación del Breaker Astral',
    onboardingSubtitle: 'Ingresa tu nombre y fecha de nacimiento para despertar tu Signo Zodiacal y Especialización.',
    onboardingNameLabel: 'Nombre del Jugador / Apodo',
    onboardingNamePlaceholder: 'Ej: NeoCosmic, AstralHero...',
    onboardingBirthLabel: 'Fecha de Nacimiento',
    onboardingCalculateBtn: 'Calcular Signo & Poder Innato',
    onboardingEnterArenaBtn: '¡ENTRAR A LA ARENA!',
    onboardingSignDetected: 'Signo Revelado',
  },
  en: {
    // Navigation
    navArena: 'Arena',
    navLobby: '⚪⚫ 2v2 Lobby',
    navDeck: 'Zodiac Deck',
    navRanked: 'Ranked',
    navProfile: 'Profile',
    navPlay2v2: 'Play 2v2',
    navCopyInvite: 'Invite',
    navCopied: 'Copied!',

    // Profile View
    profileTitle: 'Breaker Profile',
    profileSubtitle: 'Manage your cosmic identity, combat telemetry, language preference, and invitation letter.',
    profileStanding: 'Current Tier',
    profileWins: 'Wins',
    profileLosses: 'Losses',
    profileWinRate: 'Win Rate',
    profileMatches: 'Matches',
    profileMMR: 'MMR',
    profileLanguage: 'Language / Idioma',
    profileLanguageDesc: 'Choose your preferred language for the whole application.',
    profileCopyInviteCard: 'Invitation Card (Server Direct Link):',
    profileCopied: 'Link Copied!',
    profileCopyBtn: 'Copy Link',
    profileRecalculateBtn: 'Recalculate Sign & Date',
    profileSpecialization: 'Specialization Path',
    profileMatchHistory: 'Recent 2v2 Match Telemetry',
    profileNoMatches: 'No combat records yet. Play a match to climb the ranked ladder!',
    profileVictory: 'VICTORY',
    profileDefeat: 'DEFEAT',
    profileScore: 'Score',
    profileDuration: 'Seconds',

    // Lobby
    lobbyTitle: 'Cosmic Matchmaking Lobby',
    lobbyBadge: '2 vs 2 Multiplayer Lobby',
    lobbyServerActive: 'Server Active',
    lobbyRoom: 'Room',
    lobbySubtitle: 'Invite your friends using the invitation link. Pick your team: Team White or Team Black.',
    lobbyInviteCard: 'Invitation Card (Server Direct Link)',
    lobbyLinkCopied: 'Copied in 1 Click!',
    lobbyCopyBtn: 'Copy Link',
    lobbyTeamWhite: 'Team White',
    lobbyTeamBlack: 'Team Black',
    lobbyMoveToWhite: '⚪ Move to Team White',
    lobbyMoveToBlack: '⚫ Move to Team Black',
    lobbyMoveWhite: 'Move to Team White',
    lobbyMoveBlack: 'Move to Team Black',
    lobbySlotFree: 'Empty Slot',
    lobbyClickToJoin: '+ Click to take this Slot',
    lobbyClickToOccupy: '+ Click to occupy or invite a friend',
    lobbySlotLabel: 'Slot',
    lobbyBotActiveDesc: 'AI Active (Replaced when player enters)',
    lobbyMatchControls: '2v2 Match Controls',
    lobbyMarkReady: 'SET READY',
    lobbyFillBotsLabel: 'Fill empty slots with AI Bots (4 Players)',
    lobbyStartBattleBtn: 'LAUNCH 2 vs 2 BATTLE',
    lobbyYou: 'YOU',
    lobbyReady: 'Ready',
    lobbyWaiting: 'Waiting',
    lobbyReadyState: 'Ready',
    lobbyWaitingState: 'Waiting',
    lobbyReadyBtn: 'SET READY',
    lobbyImReady: '✓ READY TO FIGHT!',
    lobbyFillBots: 'Fill empty slots with AI Bots (4 Combatants)',
    lobbyStartMatch: 'LAUNCH 2 vs 2 BATTLE',
    lobbyQuickSign: 'Quick Zodiac Switch',
    lobbyChatTitle: 'Room Chat & Strategy',
    lobbyChatPlaceholder: 'Team message...',
    lobbyChatEmpty: 'Room is quiet. Say hi to your teammate or plan your strategy!',

    // Arena Hub
    arenaTitle: 'Zodiac Command Center',
    arenaSubtitle: 'Engage in 2 vs 2 grand tactical arenas with 4 combatants or train in quick matches.',
    arenaPlay2v2Btn: '⚪⚫ Enter 2v2 Room (Team White / Team Black)',
    arenaQuickMatchBtn: 'Quick Match vs',
    arenaDeckBtn: 'Zodiac Deck',
    arenaRivalSelect: 'Choose Quick Match Rival:',

    // Ranked Leaderboard
    rankedTitle: 'Global Ranked Top 10',
    rankedSubtitle: 'Track top competitive breakers, analyze their win rates, and inspect favorite builds.',
    rankedRank: 'Rank',
    rankedBreaker: 'Breaker',
    rankedSign: 'Sign & Path',
    rankedTier: 'Division Tier',
    rankedWinRate: 'Win Rate',
    rankedWL: 'W / L',
    rankedMMR: 'MMR',
    rankedAction: 'Track',
    rankedFollow: 'Follow',
    rankedFollowing: 'Following',
    rankedStanding: 'Your Standing',

    // Combat HUD & Results
    hudTeamWhite: '⚪ TEAM WHITE',
    hudTeamBlack: '⚫ TEAM BLACK',
    hudYou: 'YOU',
    hudAlly: 'ALLY',
    hudRivals: 'RIVALS',
    hudFallen: 'FALLEN',
    hudTime: 'Time',
    hudPhaseBlocks: 'Phase 1: Astral Maze',
    hudPhaseVault: 'Phase 2: Secret Vault',
    hudPhaseShowdown: 'Phase 3: Final Showdown',
    hudShop: 'Astral Shop (B)',
    hudGold: 'Gold',
    hudPause: 'Pause',
    hudResume: 'Resume',

    // Onboarding
    onboardingTitle: 'Astral Breaker Initiation',
    onboardingSubtitle: 'Enter your name and birth date to awaken your innate Zodiac Sign and Specialization.',
    onboardingNameLabel: 'Player Name / Handle',
    onboardingNamePlaceholder: 'e.g. NeoCosmic, AstralHero...',
    onboardingBirthLabel: 'Date of Birth',
    onboardingCalculateBtn: 'Calculate Sign & Innate Power',
    onboardingEnterArenaBtn: 'ENTER THE ARENA!',
    onboardingSignDetected: 'Revealed Sign',
  },
};
