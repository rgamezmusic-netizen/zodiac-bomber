import { DamageNumber, Particle } from './types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public screenShake: number = 0;

  public triggerScreenShake(intensity: number) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  public update(dt: number) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake -= dt * 18;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Damage numbers update
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dn.vy * dt;
      dn.vy *= 0.92;
      dn.life -= dt;
      dn.scale = Math.min(1.4, 0.8 + (1 - dn.life / dn.maxLife) * 0.6);

      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public spawnExplosionBurst(x: number, y: number, color = '#F59E0B', count = 24) {
    this.triggerScreenShake(8);

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 14,
      color,
      alpha: 1,
      life: 0.35,
      maxLife: 0.35,
      shape: 'ring',
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? color : '#EF4444',
        alpha: 1,
        life: 0.3 + Math.random() * 0.35,
        maxLife: 0.65,
        shape: Math.random() > 0.5 ? 'spark' : 'circle',
      });
    }
  }

  public spawnWallDebris(x: number, y: number, color = '#64748B') {
    this.triggerScreenShake(3);
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        shape: 'square',
      });
    }
  }

  public spawnPickupSparkles(x: number, y: number, color = '#38BDF8') {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0.45,
        maxLife: 0.45,
        shape: 'star',
      });
    }
  }

  public spawnDamageNumber(x: number, y: number, text: string, color = '#F87171') {
    this.damageNumbers.push({
      id: Math.random().toString(36).substring(2, 9),
      x: x + (Math.random() * 16 - 8),
      y: y - 10,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      vy: -55,
      scale: 1.0,
    });
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        const expandRatio = 1 - p.life / p.maxLife;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + expandRatio * 45, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark' || p.shape === 'star') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Damage Numbers
    for (const dn of this.damageNumbers) {
      ctx.save();
      const alpha = Math.min(1, dn.life / (dn.maxLife * 0.6));
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.round(18 * dn.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(dn.text, dn.x + 1, dn.y + 1); // drop shadow
      ctx.fillStyle = dn.color;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }
}
