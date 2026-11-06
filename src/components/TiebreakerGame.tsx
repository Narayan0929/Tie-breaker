import React, { useRef, useEffect, useState } from 'react';
import { sound } from '../game/GameSound';
import { triggerTiebreakerConfetti } from '../utils/confetti';
import { OptionAnalysis } from '../types/decision';

interface TiebreakerGameProps {
  onExitGame: () => void;
  decisionTitle?: string;
  options?: OptionAnalysis[];
}

type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Orb {
  x: number;
  y: number;
  radius: number;
  type: 'clarity' | 'courage';
  pulse: number;
}

interface Hazard {
  id: number;
  type: 'anchor' | 'paralysis' | 'phantom';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  telegraphTimer: number; // >0 means telegraphing/winding up
  telegraphMax: number;
  aimAngle?: number;
  name: string;
}

export const TiebreakerGame: React.FC<TiebreakerGameProps> = ({
  onExitGame,
  decisionTitle = 'The Great Dilemma',
  options = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level game state
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [muted, setMuted] = useState(false);

  // HUD state mirrored from loop at low frequency or game events
  const [hudScore, setHudScore] = useState(0);
  const [hudHp, setHudHp] = useState(3);
  const [hudWave, setHudWave] = useState(1);
  const [hudBalance, setHudBalance] = useState(50); // 0 (100% Option A) to 100 (100% Option B)
  const [victoryWinner, setVictoryWinner] = useState('');

  // Option names for Left / Right Gates
  const optAName = options[0]?.optionName || 'Option A';
  const optBName = options[1]?.optionName || 'Option B';

  // Refs for 60fps simulation state (isolated from React re-renders)
  const stateRef = useRef<{
    gameState: GameState;
    score: number;
    hp: number;
    maxHp: number;
    wave: number;
    balance: number; // 0 to 100
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      speed: number;
      dashTimer: number;
      dashCooldown: number;
      isDashing: boolean;
      facing: number;
      squash: number; // squash and stretch multiplier
    };
    keys: {
      held: Record<string, boolean>;
      justPressed: Record<string, boolean>;
    };
    camera: {
      shake: number;
      x: number;
      y: number;
    };
    hitstop: number;
    flashTimer: number;
    particles: Particle[];
    orbs: Orb[];
    hazards: Hazard[];
    nextHazardId: number;
    spawnTimer: number;
    orbSpawnTimer: number;
  }>({
    gameState: 'TITLE',
    score: 0,
    hp: 3,
    maxHp: 3,
    wave: 1,
    balance: 50,
    player: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 340,
      dashTimer: 0,
      dashCooldown: 0,
      isDashing: false,
      facing: 0,
      squash: 1,
    },
    keys: {
      held: {},
      justPressed: {},
    },
    camera: { shake: 0, x: 0, y: 0 },
    hitstop: 0,
    flashTimer: 0,
    particles: [],
    orbs: [],
    hazards: [],
    nextHazardId: 1,
    spawnTimer: 0,
    orbSpawnTimer: 0,
  });

  // Sync mute state
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
  };

  // Keyboard input listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      stateRef.current.keys.held[code] = true;
      stateRef.current.keys.justPressed[code] = true;

      // Global shortcuts
      if (code === 'KeyM') {
        toggleMute();
      }

      if (code === 'Escape') {
        const cur = stateRef.current.gameState;
        if (cur === 'PLAYING') {
          stateRef.current.gameState = 'PAUSED';
          setGameState('PAUSED');
        } else if (cur === 'PAUSED') {
          stateRef.current.gameState = 'PLAYING';
          setGameState('PLAYING');
        }
      }

      if (stateRef.current.gameState === 'TITLE' && (code === 'Space' || code === 'Enter')) {
        startGame();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys.held[e.code] = false;
    };

    const onBlur = () => {
      stateRef.current.keys.held = {};
      stateRef.current.keys.justPressed = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [muted]);

  const startGame = () => {
    const s = stateRef.current;
    s.gameState = 'PLAYING';
    s.score = 0;
    s.hp = 3;
    s.wave = 1;
    s.balance = 50;
    s.particles = [];
    s.orbs = [];
    s.hazards = [];
    s.player.x = 400;
    s.player.y = 300;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.dashTimer = 0;
    s.player.dashCooldown = 0;

    // Seed initial orbs
    for (let i = 0; i < 4; i++) {
      s.orbs.push({
        x: 150 + Math.random() * 500,
        y: 100 + Math.random() * 400,
        radius: 10,
        type: Math.random() > 0.3 ? 'clarity' : 'courage',
        pulse: Math.random() * Math.PI * 2,
      });
    }

    setGameState('PLAYING');
    setHudScore(0);
    setHudHp(3);
    setHudWave(1);
    setHudBalance(50);
  };

  // Main 60fps game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop);

      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Handle hitstop
      if (s.hitstop > 0) {
        s.hitstop -= dt;
        return; // Freeze simulation briefly for impact punch
      }

      // Handle flash timer
      if (s.flashTimer > 0) {
        s.flashTimer -= dt;
      }

      // --- SIMULATION (ONLY IN PLAYING OR TITLE) ---
      if (s.gameState === 'PLAYING') {
        const { held, justPressed } = s.keys;
        const player = s.player;

        // Player input vector
        let moveX = 0;
        let moveY = 0;
        if (held['KeyW'] || held['ArrowUp']) moveY -= 1;
        if (held['KeyS'] || held['ArrowDown']) moveY += 1;
        if (held['KeyA'] || held['ArrowLeft']) moveX -= 1;
        if (held['KeyD'] || held['ArrowRight']) moveX += 1;

        const mag = Math.hypot(moveX, moveY);
        if (mag > 0) {
          moveX /= mag;
          moveY /= mag;
          player.facing = Math.atan2(moveY, moveX);
        }

        // Dash action (Space)
        if (player.dashCooldown > 0) {
          player.dashCooldown -= dt;
        }

        if (justPressed['Space'] && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashTimer = 0.22;
          player.dashCooldown = 0.8;
          player.squash = 1.6;
          s.camera.shake = 8;
          sound.playDash();

          // Spawn dash dust trail
          for (let i = 0; i < 10; i++) {
            s.particles.push({
              x: player.x,
              y: player.y,
              vx: -Math.cos(player.facing) * (80 + Math.random() * 80) + (Math.random() - 0.5) * 50,
              vy: -Math.sin(player.facing) * (80 + Math.random() * 80) + (Math.random() - 0.5) * 50,
              life: 0.35,
              maxLife: 0.35,
              color: '#38bdf8',
              size: 4 + Math.random() * 4,
            });
          }
        }

        if (player.isDashing) {
          player.dashTimer -= dt;
          player.vx = Math.cos(player.facing) * player.speed * 2.8;
          player.vy = Math.sin(player.facing) * player.speed * 2.8;
          if (player.dashTimer <= 0) {
            player.isDashing = false;
          }
        } else {
          // Normal acceleration & damping
          const targetVx = moveX * player.speed;
          const targetVy = moveY * player.speed;
          player.vx += (targetVx - player.vx) * 14 * dt;
          player.vy += (targetVy - player.vy) * 14 * dt;
        }

        // Move player
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Squash-and-stretch decay
        player.squash += (1 - player.squash) * 10 * dt;

        // Arena bounds constraint
        const margin = 50;
        player.x = Math.max(margin, Math.min(width - margin, player.x));
        player.y = Math.max(margin, Math.min(height - margin, player.y));

        // Orbs spawn timer
        s.orbSpawnTimer += dt;
        if (s.orbSpawnTimer > 3.0 && s.orbs.length < 8) {
          s.orbSpawnTimer = 0;
          s.orbs.push({
            x: 100 + Math.random() * (width - 200),
            y: 100 + Math.random() * (height - 200),
            radius: 11,
            type: Math.random() > 0.4 ? 'clarity' : 'courage',
            pulse: 0,
          });
        }

        // Hazards spawn timer based on wave
        s.spawnTimer += dt;
        const spawnInterval = Math.max(1.4, 3.2 - s.wave * 0.5);
        if (s.spawnTimer > spawnInterval) {
          s.spawnTimer = 0;
          const hazardTypes: ('anchor' | 'paralysis' | 'phantom')[] = ['anchor', 'paralysis', 'phantom'];
          const chosenType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];

          // Spawn around screen edges
          const edge = Math.floor(Math.random() * 4);
          let spawnX = 0;
          let spawnY = 0;
          if (edge === 0) { spawnX = Math.random() * width; spawnY = -20; }
          else if (edge === 1) { spawnX = width + 20; spawnY = Math.random() * height; }
          else if (edge === 2) { spawnX = Math.random() * width; spawnY = height + 20; }
          else { spawnX = -20; spawnY = Math.random() * height; }

          const angleToPlayer = Math.atan2(player.y - spawnY, player.x - spawnX);

          s.hazards.push({
            id: s.nextHazardId++,
            type: chosenType,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(angleToPlayer) * (chosenType === 'anchor' ? 240 : chosenType === 'phantom' ? 140 : 80),
            vy: Math.sin(angleToPlayer) * (chosenType === 'anchor' ? 240 : chosenType === 'phantom' ? 140 : 80),
            radius: chosenType === 'anchor' ? 24 : chosenType === 'paralysis' ? 32 : 16,
            hp: chosenType === 'paralysis' ? 2 : 1,
            telegraphTimer: chosenType === 'anchor' ? 1.0 : chosenType === 'paralysis' ? 1.2 : 0,
            telegraphMax: chosenType === 'anchor' ? 1.0 : chosenType === 'paralysis' ? 1.2 : 0,
            aimAngle: angleToPlayer,
            name:
              chosenType === 'anchor'
                ? 'Sunk Cost Anchor'
                : chosenType === 'paralysis'
                ? 'Analysis Paralysis'
                : 'Confirmation Phantom',
          });
        }

        // --- UPDATE ORBS & COLLISION ---
        for (let i = s.orbs.length - 1; i >= 0; i--) {
          const orb = s.orbs[i];
          orb.pulse += dt * 4;

          const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
          if (dist < player.radius + orb.radius) {
            // Collect orb!
            s.orbs.splice(i, 1);
            s.score += orb.type === 'courage' ? 50 : 25;
            setHudScore(s.score);
            sound.playOrbChime(orb.type === 'courage' ? 1.25 : 1.0);

            // Spawn pickup particles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: orb.x,
                y: orb.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                life: 0.45,
                maxLife: 0.45,
                color: orb.type === 'courage' ? '#fbbf24' : '#38bdf8',
                size: 3 + Math.random() * 4,
              });
            }

            // Check if deposited near Left Gate (Option A) or Right Gate (Option B)
            if (player.x < width * 0.35) {
              s.balance = Math.max(0, s.balance - 10); // Tips left
              setHudBalance(s.balance);
            } else if (player.x > width * 0.65) {
              s.balance = Math.min(100, s.balance + 10); // Tips right
              setHudBalance(s.balance);
            }
          }
        }

        // --- UPDATE HAZARDS & INTERACTIONS ---
        for (let i = s.hazards.length - 1; i >= 0; i--) {
          const h = s.hazards[i];

          // Telegraph countdown
          if (h.telegraphTimer > 0) {
            h.telegraphTimer -= dt;
            if (h.telegraphTimer <= 0 && h.type === 'anchor') {
              // Sudden burst forward in telegraphed angle
              h.vx = Math.cos(h.aimAngle || 0) * 420;
              h.vy = Math.sin(h.aimAngle || 0) * 420;
            }
          } else {
            // Active movement
            if (h.type === 'phantom') {
              // Gentle homing
              const angle = Math.atan2(player.y - h.y, player.x - h.x);
              h.vx += (Math.cos(angle) * 160 - h.vx) * 3 * dt;
              h.vy += (Math.sin(angle) * 160 - h.vy) * 3 * dt;
            }

            h.x += h.vx * dt;
            h.y += h.vy * dt;
          }

          // Collision with Player
          const dist = Math.hypot(player.x - h.x, player.y - h.y);
          if (dist < player.radius + h.radius) {
            if (player.isDashing) {
              // PLAYER SMASHES HAZARD WITH DECISIVE DASH!
              h.hp -= 1;
              s.hitstop = 0.06; // 60ms hitstop
              s.camera.shake = 14;
              s.score += 100;
              setHudScore(s.score);
              sound.playSmash();

              // Explosion particles
              for (let p = 0; p < 20; p++) {
                s.particles.push({
                  x: h.x,
                  y: h.y,
                  vx: (Math.random() - 0.5) * 300,
                  vy: (Math.random() - 0.5) * 300,
                  life: 0.5,
                  maxLife: 0.5,
                  color: h.type === 'anchor' ? '#f43f5e' : h.type === 'paralysis' ? '#a855f7' : '#f97316',
                  size: 5 + Math.random() * 5,
                });
              }

              if (h.hp <= 0) {
                s.hazards.splice(i, 1);
                continue;
              }
            } else if (h.telegraphTimer <= 0) {
              // Player takes damage!
              s.hp -= 1;
              s.flashTimer = 0.15;
              s.camera.shake = 16;
              s.hitstop = 0.08;
              setHudHp(s.hp);
              sound.playHit();

              // Push player back
              const knockAngle = Math.atan2(player.y - h.y, player.x - h.x);
              player.vx = Math.cos(knockAngle) * 400;
              player.vy = Math.sin(knockAngle) * 400;

              // Remove the hazard
              s.hazards.splice(i, 1);

              if (s.hp <= 0) {
                // Game Over
                s.gameState = 'GAMEOVER';
                setGameState('GAMEOVER');
                return;
              }
              continue;
            }
          }

          // Cull offscreen hazards
          if (h.x < -100 || h.x > width + 100 || h.y < -100 || h.y > height + 100) {
            s.hazards.splice(i, 1);
          }
        }

        // Wave progression / Victory check
        if (s.score >= s.wave * 400) {
          if (s.wave < 3) {
            s.wave += 1;
            setHudWave(s.wave);
            sound.playOrbChime(1.5);
            s.camera.shake = 10;
          } else if (s.score >= 1200) {
            // Victory! Tie has been broken in the game
            s.gameState = 'VICTORY';
            setGameState('VICTORY');
            const winner = s.balance < 50 ? optAName : optBName;
            setVictoryWinner(winner);
            sound.playVictoryFanfare();
            triggerTiebreakerConfetti();
            return;
          }
        }
      }

      // --- UPDATE PARTICLES ---
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // Camera shake decay
      s.camera.shake *= Math.pow(0.05, dt);
      if (s.camera.shake < 0.1) s.camera.shake = 0;
      const shakeOffsetX = (Math.random() - 0.5) * s.camera.shake * 2;
      const shakeOffsetY = (Math.random() - 0.5) * s.camera.shake * 2;

      // Reset edge-triggered keys at end of frame
      s.keys.justPressed = {};

      // ==========================================
      // --- RENDER PASS (CANVAS 2D) ---
      // ==========================================
      ctx.save();
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // Deep celestial grid background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Neon grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Arena Gate Zones (Left: Option A, Right: Option B)
      const gateWidth = 140;

      // Left Gate (Option A - Cyan/Indigo)
      const gradA = ctx.createLinearGradient(0, 0, gateWidth, 0);
      gradA.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      gradA.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = gradA;
      ctx.fillRect(0, 0, gateWidth, height);

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gateWidth, 0);
      ctx.lineTo(gateWidth, height);
      ctx.stroke();

      // Right Gate (Option B - Emerald/Purple)
      const gradB = ctx.createLinearGradient(width, 0, width - gateWidth, 0);
      gradB.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      gradB.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = gradB;
      ctx.fillRect(width - gateWidth, 0, gateWidth, height);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width - gateWidth, 0);
      ctx.lineTo(width - gateWidth, height);
      ctx.stroke();

      // Gate Labels
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`GATE A: ${optAName.slice(0, 18)}`, 20, 40);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.fillText('Deposit clarity here', 20, 56);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'right';
      ctx.fillText(`GATE B: ${optBName.slice(0, 18)}`, width - 20, 40);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.fillText('Deposit clarity here', width - 20, 56);
      ctx.restore();

      // Render Orbs
      s.orbs.forEach((orb) => {
        const pulseR = orb.radius + Math.sin(orb.pulse) * 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = orb.type === 'courage' ? '#fbbf24' : '#38bdf8';
        ctx.shadowColor = orb.type === 'courage' ? '#f59e0b' : '#0284c7';
        ctx.shadowBlur = 12;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Render Hazards & Windup Telegraphs
      s.hazards.forEach((h) => {
        ctx.save();

        // Windup Telegraph Visuals
        if (h.telegraphTimer > 0) {
          const progress = 1 - h.telegraphTimer / h.telegraphMax;

          if (h.type === 'anchor') {
            // Laser aim line telegraph
            ctx.beginPath();
            ctx.moveTo(h.x, h.y);
            const lineLen = 800;
            const endX = h.x + Math.cos(h.aimAngle || 0) * lineLen;
            const endY = h.y + Math.sin(h.aimAngle || 0) * lineLen;
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.3 + progress * 0.7})`;
            ctx.lineWidth = 2 + progress * 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
          } else if (h.type === 'paralysis') {
            // Expanding concentric danger circle
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * (0.5 + progress * 0.8), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + progress * 0.6})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        // Hazard Body
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        if (h.type === 'anchor') {
          ctx.fillStyle = '#e11d48';
          ctx.shadowColor = '#f43f5e';
        } else if (h.type === 'paralysis') {
          ctx.fillStyle = '#9333ea';
          ctx.shadowColor = '#c084fc';
        } else {
          ctx.fillStyle = '#ea580c';
          ctx.shadowColor = '#fb923c';
        }
        ctx.shadowBlur = 14;
        ctx.fill();

        // Hazard core icon/letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.type === 'anchor' ? '⚓' : h.type === 'paralysis' ? '⚡' : '👁', h.x, h.y);

        ctx.restore();
      });

      // Render Player Avatar (Equilibrium Seeker)
      const player = s.player;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.facing);
      ctx.scale(player.squash, 1 / Math.sqrt(player.squash));

      // Dash aura
      if (player.isDashing) {
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.fill();
      }

      // Player Core
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.flashTimer > 0 ? '#ffffff' : '#4f46e5';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 16;
      ctx.fill();

      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Forward beak / pointer
      ctx.beginPath();
      ctx.moveTo(player.radius - 2, -6);
      ctx.lineTo(player.radius + 8, 0);
      ctx.lineTo(player.radius - 2, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.restore();
      });

      // Flash on hit overlay
      if (s.flashTimer > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [optAName, optBName]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 select-none">
      {/* 60fps Isolated Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
      />

      {/* --- LOW-OCCLUSION HUD PERIMETER CLUSTERS (POINTER-EVENTS: NONE) --- */}
      {gameState === 'PLAYING' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Bar Cluster */}
          <div className="flex items-start justify-between">
            {/* Top-Left: Player Health & Wave */}
            <div className="rounded-xl border border-indigo-500/20 bg-slate-900/80 px-4 py-2 text-white shadow-lg backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Integrity
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-3 w-4 rounded-xs transition-colors ${
                        i < hudHp ? 'bg-indigo-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-slate-300">
                WAVE <span className="text-indigo-400 tabular-nums">0{hudWave}</span> / 03
              </div>
            </div>

            {/* Top-Center: Equilibrium Scale Meter */}
            <div className="flex flex-col items-center max-w-xs w-full mx-4">
              <div className="flex w-full items-center justify-between text-[11px] font-bold tracking-tight text-slate-300 mb-1">
                <span className="text-cyan-400 truncate max-w-[100px]">{optAName}</span>
                <span className="text-xs uppercase font-extrabold text-slate-400">Equilibrium Scale</span>
                <span className="text-emerald-400 truncate max-w-[100px] text-right">{optBName}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${hudBalance}%` }}
                />
              </div>
            </div>

            {/* Top-Right: Score readout & Mute / Controls */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="rounded-xl border border-indigo-500/20 bg-slate-900/80 px-4 py-2 text-right text-white shadow-lg backdrop-blur-xs">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Clarity Score
                </div>
                <div className="text-base font-mono font-black tabular-nums text-indigo-300">
                  {hudScore}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMute}
                className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-slate-300 hover:text-white transition-colors"
                title={muted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {muted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                onClick={onExitGame}
                className="rounded-xl border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/80 transition-colors"
              >
                Exit Game
              </button>
            </div>
          </div>

          {/* Bottom Bar: Action Hint */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div>
              <span className="text-indigo-400 font-bold">Space: </span>
              <span>Decisive Dash (Smashes Hazards)</span>
            </div>
            <div className="hidden sm:block">
              <span>WASD Move · Space Action · Esc Pause · M Mute</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TITLE SCREEN OVERLAY --- */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950/70 backdrop-blur-xs">
          {/* Bespoke inline SVG Title Lockup */}
          <div className="mb-6 flex flex-col items-center">
            <svg
              className="h-20 w-20 text-indigo-400 mb-3 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="M7 21h10" />
              <path d="M12 3v18" />
              <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
            </svg>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans">
              The Trial of Equilibrium
            </h1>
            <p className="mt-2 text-sm text-indigo-300 max-w-md font-medium">
              A high-velocity decision agility arena. Smash cognitive biases, collect clarity orbs,
              and deposit them into your chosen path to tip the cosmic balance.
            </p>
          </div>

          {/* Dilemma Header in Title */}
          <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-950/50 px-6 py-3 max-w-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Active Dilemma:
            </span>
            <div className="text-sm font-bold text-white mt-0.5 line-clamp-1">
              {decisionTitle}
            </div>
          </div>

          {/* Primary Start CTA */}
          <button
            type="button"
            onClick={startGame}
            className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all"
          >
            <span>ENTER THE GAUNTLET</span>
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-mono">SPACE / ENTER</span>
          </button>

          {/* Flat Control-Hint Line */}
          <div className="mt-8 text-xs font-mono text-slate-400 tracking-wider">
            WASD Move · Space Decisive Dash · Esc Pause · M Mute
          </div>

          <button
            type="button"
            onClick={onExitGame}
            className="mt-6 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            Return to Decision Suite
          </button>
        </div>
      )}

      {/* --- PAUSE MODAL --- */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xs text-white">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
              Game Paused
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Take a breath and reflect on your tradeoffs.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  stateRef.current.gameState = 'PLAYING';
                  setGameState('PLAYING');
                }}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Resume Trial (Esc)
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Exit to Decision Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VICTORY MODAL --- */}
      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md text-white animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-indigo-950 p-8 text-center shadow-2xl shadow-emerald-500/20">
            <div className="mb-2 text-4xl">👑</div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Cosmic Scale Has Spoken
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white mt-1">
              Equilibrium Achieved!
            </h2>

            <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4">
              <span className="text-[11px] uppercase font-bold text-emerald-300">
                Your Victorious Option
              </span>
              <div className="text-xl font-extrabold text-white mt-1">
                &ldquo;{victoryWinner}&rdquo;
              </div>
            </div>

            <div className="mb-6 flex justify-around text-center text-xs font-mono text-slate-300 border-t border-b border-white/10 py-3">
              <div>
                <div className="text-slate-400 text-[10px]">FINAL SCORE</div>
                <div className="text-base font-bold text-indigo-400">{hudScore}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">WAVES CLEARED</div>
                <div className="text-base font-bold text-emerald-400">3 / 3</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startGame}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Back to Decision Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAMEOVER MODAL --- */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md text-white animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mb-2 text-3xl">💥</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Overwhelmed by Biases
            </h2>
            <p className="mt-1 text-xs text-slate-400 mb-6">
              Analysis paralysis and sunk cost traps claimed your integrity. Clear your mind and try again.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={startGame}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Retry Trial (Space)
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Return to Decision Suite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
