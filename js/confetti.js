/* =========================================================
   Confeti liviano en <canvas> + sonido de felicitación
   sintetizado con Web Audio API (sin archivos externos,
   funciona 100% offline).
   ========================================================= */

const Celebration = (() => {
  let canvas, ctx, particles = [], animId = null;

  const COLORS = ['#8FD3C7', '#FFC98B', '#FFB3B3', '#C6B8F0', '#A9D8B8', '#FFE08A'];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        r: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vy: 2 + Math.random() * 3,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * 360,
        vrot: -6 + Math.random() * 12,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let stillFalling = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      if (p.y < canvas.height + 20) stillFalling = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      }
      ctx.restore();
    }
    if (stillFalling) {
      animId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animId);
    }
  }

  function playCheerSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctxA = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 - arpegio alegre
      notes.forEach((freq, i) => {
        const osc = ctxA.createOscillator();
        const gain = ctxA.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctxA.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain).connect(ctxA.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
      setTimeout(() => ctxA.close(), 1200);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido de felicitación.', e);
    }
  }

  function playTapSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctxA = new AudioCtx();
      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();
      osc.type = 'sine';
      osc.frequency.value = 700;
      gain.gain.setValueAtTime(0.15, ctxA.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.15);
      osc.connect(gain).connect(ctxA.destination);
      osc.start();
      osc.stop(ctxA.currentTime + 0.15);
      setTimeout(() => ctxA.close(), 300);
    } catch (e) { /* silencioso si falla */ }
  }

  function show(soundEnabled) {
    const overlay = document.getElementById('celebration');
    canvas = document.getElementById('confetti-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    overlay.classList.remove('hidden');
    createParticles(140);
    draw();
    if (soundEnabled) playCheerSound();

    setTimeout(() => {
      overlay.classList.add('hidden');
      if (animId) cancelAnimationFrame(animId);
    }, 3200);
  }

  window.addEventListener('resize', () => {
    if (canvas) resizeCanvas();
  });

  return { show, playTapSound };
})();
