import { AudioFX } from './AudioSystem';
import { BALANCE } from './BalanceConfig';
import { BotAI } from './BotAI';
import { ZODIAC_CARDS_DATABASE } from './CardRegistry';
import { MapSystem } from './MapSystem';
import { ParticleSystem } from './ParticleSystem';
import { PlayerSession, RemoteInputData } from './MultiplayerManager';
import { SPECIALIZATION_PATHS } from './SpecializationRegistry';
import {
  AirdropPickup,
  Bomb,
  CoinPickup,
  ComboState,
  Entity,
  Explosion,
  ExplosionSegment,
  FallingGrease,
  GreasePuddle,
  Item,
  LootPickup,
  MatchPhase,
  MatchStats,
  Meteor,
  PlayerPath,
  ShopItem,
  ZodiacCard,
  ZodiacSign,
} from './types';
import { ZODIAC_SIGNS } from './ZodiacRegistry';

export interface MultiplayerEngineConfig {
  isMultiplayer: boolean;
  localSlot: 0 | 1 | 2 | 3;
  players: Record<string, PlayerSession>;
  fillBots: boolean;
  isHost: boolean;
  mapSeed?: number;
}

export class GameEngine {
  public map: MapSystem;
  public particles: ParticleSystem;
  public botAI: BotAI;
  public bot2AI: BotAI;
  public allyAI: BotAI;

  public is2v2: boolean;
  public isMultiplayer: boolean = false;
  public localSlot: 0 | 1 | 2 | 3 = 0;
  public isHost: boolean = false;
  public player: Entity;
  public ally: Entity | null = null;
  public bot: Entity;
  public bot2: Entity | null = null;

  public bombs: Bomb[] = [];
  public explosions: Explosion[] = [];
  public lootList: LootPickup[] = [];
  public coinList: CoinPickup[] = [];
  public fallingGreaseList: FallingGrease[] = [];
  public greasePuddles: GreasePuddle[] = [];
  public meteors: Meteor[] = [];
  public airdropPickups: AirdropPickup[] = [];

  // Match Phase Progression & Timers
  public phase: MatchPhase = 'maze_blocks';
  public portalSoloTimer: number = BALANCE.PORTAL_SOLO_DURATION;
  public vaultCombatTimer: number = BALANCE.VAULT_COMBAT_DURATION;
  public isRivalInWarehouse: boolean = false;

  // Sky Timers in Final Showdown
  public greaseSpawnTimer: number = 2.0;
  public meteorSpawnTimer: number = 3.0;
  public airdropSpawnTimer: number = 5.0;

  // Shop Catalog
  public shopItems: ShopItem[] = [];

  public combo: ComboState = { count: 0, timer: 0, maxTimer: BALANCE.COMBO_WINDOW_SECONDS, multiplier: 1 };
  public matchTimeRemaining: number = BALANCE.MATCH_TIME_LIMIT;
  public isGameOver: boolean = false;
  public winner: 'player' | 'bot' | 'draw' | null = null;

  // Real-time Match Telemetry
  public stats: MatchStats = {
    winnerId: null,
    playerWon: false,
    gameMode: '2v2',
    matchDuration: 0,
    damageDealtPlayer: 0,
    damageDealtAlly: 0,
    damageDealtBot: 0,
    damageDealtBot2: 0,
    wallsDestroyedPlayer: 0,
    wallsDestroyedBot: 0,
    bombsPlacedPlayer: 0,
    lootCollectedPlayer: 0,
    maxComboPlayer: 0,
    score: 0,
    mmrChange: 0,
  };

  private onMatchEndCallback?: (stats: MatchStats) => void;

  constructor(
    playerSign: ZodiacSign,
    botSign: ZodiacSign,
    equippedCardId?: string,
    playerPath: PlayerPath = 'bomb_master',
    botPath: PlayerPath = 'blast_force',
    onMatchEnd?: (stats: MatchStats) => void,
    is2v2: boolean = true,
    allySign: ZodiacSign = 'Sagittarius',
    allyPath: PlayerPath = 'velocity',
    bot2Sign: ZodiacSign = 'Capricorn',
    bot2Path: PlayerPath = 'guardian',
    multiplayerConfig?: MultiplayerEngineConfig
  ) {
    this.is2v2 = is2v2;
    this.map = new MapSystem(BALANCE.GRID_WIDTH, BALANCE.GRID_HEIGHT, BALANCE.TILE_SIZE, multiplayerConfig?.mapSeed);
    this.particles = new ParticleSystem();
    this.botAI = new BotAI();
    this.bot2AI = new BotAI();
    this.allyAI = new BotAI();
    this.onMatchEndCallback = onMatchEnd;
    this.stats.gameMode = is2v2 ? '2v2' : '1v1';

    if (multiplayerConfig && multiplayerConfig.isMultiplayer) {
      this.isMultiplayer = true;
      this.localSlot = multiplayerConfig.localSlot;
      this.isHost = multiplayerConfig.isHost;

      const sessionsBySlot: Record<number, PlayerSession> = {};
      for (const p of Object.values(multiplayerConfig.players)) {
        sessionsBySlot[p.slot] = p;
      }

      // Slot 0 (Team White #1: 1, 1)
      const p0 = sessionsBySlot[0];
      const p0Sign = p0?.sign || playerSign;
      const p0Path = p0?.path || playerPath;
      const p0Card = p0?.equippedCardId || equippedCardId;
      this.player = this.createEntity(
        p0?.id || 'player_slot0',
        p0?.name || 'BOT 1',
        !p0 && multiplayerConfig.fillBots,
        'team_blue',
        p0Sign,
        p0Path,
        1,
        1,
        p0Card
      );

      // Slot 1 (Team White #2: 1, height - 2)
      const p1 = sessionsBySlot[1];
      if (this.is2v2) {
        const p1Sign = p1?.sign || allySign;
        const p1Path = p1?.path || allyPath;
        const p1Card = p1?.equippedCardId;
        this.ally = this.createEntity(
          p1?.id || 'ally_slot1',
          p1?.name || 'BOT 2',
          !p1,
          'team_blue',
          p1Sign,
          p1Path,
          1,
          this.map.height - 2,
          p1Card
        );
      } else {
        this.ally = null;
      }

      // Slot 2 (Team Black #1: width - 2, 1)
      const p2 = sessionsBySlot[2];
      const p2Sign = p2?.sign || botSign;
      const p2Path = p2?.path || botPath;
      const p2Card = p2?.equippedCardId;
      this.bot = this.createEntity(
        p2?.id || 'rival_slot2',
        p2?.name || 'BOT 3',
        !p2,
        'team_red',
        p2Sign,
        p2Path,
        this.map.width - 2,
        1,
        p2Card
      );

      // Slot 3 (Team Black #2: width - 2, height - 2)
      const p3 = sessionsBySlot[3];
      if (this.is2v2) {
        const p3Sign = p3?.sign || bot2Sign;
        const p3Path = p3?.path || bot2Path;
        const p3Card = p3?.equippedCardId;
        this.bot2 = this.createEntity(
          p3?.id || 'rival_slot3',
          p3?.name || 'BOT 4',
          !p3,
          'team_red',
          p3Sign,
          p3Path,
          this.map.width - 2,
          this.map.height - 2,
          p3Card
        );
      } else {
        this.bot2 = null;
      }
    } else {
      // Singleplayer initialization: 1 human player + 3 standardized bots
      // 1. Initialize Player (Team White #1 - Top-Left: 1, 1)
      this.player = this.createEntity(
        'player_1',
        'Player',
        false,
        'team_blue',
        playerSign,
        playerPath,
        1,
        1,
        equippedCardId
      );

      // 2. Initialize Ally (Team White #2 - Bottom-Left: 1, height - 2)
      if (this.is2v2) {
        this.ally = this.createEntity(
          'ally_bot',
          'BOT 2',
          true,
          'team_blue',
          allySign,
          allyPath,
          1,
          this.map.height - 2
        );
      } else {
        this.ally = null;
      }

      // 3. Initialize Rival 1 (Team Black #1 - Top-Right: width - 2, 1)
      this.bot = this.createEntity(
        'bot_rival1',
        'BOT 3',
        true,
        'team_red',
        botSign,
        botPath,
        this.map.width - 2,
        1
      );

      // 4. Initialize Rival 2 (Team Black #2 - Bottom-Right: width - 2, height - 2)
      if (this.is2v2) {
        this.bot2 = this.createEntity(
          'bot_rival2',
          'BOT 4',
          true,
          'team_red',
          bot2Sign,
          bot2Path,
          this.map.width - 2,
          this.map.height - 2
        );
      } else {
        this.bot2 = null;
      }
    }

    this.initShopCatalog();
  }

  public getEntityBySlot(slot: number): Entity | null {
    if (slot === 0) return this.player;
    if (slot === 1) return this.ally;
    if (slot === 2) return this.bot;
    if (slot === 3) return this.bot2;
    return null;
  }

  public getLocalEntity(): Entity {
    const entity = this.getEntityBySlot(this.localSlot);
    return entity || this.player;
  }

  public applyRemoteInput(slot: number, data: RemoteInputData): void {
    if (slot === this.localSlot) return; // Don't apply to self
    const entity = this.getEntityBySlot(slot);
    if (!entity || !entity.isAlive) return;

    // Smooth position reconciliation
    const dx = data.x - entity.x;
    const dy = data.y - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 80) {
      entity.x = data.x;
      entity.y = data.y;
    } else {
      entity.x += dx * 0.4;
      entity.y += dy * 0.4;
    }

    entity.vx = data.vx;
    entity.vy = data.vy;
    if (data.hp !== undefined) entity.hp = data.hp;
    if (data.shield !== undefined) entity.shield = data.shield;
    if (data.carriedCoins !== undefined) entity.carriedCoins = data.carriedCoins;
    if (data.isPhasing !== undefined) entity.isPhasing = data.isPhasing;
  }

  public handleRemoteEvent(slot: number, event: string, data: any): void {
    if (slot === this.localSlot) return;
    const entity = this.getEntityBySlot(slot);
    if (!entity) return;

    if (event === 'PLACE_BOMB') {
      this.placeBomb(entity);
    } else if (event === 'USE_SKILL') {
      this.triggerSkill(entity);
    } else if (event === 'BUY_SHOP_ITEM') {
      if (data?.itemId) {
        this.buyShopItemForEntity(entity, data.itemId);
      }
    }
  }

  public buyShopItemForEntity(entity: Entity, itemId: string): boolean {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item) return false;
    if (entity.coins < item.cost) return false;

    entity.coins -= item.cost;
    entity.bankedCoins = entity.coins;
    this.applyShopEffect(entity, item.effectKey);
    AudioFX.playShopBuy();
    this.particles.spawnPickupSparkles(entity.x, entity.y, '#F59E0B');
    this.particles.spawnDamageNumber(entity.x, entity.y - 20, `🛍️ ${item.name}!`, '#F59E0B');
    return true;
  }

  public getAllEntities(): Entity[] {
    return [this.player, this.ally, this.bot, this.bot2].filter(Boolean) as Entity[];
  }

  public getBlueTeam(): Entity[] {
    return [this.player, this.ally].filter(Boolean) as Entity[];
  }

  public getRedTeam(): Entity[] {
    return [this.bot, this.bot2].filter(Boolean) as Entity[];
  }

  private createEntity(
    id: string,
    name: string,
    isBot: boolean,
    teamId: 'team_blue' | 'team_red',
    sign: ZodiacSign,
    path: PlayerPath = 'bomb_master',
    gridX: number,
    gridY: number,
    equippedCardId?: string
  ): Entity {
    const info = ZODIAC_SIGNS[sign] || ZODIAC_SIGNS['Aries'];
    const pathInfo = SPECIALIZATION_PATHS[path] || SPECIALIZATION_PATHS['bomb_master'];
    const spawn = this.map.gridToWorldCenter(gridX, gridY);
    const card: ZodiacCard | undefined = equippedCardId ? ZODIAC_CARDS_DATABASE[equippedCardId] : undefined;

    const pathStats = pathInfo.stats;
    const initialBombCount = Math.max(
      1,
      info.baseBombCount + (card?.stats?.bombCountBonus || 0) + (pathStats.bombCountBonus || 0)
    );
    const initialHp = Math.max(50, info.baseHp + (card?.stats?.hpBonus || 0) + (pathStats.hpBonus || 0));
    const initialSpeed = Math.max(160, info.baseSpeed + (card?.stats?.speedBonus || 0) + (pathStats.speedBonus || 0));
    const initialArmor = Math.max(0, info.baseArmor + (card?.stats?.armorBonus || 0) + (pathStats.armorBonus || 0));
    const initialRadius = Math.max(
      1,
      info.baseBombRadius + (card?.stats?.bombRadiusBonus || 0) + (pathStats.bombRadiusBonus || 0)
    );
    const initialDamage = Math.max(
      30,
      info.baseBombDamage + (card?.stats?.damageBonus || 0) + (pathStats.damageBonus || 0)
    );

    return {
      id,
      name,
      isBot,
      teamId,
      sign,
      path,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: initialHp,
      maxHp: initialHp,
      shield: 0,
      speed: initialSpeed,
      armor: initialArmor,
      bombCount: initialBombCount,
      maxBombs: initialBombCount,
      magazine: this.createInitialMagazine(initialBombCount),
      bombRadius: initialRadius,
      bombDamage: initialDamage,
      isAlive: true,
      iFrames: 0,
      activeSkillCooldown: 0,
      activeSkillMaxCooldown: info.activeCooldown * (1 - (card?.stats?.cooldownReduction || 0)),
      inventory: [],
      equippedCard: card,
      statusEffects: [],
      coins: 0,
      carriedCoins: 0,
      bankedCoins: 0,
      slipTimer: 0,
      slipVx: 0,
      slipVy: 0,
      tractionBonus: 0,
      hasEnteredDoor: false,
    };
  }

  private createInitialMagazine(count: number): import('./types').BombSlot[] {
    const slots: import('./types').BombSlot[] = [];
    for (let i = 0; i < count; i++) {
      // Primary bomb (slot 0) has 0s reload time -> INSTANT recharge once it explodes!
      const maxTime = i === 0 ? BALANCE.BOMB_RELOAD_PRIMARY_TIME : (i === 1 ? BALANCE.BOMB_RELOAD_SECONDARY_TIME : BALANCE.BOMB_RELOAD_TERTIARY_TIME);
      slots.push({
        slotIndex: i,
        isReady: true,
        rechargeTimer: 0,
        maxRechargeTime: maxTime,
        isEmpowered: i > 0,
        powerBonusRadius: i > 0 ? BALANCE.EMPOWERED_BOMB_BONUS_RADIUS : 0,
        powerBonusDamage: i > 0 ? BALANCE.EMPOWERED_BOMB_BONUS_DAMAGE : 0,
      });
    }
    return slots;
  }

  private initShopCatalog(): void {
    this.shopItems = [
      {
        id: 'shop_super_bomb',
        name: 'Super Bomba Astral (Cámara Extra)',
        cost: 90, // Aumentado 50% (de 60 a 90)
        description: '+1 Cámara de Bomba Potenciada con +1 Radio y +18 Daño.',
        icon: '⚡',
        effectKey: 'extra_bomb',
        bought: false,
      },
      {
        id: 'shop_shield',
        name: 'Escudo Cósmico Titán',
        cost: 75, // Aumentado 50% (de 50 a 75)
        description: '+60 Escudo de protección astral permanente.',
        icon: '🛡️',
        effectKey: 'shield_boost',
        bought: false,
      },
      {
        id: 'shop_speed',
        name: 'Botas de Hermes',
        cost: 68, // Aumentado 50% (de 45 a 68)
        description: '+18 Velocidad de movimiento sobrehumana.',
        icon: '👢',
        effectKey: 'speed_boost',
        bought: false,
      },
      {
        id: 'shop_nuclear_core',
        name: 'Núcleo de Supernova',
        cost: 98, // Aumentado 50% (de 65 a 98)
        description: '+1 Radio de Explosión y +20 Daño a todas tus bombas.',
        icon: '💥',
        effectKey: 'damage_boost',
        bought: false,
      },
      {
        id: 'shop_heal_elixir',
        name: 'Elixir de Restauración Estelar',
        cost: 60, // Aumentado 50% (de 40 a 60)
        description: 'Cura 100% tus Puntos de Salud y otorga +30 Max HP.',
        icon: '❤️',
        effectKey: 'heal_maxhp',
        bought: false,
      },
      {
        id: 'shop_traction_cleats',
        name: 'Picos de Tracción Antideslizantes',
        cost: 53, // Aumentado 50% (de 35 a 53)
        description: 'Reduce un 60% el tiempo de resbalón al pisar grasa cósmica.',
        icon: '🧲',
        effectKey: 'traction_boots',
        bought: false,
      },
    ];
  }

  public update(dt: number, inputDirection: { x: number; y: number }): void {
    if (this.isGameOver) return;

    this.stats.matchDuration += dt;

    if (this.phase !== 'final_showdown') {
      this.matchTimeRemaining -= dt;
      if (this.matchTimeRemaining <= 0) {
        this.matchTimeRemaining = 0;
        this.startFinalShowdown();
        return;
      }
    }

    // 1. Update Combo Timer
    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) {
        this.combo.count = 0;
        this.combo.multiplier = 1;
      }
    }

    // 2. Phase-specific updates
    if (this.phase === 'portal_warehouse') {
      this.updatePortalSoloPhase(dt);
    } else if (this.phase === 'vault_combat') {
      this.updateVaultCombatPhase(dt);
    } else if (this.phase === 'final_showdown') {
      this.updateFinalShowdownPhase(dt);
    }

    // 3. Update Slot 0 (Blue 1)
    if (this.player && this.player.isAlive) {
      if (this.localSlot === 0) {
        this.updateEntity(this.player, dt, inputDirection);
      } else if (this.player.isBot && this.phase !== 'astral_shop') {
        const redTargets = [this.bot, this.bot2].filter(b => b && b.isAlive) as Entity[];
        const p0Input = this.botAI.update(
          dt,
          this.player,
          redTargets,
          this.map,
          this.bombs,
          this.lootList,
          (entity) => this.placeBomb(entity),
          (entity) => this.triggerSkill(entity),
          this.explosions
        );
        this.updateEntity(this.player, dt, p0Input, true);
      } else {
        // Remote human player
        this.updateEntity(this.player, dt, { x: 0, y: 0 }, true);
      }
    }

    // 4. Update Slot 1 (Blue 2 - Ally)
    if (this.ally && this.ally.isAlive && this.phase !== 'astral_shop') {
      if (this.localSlot === 1) {
        this.updateEntity(this.ally, dt, inputDirection);
      } else if (this.ally.isBot) {
        const redTargets = [this.bot, this.bot2].filter(b => b && b.isAlive) as Entity[];
        const allyInput = this.allyAI.update(
          dt,
          this.ally,
          redTargets,
          this.map,
          this.bombs,
          this.lootList,
          (entity) => this.placeBomb(entity),
          (entity) => this.triggerSkill(entity),
          this.explosions
        );
        this.updateEntity(this.ally, dt, allyInput, true);
      } else {
        // Remote human player
        this.updateEntity(this.ally, dt, { x: 0, y: 0 }, true);
      }
    }

    // 5. Update Slot 2 & Slot 3 (Red 1 & Red 2)
    const canBotsMove = this.phase !== 'astral_shop' && (this.phase !== 'portal_warehouse' || this.isRivalInWarehouse);
    if (canBotsMove) {
      const blueTargets = [this.player, this.ally].filter(p => p && p.isAlive) as Entity[];

      if (this.bot && this.bot.isAlive) {
        if (this.localSlot === 2) {
          this.updateEntity(this.bot, dt, inputDirection);
        } else if (this.bot.isBot) {
          const botInput = this.botAI.update(
            dt,
            this.bot,
            blueTargets,
            this.map,
            this.bombs,
            this.lootList,
            (entity) => this.placeBomb(entity),
            (entity) => this.triggerSkill(entity),
            this.explosions
          );
          this.updateEntity(this.bot, dt, botInput, true);
        } else {
          // Remote human player
          this.updateEntity(this.bot, dt, { x: 0, y: 0 }, true);
        }
      }

      if (this.bot2 && this.bot2.isAlive) {
        if (this.localSlot === 3) {
          this.updateEntity(this.bot2, dt, inputDirection);
        } else if (this.bot2.isBot) {
          const bot2Input = this.bot2AI.update(
            dt,
            this.bot2,
            blueTargets,
            this.map,
            this.bombs,
            this.lootList,
            (entity) => this.placeBomb(entity),
            (entity) => this.triggerSkill(entity),
            this.explosions
          );
          this.updateEntity(this.bot2, dt, bot2Input, true);
        } else {
          // Remote human player
          this.updateEntity(this.bot2, dt, { x: 0, y: 0 }, true);
        }
      }
    }

    // 6. Check Secret Door Entrance in Phase 1
    if (this.phase === 'maze_blocks') {
      this.checkDoorTriggers();
    }

    // 7. Check Bank Zone Deposits (Warehouse Phases)
    if (this.phase === 'portal_warehouse' || this.phase === 'vault_combat') {
      this.checkBankDeposits();
    }

    // 8. Update Bombs & Explosions
    this.updateBombs(dt);
    this.updateExplosions(dt);

    // 9. Update Loot Pickups
    this.updateLoot(dt);

    // 10. Update Coins in Warehouse
    if (this.phase === 'portal_warehouse' || this.phase === 'vault_combat') {
      this.updateCoins(dt);
    }

    // 11. Update Particles & Visuals
    this.particles.update(dt);
  }

  private checkDoorTriggers(): void {
    for (const door of this.map.secretDoors) {
      if (door.isRevealed && !door.isEntered) {
        const center = this.map.gridToWorldCenter(door.gridX, door.gridY);
        for (const entity of this.getAllEntities()) {
          if (!entity.isAlive) continue;
          const dist = Math.hypot(entity.x - center.x, entity.y - center.y);
          if (dist <= 28) {
            door.isEntered = true;
            entity.hasEnteredDoor = true;
            this.startWarehouseSoloPhase();
            return;
          }
        }
      }
    }
  }

  /**
   * Phase 2a: Blue Team enters the portal ALONE.
   * Enemy team does not enter immediately! Blue team can gather coins from the warehouse.
   */
  public startWarehouseSoloPhase(): void {
    this.phase = 'portal_warehouse';
    this.portalSoloTimer = BALANCE.PORTAL_SOLO_DURATION;
    this.isRivalInWarehouse = false;
    this.map.generateWarehouseMap();

    // Clear active bombs/explosions/loot from phase 1
    this.bombs = [];
    this.explosions = [];
    this.lootList = [];
    this.coinList = [];

    // Teleport Blue team (Player: top-left base 1, 1; Ally: bottom-left base 1, height - 2)
    const pCenter = this.map.gridToWorldCenter(1, 1);
    this.player.x = pCenter.x;
    this.player.y = pCenter.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.slipTimer = 0;
    this.player.carriedCoins = 0;

    if (this.ally) {
      const aCenter = this.map.gridToWorldCenter(1, this.map.height - 2);
      this.ally.x = aCenter.x;
      this.ally.y = aCenter.y;
      this.ally.vx = 0;
      this.ally.vy = 0;
      this.ally.slipTimer = 0;
      this.ally.carriedCoins = 0;
    }

    // Red team remains in waiting portal
    const b1Center = this.map.gridToWorldCenter(this.map.width - 2, 1);
    this.bot.x = b1Center.x;
    this.bot.y = b1Center.y;
    this.bot.vx = 0;
    this.bot.vy = 0;
    this.bot.slipTimer = 0;
    this.bot.carriedCoins = 0;

    if (this.bot2) {
      const b2Center = this.map.gridToWorldCenter(this.map.width - 2, this.map.height - 2);
      this.bot2.x = b2Center.x;
      this.bot2.y = b2Center.y;
      this.bot2.vx = 0;
      this.bot2.vy = 0;
      this.bot2.slipTimer = 0;
      this.bot2.carriedCoins = 0;
    }

    // Populate the central warehouse with abundant gold and gem chests
    this.populateWarehouseCoins();

    AudioFX.playDoorOpen();
    this.particles.triggerScreenShake(8);
    this.particles.spawnDamageNumber(pCenter.x, pCenter.y - 20, '🚪 ¡GRAN ALMACÉN ASTRAL! RECOGE Y GUARDA EN TU BÓVEDA', '#38BDF8');
  }

  private populateWarehouseCoins(): void {
    for (let y = 2; y < this.map.height - 2; y++) {
      for (let x = 2; x < this.widthTiles() - 2; x++) {
        // High density across central warehouse
        const isCenter = (x >= 4 && x <= this.widthTiles() - 5 && y >= 3 && y <= this.map.height - 4);
        const spawnChance = isCenter ? 0.70 : 0.35;

        if (this.map.isWalkable(x, y) && Math.random() < spawnChance) {
          const isGem = Math.random() < (isCenter ? 0.35 : 0.2);
          const pos = this.map.gridToWorldCenter(x, y);
          this.coinList.push({
            id: Math.random().toString(36).substring(2, 9),
            x: pos.x,
            y: pos.y,
            gridX: x,
            gridY: y,
            value: isGem ? BALANCE.COIN_VALUE_GEM : BALANCE.COIN_VALUE_GOLD,
            life: 999,
            bobPhase: Math.random() * Math.PI * 2,
            isGem,
          });
        }
      }
    }
  }

  private widthTiles(): number {
    return this.map.width;
  }

  private updatePortalSoloPhase(dt: number): void {
    this.portalSoloTimer -= dt;
    if (this.portalSoloTimer <= 0) {
      this.portalSoloTimer = 0;
      this.startVaultCombatPhase();
    }
  }

  /**
   * Phase 2b: Enemy team arrives through the portal!
   * Exactly 10 seconds of coin collection + active combat with bombs.
   */
  public startVaultCombatPhase(): void {
    this.phase = 'vault_combat';
    this.vaultCombatTimer = BALANCE.VAULT_COMBAT_DURATION;
    this.isRivalInWarehouse = true;

    // Teleport Red team into right wing
    const b1Center = this.map.gridToWorldCenter(this.map.width - 2, 2);
    this.bot.x = b1Center.x;
    this.bot.y = b1Center.y;
    this.bot.vx = 0;
    this.bot.vy = 0;

    if (this.bot2) {
      const b2Center = this.map.gridToWorldCenter(this.map.width - 2, this.map.height - 3);
      this.bot2.x = b2Center.x;
      this.bot2.y = b2Center.y;
      this.bot2.vx = 0;
      this.bot2.vy = 0;
    }

    AudioFX.playShowdownStart();
    this.particles.triggerScreenShake(10);
    this.particles.spawnExplosionBurst(b1Center.x, b1Center.y, '#EF4444', 24);
    this.particles.spawnDamageNumber(b1Center.x, b1Center.y - 20, '⚠️ ¡RIVALES ENTRARON! (10s) ¡PÉGALES BOMBAS!', '#EF4444');
  }

  private updateVaultCombatPhase(dt: number): void {
    this.vaultCombatTimer -= dt;
    if (this.vaultCombatTimer <= 0 || this.coinList.length === 0) {
      this.vaultCombatTimer = 0;
      // Auto-bank any remaining carried coins for all entities
      for (const entity of this.getAllEntities()) {
        if (entity.carriedCoins > 0) {
          entity.bankedCoins += entity.carriedCoins;
          entity.coins = entity.bankedCoins;
          entity.carriedCoins = 0;
        }
      }

      this.startShopPhase();
    }
  }

  /**
   * Check if any fighter is stepping on their respective team Bank Zone
   */
  private checkBankDeposits(): void {
    for (const entity of this.getAllEntities()) {
      if (!entity.isAlive || entity.carriedCoins <= 0) continue;

      const eGrid = this.map.worldToGrid(entity.x, entity.y);

      // Blue Team Vault (Left wing)
      if (entity.teamId === 'team_blue') {
        const isBlueBank = (eGrid.gridX >= 1 && eGrid.gridX <= 3 && eGrid.gridY >= 1 && eGrid.gridY <= 3) ||
                           (eGrid.gridX >= 1 && eGrid.gridX <= 3 && eGrid.gridY >= this.map.height - 4 && eGrid.gridY <= this.map.height - 2);
        if (isBlueBank) {
          const bankedAmount = entity.carriedCoins;
          entity.bankedCoins += bankedAmount;
          entity.coins = entity.bankedCoins;
          entity.carriedCoins = 0;

          if (entity.id === 'player_1') {
            AudioFX.playBankCoins();
            this.particles.spawnDamageNumber(entity.x, entity.y - 18, `💰 +${bankedAmount} ORO GUARDADO!`, '#38BDF8');
          }
          this.particles.spawnPickupSparkles(entity.x, entity.y, '#38BDF8');
        }
      } else {
        // Red Team Vault (Right wing)
        const isRedBank = (eGrid.gridX >= this.map.width - 4 && eGrid.gridX <= this.map.width - 2 && eGrid.gridY >= 1 && eGrid.gridY <= 3) ||
                          (eGrid.gridX >= this.map.width - 4 && eGrid.gridX <= this.map.width - 2 && eGrid.gridY >= this.map.height - 4 && eGrid.gridY <= this.map.height - 2);
        if (isRedBank) {
          const bankedAmount = entity.carriedCoins;
          entity.bankedCoins += bankedAmount;
          entity.coins = entity.bankedCoins;
          entity.carriedCoins = 0;
          this.particles.spawnPickupSparkles(entity.x, entity.y, '#F87171');
        }
      }
    }
  }

  public startShopPhase(): void {
    this.phase = 'astral_shop';
    AudioFX.playVictory();
    this.botAutoPurchase();
  }

  private botAutoPurchase(): void {
    const botsToUpgrade = [this.ally, this.bot, this.bot2].filter(Boolean) as Entity[];
    for (const b of botsToUpgrade) {
      let botBudget = Math.max(135, b.coins);
      if (botBudget >= 90) {
        this.applyShopEffect(b, 'extra_bomb');
        botBudget -= 90;
      }
      if (botBudget >= 75) {
        this.applyShopEffect(b, 'shield_boost');
        botBudget -= 75;
      }
      if (botBudget >= 68) {
        this.applyShopEffect(b, 'speed_boost');
        botBudget -= 68;
      }
      if (botBudget >= 60) {
        this.applyShopEffect(b, 'heal_maxhp');
        botBudget -= 60;
      }
    }
  }

  public buyShopItem(itemId: string): boolean {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item || item.bought) return false;

    if (this.player.coins < item.cost) {
      return false;
    }

    this.player.coins -= item.cost;
    item.bought = true;
    this.applyShopEffect(this.player, item.effectKey);
    AudioFX.playBuyItem();
    this.particles.spawnPickupSparkles(this.player.x, this.player.y);
    return true;
  }

  private applyShopEffect(entity: Entity, effectKey: ShopItem['effectKey']): void {
    switch (effectKey) {
      case 'extra_bomb': {
        const slotIdx = entity.magazine.length;
        const reloadTime = slotIdx === 1 ? BALANCE.BOMB_RELOAD_SECONDARY_TIME : BALANCE.BOMB_RELOAD_TERTIARY_TIME;
        entity.magazine.push({
          slotIndex: slotIdx,
          isReady: true,
          rechargeTimer: 0,
          maxRechargeTime: reloadTime,
          isEmpowered: true,
          powerBonusRadius: BALANCE.EMPOWERED_BOMB_BONUS_RADIUS + 1,
          powerBonusDamage: BALANCE.EMPOWERED_BOMB_BONUS_DAMAGE + 10,
        });
        entity.maxBombs = entity.magazine.length;
        entity.bombCount = entity.magazine.filter(s => s.isReady).length;
        break;
      }
      case 'shield_boost': {
        entity.shield += 60;
        break;
      }
      case 'speed_boost': {
        entity.speed += 18; // Reducido 50% (de 35 a 18)
        break;
      }
      case 'damage_boost': {
        entity.bombRadius += 1;
        entity.bombDamage += 20;
        break;
      }
      case 'heal_maxhp': {
        entity.maxHp += 30;
        entity.hp = entity.maxHp;
        break;
      }
      case 'traction_boots': {
        entity.tractionBonus = 0.6;
        break;
      }
    }
  }

  public startFinalShowdown(): void {
    this.phase = 'final_showdown';
    this.map.generateFinalShowdownMap();

    this.bombs = [];
    this.explosions = [];
    this.lootList = [];
    this.coinList = [];
    this.fallingGreaseList = [];
    this.greasePuddles = [];
    this.meteors = [];
    this.airdropPickups = [];

    // Position combatants in 4 tactical corners of the Grand Arena:
    // Top-Left: Player 1 (Blue)
    const pPos = this.map.gridToWorldCenter(2, 2);
    this.player.x = pPos.x;
    this.player.y = pPos.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.slipTimer = 0;
    this.player.carriedCoins = 0;

    // Bottom-Left: Ally (Blue)
    if (this.ally) {
      const aPos = this.map.gridToWorldCenter(2, this.map.height - 3);
      this.ally.x = aPos.x;
      this.ally.y = aPos.y;
      this.ally.vx = 0;
      this.ally.vy = 0;
      this.ally.slipTimer = 0;
      this.ally.carriedCoins = 0;
    }

    // Top-Right: Rival 1 (Red)
    const b1Pos = this.map.gridToWorldCenter(this.map.width - 3, 2);
    this.bot.x = b1Pos.x;
    this.bot.y = b1Pos.y;
    this.bot.vx = 0;
    this.bot.vy = 0;
    this.bot.slipTimer = 0;
    this.bot.carriedCoins = 0;

    // Bottom-Right: Rival 2 (Red)
    if (this.bot2) {
      const b2Pos = this.map.gridToWorldCenter(this.map.width - 3, this.map.height - 3);
      this.bot2.x = b2Pos.x;
      this.bot2.y = b2Pos.y;
      this.bot2.vx = 0;
      this.bot2.vy = 0;
      this.bot2.slipTimer = 0;
      this.bot2.carriedCoins = 0;
    }

    // Reset magazines to fully ready for all entities
    for (const entity of this.getAllEntities()) {
      for (const s of entity.magazine) {
        s.isReady = true;
        s.rechargeTimer = 0;
        s.activeBombId = undefined;
      }
      entity.bombCount = entity.magazine.length;
    }

    AudioFX.playShowdownStart();
    this.particles.triggerScreenShake(14);
    this.particles.spawnDamageNumber(pPos.x, pPos.y - 24, '⚔️ ¡DUELO FINAL 2 vs 2 A MUERTE!', '#EF4444');
  }

  private updateFinalShowdownPhase(dt: number): void {
    // 1. Spawn falling grease drops periodically
    this.greaseSpawnTimer -= dt;
    if (this.greaseSpawnTimer <= 0) {
      this.greaseSpawnTimer =
        BALANCE.GREASE_SPAWN_INTERVAL_MIN +
        Math.random() * (BALANCE.GREASE_SPAWN_INTERVAL_MAX - BALANCE.GREASE_SPAWN_INTERVAL_MIN);

      const gx = Math.floor(2 + Math.random() * (this.map.width - 4));
      const gy = Math.floor(2 + Math.random() * (this.map.height - 4));
      const target = this.map.gridToWorldCenter(gx, gy);

      this.fallingGreaseList.push({
        id: Math.random().toString(36).substring(2, 9),
        startX: target.x + (Math.random() - 0.5) * 40,
        startY: target.y - 240,
        targetX: target.x,
        targetY: target.y,
        gridX: gx,
        gridY: gy,
        progress: 0,
        duration: 1.1,
      });
    }

    // 2. Spawn Meteors from the sky
    this.meteorSpawnTimer -= dt;
    if (this.meteorSpawnTimer <= 0) {
      this.meteorSpawnTimer =
        BALANCE.METEOR_SPAWN_INTERVAL_MIN +
        Math.random() * (BALANCE.METEOR_SPAWN_INTERVAL_MAX - BALANCE.METEOR_SPAWN_INTERVAL_MIN);

      // Target near player, bot, or center
      const targetCandidate = Math.random() < 0.45 ? this.player : Math.random() < 0.8 ? this.bot : null;
      let tx: number, ty: number, gx: number, gy: number;

      if (targetCandidate && targetCandidate.isAlive) {
        tx = targetCandidate.x + (Math.random() - 0.5) * 60;
        ty = targetCandidate.y + (Math.random() - 0.5) * 60;
        const g = this.map.worldToGrid(tx, ty);
        gx = Math.max(1, Math.min(this.map.width - 2, g.gridX));
        gy = Math.max(1, Math.min(this.map.height - 2, g.gridY));
        const center = this.map.gridToWorldCenter(gx, gy);
        tx = center.x;
        ty = center.y;
      } else {
        gx = Math.floor(2 + Math.random() * (this.map.width - 4));
        gy = Math.floor(2 + Math.random() * (this.map.height - 4));
        const center = this.map.gridToWorldCenter(gx, gy);
        tx = center.x;
        ty = center.y;
      }

      this.meteors.push({
        id: Math.random().toString(36).substring(2, 9),
        startX: tx + 120,
        startY: ty - 280,
        targetX: tx,
        targetY: ty,
        gridX: gx,
        gridY: gy,
        progress: 0,
        duration: BALANCE.METEOR_DURATION,
        radius: BALANCE.METEOR_BLAST_RADIUS,
        damage: BALANCE.METEOR_DAMAGE,
      });

      AudioFX.playMeteorWarning();
    }

    // 3. Spawn Airdrop Power-ups Falling from the Sky
    this.airdropSpawnTimer -= dt;
    if (this.airdropSpawnTimer <= 0) {
      this.airdropSpawnTimer =
        BALANCE.AIRDROP_SPAWN_INTERVAL_MIN +
        Math.random() * (BALANCE.AIRDROP_SPAWN_INTERVAL_MAX - BALANCE.AIRDROP_SPAWN_INTERVAL_MIN);

      const gx = Math.floor(2 + Math.random() * (this.map.width - 4));
      const gy = Math.floor(2 + Math.random() * (this.map.height - 4));
      const target = this.map.gridToWorldCenter(gx, gy);

      const airdropTypes: Array<{ type: AirdropPickup['type']; title: string; icon: string; color: string }> = [
        { type: 'shield', title: 'ESCUDO TITÁN +50', icon: '🛡️', color: '#38BDF8' },
        { type: 'heal', title: 'ELIXIR VIDA +35', icon: '❤️', color: '#10B981' },
        { type: 'super_bomb', title: 'SUPER BOMBA ORBITAL', icon: '⚡', color: '#F59E0B' },
        { type: 'speed_boost', title: 'TURBINA VELOCIDAD +40', icon: '💨', color: '#C084FC' },
      ];
      const selected = airdropTypes[Math.floor(Math.random() * airdropTypes.length)];

      this.airdropPickups.push({
        id: Math.random().toString(36).substring(2, 9),
        startX: target.x,
        startY: target.y - 260,
        targetX: target.x,
        targetY: target.y,
        x: target.x,
        y: target.y - 260,
        gridX: gx,
        gridY: gy,
        progress: 0,
        duration: BALANCE.AIRDROP_DURATION,
        isLanded: false,
        type: selected.type,
        title: selected.title,
        icon: selected.icon,
        color: selected.color,
        bobPhase: Math.random() * Math.PI * 2,
        life: BALANCE.AIRDROP_LIFETIME,
      });

      AudioFX.playAirdropSpawn();
    }

    // 4. Update Falling Grease drops
    for (let i = this.fallingGreaseList.length - 1; i >= 0; i--) {
      const fg = this.fallingGreaseList[i];
      fg.progress += dt / fg.duration;

      if (fg.progress >= 1.0) {
        AudioFX.playGreaseSplash();
        this.particles.spawnExplosionBurst(fg.targetX, fg.targetY, '#84CC16', 14);

        this.greasePuddles.push({
          id: Math.random().toString(36).substring(2, 9),
          x: fg.targetX,
          y: fg.targetY,
          gridX: fg.gridX,
          gridY: fg.gridY,
          radius: 24,
          duration: BALANCE.GREASE_PUDDLE_DURATION,
          maxDuration: BALANCE.GREASE_PUDDLE_DURATION,
        });

        this.fallingGreaseList.splice(i, 1);
      }
    }

    // 5. Update active Grease Puddles & check slip collisions
    for (let i = this.greasePuddles.length - 1; i >= 0; i--) {
      const puddle = this.greasePuddles[i];
      puddle.duration -= dt;

      for (const entity of this.getAllEntities()) {
        this.checkGreaseSlip(entity, puddle);
      }

      if (puddle.duration <= 0) {
        this.greasePuddles.splice(i, 1);
      }
    }

    // 6. Update Meteors & check impact
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      meteor.progress += dt / meteor.duration;

      if (meteor.progress >= 1.0) {
        // Impact!
        AudioFX.playMeteorImpact();
        this.particles.triggerScreenShake(14);
        this.particles.spawnExplosionBurst(meteor.targetX, meteor.targetY, '#EF4444', 36);
        this.particles.spawnWallDebris(meteor.targetX, meteor.targetY);
        this.particles.spawnDamageNumber(meteor.targetX, meteor.targetY - 20, '☄️ ¡IMPACTO METEORITO!', '#EF4444');

        // Damage check in blast radius for all entities
        for (const entity of this.getAllEntities()) {
          this.checkMeteorDamage(entity, meteor);
        }

        this.meteors.splice(i, 1);
      }
    }

    // 7. Update Airdrop Pickups & check collection
    for (let i = this.airdropPickups.length - 1; i >= 0; i--) {
      const airdrop = this.airdropPickups[i];
      if (!airdrop.isLanded) {
        airdrop.progress += dt / airdrop.duration;
        airdrop.y = airdrop.startY + (airdrop.targetY - airdrop.startY) * airdrop.progress;
        if (airdrop.progress >= 1.0) {
          airdrop.isLanded = true;
          airdrop.y = airdrop.targetY;
          this.particles.spawnPickupSparkles(airdrop.x, airdrop.y, airdrop.color);
        }
      } else {
        airdrop.life -= dt;
        airdrop.bobPhase += dt * 3;

        let collected = false;
        for (const entity of this.getAllEntities()) {
          const dist = Math.hypot(entity.x - airdrop.x, entity.y - airdrop.y);
          if (entity.isAlive && dist <= BALANCE.LOOT_PICKUP_RADIUS) {
            this.applyAirdropBuff(entity, airdrop);
            this.airdropPickups.splice(i, 1);
            collected = true;
            break;
          }
        }
        if (collected) continue;

        if (airdrop.life <= 0) {
          this.airdropPickups.splice(i, 1);
        }
      }
    }
  }

  private checkMeteorDamage(entity: Entity, meteor: Meteor): void {
    if (!entity.isAlive || entity.iFrames > 0) return;

    const dist = Math.hypot(entity.x - meteor.targetX, entity.y - meteor.targetY);
    if (dist <= meteor.radius + entity.radius * 0.5) {
      let finalDamage = BALANCE.calculateDamage(meteor.damage, entity.armor);

      if (entity.shield > 0) {
        if (entity.shield >= finalDamage) {
          entity.shield -= finalDamage;
          finalDamage = 0;
          this.particles.spawnDamageNumber(entity.x, entity.y, 'ESCUDO RESISTE', '#38BDF8');
        } else {
          finalDamage -= entity.shield;
          entity.shield = 0;
        }
      }

      if (finalDamage > 0) {
        entity.hp -= finalDamage;
        entity.iFrames = BALANCE.BASE_IFRAMES_DURATION;
        this.particles.spawnDamageNumber(entity.x, entity.y, `-${finalDamage} ☄️`, '#EF4444');

        // Knockback away from meteor impact
        const angle = Math.atan2(entity.y - meteor.targetY, entity.x - meteor.targetX);
        entity.vx += Math.cos(angle) * 160;
        entity.vy += Math.sin(angle) * 160;

        if (entity.hp <= 0) {
          entity.hp = 0;
          this.killEntity(entity);
        }
      }
    }
  }

  private applyAirdropBuff(entity: Entity, airdrop: AirdropPickup): void {
    AudioFX.playAirdropCollect();
    this.particles.spawnExplosionBurst(airdrop.x, airdrop.y, airdrop.color, 20);
    this.particles.spawnDamageNumber(entity.x, entity.y - 18, `✨ ${airdrop.title}!`, airdrop.color);

    switch (airdrop.type) {
      case 'shield':
        entity.shield += 50;
        break;
      case 'heal':
        entity.hp = Math.min(entity.maxHp, entity.hp + 35);
        break;
      case 'super_bomb': {
        const slotIdx = entity.magazine.length;
        entity.magazine.push({
          slotIndex: slotIdx,
          isReady: true,
          rechargeTimer: 0,
          maxRechargeTime: BALANCE.BOMB_RELOAD_SECONDARY_TIME,
          isEmpowered: true,
          powerBonusRadius: 2,
          powerBonusDamage: 25,
        });
        entity.maxBombs = entity.magazine.length;
        entity.bombCount = entity.magazine.filter(s => s.isReady).length;
        break;
      }
      case 'speed_boost':
        entity.speed += 40;
        entity.statusEffects.push({ type: 'speed_boost', duration: 12.0, magnitude: 0.3 });
        break;
    }
  }

  private checkGreaseSlip(entity: Entity, puddle: GreasePuddle): void {
    if (!entity.isAlive || entity.slipTimer > 0) return;

    const dist = Math.hypot(entity.x - puddle.x, entity.y - puddle.y);
    if (dist <= puddle.radius + entity.radius * 0.5) {
      const currentSpeed = entity.speed * BALANCE.GREASE_SLIP_SPEED_MULTIPLIER;
      let dirX = entity.vx;
      let dirY = entity.vy;

      if (Math.hypot(dirX, dirY) < 10) {
        const angle = Math.random() * Math.PI * 2;
        dirX = Math.cos(angle);
        dirY = Math.sin(angle);
      }

      const len = Math.hypot(dirX, dirY) || 1;
      entity.slipVx = (dirX / len) * currentSpeed;
      entity.slipVy = (dirY / len) * currentSpeed;
      entity.slipTimer = Math.max(0.2, BALANCE.GREASE_SLIP_DURATION * (1 - entity.tractionBonus));

      AudioFX.playGreaseSlip();
      this.particles.spawnDamageNumber(entity.x, entity.y - 16, '💫 ¡RESBALÓN!', '#FACC15');
      this.particles.spawnPickupSparkles(entity.x, entity.y, '#84CC16');
    }
  }

  private updateCoins(dt: number): void {
    for (let i = this.coinList.length - 1; i >= 0; i--) {
      const coin = this.coinList[i];
      coin.bobPhase += dt * 5;

      let collected = false;
      for (const entity of this.getAllEntities()) {
        if (!entity.isAlive) continue;
        // In portal solo phase, only Blue Team collects
        if (this.phase === 'portal_warehouse' && !this.isRivalInWarehouse && entity.teamId !== 'team_blue') {
          continue;
        }

        const dist = Math.hypot(entity.x - coin.x, entity.y - coin.y);
        if (dist <= BALANCE.LOOT_PICKUP_RADIUS) {
          entity.carriedCoins += coin.value;
          if (entity.id === 'player_1') {
            AudioFX.playCoinPickup();
            this.particles.spawnDamageNumber(coin.x, coin.y, `+${coin.value} 🪙 (Carga: ${entity.carriedCoins})`, coin.isGem ? '#C084FC' : '#FBBF24');
          }
          this.particles.spawnPickupSparkles(coin.x, coin.y, coin.isGem ? '#C084FC' : '#FBBF24');
          this.coinList.splice(i, 1);
          collected = true;
          break;
        }
      }
      if (collected) continue;
    }
  }

  private updateEntity(
    entity: Entity,
    dt: number,
    inputDir: { x?: number; y?: number; vx?: number; vy?: number },
    isVelocityDirect = false
  ): void {
    if (!entity.isAlive) return;

    // Cooldowns & iFrames
    if (entity.activeSkillCooldown > 0) {
      entity.activeSkillCooldown -= dt;
      if (entity.activeSkillCooldown < 0) entity.activeSkillCooldown = 0;
    }
    if (entity.iFrames > 0) {
      entity.iFrames -= dt;
      if (entity.iFrames < 0) entity.iFrames = 0;
    }

    // Status effects
    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect = entity.statusEffects[i];
      effect.duration -= dt;
      if (effect.type === 'poison') {
        entity.hp -= effect.magnitude * dt;
        if (entity.hp <= 0) {
          entity.hp = 0;
          this.killEntity(entity);
        }
      }
      if (effect.duration <= 0) {
        entity.statusEffects.splice(i, 1);
      }
    }

    // Slipping condition handles velocity override
    if (entity.slipTimer > 0) {
      entity.slipTimer -= dt;
      entity.vx = entity.slipVx;
      entity.vy = entity.slipVy;
      this.moveWithCollision(entity, dt);
      return;
    }

    // Calculate baseline speed + weight penalty from carried coins
    let currentSpeed = entity.speed;

    // Weight penalty: carrying coins slows the character down
    if (entity.carriedCoins > 0) {
      const weightRatio = Math.min(1.0, entity.carriedCoins / BALANCE.COIN_WEIGHT_CAP_THRESHOLD);
      const slowdown = weightRatio * BALANCE.COIN_WEIGHT_MAX_PENALTY;
      currentSpeed *= (1 - slowdown);
    }

    // Adrenaline / Critical Health Boost
    const isCritical = entity.hp <= entity.maxHp * BALANCE.CRITICAL_HP_THRESHOLD;
    if (isCritical) {
      currentSpeed *= BALANCE.ADRENALINE_SPEED_BOOST;
    }

    // Apply slow effects if any
    const slowEffect = entity.statusEffects.find(e => e.type === 'slow');
    if (slowEffect) {
      currentSpeed *= 1 - slowEffect.magnitude;
    }

    // Velocity calculation
    if (isVelocityDirect) {
      entity.vx = inputDir.vx ?? inputDir.x ?? 0;
      entity.vy = inputDir.vy ?? inputDir.y ?? 0;
    } else {
      const ix = inputDir.x ?? 0;
      const iy = inputDir.y ?? 0;
      const len = Math.hypot(ix, iy);
      if (len > 0.05) {
        entity.vx = (ix / len) * currentSpeed;
        entity.vy = (iy / len) * currentSpeed;
      } else {
        entity.vx = 0;
        entity.vy = 0;
      }
    }

    // Collision detection & movement resolution against grid
    this.moveWithCollision(entity, dt);
  }

  private moveWithCollision(entity: Entity, dt: number): void {
    const nextX = entity.x + entity.vx * dt;
    const nextY = entity.y + entity.vy * dt;
    const r = entity.radius * 0.75;

    // Check X movement
    if (this.canOccupy(nextX, entity.y, r, entity.isPhasing)) {
      entity.x = nextX;
    } else {
      entity.vx = 0;
    }

    // Check Y movement
    if (this.canOccupy(entity.x, nextY, r, entity.isPhasing)) {
      entity.y = nextY;
    } else {
      entity.vy = 0;
    }
  }

  private canOccupy(x: number, y: number, r: number, isPhasing = false): boolean {
    const checkPoints = [
      { x: x - r, y: y - r },
      { x: x + r, y: y - r },
      { x: x - r, y: y + r },
      { x: x + r, y: y + r },
    ];

    for (const pt of checkPoints) {
      const g = this.map.worldToGrid(pt.x, pt.y);
      if (!this.map.isWalkable(g.gridX, g.gridY, isPhasing)) {
        return false;
      }
    }
    return true;
  }

  public placeBomb(entity: Entity): boolean {
    if (!entity.isAlive || entity.bombCount <= 0) return false;

    const g = this.map.worldToGrid(entity.x, entity.y);
    const alreadyBomb = this.bombs.some(b => b.gridX === g.gridX && b.gridY === g.gridY);
    if (alreadyBomb) return false;

    const readySlot = entity.magazine.find(s => s.isReady);
    if (!readySlot) return false;

    const bombId = Math.random().toString(36).substring(2, 9);
    readySlot.isReady = false;
    readySlot.activeBombId = bombId;
    readySlot.rechargeTimer = 0;

    const center = this.map.gridToWorldCenter(g.gridX, g.gridY);
    const extraRadius = readySlot.isEmpowered ? readySlot.powerBonusRadius : 0;
    const extraDamage = readySlot.isEmpowered ? readySlot.powerBonusDamage : 0;

    const newBomb: Bomb = {
      id: bombId,
      x: center.x,
      y: center.y,
      gridX: g.gridX,
      gridY: g.gridY,
      timer: BALANCE.BOMB_TIMER,
      maxTimer: BALANCE.BOMB_TIMER,
      radius: entity.bombRadius + extraRadius,
      damage: entity.bombDamage + extraDamage,
      ownerId: entity.id,
      ownerSign: entity.sign,
      slotIndex: readySlot.slotIndex,
      isEmpowered: readySlot.isEmpowered,
      isScorpioPoison: entity.sign === 'Scorpio' || entity.equippedCard?.abilityKey === 'venom_retribution',
    };

    entity.bombCount = entity.magazine.filter(s => s.isReady).length;
    this.bombs.push(newBomb);

    if (entity.id === 'player_1') {
      this.stats.bombsPlacedPlayer++;
      if (readySlot.isEmpowered) {
        this.particles.spawnExplosionBurst(center.x, center.y, '#FBBF24', 12);
        this.particles.spawnDamageNumber(center.x, center.y - 14, '⚡ SUPER BOMBA', '#F59E0B');
      }
    }

    AudioFX.playBombDrop();
    return true;
  }

  public triggerSkill(entity: Entity): boolean {
    if (!entity.isAlive || entity.activeSkillCooldown > 0) return false;

    entity.activeSkillCooldown = entity.activeSkillMaxCooldown;
    AudioFX.playSkill();

    const pX = entity.x;
    const pY = entity.y;
    this.particles.spawnExplosionBurst(pX, pY, '#A855F7', 16);

    switch (entity.sign) {
      case 'Aries': {
        entity.vx *= 2.5;
        entity.vy *= 2.5;
        this.particles.spawnExplosionBurst(pX, pY, '#EF4444', 20);
        this.damageAdjacentTiles(entity.x, entity.y, 40, entity.id, entity.sign);
        break;
      }
      case 'Taurus': {
        this.particles.spawnExplosionBurst(pX, pY, '#10B981', 30);
        this.damageAdjacentTiles(entity.x, entity.y, 50, entity.id, entity.sign);
        entity.shield = Math.min(60, entity.shield + 25);
        break;
      }
      case 'Leo': {
        entity.bombRadius += 1;
        const enemies = entity.teamId === 'team_blue' ? this.getRedTeam() : this.getBlueTeam();
        for (const enemy of enemies) {
          enemy.statusEffects.push({ type: 'slow', duration: 3.5, magnitude: 0.35 });
          this.particles.spawnDamageNumber(enemy.x, enemy.y, 'SLOWED!', '#FDE047');
        }
        break;
      }
      case 'Cancer': {
        entity.shield += 30;
        entity.hp = Math.min(entity.maxHp, entity.hp + 20);
        this.particles.spawnPickupSparkles(pX, pY, '#22D3EE');
        this.particles.spawnDamageNumber(pX, pY, '+20 HP', '#22D3EE');
        break;
      }
      case 'Pisces': {
        entity.isPhasing = true;
        this.particles.spawnPickupSparkles(pX, pY, '#2DD4BF');
        setTimeout(() => {
          entity.isPhasing = false;
        }, 3000);
        break;
      }
      case 'Virgo': {
        entity.armor += 8;
        for (const loot of this.lootList) {
          loot.x = entity.x;
          loot.y = entity.y;
        }
        break;
      }
      case 'Capricorn': {
        const g = this.map.worldToGrid(entity.x, entity.y);
        const adjacent = [
          { gx: g.gridX + 1, gy: g.gridY },
          { gx: g.gridX - 1, gy: g.gridY },
        ];
        for (const adj of adjacent) {
          if (this.map.getTile(adj.gx, adj.gy)?.type === 'empty') {
            this.map.setTile(adj.gx, adj.gy, 'wall_indestructible');
          }
        }
        entity.shield += 25;
        break;
      }
      default: {
        entity.shield += 20;
        this.particles.spawnExplosionBurst(pX, pY, '#38BDF8', 16);
      }
    }

    return true;
  }

  private damageAdjacentTiles(x: number, y: number, damage: number, ownerId: string, ownerSign: ZodiacSign) {
    const centerG = this.map.worldToGrid(x, y);
    const adjacent = [
      { gx: centerG.gridX, gy: centerG.gridY },
      { gx: centerG.gridX + 1, gy: centerG.gridY },
      { gx: centerG.gridX - 1, gy: centerG.gridY },
      { gx: centerG.gridX, gy: centerG.gridY + 1 },
      { gx: centerG.gridX, gy: centerG.gridY - 1 },
    ];

    for (const adj of adjacent) {
      const tile = this.map.getTile(adj.gx, adj.gy);
      if (tile && tile.type === 'wall_destructible') {
        this.destroyTile(adj.gx, adj.gy, ownerId);
      }
    }
  }

  private updateBombs(dt: number): void {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.timer -= dt;

      if (bomb.timer < 0.6 && Math.random() < 0.25) {
        AudioFX.playBombTick();
      }

      if (bomb.timer <= 0) {
        this.detonateBomb(bomb);
        this.bombs.splice(i, 1);
      }
    }

    for (const entity of this.getAllEntities()) {
      this.updateEntityMagazine(entity, dt);
    }
  }

  private updateEntityMagazine(entity: Entity, dt: number): void {
    for (const slot of entity.magazine) {
      if (!slot.isReady && slot.rechargeTimer > 0) {
        slot.rechargeTimer -= dt;
        if (slot.rechargeTimer <= 0) {
          slot.rechargeTimer = 0;
          slot.isReady = true;
          slot.activeBombId = undefined;
          if (entity.id === 'player_1') {
            AudioFX.playChamberReloaded();
            this.particles.spawnDamageNumber(
              entity.x,
              entity.y - 18,
              slot.isEmpowered ? '⚡ SUPER BOMBA LISTA!' : '💣 BOMBA RECARGADA!',
              slot.isEmpowered ? '#F59E0B' : '#10B981'
            );
          }
        }
      }
    }
    entity.bombCount = entity.magazine.filter(s => s.isReady).length;
  }

  public detonateBomb(bomb: Bomb): void {
    AudioFX.playExplosion();

    // Trigger magazine recharge on owner's chamber slot
    const owner = this.getAllEntities().find(e => e.id === bomb.ownerId);
    if (owner) {
      let slot = owner.magazine.find(s => s.activeBombId === bomb.id);
      if (!slot && typeof bomb.slotIndex === 'number' && owner.magazine[bomb.slotIndex]) {
        slot = owner.magazine[bomb.slotIndex];
      }
      if (!slot) {
        slot = owner.magazine.find(s => !s.isReady && s.rechargeTimer <= 0);
      }
      if (slot) {
        slot.activeBombId = undefined;
        // PRIMARY BOMB (slot 0 or maxRechargeTime === 0) reloads INSTANTLY!
        if (slot.slotIndex === 0 || slot.maxRechargeTime <= 0) {
          slot.rechargeTimer = 0;
          slot.isReady = true;
          if (owner.id === 'player_1') {
            AudioFX.playChamberReloaded();
          }
        } else {
          slot.rechargeTimer = slot.maxRechargeTime;
        }
      }
      owner.bombCount = owner.magazine.filter(s => s.isReady).length;
    }

    const segments: ExplosionSegment[] = [{ gridX: bomb.gridX, gridY: bomb.gridY, isCenter: true, dir: 'center' }];
    const worldCenter = this.map.gridToWorldCenter(bomb.gridX, bomb.gridY);
    this.particles.spawnExplosionBurst(worldCenter.x, worldCenter.y, bomb.isScorpioPoison ? '#A855F7' : '#F59E0B');

    const directions: Array<{ dx: number; dy: number; dir: 'up' | 'down' | 'left' | 'right' }> = [
      { dx: 1, dy: 0, dir: 'right' },
      { dx: -1, dy: 0, dir: 'left' },
      { dx: 0, dy: 1, dir: 'down' },
      { dx: 0, dy: -1, dir: 'up' },
    ];

    for (const d of directions) {
      for (let r = 1; r <= bomb.radius; r++) {
        const gx = bomb.gridX + d.dx * r;
        const gy = bomb.gridY + d.dy * r;
        const tile = this.map.getTile(gx, gy);

        if (!tile) break;

        if (tile.type === 'wall_indestructible') {
          break;
        }

        segments.push({ gridX: gx, gridY: gy, isCenter: false, dir: d.dir });

        if (tile.type === 'wall_destructible') {
          this.destroyTile(gx, gy, bomb.ownerId);
          break;
        }

        const chainedBomb = this.bombs.find(b => b.gridX === gx && b.gridY === gy);
        if (chainedBomb && chainedBomb.timer > BALANCE.BOMB_CHAIN_DELAY) {
          chainedBomb.timer = BALANCE.BOMB_CHAIN_DELAY;
        }
      }
    }

    const newExplosion: Explosion = {
      id: Math.random().toString(36).substring(2, 9),
      centerGridX: bomb.gridX,
      centerGridY: bomb.gridY,
      segments,
      duration: BALANCE.BOMB_EXPLOSION_DURATION,
      maxDuration: BALANCE.BOMB_EXPLOSION_DURATION,
      damage: bomb.damage,
      ownerId: bomb.ownerId,
      ownerSign: bomb.ownerSign,
      isScorpioPoison: bomb.isScorpioPoison,
    };

    this.explosions.push(newExplosion);
  }

  private destroyTile(gridX: number, gridY: number, breakerId: string): void {
    const tile = this.map.getTile(gridX, gridY);
    if (!tile || tile.type !== 'wall_destructible') return;

    const center = this.map.gridToWorldCenter(gridX, gridY);
    this.particles.spawnWallDebris(center.x, center.y);
    AudioFX.playWallBreak();

    // Check Secret Door hidden behind this destructible wall
    const secretDoor = this.map.secretDoors.find(d => d.gridX === gridX && d.gridY === gridY);
    if (secretDoor && !secretDoor.isRevealed) {
      secretDoor.isRevealed = true;
      AudioFX.playDoorOpen();
      this.particles.spawnExplosionBurst(center.x, center.y, '#A855F7', 24);
      this.particles.spawnDamageNumber(center.x, center.y - 18, '🚪 ¡PUERTA SECRETA REVELADA!', '#F59E0B');
    }

    // Spawn Loot if present
    if (tile.itemDrop) {
      this.lootList.push({
        id: Math.random().toString(36).substring(2, 9),
        x: center.x,
        y: center.y,
        gridX,
        gridY,
        item: tile.itemDrop,
        life: BALANCE.LOOT_LIFETIME,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }

    this.map.setTile(gridX, gridY, 'empty');

    if (breakerId === this.player.id) {
      this.stats.wallsDestroyedPlayer++;
      this.combo.count++;
      this.combo.timer = this.combo.maxTimer;
      this.combo.multiplier = Math.min(BALANCE.COMBO_MAX_MULTIPLIER, 1 + this.combo.count * 0.25);

      if (this.combo.count > this.stats.maxComboPlayer) {
        this.stats.maxComboPlayer = this.combo.count;
      }

      AudioFX.playCombo(this.combo.count);
      this.particles.spawnDamageNumber(
        center.x,
        center.y,
        `BREAK x${this.combo.count}!`,
        this.combo.count >= 4 ? '#F59E0B' : '#38BDF8'
      );
    } else {
      this.stats.wallsDestroyedBot++;
    }
  }

  private updateExplosions(dt: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.duration -= dt;

      for (const entity of this.getAllEntities()) {
        this.checkExplosionHit(exp, entity);
      }

      if (exp.duration <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private checkExplosionHit(exp: Explosion, entity: Entity): void {
    if (!entity.isAlive || entity.iFrames > 0) return;

    const entityGrid = this.map.worldToGrid(entity.x, entity.y);
    const isHit = exp.segments.some(s => s.gridX === entityGrid.gridX && s.gridY === entityGrid.gridY);

    if (isHit) {
      const rawDamage = exp.damage;
      let finalDamage = BALANCE.calculateDamage(rawDamage, entity.armor);

      if (entity.sign === 'Taurus') {
        finalDamage = Math.round(finalDamage * 0.82);
      }

      if (entity.shield > 0) {
        if (entity.shield >= finalDamage) {
          entity.shield -= finalDamage;
          finalDamage = 0;
          this.particles.spawnDamageNumber(entity.x, entity.y, 'BLOCKED', '#38BDF8');
        } else {
          finalDamage -= entity.shield;
          entity.shield = 0;
        }
      }

      if (finalDamage > 0) {
        entity.hp -= finalDamage;
        entity.iFrames = BALANCE.BASE_IFRAMES_DURATION;
        AudioFX.playHit();

        this.particles.spawnDamageNumber(
          entity.x,
          entity.y,
          `-${finalDamage}`,
          entity.teamId === 'team_blue' ? '#EF4444' : '#FBBF24'
        );
        this.particles.triggerScreenShake(6);

        if (exp.ownerId === this.player.id) {
          this.stats.damageDealtPlayer += finalDamage;
        } else if (this.ally && exp.ownerId === this.ally.id) {
          this.stats.damageDealtAlly += finalDamage;
        } else if (exp.ownerId === this.bot.id) {
          this.stats.damageDealtBot += finalDamage;
        } else if (this.bot2 && exp.ownerId === this.bot2.id) {
          this.stats.damageDealtBot2 += finalDamage;
        }

        if (exp.isScorpioPoison) {
          entity.statusEffects.push({ type: 'poison', duration: 3.0, magnitude: 6 });
          entity.statusEffects.push({ type: 'slow', duration: 2.5, magnitude: 0.25 });
        }

        if (entity.hp <= 0) {
          entity.hp = 0;
          this.killEntity(entity);
        }
      }
    }
  }

  private killEntity(entity: Entity): void {
    entity.isAlive = false;
    entity.hp = 0;
    this.particles.spawnExplosionBurst(entity.x, entity.y, '#EF4444', 32);
    this.particles.spawnDamageNumber(entity.x, entity.y - 18, `☠️ ${entity.name} CAÍDO`, '#EF4444');

    // Check if entire Blue Team or Red Team is defeated
    const blueAlive = this.getBlueTeam().some(e => e.isAlive);
    const redAlive = this.getRedTeam().some(e => e.isAlive);

    if (!blueAlive && !redAlive) {
      AudioFX.playDefeat();
      this.handleMatchEnd('draw');
    } else if (!blueAlive) {
      AudioFX.playDefeat();
      this.handleMatchEnd('bot');
    } else if (!redAlive) {
      AudioFX.playVictory();
      this.handleMatchEnd('player');
    }
  }

  private updateLoot(dt: number): void {
    for (let i = this.lootList.length - 1; i >= 0; i--) {
      const loot = this.lootList[i];
      loot.life -= dt;
      loot.bobPhase += dt * 4;

      let collected = false;
      for (const entity of this.getAllEntities()) {
        if (!entity.isAlive) continue;
        const dist = Math.hypot(entity.x - loot.x, entity.y - loot.y);
        if (dist <= BALANCE.LOOT_PICKUP_RADIUS) {
          this.applyItemPickup(entity, loot.item);
          if (entity.id === 'player_1') {
            this.stats.lootCollectedPlayer++;
          }
          this.particles.spawnPickupSparkles(loot.x, loot.y);
          AudioFX.playPickup();
          this.lootList.splice(i, 1);
          collected = true;
          break;
        }
      }
      if (collected) continue;

      if (loot.life <= 0) {
        this.lootList.splice(i, 1);
      }
    }
  }

  private applyItemPickup(entity: Entity, item: Item): void {
    entity.inventory.push(item);
    const s = item.stats;

    if (s.hpBonus) {
      entity.maxHp += s.hpBonus;
      entity.hp = Math.min(entity.maxHp, entity.hp + s.hpBonus);
    }
    if (s.armorBonus) entity.armor += s.armorBonus;
    if (s.speedBonus) entity.speed += s.speedBonus;
    if (s.bombCountBonus) {
      for (let i = 0; i < s.bombCountBonus; i++) {
        const slotIdx = entity.magazine.length;
        const reloadTime = slotIdx === 1 ? BALANCE.BOMB_RELOAD_SECONDARY_TIME : BALANCE.BOMB_RELOAD_TERTIARY_TIME;
        entity.magazine.push({
          slotIndex: slotIdx,
          isReady: true,
          rechargeTimer: 0,
          maxRechargeTime: reloadTime,
          isEmpowered: true,
          powerBonusRadius: BALANCE.EMPOWERED_BOMB_BONUS_RADIUS,
          powerBonusDamage: BALANCE.EMPOWERED_BOMB_BONUS_DAMAGE,
        });
      }
      entity.maxBombs = entity.magazine.length;
      entity.bombCount = entity.magazine.filter(m => m.isReady).length;

      if (entity.id === 'player_1') {
        this.particles.spawnDamageNumber(entity.x, entity.y - 12, '+⚡ SUPER BOMBA (Cámara 2)', '#F59E0B');
      }
    }
    if (s.bombRadiusBonus) entity.bombRadius += s.bombRadiusBonus;
    if (s.damageBonus) entity.bombDamage += s.damageBonus;

    if (entity.sign === 'Cancer') {
      entity.shield = Math.min(45, entity.shield + 15);
    }

    this.particles.spawnDamageNumber(entity.x, entity.y, `+${item.name}`, '#38BDF8');
  }

  private handleMatchEnd(winner: 'player' | 'bot' | 'draw'): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.winner = winner;

    this.stats.winnerId = winner === 'player' ? 'team_blue' : winner === 'bot' ? 'team_red' : null;
    this.stats.playerWon = winner === 'player';

    const score = Math.round(
      this.stats.damageDealtPlayer * 2.5 +
        (this.stats.damageDealtAlly || 0) * 1.5 +
        this.stats.wallsDestroyedPlayer * 15 +
        this.stats.lootCollectedPlayer * 25 +
        this.stats.maxComboPlayer * 50 +
        this.player.coins * 10 +
        (winner === 'player' ? 600 : 100)
    );

    this.stats.score = score;
    this.stats.mmrChange = winner === 'player' ? BALANCE.MMR_WIN_BASE + Math.floor(score / 200) : -BALANCE.MMR_LOSS_BASE;

    if (this.onMatchEndCallback) {
      this.onMatchEndCallback(this.stats);
    }
  }
}
