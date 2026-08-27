import { BALANCE } from './BalanceConfig';
import { MapSystem } from './MapSystem';
import { Bomb, Entity, Explosion, LootPickup } from './types';

interface GridPos {
  gx: number;
  gy: number;
}

interface DangerTile {
  gx: number;
  gy: number;
  timeRemaining: number;
  damage: number;
}

export class BotAI {
  private decisionTimer: number = 0;
  private bombCooldown: number = 0;
  private currentPath: GridPos[] = [];
  private isEvacuating: boolean = false;

  public update(
    dt: number,
    bot: Entity,
    target: Entity | Entity[],
    map: MapSystem,
    bombs: Bomb[],
    lootList: LootPickup[],
    onPlaceBomb: (bot: Entity) => void,
    onUseSkill: (bot: Entity) => void,
    explosions: Explosion[] = []
  ): { vx: number; vy: number } {
    this.decisionTimer -= dt;
    this.bombCooldown -= dt;

    if (!bot.isAlive) return { vx: 0, vy: 0 };

    // Select primary alive enemy target
    let primaryTarget: Entity | null = null;
    if (Array.isArray(target)) {
      const aliveEnemies = target.filter(e => e.isAlive);
      if (aliveEnemies.length > 0) {
        primaryTarget = aliveEnemies.reduce((closest, curr) => {
          const distC = Math.hypot(bot.x - closest.x, bot.y - closest.y);
          const distCurr = Math.hypot(bot.x - curr.x, bot.y - curr.y);
          return distCurr < distC ? curr : closest;
        }, aliveEnemies[0]);
      }
    } else if (target && target.isAlive) {
      primaryTarget = target;
    }

    const bGrid = map.worldToGrid(bot.x, bot.y);
    const pGrid = primaryTarget ? map.worldToGrid(primaryTarget.x, primaryTarget.y) : { gridX: Math.floor(map.width / 2), gridY: Math.floor(map.height / 2) };
    const botGrid: GridPos = { gx: bGrid.gridX, gy: bGrid.gridY };
    const targetGrid: GridPos = { gx: pGrid.gridX, gy: pGrid.gridY };

    // 1. DANGER & BLAST MATRIX: Calculate all dangerous tiles across active bombs and lingering fire
    const dangerMap = this.calculateDangerMatrix(bombs, explosions, map);
    const isBotInImmediateDanger = this.isTileDangerous(botGrid.gx, botGrid.gy, dangerMap);

    // 2. DEFENSIVE EMERGENCY & SKILL REACTION
    if (isBotInImmediateDanger) {
      this.isEvacuating = true;
      // If skill is ready and bot is in danger or critical HP, trigger defensive/escape skill
      if (bot.activeSkillCooldown <= 0) {
        if (
          bot.hp <= bot.maxHp * 0.6 ||
          ['Leo', 'Cancer', 'Taurus', 'Virgo', 'Pisces', 'Aries', 'Sagittarius'].includes(bot.sign)
        ) {
          onUseSkill(bot);
        }
      }

      // Find shortest escape path to a 100% safe tile
      const escapePath = this.findEscapePath(botGrid.gx, botGrid.gy, dangerMap, map, bombs);
      if (escapePath && escapePath.length > 0) {
        this.currentPath = escapePath;
        return this.followPath(bot, map);
      }
    } else {
      this.isEvacuating = false;
    }

    // 3. LOW HP SURVIVAL REACTION
    if (bot.hp <= bot.maxHp * BALANCE.CRITICAL_HP_THRESHOLD && bot.activeSkillCooldown <= 0) {
      onUseSkill(bot);
    }

    // 4. PERIODIC STRATEGIC DECISION REFRESH
    if (this.decisionTimer <= 0 || this.currentPath.length === 0) {
      this.decisionTimer = 0.14; // Refresh tactical goal every 140ms
      this.evaluateTactics(bot, primaryTarget, botGrid, targetGrid, map, bombs, lootList, dangerMap, onPlaceBomb, onUseSkill);
    }

    // 5. FOLLOW PLANNED PATH
    return this.followPath(bot, map);
  }

  private evaluateTactics(
    bot: Entity,
    target: Entity | null,
    botGrid: GridPos,
    targetGrid: GridPos,
    map: MapSystem,
    bombs: Bomb[],
    lootList: LootPickup[],
    dangerMap: Map<string, DangerTile>,
    onPlaceBomb: (bot: Entity) => void,
    onUseSkill: (bot: Entity) => void
  ): void {
    // If currently evacuating and have a valid safe path, do not interrupt
    if (this.isEvacuating && this.currentPath.length > 0) {
      return;
    }

    // Priority: If bot is carrying coins in warehouse, return to closest team bank base to deposit them!
    if (bot.carriedCoins >= 30 && map.bankZones.length > 0) {
      const bankOwner = bot.teamId === 'team_blue' ? 'player' : 'bot';
      const teamBanks = map.bankZones.filter(z => z.ownerId === bankOwner);
      let bestBankPath: GridPos[] | null = null;
      for (const bank of teamBanks) {
        const path = this.findBfsPath(botGrid.gx, botGrid.gy, bank.gridX, bank.gridY, map, dangerMap, bombs, false);
        if (path && (!bestBankPath || path.length < bestBankPath.length)) {
          bestBankPath = path;
        }
      }
      if (bestBankPath && bestBankPath.length > 0) {
        this.currentPath = bestBankPath;
        return;
      }
    }

    // Priority A: TACTICAL ATTACK ON TARGET (Line of sight & range)
    if (target && target.isAlive) {
      const distToTargetGrid = Math.abs(botGrid.gx - targetGrid.gx) + Math.abs(botGrid.gy - targetGrid.gy);

      if (distToTargetGrid <= bot.bombRadius + 1 && this.bombCooldown <= 0 && bot.bombCount > 0) {
        // Check if we can safely place a bomb without trapping or killing ourselves
        const safeEscape = this.verifyBombPlacementSafety(botGrid.gx, botGrid.gy, bot.bombRadius, bot.speed, bombs, dangerMap, map);
        if (safeEscape.isSafe && safeEscape.escapePath) {
          onPlaceBomb(bot);
          this.bombCooldown = BALANCE.BOT_BOMB_COOLDOWN;
          this.currentPath = safeEscape.escapePath;
          this.isEvacuating = true;

          // Tactical skill trigger on attack
          if (bot.activeSkillCooldown <= 0 && (bot.sign === 'Scorpio' || bot.sign === 'Aries')) {
            onUseSkill(bot);
          }
          return;
        }
      }
    }

    // Priority B: HIGH-VALUE LOOT COLLECTION
    if (lootList.length > 0) {
      const reachableLoot = this.findReachableSafeLoot(botGrid, lootList, dangerMap, map, bombs);
      if (reachableLoot) {
        this.currentPath = reachableLoot.path;
        return;
      }
    }

    // Priority C: DESTRUCTIVE WALL CLEARING / FARMING LOOT & CREATING LANES
    const adjacentDestructibles = this.getAdjacentDestructibleTiles(botGrid, map);
    if (adjacentDestructibles.length > 0 && this.bombCooldown <= 0 && bot.bombCount > 0) {
      // Check if safely clearing this wall is possible
      const safeEscape = this.verifyBombPlacementSafety(botGrid.gx, botGrid.gy, bot.bombRadius, bot.speed, bombs, dangerMap, map);
      if (safeEscape.isSafe && safeEscape.escapePath) {
        onPlaceBomb(bot);
        this.bombCooldown = BALANCE.BOT_BOMB_COOLDOWN;
        this.currentPath = safeEscape.escapePath;
        this.isEvacuating = true;
        return;
      }
    }

    // Priority D: ADVANCE TOWARD TARGET OR DESTRUCTIBLE CHOKEPOINTS
    const pathToPlayer = this.findBfsPath(botGrid.gx, botGrid.gy, targetGrid.gx, targetGrid.gy, map, dangerMap, bombs, false);
    if (pathToPlayer && pathToPlayer.length > 0) {
      this.currentPath = pathToPlayer;
      return;
    }

    // Priority E: If player is behind destructibles, navigate to the nearest destructible wall blocking the path
    const pathToDestructible = this.findPathToNearestDestructible(botGrid, map, dangerMap, bombs);
    if (pathToDestructible && pathToDestructible.length > 0) {
      this.currentPath = pathToDestructible;
      return;
    }

    // Fallback: Roam to random adjacent safe tile
    const safeNeighbors = this.getSafeNeighbors(botGrid.gx, botGrid.gy, dangerMap, map, bombs);
    if (safeNeighbors.length > 0) {
      const randomTarget = safeNeighbors[Math.floor(Math.random() * safeNeighbors.length)];
      this.currentPath = [randomTarget];
    } else {
      this.currentPath = [];
    }
  }

  /**
   * Follows the current path waypoint-by-waypoint with corner-aligning velocity.
   */
  private followPath(bot: Entity, map: MapSystem): { vx: number; vy: number } {
    if (this.currentPath.length === 0) {
      return { vx: 0, vy: 0 };
    }

    const nextTile = this.currentPath[0];
    const targetWorld = map.gridToWorldCenter(nextTile.gx, nextTile.gy);

    const dx = targetWorld.x - bot.x;
    const dy = targetWorld.y - bot.y;
    const dist = Math.hypot(dx, dy);

    // If within close threshold of waypoint center, consume waypoint and proceed to next
    if (dist < 8) {
      this.currentPath.shift();
      if (this.currentPath.length === 0) {
        return { vx: 0, vy: 0 };
      }
      return this.followPath(bot, map);
    }

    let speed = bot.speed;
    if (bot.hp <= bot.maxHp * BALANCE.CRITICAL_HP_THRESHOLD) {
      speed *= BALANCE.ADRENALINE_SPEED_BOOST;
    }

    // Corner alignment assistance: guide perpendicular axis toward center of current corridor
    const currGrid = map.worldToGrid(bot.x, bot.y);
    const currCenter = map.gridToWorldCenter(currGrid.gridX, currGrid.gridY);

    if (Math.abs(dx) > Math.abs(dy)) {
      // Primary horizontal motion
      const nudgeY = (currCenter.y - bot.y) * 4.0;
      return {
        vx: Math.sign(dx) * speed,
        vy: Math.max(-speed * 0.4, Math.min(speed * 0.4, nudgeY)),
      };
    } else {
      // Primary vertical motion
      const nudgeX = (currCenter.x - bot.x) * 4.0;
      return {
        vx: Math.max(-speed * 0.4, Math.min(speed * 0.4, nudgeX)),
        vy: Math.sign(dy) * speed,
      };
    }
  }

  /**
   * Calculates all dangerous tiles for existing bombs and active explosions.
   */
  private calculateDangerMatrix(
    bombs: Bomb[],
    explosions: Explosion[],
    map: MapSystem
  ): Map<string, DangerTile> {
    const danger = new Map<string, DangerTile>();

    // 1. Active explosions lingering on the grid
    for (const exp of explosions) {
      for (const seg of exp.segments) {
        const key = `${seg.gridX},${seg.gridY}`;
        danger.set(key, {
          gx: seg.gridX,
          gy: seg.gridY,
          timeRemaining: exp.duration,
          damage: exp.damage,
        });
      }
    }

    // 2. Active bombs ticking down
    for (const b of bombs) {
      const bombKey = `${b.gridX},${b.gridY}`;
      danger.set(bombKey, {
        gx: b.gridX,
        gy: b.gridY,
        timeRemaining: b.timer,
        damage: b.damage,
      });

      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      for (const d of dirs) {
        for (let r = 1; r <= b.radius; r++) {
          const gx = b.gridX + d.dx * r;
          const gy = b.gridY + d.dy * r;
          const tile = map.getTile(gx, gy);
          if (!tile) break;
          if (tile.type === 'wall_indestructible') break;

          const key = `${gx},${gy}`;
          const existing = danger.get(key);
          if (!existing || existing.timeRemaining > b.timer) {
            danger.set(key, {
              gx,
              gy,
              timeRemaining: b.timer,
              damage: b.damage,
            });
          }

          if (tile.type === 'wall_destructible') {
            break; // Wall blocks blast continuation
          }
        }
      }
    }

    return danger;
  }

  /**
   * Pre-check: "Can I place a bomb right here without killing or trapping myself?"
   * Simulates the prospective bomb's blast cross-hairs, adds them to danger,
   * and runs BFS to ensure a reachable safe tile exists before the fuse expires.
   */
  private verifyBombPlacementSafety(
    botGx: number,
    botGy: number,
    bombRadius: number,
    botSpeed: number,
    currentBombs: Bomb[],
    dangerMap: Map<string, DangerTile>,
    map: MapSystem
  ): { isSafe: boolean; escapePath?: GridPos[] } {
    // Clone danger map and project prospective bomb
    const simulatedDanger = new Map<string, DangerTile>(dangerMap);
    const prospectiveTimer = BALANCE.BOMB_TIMER;

    simulatedDanger.set(`${botGx},${botGy}`, {
      gx: botGx,
      gy: botGy,
      timeRemaining: prospectiveTimer,
      damage: BALANCE.BASE_BOMB_DAMAGE,
    });

    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const d of dirs) {
      for (let r = 1; r <= bombRadius; r++) {
        const gx = botGx + d.dx * r;
        const gy = botGy + d.dy * r;
        const tile = map.getTile(gx, gy);
        if (!tile) break;
        if (tile.type === 'wall_indestructible') break;

        simulatedDanger.set(`${gx},${gy}`, {
          gx,
          gy,
          timeRemaining: prospectiveTimer,
          damage: BALANCE.BASE_BOMB_DAMAGE,
        });

        if (tile.type === 'wall_destructible') break;
      }
    }

    // Now search for an escape path from (botGx, botGy) to a 100% safe tile
    const escapePath = this.findEscapePath(botGx, botGy, simulatedDanger, map, currentBombs, true);
    if (!escapePath || escapePath.length === 0) {
      return { isSafe: false };
    }

    // Calculate time required to reach safe tile
    const pathDistancePixels = escapePath.length * map.tileSize;
    const timeToEscape = pathDistancePixels / botSpeed;

    // Safety buffer of at least 0.65 seconds before explosion
    if (timeToEscape > prospectiveTimer - 0.65) {
      return { isSafe: false };
    }

    return { isSafe: true, escapePath };
  }

  /**
   * BFS to find the shortest escape path to a tile that is NOT in simulated or current danger.
   */
  private findEscapePath(
    startGx: number,
    startGy: number,
    dangerMap: Map<string, DangerTile>,
    map: MapSystem,
    bombs: Bomb[],
    allowStartOnBomb = true
  ): GridPos[] | null {
    interface Node {
      gx: number;
      gy: number;
      path: GridPos[];
    }

    const queue: Node[] = [{ gx: startGx, gy: startGy, path: [] }];
    const visited = new Set<string>();
    visited.add(`${startGx},${startGy}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;

      // Is current node a 100% safe tile?
      const isSafe = !dangerMap.has(`${curr.gx},${curr.gy}`);
      if (isSafe && curr.path.length > 0) {
        return curr.path;
      }

      const neighbors = [
        { gx: curr.gx + 1, gy: curr.gy },
        { gx: curr.gx - 1, gy: curr.gy },
        { gx: curr.gx, gy: curr.gy + 1 },
        { gx: curr.gx, gy: curr.gy - 1 },
      ];

      for (const n of neighbors) {
        const key = `${n.gx},${n.gy}`;
        if (visited.has(key)) continue;

        // Check if tile is walkable
        if (!map.isWalkable(n.gx, n.gy)) continue;

        // Bomb collision: cannot walk through other bomb entities
        const hasOtherBomb = bombs.some(
          b => b.gridX === n.gx && b.gridY === n.gy && !(allowStartOnBomb && n.gx === startGx && n.gy === startGy)
        );
        if (hasOtherBomb) continue;

        visited.add(key);
        queue.push({
          gx: n.gx,
          gy: n.gy,
          path: [...curr.path, { gx: n.gx, gy: n.gy }],
        });
      }
    }

    return null;
  }

  /**
   * BFS pathfinder between two points, avoiding dangerous tiles and walls.
   */
  private findBfsPath(
    startGx: number,
    startGy: number,
    targetGx: number,
    targetGy: number,
    map: MapSystem,
    dangerMap: Map<string, DangerTile>,
    bombs: Bomb[],
    allowDestructibleThrough = false
  ): GridPos[] | null {
    if (startGx === targetGx && startGy === targetGy) return [];

    interface Node {
      gx: number;
      gy: number;
      path: GridPos[];
    }

    const queue: Node[] = [{ gx: startGx, gy: startGy, path: [] }];
    const visited = new Set<string>();
    visited.add(`${startGx},${startGy}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;

      if (curr.gx === targetGx && curr.gy === targetGy) {
        return curr.path;
      }

      const neighbors = [
        { gx: curr.gx + 1, gy: curr.gy },
        { gx: curr.gx - 1, gy: curr.gy },
        { gx: curr.gx, gy: curr.gy + 1 },
        { gx: curr.gx, gy: curr.gy - 1 },
      ];

      for (const n of neighbors) {
        const key = `${n.gx},${n.gy}`;
        if (visited.has(key)) continue;

        // Check walkability
        const tile = map.getTile(n.gx, n.gy);
        if (!tile) continue;

        if (tile.type === 'wall_indestructible') continue;
        if (tile.type === 'wall_destructible' && !allowDestructibleThrough) continue;

        // Avoid dangerous tiles
        if (dangerMap.has(key)) continue;

        // Avoid active bombs
        if (bombs.some(b => b.gridX === n.gx && b.gridY === n.gy)) continue;

        visited.add(key);
        queue.push({
          gx: n.gx,
          gy: n.gy,
          path: [...curr.path, { gx: n.gx, gy: n.gy }],
        });
      }
    }

    return null;
  }

  /**
   * Finds path to reachable safe loot.
   */
  private findReachableSafeLoot(
    botGrid: GridPos,
    lootList: LootPickup[],
    dangerMap: Map<string, DangerTile>,
    map: MapSystem,
    bombs: Bomb[]
  ): { loot: LootPickup; path: GridPos[] } | null {
    let closest: { loot: LootPickup; path: GridPos[] } | null = null;
    let minLength = 999;

    for (const loot of lootList) {
      const lGrid = map.worldToGrid(loot.x, loot.y);
      if (dangerMap.has(`${lGrid.gridX},${lGrid.gridY}`)) continue;

      const path = this.findBfsPath(botGrid.gx, botGrid.gy, lGrid.gridX, lGrid.gridY, map, dangerMap, bombs, false);
      if (path && path.length > 0 && path.length < minLength) {
        minLength = path.length;
        closest = { loot, path };
      }
    }

    return closest;
  }

  /**
   * Finds the path to the closest destructible wall blocking exploration.
   */
  private findPathToNearestDestructible(
    botGrid: GridPos,
    map: MapSystem,
    dangerMap: Map<string, DangerTile>,
    bombs: Bomb[]
  ): GridPos[] | null {
    interface Node {
      gx: number;
      gy: number;
      path: GridPos[];
    }

    const queue: Node[] = [{ gx: botGrid.gx, gy: botGrid.gy, path: [] }];
    const visited = new Set<string>();
    visited.add(`${botGrid.gx},${botGrid.gy}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;

      // Check if any neighbor is a destructible wall
      const neighbors = [
        { gx: curr.gx + 1, gy: curr.gy },
        { gx: curr.gx - 1, gy: curr.gy },
        { gx: curr.gx, gy: curr.gy + 1 },
        { gx: curr.gx, gy: curr.gy - 1 },
      ];

      for (const n of neighbors) {
        const tile = map.getTile(n.gx, n.gy);
        if (tile && tile.type === 'wall_destructible') {
          return curr.path.length > 0 ? curr.path : [{ gx: curr.gx, gy: curr.gy }];
        }
      }

      for (const n of neighbors) {
        const key = `${n.gx},${n.gy}`;
        if (visited.has(key)) continue;
        if (!map.isWalkable(n.gx, n.gy)) continue;
        if (dangerMap.has(key)) continue;
        if (bombs.some(b => b.gridX === n.gx && b.gridY === n.gy)) continue;

        visited.add(key);
        queue.push({
          gx: n.gx,
          gy: n.gy,
          path: [...curr.path, { gx: n.gx, gy: n.gy }],
        });
      }
    }

    return null;
  }

  private isTileDangerous(gx: number, gy: number, dangerMap: Map<string, DangerTile>): boolean {
    return dangerMap.has(`${gx},${gy}`);
  }

  private getAdjacentDestructibleTiles(grid: GridPos, map: MapSystem): GridPos[] {
    const neighbors = [
      { gx: grid.gx + 1, gy: grid.gy },
      { gx: grid.gx - 1, gy: grid.gy },
      { gx: grid.gx, gy: grid.gy + 1 },
      { gx: grid.gx, gy: grid.gy - 1 },
    ];

    return neighbors.filter(n => {
      const t = map.getTile(n.gx, n.gy);
      return t && t.type === 'wall_destructible';
    });
  }

  private getSafeNeighbors(
    gx: number,
    gy: number,
    dangerMap: Map<string, DangerTile>,
    map: MapSystem,
    bombs: Bomb[]
  ): GridPos[] {
    const neighbors = [
      { gx: gx + 1, gy: gy },
      { gx: gx - 1, gy: gy },
      { gx: gx, gy: gy + 1 },
      { gx: gx, gy: gy - 1 },
    ];

    return neighbors.filter(n => {
      if (!map.isWalkable(n.gx, n.gy)) return false;
      if (dangerMap.has(`${n.gx},${n.gy}`)) return false;
      if (bombs.some(b => b.gridX === n.gx && b.gridY === n.gy)) return false;
      return true;
    });
  }
}
