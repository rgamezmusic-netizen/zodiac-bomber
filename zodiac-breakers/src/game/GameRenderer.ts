import { GameEngine } from './GameEngine';
import { RARITY_CONFIG } from './ItemRegistry';
import { ZODIAC_SIGNS } from './ZodiacRegistry';

export class GameRenderer {
  public draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    engine: GameEngine
  ) {
    const map = engine.map;
    const tileSize = map.tileSize;
    const now = Date.now();

    // Apply Screen Shake offset
    ctx.save();
    if (engine.particles.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * engine.particles.screenShake;
      const shakeY = (Math.random() - 0.5) * engine.particles.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear Arena Canvas
    ctx.fillStyle =
      engine.phase === 'final_showdown'
        ? '#070A12'
        : engine.phase === 'portal_warehouse' || engine.phase === 'vault_combat'
        ? '#120F0D'
        : '#090D16';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Cosmic Showdown Background Ring decoration
    if (engine.phase === 'final_showdown') {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.09)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 1. Draw Grid Tiles
    const isWarehouse = engine.phase === 'portal_warehouse' || engine.phase === 'vault_combat';

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.grid[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        // Ground tile color
        if (isWarehouse) {
          // Central warehouse floor pattern
          const isCenter = x >= 4 && x <= map.width - 5 && y >= 3 && y <= map.height - 4;
          if (isCenter) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#261D15' : '#1F1710';
          } else {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#181410' : '#120F0C';
          }
        } else if (engine.phase === 'final_showdown') {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#0F172A' : '#0B1120';
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#0E1626' : '#0B111F';
        }
        ctx.fillRect(px, py, tileSize, tileSize);

        // Grid hairline
        ctx.strokeStyle = isWarehouse ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);

        if (tile.type === 'wall_indestructible') {
          // Indestructible monolith
          ctx.fillStyle = isWarehouse ? '#3D2817' : '#1E293B';
          ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          ctx.strokeStyle = isWarehouse ? '#854D0E' : '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

          // Core rune
          ctx.fillStyle = isWarehouse ? '#D97706' : '#475569';
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.type === 'wall_destructible') {
          if (isWarehouse) {
            // Warehouse Wooden/Metal Cargo Crate
            ctx.fillStyle = '#451A03';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            ctx.strokeStyle = '#B45309';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

            // Crate cross braces
            ctx.strokeStyle = '#78350F';
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + tileSize - 4, py + tileSize - 4);
            ctx.moveTo(px + tileSize - 4, py + 4);
            ctx.lineTo(px + 4, py + tileSize - 4);
            ctx.stroke();

            ctx.fillStyle = '#FBBF24';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📦', px + tileSize / 2, py + tileSize / 2);
          } else {
            // Destructible Astral Crystal Wall
            ctx.fillStyle = '#1E1B4B';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            ctx.strokeStyle = '#4338CA';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

            ctx.fillStyle = '#312E81';
            ctx.beginPath();
            ctx.moveTo(px + tileSize / 2, py + 6);
            ctx.lineTo(px + tileSize - 6, py + tileSize / 2);
            ctx.lineTo(px + tileSize / 2, py + tileSize - 6);
            ctx.lineTo(px + 6, py + tileSize / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#818CF8';
            ctx.beginPath();
            ctx.arc(px + tileSize / 2, py + tileSize / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 2. Draw Bank Deposit Zones in Warehouse Phase
    if (isWarehouse && map.bankZones.length > 0) {
      for (const zone of map.bankZones) {
        const zx = zone.gridX * tileSize;
        const zy = zone.gridY * tileSize;
        const zw = zone.widthTiles * tileSize;
        const zh = zone.heightTiles * tileSize;
        const pulse = 0.5 + Math.sin(now / 200) * 0.3;

        // Zone floor glow
        ctx.fillStyle = zone.ownerId === 'player' ? `rgba(56, 189, 248, 0.15)` : `rgba(248, 113, 113, 0.15)`;
        ctx.fillRect(zx, zy, zw, zh);

        // Dashed glowing border
        ctx.strokeStyle = zone.ownerId === 'player' ? `rgba(56, 189, 248, ${pulse})` : `rgba(248, 113, 113, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(zx + 2, zy + 2, zw - 4, zh - 4);
        ctx.setLineDash([]);

        // Vault Icon & Label
        const cx = zx + zw / 2;
        const cy = zy + zh / 2;
        ctx.fillStyle = zone.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📥', cx, cy - 8);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(zone.label, cx, cy + 12);
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('PISA AQUÍ PARA GUARDAR', cx, cy + 24);
      }
    }

    // 3. Draw Revealed Secret Doors (Phase 1)
    if (engine.phase === 'maze_blocks') {
      for (const door of map.secretDoors) {
        if (door.isRevealed) {
          const center = map.gridToWorldCenter(door.gridX, door.gridY);
          const spin = (now % 2000) / 2000 * Math.PI * 2;

          ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(center.x, center.y);
          ctx.rotate(spin);
          ctx.strokeStyle = '#C084FC';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 1.5);
          ctx.stroke();

          ctx.rotate(-spin * 2);
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI);
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#581C87';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚪', center.x, center.y);

          ctx.fillStyle = '#FDE047';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(`PORTAL ${door.doorNumber}`, center.x, center.y - 20);
        }
      }
    }

    // 4. Draw Grease Puddles on Floor (Phase 3)
    if (engine.phase === 'final_showdown') {
      for (const puddle of engine.greasePuddles) {
        const pAlpha = Math.min(1, puddle.duration / 1.0);
        ctx.fillStyle = `rgba(132, 204, 22, ${0.45 * pAlpha})`;
        ctx.beginPath();
        ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(163, 230, 53, ${0.8 * pAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = `rgba(234, 179, 8, ${0.6 * pAlpha})`;
        ctx.beginPath();
        ctx.arc(puddle.x - 6, puddle.y - 4, 4, 0, Math.PI * 2);
        ctx.arc(puddle.x + 8, puddle.y + 3, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pAlpha})`;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🫧', puddle.x, puddle.y);
      }

      // Draw Falling Grease Drops from Sky
      for (const fg of engine.fallingGreaseList) {
        const shadowScale = 0.3 + fg.progress * 0.7;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.ellipse(fg.targetX, fg.targetY + 4, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        const curX = fg.startX + (fg.targetX - fg.startX) * fg.progress;
        const curY = fg.startY + (fg.targetY - fg.startY) * fg.progress;

        ctx.fillStyle = '#84CC16';
        ctx.beginPath();
        ctx.arc(curX, curY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(132, 204, 22, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX, curY - 20);
        ctx.stroke();
      }

      // Draw Falling Meteors from Sky & Floor Target Crosshairs
      for (const meteor of engine.meteors) {
        // Floor pulsating crimson crosshair target
        const pulse = 0.6 + Math.sin(now / 80) * 0.4;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.25 * pulse})`;
        ctx.beginPath();
        ctx.arc(meteor.targetX, meteor.targetY, meteor.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(meteor.targetX, meteor.targetY, meteor.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#FCA5A5';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ¡METEORITO!', meteor.targetX, meteor.targetY - meteor.radius - 6);

        // Falling Meteor fireball sprite
        const curX = meteor.startX + (meteor.targetX - meteor.startX) * meteor.progress;
        const curY = meteor.startY + (meteor.targetY - meteor.startY) * meteor.progress;

        // Smoke / Fire Trail
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(meteor.startX, meteor.startY);
        ctx.stroke();

        // Glowing Meteor Core
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(curX, curY, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(curX, curY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☄️', curX, curY);
      }

      // Draw Airdrop Pickups & Descents
      for (const airdrop of engine.airdropPickups) {
        if (!airdrop.isLanded) {
          // Parachute and descending capsule
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(airdrop.x - 14, airdrop.y - 18);
          ctx.lineTo(airdrop.x, airdrop.y);
          ctx.moveTo(airdrop.x + 14, airdrop.y - 18);
          ctx.lineTo(airdrop.x, airdrop.y);
          ctx.stroke();

          // Canopy
          ctx.fillStyle = airdrop.color;
          ctx.beginPath();
          ctx.arc(airdrop.x, airdrop.y - 18, 14, Math.PI, 0);
          ctx.closePath();
          ctx.fill();

          // Capsule Body
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.arc(airdrop.x, airdrop.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = airdrop.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(airdrop.icon, airdrop.x, airdrop.y);
        } else {
          // Landed Supply Beacon on ground
          const floatY = airdrop.y + Math.sin(airdrop.bobPhase) * 3;
          const pulse = 0.6 + Math.sin(now / 150) * 0.4;

          // Glowing aura
          ctx.fillStyle = `${airdrop.color}33`;
          ctx.beginPath();
          ctx.arc(airdrop.x, floatY, 20 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Outer ring
          ctx.strokeStyle = airdrop.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(airdrop.x, floatY, 15, 0, Math.PI * 2);
          ctx.stroke();

          // Center badge
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(airdrop.x, floatY, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(airdrop.icon, airdrop.x, floatY);

          ctx.fillStyle = airdrop.color;
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(airdrop.title, airdrop.x, floatY - 20);
        }
      }
    }

    // 5. Draw Coins in Warehouse Phase
    if (isWarehouse) {
      for (const coin of engine.coinList) {
        const floatY = coin.y + Math.sin(coin.bobPhase) * 3;
        if (coin.isGem) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.beginPath();
          ctx.arc(coin.x, floatY, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#C084FC';
          ctx.beginPath();
          ctx.moveTo(coin.x, floatY - 8);
          ctx.lineTo(coin.x + 8, floatY);
          ctx.lineTo(coin.x, floatY + 8);
          ctx.lineTo(coin.x - 8, floatY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#F3E8FF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.beginPath();
          ctx.arc(coin.x, floatY, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(coin.x, floatY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#78350F';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', coin.x, floatY);
        }
      }
    }

    // 6. Draw Active Bombs
    for (const b of engine.bombs) {
      const isPlayerBomb = b.ownerId === engine.player.id;
      const isFriendlyBomb = isPlayerBomb || (engine.ally && b.ownerId === engine.ally.id);
      const pulse = 1 + Math.sin((1 - b.timer / b.maxTimer) * (isFriendlyBomb ? 14 : 18)) * 0.16;
      const radius = (b.isEmpowered ? 18 : 16) * pulse;

      // Glow aura
      if (b.isEmpowered) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      } else if (b.isScorpioPoison) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      } else if (isFriendlyBomb) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.30)';
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Empowered Super Bomb orbital rune ring
      if (b.isEmpowered) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Bomb Body
      ctx.fillStyle = b.isEmpowered
        ? '#311702'
        : b.isScorpioPoison
        ? '#581C87'
        : isFriendlyBomb
        ? '#0F172A'
        : '#1C0D0D';
      ctx.beginPath();
      ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = b.isEmpowered
        ? '#F59E0B'
        : b.isScorpioPoison
        ? '#C084FC'
        : isFriendlyBomb
        ? '#38BDF8'
        : '#EF4444';
      ctx.lineWidth = b.isEmpowered ? 3 : 2.5;
      ctx.stroke();

      // Fuse Spark
      ctx.fillStyle = b.isEmpowered ? '#FDE047' : '#FBBF24';
      ctx.beginPath();
      ctx.arc(b.x, b.y - radius * 0.9, b.isEmpowered ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();

      if (isFriendlyBomb) {
        // Friendly bomb timer & progress ring
        const progress = Math.max(0, b.timer / b.maxTimer);
        ctx.strokeStyle = b.isEmpowered ? '#FBBF24' : isPlayerBomb ? '#38BDF8' : '#60A5FA';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.timer.toFixed(1), b.x, b.y + 1);

        if (b.isEmpowered) {
          ctx.fillStyle = '#FDE047';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('SUPER', b.x, b.y - radius - 6);
        }
      } else {
        // Rival bomb: Timer HIDDEN
        ctx.fillStyle = '#F87171';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', b.x, b.y);

        const dangerPulse = (now % 400) / 400;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - dangerPulse * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius + dangerPulse * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 7. Draw Explosions
    for (const exp of engine.explosions) {
      const alpha = exp.duration / exp.maxDuration;
      ctx.fillStyle = exp.isScorpioPoison
        ? `rgba(168, 85, 247, ${alpha * 0.7})`
        : `rgba(245, 158, 11, ${alpha * 0.8})`;

      for (const seg of exp.segments) {
        const spx = seg.gridX * tileSize;
        const spy = seg.gridY * tileSize;

        ctx.fillRect(spx + 3, spy + 3, tileSize - 6, tileSize - 6);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
        ctx.fillRect(spx + 12, spy + 12, tileSize - 24, tileSize - 24);
        ctx.fillStyle = exp.isScorpioPoison
          ? `rgba(168, 85, 247, ${alpha * 0.7})`
          : `rgba(245, 158, 11, ${alpha * 0.8})`;
      }
    }

    // 8. Draw Loot Pickups
    for (const loot of engine.lootList) {
      const floatY = loot.y + Math.sin(loot.bobPhase) * 4;
      const rarity = RARITY_CONFIG[loot.item.rarity];

      ctx.fillStyle = rarity.bg;
      ctx.beginPath();
      ctx.arc(loot.x, floatY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(loot.x, floatY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rarity.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loot.item.icon, loot.x, floatY);
    }

    // 9. Draw Entities in 2v2 (Player, Ally, Rival 1, Rival 2)
    for (const entity of engine.getAllEntities()) {
      if (!entity.isAlive) continue;
      // In solo warehouse stage, hide enemies until countdown expires
      if (engine.phase === 'portal_warehouse' && !engine.isRivalInWarehouse && entity.teamId !== 'team_blue') {
        continue;
      }
      const isBlue = entity.teamId === 'team_blue';
      const defaultColor = isBlue ? '#38BDF8' : '#F87171';
      this.drawEntity(ctx, entity, defaultColor, isWarehouse, entity.id === engine.player.id);
    }

    // 10. Draw Particles and Floating Damage
    engine.particles.draw(ctx);

    ctx.restore();
  }

  private drawEntity(
    ctx: CanvasRenderingContext2D,
    entity: import('./types').Entity,
    defaultColor: string,
    isWarehouse: boolean,
    isLocalPlayer: boolean = false
  ) {
    if (!entity.isAlive) return;

    const zInfo = ZODIAC_SIGNS[entity.sign];
    const themeColor = zInfo?.themeColor || defaultColor;
    const isBlueTeam = entity.teamId === 'team_blue';

    ctx.save();

    // Slipping Motion Blur & Skid Trails
    if (entity.slipTimer > 0) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(entity.x, entity.y);
      ctx.lineTo(entity.x - entity.slipVx * 0.15, entity.y - entity.slipVy * 0.15);
      ctx.stroke();

      ctx.translate(entity.x, entity.y);
      ctx.rotate(Math.sin(Date.now() / 50) * 0.25);
      ctx.translate(-entity.x, -entity.y);
    }

    // Team Ring Accent
    ctx.strokeStyle = isBlueTeam ? 'rgba(56, 189, 248, 0.5)' : 'rgba(248, 113, 113, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Critical HP Adrenaline Pulse Aura
    const isCrit = entity.hp <= entity.maxHp * 0.35;
    if (isCrit) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shield Aura
    if (entity.shield > 0) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Invulnerability Flashing
    if (entity.iFrames > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Phasing opacity
    if (entity.isPhasing) {
      ctx.globalAlpha = 0.5;
    }

    // Character Base Body
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = isLocalPlayer ? 3.5 : 2.5;
    ctx.stroke();

    // Zodiac Symbol in Center
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zInfo?.symbol || '♈', entity.x, entity.y + 1);

    // HP Bar Above Entity
    const barWidth = 36;
    const barHeight = 5;
    const barX = entity.x - barWidth / 2;
    const barY = entity.y - entity.radius - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const hpRatio = Math.max(0, entity.hp / entity.maxHp);
    ctx.fillStyle = hpRatio > 0.4 ? '#10B981' : hpRatio > 0.2 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Local player indicator arrow / tag
    if (isLocalPlayer) {
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(entity.x, barY - 18);
      ctx.lineTo(entity.x - 4, barY - 24);
      ctx.lineTo(entity.x + 4, barY - 24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('TÚ', entity.x, barY - 27);
    }

    // Entity Label with Team Tag
    ctx.fillStyle = isBlueTeam ? '#93C5FD' : '#FCA5A5';
    ctx.font = '9px monospace';
    ctx.fillText(entity.name, entity.x, barY - 6);

    // Warehouse Carried Coins & Weight Indicator Badge
    if (isWarehouse && entity.carriedCoins > 0) {
      const slowPct = Math.min(50, Math.round((entity.carriedCoins / 75) * 50));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(entity.x - 30, entity.y + entity.radius + 4, 60, 14);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1;
      ctx.strokeRect(entity.x - 30, entity.y + entity.radius + 4, 60, 14);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`🎒${entity.carriedCoins}🪙 -${slowPct}%`, entity.x, entity.y + entity.radius + 14);
    }

    ctx.restore();
  }
}
