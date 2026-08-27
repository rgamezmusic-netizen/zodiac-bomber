import { BALANCE } from './BalanceConfig';
import { getRandomLootItem } from './ItemRegistry';
import { BankZone, SecretDoor, Tile, TileType } from './types';

export class MapSystem {
  public width: number;
  public height: number;
  public tileSize: number;
  public grid: Tile[][];
  public secretDoors: SecretDoor[] = [];
  public bankZones: BankZone[] = [];
  private seed: number;

  constructor(width = BALANCE.GRID_WIDTH, height = BALANCE.GRID_HEIGHT, tileSize = BALANCE.TILE_SIZE, seed?: number) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.grid = this.generateMap();
  }

  // Linear Congruential Generator for reproducible pseudo-random numbers
  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public generateMap(): Tile[][] {
    this.secretDoors = [];
    this.bankZones = [];
    const map: Tile[][] = [];

    // Potential candidates for the 2 secret doors placed TOWARDS THE CENTER of the arena
    // Avoid outer corners and force players to fight through the labyrinth into the center
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    const doorCandidateSlots: { x: number; y: number }[] = [
      { x: centerX, y: centerY }, // Exact center
      { x: centerX - 3, y: centerY }, // Center left
      { x: centerX + 3, y: centerY }, // Center right
      { x: centerX, y: centerY - 3 }, // Center top
      { x: centerX, y: centerY + 3 }, // Center bottom
      { x: centerX - 2, y: centerY - 2 }, // Inner diagonal 1
      { x: centerX + 2, y: centerY + 2 }, // Inner diagonal 2
      { x: centerX - 2, y: centerY + 2 }, // Inner diagonal 3
      { x: centerX + 2, y: centerY - 2 }, // Inner diagonal 4
    ];

    // Pick 2 distinct slots for the 2 secret doors
    const shuffled = [...doorCandidateSlots].sort(() => this.random() - 0.5);
    const door1Pos = shuffled[0];
    const door2Pos = shuffled[1];

    this.secretDoors.push({
      id: 'door_1',
      gridX: door1Pos.x,
      gridY: door1Pos.y,
      doorNumber: 1,
      isRevealed: false,
      isEntered: false,
      name: 'Puerta Astral I (Bóveda Dorada)',
    });

    this.secretDoors.push({
      id: 'door_2',
      gridX: door2Pos.x,
      gridY: door2Pos.y,
      doorNumber: 2,
      isRevealed: false,
      isEntered: false,
      name: 'Puerta Astral II (Bóveda Estelar)',
    });

    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        // Outer boundaries are indestructible
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push({
            type: 'wall_indestructible',
            hp: 999,
            maxHp: 999,
          });
          continue;
        }

        // Keep all 4 corners clear for 2v2 team safe spawn zones:
        // Top-Left: Player 1 (Blue)
        // Bottom-Left: Ally 1 (Blue)
        // Top-Right: Rival 1 (Red)
        // Bottom-Right: Rival 2 (Red)
        const isPlayerSpawn = (x <= 2 && y <= 2);
        const isAllySpawn = (x <= 2 && y >= this.height - 3);
        const isRival1Spawn = (x >= this.width - 3 && y <= 2);
        const isRival2Spawn = (x >= this.width - 3 && y >= this.height - 3);

        if (isPlayerSpawn || isAllySpawn || isRival1Spawn || isRival2Spawn) {
          row.push({
            type: 'empty',
            hp: 0,
            maxHp: 0,
          });
          continue;
        }

        // Guaranteed destructible block on secret door coordinates
        const isDoorTile = (x === door1Pos.x && y === door1Pos.y) || (x === door2Pos.x && y === door2Pos.y);
        if (isDoorTile) {
          row.push({
            type: 'wall_destructible',
            hp: BALANCE.WALL_DESTRUCTIBLE_HP,
            maxHp: BALANCE.WALL_DESTRUCTIBLE_HP,
            itemDrop: undefined, // Contains the secret door underneath!
          });
          continue;
        }

        // Strategic Pillars pattern: every second tile in even rows/cols is indestructible pillar
        if (x % 2 === 0 && y % 2 === 0) {
          row.push({
            type: 'wall_indestructible',
            hp: 999,
            maxHp: 999,
          });
          continue;
        }

        // Fill remaining tiles with destructible astral walls (~70% density)
        if (this.random() < 0.70) {
          const item = this.random() < BALANCE.LOOT_DROP_CHANCE ? getRandomLootItem() : undefined;
          row.push({
            type: 'wall_destructible',
            hp: BALANCE.WALL_DESTRUCTIBLE_HP,
            maxHp: BALANCE.WALL_DESTRUCTIBLE_HP,
            itemDrop: item,
          });
        } else {
          row.push({
            type: 'empty',
            hp: 0,
            maxHp: 0,
          });
        }
      }
      map.push(row);
    }

    return map;
  }

  /**
   * Generates the Cosmic Warehouse Map with:
   * - Central warehouse depot with open storage pathways & crates
   * - Player base vault in top-left corner (1, 1)
   * - Rival base vault in bottom-right corner (15, 11)
   */
  public generateWarehouseMap(): Tile[][] {
    this.secretDoors = [];
    this.bankZones = [
      {
        ownerId: 'player',
        gridX: 1,
        gridY: 1,
        widthTiles: 3,
        heightTiles: 3,
        label: 'BÓVEDA AZUL (NORTE)',
        color: '#38BDF8',
      },
      {
        ownerId: 'player',
        gridX: 1,
        gridY: this.height - 4,
        widthTiles: 3,
        heightTiles: 3,
        label: 'BÓVEDA AZUL (SUR)',
        color: '#38BDF8',
      },
      {
        ownerId: 'bot',
        gridX: this.width - 4,
        gridY: 1,
        widthTiles: 3,
        heightTiles: 3,
        label: 'BÓVEDA ROJA (NORTE)',
        color: '#F87171',
      },
      {
        ownerId: 'bot',
        gridX: this.width - 4,
        gridY: this.height - 4,
        widthTiles: 3,
        heightTiles: 3,
        label: 'BÓVEDA ROJA (SUR)',
        color: '#F87171',
      },
    ];

    const map: Tile[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        // Outer walls
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push({
            type: 'wall_indestructible',
            hp: 999,
            maxHp: 999,
          });
          continue;
        }

        // Safe Corner Base Bank Zones (Blue Team: Top-Left & Bottom-Left, Red Team: Top-Right & Bottom-Right)
        const isBlueBaseTop = (x >= 1 && x <= 3 && y >= 1 && y <= 3);
        const isBlueBaseBottom = (x >= 1 && x <= 3 && y >= this.height - 4 && y <= this.height - 2);
        const isRedBaseTop = (x >= this.width - 4 && x <= this.width - 2 && y >= 1 && y <= 3);
        const isRedBaseBottom = (x >= this.width - 4 && x <= this.width - 2 && y >= this.height - 4 && y <= this.height - 2);

        if (isBlueBaseTop || isBlueBaseBottom || isRedBaseTop || isRedBaseBottom) {
          row.push({
            type: 'empty',
            hp: 0,
            maxHp: 0,
          });
          continue;
        }

        // Central Warehouse Layout: pillars and destructible warehouse crates
        const isCenterWarehouse = (x >= 5 && x <= this.width - 6 && y >= 3 && y <= this.height - 4);
        if (isCenterWarehouse) {
          // Crossway structure inside warehouse
          if (x % 4 === 0 && y % 4 === 0) {
            row.push({
              type: 'wall_indestructible',
              hp: 999,
              maxHp: 999,
            });
          } else if (Math.random() < 0.38) {
            row.push({
              type: 'wall_destructible',
              hp: BALANCE.WALL_DESTRUCTIBLE_HP,
              maxHp: BALANCE.WALL_DESTRUCTIBLE_HP,
            });
          } else {
            row.push({
              type: 'empty',
              hp: 0,
              maxHp: 0,
            });
          }
          continue;
        }

        // Hallways between base and warehouse
        if (x % 3 === 0 && y % 3 === 0 && Math.random() < 0.35) {
          row.push({
            type: 'wall_destructible',
            hp: BALANCE.WALL_DESTRUCTIBLE_HP,
            maxHp: BALANCE.WALL_DESTRUCTIBLE_HP,
          });
        } else {
          row.push({
            type: 'empty',
            hp: 0,
            maxHp: 0,
          });
        }
      }
      map.push(row);
    }

    this.grid = map;
    return map;
  }

  public generateFinalShowdownMap(): Tile[][] {
    this.secretDoors = [];
    this.bankZones = [];
    const map: Tile[][] = [];

    // Grand Showdown Arena with strategic quadrant pillars
    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push({
            type: 'wall_indestructible',
            hp: 999,
            maxHp: 999,
          });
        } else if (
          (x === Math.floor(this.width / 3) && y === Math.floor(this.height / 3)) ||
          (x === Math.floor((this.width * 2) / 3) && y === Math.floor(this.height / 3)) ||
          (x === Math.floor(this.width / 3) && y === Math.floor((this.height * 2) / 3)) ||
          (x === Math.floor((this.width * 2) / 3) && y === Math.floor((this.height * 2) / 3))
        ) {
          // 4 Cosmic Monoliths in the Showdown Arena
          row.push({
            type: 'wall_indestructible',
            hp: 999,
            maxHp: 999,
          });
        } else {
          // Open battle field!
          row.push({
            type: 'empty',
            hp: 0,
            maxHp: 0,
          });
        }
      }
      map.push(row);
    }
    this.grid = map;
    return map;
  }

  public isWalkable(gridX: number, gridY: number, canPhase = false): boolean {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return false;
    }
    const tile = this.grid[gridY][gridX];
    if (tile.type === 'empty') return true;
    if (canPhase && tile.type === 'wall_destructible') return true;
    return false;
  }

  public getTile(gridX: number, gridY: number): Tile | null {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return null;
    }
    return this.grid[gridY][gridX];
  }

  public setTile(gridX: number, gridY: number, type: TileType): void {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return;
    }
    this.grid[gridY][gridX] = {
      type,
      hp: type === 'wall_destructible' ? BALANCE.WALL_DESTRUCTIBLE_HP : 999,
      maxHp: type === 'wall_destructible' ? BALANCE.WALL_DESTRUCTIBLE_HP : 999,
    };
  }

  public worldToGrid(x: number, y: number): { gridX: number; gridY: number } {
    return {
      gridX: Math.floor(x / this.tileSize),
      gridY: Math.floor(y / this.tileSize),
    };
  }

  public gridToWorldCenter(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2,
    };
  }
}
