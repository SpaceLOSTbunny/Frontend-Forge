(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============================================================
     Footer year
     ============================================================ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     Theme toggle — reads/writes the same key as the main site so
     the choice stays in sync when navigating back and forth
     ============================================================ */
  const themeBtn = $('#themeBtn');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (themeBtn) themeBtn.textContent = '☀️';
    } else {
      root.removeAttribute('data-theme');
      if (themeBtn) themeBtn.textContent = '🌙';
    }
  }

  applyTheme(localStorage.getItem('forge_theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('forge_theme', next);
  });

  /* ============================================================
     Mobile nav
     ============================================================ */
  const menuBtn = $('#menuBtn');
  const siteNav = $('#siteNav');

  menuBtn?.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      siteNav?.classList.remove('open');
      menuBtn?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============================================================
     Spark particles on primary buttons (mirrors script.js so the
     "Start Practicing" CTA and the back-to-top button feel the
     same everywhere in the site)
     ============================================================ */
  function spark(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const originX = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const originY = e.clientY ? e.clientY - rect.top : rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const p = document.createElement('span');
      p.className = 'spark';
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 24;
      p.style.left = `${originX}px`;
      p.style.top = `${originY}px`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 10}px`);
      btn.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  $$('.startBtn, #backToTopBtn').forEach(btn => btn.addEventListener('click', spark));

  /* ============================================================
     Back to top
     ============================================================ */
  const backToTopBtn = $('#backToTopBtn');
  if (backToTopBtn) {
    const toggleBackToTop = () => {
      backToTopBtn.classList.toggle('visible', window.scrollY > 420);
    };
    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
