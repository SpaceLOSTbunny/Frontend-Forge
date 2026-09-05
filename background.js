/* =========================================================
   Frontend Forge — Interactive Ember Background
   A full-page canvas of drifting embers that react to the
   cursor (or finger, on touch). Shared across every page —
   loaded by both script.js (index) and course.js (courses).
   ========================================================= */
(() => {
  'use strict';

  const canvas = document.getElementById('emberCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 720px)');

  /* ---------- sizing ---------- */
  let width = 0, height = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- theme-aware colors (reads the same CSS vars as the rest of the site) ---------- */
  let colors = { c1: '#ffb627', c2: '#ff6b35', glow: 'rgba(255, 182, 39, 0.65)' };
  function readColors() {
    const s = getComputedStyle(document.documentElement);
    colors = {
      c1: (s.getPropertyValue('--particle-1') || '').trim() || colors.c1,
      c2: (s.getPropertyValue('--particle-2') || '').trim() || colors.c2,
      glow: (s.getPropertyValue('--particle-glow') || '').trim() || colors.glow
    };
  }
  readColors();
  // Re-read whenever the theme toggle flips data-theme on <html>
  new MutationObserver(readColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  /* ---------- pointer tracking (mouse + touch) ---------- */
  const pointer = { x: -9999, y: -9999, active: false };
  let pointerTimeout;

  function setPointer(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    clearTimeout(pointerTimeout);
    // treat the pointer as "gone" if it hasn't moved in a while (e.g. touch lift)
    pointerTimeout = setTimeout(() => { pointer.active = false; }, 2200);
  }

  window.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('mouseleave', () => { pointer.active = false; });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) setPointer(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => { pointer.active = false; });

  /* ---------- embers ---------- */
  const COUNT = mobileQuery.matches ? 20 : 42;
  const INTERACT_RADIUS = 150;
  const PUSH_STRENGTH = 8;

  class Ember {
    constructor() { this.reset(true); }

    reset(initial) {
      this.baseX = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 24;
      this.size = 2 + Math.random() * 3.5;
      this.speed = 0.22 + Math.random() * 0.45;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.006 + Math.random() * 0.012;
      this.wobbleRange = 10 + Math.random() * 18;
      this.maxAlpha = 0.35 + Math.random() * 0.5;
      this.alpha = initial ? this.maxAlpha * Math.random() : 0;
      this.useC1 = Math.random() > 0.5;
      // spring offset used for the mouse-repel effect
      this.ox = 0;
      this.oy = 0;
      this.vx = 0;
      this.vy = 0;
    }

    update() {
      this.y -= this.speed;
      this.wobble += this.wobbleSpeed;
      const targetX = this.baseX + Math.sin(this.wobble) * this.wobbleRange;

      // fade in near the bottom, fade out near the top
      if (this.y > height - 60) {
        this.alpha = Math.min(this.maxAlpha, this.alpha + 0.015);
      } else if (this.y < 70) {
        this.alpha = Math.max(0, this.alpha - 0.02);
      } else if (this.alpha < this.maxAlpha) {
        this.alpha = Math.min(this.maxAlpha, this.alpha + 0.015);
      }

      // repel away from the pointer, spring back afterwards
      if (pointer.active) {
        const dx = targetX - pointer.x;
        const dy = this.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < INTERACT_RADIUS && dist > 0.01) {
          const force = (1 - dist / INTERACT_RADIUS) * PUSH_STRENGTH;
          this.vx += (dx / dist) * force * 0.06;
          this.vy += (dy / dist) * force * 0.06;
        }
      }
      // spring the offset back toward the resting path
      this.vx += -this.ox * 0.02;
      this.vy += -this.oy * 0.02;
      this.vx *= 0.9;
      this.vy *= 0.9;
      this.ox += this.vx;
      this.oy += this.vy;

      this.x = targetX + this.ox;
      this.drawY = this.y + this.oy;

      if (this.y < -30) this.reset(false);
    }

    draw() {
      if (this.alpha <= 0.01) return;
      const nearPointer = pointer.active && Math.hypot(this.x - pointer.x, this.drawY - pointer.y) < INTERACT_RADIUS;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.useC1 ? colors.c1 : colors.c2;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = nearPointer ? 18 : 9;
      const r = nearPointer ? this.size * 0.75 : this.size * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.drawY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  let embers = Array.from({ length: COUNT }, () => new Ember());

  /* ---------- render loop ---------- */
  let rafId = null;

  function frame() {
    ctx.clearRect(0, 0, width, height);
    embers.forEach(e => { e.update(); e.draw(); });
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId) return;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, width, height);
  }

  // Respect reduced-motion: draw one faint static frame instead of animating,
  // and skip the interactive repel loop entirely.
  if (reduceMotionQuery.matches) {
    embers.forEach(e => { e.alpha = e.maxAlpha * 0.4; e.draw(); });
  } else {
    start();
  }
  reduceMotionQuery.addEventListener('change', (e) => {
    if (e.matches) { stop(); } else { start(); }
  });

  // Pause the loop when the tab is hidden to save battery/CPU.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduceMotionQuery.matches) start();
  });
})();

/* =========================================================
   PWA install support — registers the service worker so the
   site can be added to the home screen on Android and iOS and
   still opens (from cache) with a flaky connection. Silently
   no-ops if unsupported (e.g. served over plain http://) or the
   file is opened directly instead of through a server.
   ========================================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
