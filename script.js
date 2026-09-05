(() => {
  'use strict';

  /* ============================================================
     Utilities
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Fisher-Yates shuffle — returns a new shuffled array, doesn't mutate the source
  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Pick `count` random items from a pool (no repeats within a single draw)
  function pickRandom(pool, count) {
    return shuffle(pool).slice(0, Math.min(count, pool.length));
  }

  /* ============================================================
     Toasts
     ============================================================ */
  const toastStack = $('#toastStack');

  function showToast(message, type = 'info', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message; // textContent only — never innerHTML with dynamic text
    toastStack.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  /* ============================================================
     Footer year
     ============================================================ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     Theme toggle
     ============================================================ */
  const themeBtn = $('#themeBtn');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      themeBtn.textContent = '☀️';
    } else {
      root.removeAttribute('data-theme');
      themeBtn.textContent = '🌙';
    }
    if (window.monaco) window.monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
  }

  const savedTheme = localStorage.getItem('forge_theme') || 'dark';
  applyTheme(savedTheme);

  themeBtn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('forge_theme', next);

    const state = loadProgress();
    if (!state.themeToggled) {
      state.themeToggled = true;
      saveProgress(state);
      showToast('Badge earned: Night Owl 🌙', 'success');
    }
  });

  /* ============================================================
     Mobile nav
     ============================================================ */
  const menuBtn = $('#menuBtn');
  const siteNav = $('#siteNav');

  menuBtn.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============================================================
     Nav highlighting — which nav-link matches the current page
     ============================================================ */
  const navLinks = $$('.nav-link');

  (function highlightCurrentPageNav() {
    const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    navLinks.forEach(link => {
      const linkPage = (link.getAttribute('href').split('#')[0] || 'index.html').toLowerCase();
      link.classList.toggle('active', linkPage === currentPage || (linkPage === 'index.html' && currentPage === ''));
    });
  })();

  /* ============================================================
     Scrollspy — track visited sections for the Explorer badge
     ============================================================ */
  const sections = $$('section[id]');
  const EXPLORABLE_SECTIONS = ['home', 'courses', 'playground', 'quiz', 'progress', 'certificates', 'contact', 'about'];

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) markSectionVisited(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(section => spyObserver.observe(section));

  function markSectionVisited(id) {
    if (!EXPLORABLE_SECTIONS.includes(id)) return;
    const state = loadProgress();
    if (!state.visited.includes(id)) {
      state.visited.push(id);
      const nowComplete = EXPLORABLE_SECTIONS.every(s => state.visited.includes(s));
      saveProgress(state);
      if (nowComplete) showToast('Badge earned: Explorer 🧭', 'success');
    }
  }

  /* ============================================================
     Scroll-reveal animations
     ============================================================ */
  const revealTargets = $$(
    '.card, .course-card, .quiz-card, .progress-stat, .badge, .cert-card, .contact-card, .features h2, #courses h2, #playground h2, #quiz h2, #progress h2, #certificates h2, #contact h2, #about h2, .section-sub'
  );

  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${(i % 6) * 60}ms`);
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach(el => revealObserver.observe(el));

  /* ============================================================
     Spark particles on primary buttons
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

  $$('.startBtn, .courseBtn, #backToTopBtn').forEach(btn => btn.addEventListener('click', spark));

  /* ============================================================
     Smooth scroll for internal links
     ============================================================ */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  $('#startLearningBtn')?.addEventListener('click', () => {
    window.location.href = 'courses.html';
  });

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

  /* ============================================================
     Progress state (localStorage)
     ============================================================ */
  const PROGRESS_KEY = 'forge_progress';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) throw new Error('no data');
      const parsed = JSON.parse(raw);
      // Backfill any fields older saves may not have
      return {
        courses: { html: false, css: false, javascript: false, python: false, java: false, cpp: false, ...(parsed.courses || {}) },
        quizBest: parsed.quizBest ?? 0,
        quizAttempts: parsed.quizAttempts ?? 0,
        blanksCompleted: parsed.blanksCompleted ?? false,
        blanksAttempts: parsed.blanksAttempts ?? 0,
        playgroundUsed: parsed.playgroundUsed ?? false,
        themeToggled: parsed.themeToggled ?? false,
        visited: parsed.visited ?? [],
        quizBestByTopic: { html: 0, css: 0, javascript: 0, ...(parsed.quizBestByTopic || {}) },
        blanksBestByTopic: { html: 0, css: 0, javascript: 0, ...(parsed.blanksBestByTopic || {}) }
      };
    } catch {
      return {
        courses: { html: false, css: false, javascript: false, python: false, java: false, cpp: false },
        quizBest: 0,
        quizAttempts: 0,
        blanksCompleted: false,
        blanksAttempts: 0,
        playgroundUsed: false,
        themeToggled: false,
        visited: [],
        quizBestByTopic: { html: 0, css: 0, javascript: 0 },
        blanksBestByTopic: { html: 0, css: 0, javascript: 0 }
      };
    }
  }

  function saveProgress(state) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    renderProgress();
  }

  /* ---------- Certificates: unlocked once a topic's best quiz AND
     best fill-in-the-blanks score are both at least 50% ---------- */
  const CERT_COURSES = [
    { id: 'html', label: 'HTML', icon: '📘' },
    { id: 'css', label: 'CSS', icon: '🎨' },
    { id: 'javascript', label: 'JavaScript', icon: '⚙️' }
  ];
  const CERT_PASS_MARK = 50;

  function isCertUnlocked(state, topic) {
    const q = (state.quizBestByTopic && state.quizBestByTopic[topic]) || 0;
    const b = (state.blanksBestByTopic && state.blanksBestByTopic[topic]) || 0;
    return q >= CERT_PASS_MARK && b >= CERT_PASS_MARK;
  }

  const BADGES = [
    { id: 'starter', icon: '🔨', name: 'Getting Started', check: s => Object.values(s.courses).some(Boolean) },
    { id: 'allcourses', icon: '🎓', name: 'All Courses', check: s => Object.values(s.courses).every(Boolean) },
    { id: 'quizmaster', icon: '🏆', name: 'Quiz Master', check: s => s.quizBest >= 80 },
    { id: 'perfectionist', icon: '💯', name: 'Perfectionist', check: s => s.quizBest === 100 },
    { id: 'blanks', icon: '✏️', name: 'Blank Filler', check: s => s.blanksCompleted },
    { id: 'playground', icon: '⚡', name: 'Code Runner', check: s => s.playgroundUsed },
    { id: 'nightowl', icon: '🌙', name: 'Night Owl', check: s => s.themeToggled },
    { id: 'dedicated', icon: '🔥', name: 'Dedicated Learner', check: s => s.quizAttempts >= 5 },
    { id: 'marathon', icon: '🎯', name: 'Marathon Runner', check: s => s.blanksAttempts >= 5 },
    { id: 'explorer', icon: '🧭', name: 'Explorer', check: s => EXPLORABLE_SECTIONS.every(sec => s.visited.includes(sec)) },
    { id: 'certified', icon: '🏅', name: 'Certified', check: s => CERT_COURSES.some(c => isCertUnlocked(s, c.id)) }
  ];

  let earnedIds = new Set();

  function animateStat(el, endValue, suffix = '') {
    const startValue = Number(el.dataset.value || 0);
    const duration = 500;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      el.textContent = `${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else el.dataset.value = String(endValue);
    }
    requestAnimationFrame(tick);
  }

  function renderProgress() {
    const state = loadProgress();

    const startedCount = Object.values(state.courses).filter(Boolean).length;
    const statCourses = $('#statCourses');
    if (statCourses) {
      statCourses.dataset.value = statCourses.dataset.value || '0';
      animateStat(statCourses, startedCount, '/6');
    }

    const statQuiz = $('#statQuiz');
    if (statQuiz) {
      statQuiz.dataset.value = statQuiz.dataset.value || '0';
      animateStat(statQuiz, state.quizBest, '%');
    }

    const earnedCount = BADGES.filter(b => b.check(state)).length;
    const statBadges = $('#statBadges');
    if (statBadges) {
      statBadges.dataset.value = statBadges.dataset.value || '0';
      animateStat(statBadges, earnedCount, `/${BADGES.length}`);
    }

    const grid = $('#badgeGrid');
    if (grid) {
      grid.innerHTML = '';

      BADGES.forEach(b => {
        const earned = b.check(state);

        const el = document.createElement('div');
        el.className = `badge${earned ? ' earned' : ''}`;
        if (earned && !earnedIds.has(b.id)) el.classList.add('badge-pop');
        el.title = earned ? `Earned: ${b.name}` : `Locked: ${b.name}`;

        const iconEl = document.createElement('span');
        iconEl.className = 'badge-icon';
        iconEl.textContent = b.icon;

        const nameEl = document.createElement('span');
        nameEl.className = 'badge-name';
        nameEl.textContent = b.name;

        el.append(iconEl, nameEl);
        grid.appendChild(el);
      });
    }

    earnedIds = new Set(BADGES.filter(b => b.check(state)).map(b => b.id));

    $$('.course-card').forEach(card => {
      const course = card.dataset.course;
      card.classList.toggle('completed', !!state.courses[course]);
    });

    renderCertificates(state);
  }

  function renderCertificates(state) {
    const grid = $('#certGrid');
    if (!grid) return;
    grid.innerHTML = '';

    CERT_COURSES.forEach(course => {
      const quizPct = (state.quizBestByTopic && state.quizBestByTopic[course.id]) || 0;
      const blanksPct = (state.blanksBestByTopic && state.blanksBestByTopic[course.id]) || 0;
      const unlocked = isCertUnlocked(state, course.id);

      const card = document.createElement('div');
      card.className = `cert-card${unlocked ? ' unlocked' : ''}`;

      const iconEl = document.createElement('span');
      iconEl.className = 'cert-card-icon';
      iconEl.textContent = unlocked ? '🏅' : '🔒';

      const nameEl = document.createElement('h3');
      nameEl.textContent = `${course.label} Certificate`;

      const detailEl = document.createElement('p');
      detailEl.className = 'cert-card-detail';
      detailEl.textContent = `Quiz: ${quizPct}% · Blanks: ${blanksPct}% (need ${CERT_PASS_MARK}%+ each)`;

      const btn = document.createElement('button');
      btn.className = unlocked ? 'startBtn' : 'ghostBtn';
      btn.textContent = unlocked ? 'View & Download' : 'Locked';
      btn.disabled = !unlocked;
      if (unlocked) btn.addEventListener('click', () => openCertModal(course));

      card.append(iconEl, nameEl, detailEl, btn);
      grid.appendChild(card);
    });
  }

  $('#resetProgressBtn')?.addEventListener('click', () => {
    localStorage.removeItem(PROGRESS_KEY);
    earnedIds = new Set();
    renderProgress();
    showToast('Progress reset.', 'info');
  });

  /* ============================================================
     Certificate modal — canvas-rendered, downloadable as PNG
     ============================================================ */
  const CERT_NAME_KEY = 'forge_cert_name';
  const certModal = $('#certModal');
  const certCanvas = $('#certCanvas');
  const certNameInput = $('#certNameInput');
  let activeCertCourse = null;

  function drawCertificate(course, rawName) {
    if (!certCanvas) return;
    const ctx = certCanvas.getContext('2d');
    const w = certCanvas.width, h = certCanvas.height;
    const name = rawName.trim() || 'Frontend Forge Learner';

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#1e1a15');
    bgGrad.addColorStop(1, '#14110d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = '#ffb627';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 38, w - 76, h - 76);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffb627';
    ctx.font = '600 22px "Space Grotesk", sans-serif';
    ctx.fillText('⚒ FRONTEND FORGE', w / 2, 112);

    ctx.fillStyle = '#f5f0e8';
    ctx.font = '700 46px "Space Grotesk", sans-serif';
    ctx.fillText('Certificate of Completion', w / 2, 190);

    ctx.fillStyle = '#9a9184';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('This certifies that', w / 2, 250);

    ctx.fillStyle = '#ff6b35';
    ctx.font = '700 40px "Space Grotesk", sans-serif';
    ctx.fillText(name, w / 2, 320);

    ctx.fillStyle = '#9a9184';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('has successfully completed the', w / 2, 370);

    ctx.fillStyle = '#f5f0e8';
    ctx.font = '700 32px "Space Grotesk", sans-serif';
    ctx.fillText(`${course.label} Course`, w / 2, 418);

    ctx.fillStyle = '#6b6357';
    ctx.font = '16px Inter, sans-serif';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`Awarded ${dateStr}`, w / 2, 470);

    ctx.strokeStyle = '#38311f';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 140, 560);
    ctx.lineTo(w / 2 + 140, 560);
    ctx.stroke();

    ctx.fillStyle = '#9a9184';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Frontend Forge · Keep Building', w / 2, 585);
  }

  function openCertModal(course) {
    activeCertCourse = course;
    certModal?.classList.remove('hidden');
    const titleEl = $('#certModalTitle');
    if (titleEl) titleEl.textContent = `${course.label} Certificate`;

    const savedName = localStorage.getItem(CERT_NAME_KEY) || '';
    if (certNameInput) certNameInput.value = savedName;

    const render = () => drawCertificate(course, certNameInput ? certNameInput.value : '');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    else render();
  }

  function closeCertModal() {
    certModal?.classList.add('hidden');
  }

  certNameInput?.addEventListener('input', () => {
    localStorage.setItem(CERT_NAME_KEY, certNameInput.value);
    if (activeCertCourse) drawCertificate(activeCertCourse, certNameInput.value);
  });

  $('#certModalClose')?.addEventListener('click', closeCertModal);
  certModal?.addEventListener('click', (e) => {
    if (e.target === certModal) closeCertModal();
  });

  $('#certDownloadBtn')?.addEventListener('click', () => {
    if (!activeCertCourse || !certCanvas) return;
    const link = document.createElement('a');
    link.download = `frontend-forge-${activeCertCourse.id}-certificate.png`;
    link.href = certCanvas.toDataURL('image/png');
    link.click();
    showToast('Certificate downloaded!', 'success');
  });

  /* ============================================================
     Course buttons
     ============================================================ */
  $$('.courseBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = btn.dataset.course;
      const state = loadProgress();
      const alreadyStarted = state.courses[course];
      state.courses[course] = true;
      saveProgress(state);

      const label = course === 'javascript' ? 'JavaScript' : course.toUpperCase();
      showToast(
        alreadyStarted ? `Back to ${label} — pick up where you left off.` : `${label} course started!`,
        'success'
      );
    });
  });

  /* ============================================================
     Playground
     ============================================================ */
  const openPlaygroundBtn = $('#openPlaygroundBtn');
  const playgroundEditor = $('#playgroundEditor');
  const previewFrame = $('#previewFrame');
  const runCodeBtn = $('#runCodeBtn');
  const resetCodeBtn = $('#resetCodeBtn');
  const consoleOutput = $('#playgroundConsole');

  // Starter code for the three compiler languages (separate from the
  // HTML/CSS/JS trio, which are combined into one live preview instead).
  const COMPILER_DEFAULTS = {
    python: `print("Hello, Forge!")\n\nfor i in range(3):\n    print("Counting:", i)`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Forge!");\n    }\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Forge!" << endl;\n    return 0;\n}`
  };

  const DEFAULT_CODE = {
    html: `<h1>Hello, Forge!</h1>\n<p>Edit the HTML, CSS and JS tabs, then hit Run.</p>\n<button id="demoBtn">Click me</button>`,
    css: `body {\n  font-family: sans-serif;\n  color: #ff6b35;\n  padding: 1rem;\n}\n\nbutton {\n  cursor: pointer;\n}`,
    js: `console.log('Playground ready');\n\ndocument.getElementById('demoBtn').addEventListener('click', () => {\n  console.log('Button clicked!');\n});`
  };

  /* Curated starter snippets for the "Load example" picker — each one
     demonstrates a different everyday pattern (DOM updates, a small
     app, a pure-CSS interaction, a timer) so newcomers have somewhere
     more interesting to start from than a blank editor. */
  const PLAYGROUND_EXAMPLES = {
    starter: { label: 'Starter', ...DEFAULT_CODE },

    colorGenerator: {
      label: 'Color Generator',
      html: `<div class="swatch" id="swatch"></div>\n<p id="hexLabel">#000000</p>\n<button id="genBtn">New Color</button>`,
      css: `body {\n  font-family: sans-serif;\n  text-align: center;\n  padding: 2rem 1rem;\n}\n.swatch {\n  width: 140px;\n  height: 140px;\n  margin: 0 auto 1rem;\n  border-radius: 16px;\n  background: #222;\n  box-shadow: 0 10px 24px rgba(0,0,0,0.18);\n  transition: background 0.3s ease;\n}\n#hexLabel {\n  font-family: monospace;\n  letter-spacing: 0.05em;\n  margin-bottom: 1rem;\n}\nbutton {\n  padding: 10px 22px;\n  border: none;\n  border-radius: 8px;\n  background: #ff6b35;\n  color: #fff;\n  font-weight: 600;\n  cursor: pointer;\n}\nbutton:hover { background: #ffb627; }`,
      js: `const swatch = document.getElementById('swatch');\nconst label = document.getElementById('hexLabel');\nconst genBtn = document.getElementById('genBtn');\n\nfunction randomHex() {\n  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');\n  return '#' + hex;\n}\n\nfunction setColor() {\n  const color = randomHex();\n  swatch.style.background = color;\n  label.textContent = color;\n  console.log('New color:', color);\n}\n\ngenBtn.addEventListener('click', setColor);\nsetColor();`
    },

    todoList: {
      label: 'To-Do List',
      html: `<div class="todo">\n  <input id="todoInput" type="text" placeholder="Add a task...">\n  <button id="addBtn">Add</button>\n  <ul id="todoList"></ul>\n</div>`,
      css: `body { font-family: sans-serif; padding: 2rem 1rem; max-width: 320px; margin: 0 auto; }\n.todo { display: flex; flex-wrap: wrap; gap: 8px; }\ninput { flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }\nbutton { padding: 8px 14px; border: none; border-radius: 6px; background: #ff6b35; color: #fff; font-weight: 600; cursor: pointer; }\nul { list-style: none; padding: 0; width: 100%; margin-top: 14px; }\nli { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; background: #f2f2f2; border-radius: 6px; margin-bottom: 6px; }\nli.done span { text-decoration: line-through; color: #999; }\nli button { background: transparent; color: #d33; font-size: 0.78rem; padding: 2px 8px; }`,
      js: `const input = document.getElementById('todoInput');\nconst addBtn = document.getElementById('addBtn');\nconst list = document.getElementById('todoList');\n\nfunction addTodo() {\n  const text = input.value.trim();\n  if (!text) return;\n\n  const li = document.createElement('li');\n  const span = document.createElement('span');\n  span.textContent = text;\n  span.addEventListener('click', () => li.classList.toggle('done'));\n\n  const removeBtn = document.createElement('button');\n  removeBtn.textContent = 'Remove';\n  removeBtn.addEventListener('click', () => li.remove());\n\n  li.append(span, removeBtn);\n  list.appendChild(li);\n  input.value = '';\n  console.log('Added task:', text);\n}\n\naddBtn.addEventListener('click', addTodo);\ninput.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') addTodo();\n});`
    },

    flipCard: {
      label: 'Flip Card',
      html: `<div class="card" id="flipCard">\n  <div class="face front">Hover me</div>\n  <div class="face back">Flipped!</div>\n</div>`,
      css: `body { font-family: sans-serif; display: flex; justify-content: center; padding: 3rem 1rem; }\n.card { width: 160px; height: 160px; position: relative; perspective: 800px; }\n.face {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 14px;\n  font-weight: 600;\n  color: #fff;\n  text-align: center;\n  backface-visibility: hidden;\n  transition: transform 0.6s ease;\n}\n.front { background: linear-gradient(135deg, #ff6b35, #ffb627); }\n.back { background: linear-gradient(135deg, #6a4cff, #35c1ff); transform: rotateY(180deg); }\n.card:hover .front { transform: rotateY(180deg); }\n.card:hover .back { transform: rotateY(360deg); }`,
      js: `console.log('Hover the card — the flip is pure CSS (transform + perspective), no JS required.');`
    },

    countdownTimer: {
      label: 'Countdown Timer',
      html: `<div class="timer">\n  <h2 id="display">00:10</h2>\n  <button id="startBtn">Start</button>\n  <button id="resetBtn">Reset</button>\n</div>`,
      css: `body { font-family: sans-serif; text-align: center; padding: 3rem 1rem; }\nh2 { font-size: 3rem; font-variant-numeric: tabular-nums; margin-bottom: 1rem; }\nbutton { padding: 10px 18px; margin: 0 6px; border: none; border-radius: 8px; background: #ff6b35; color: #fff; font-weight: 600; cursor: pointer; }\nbutton:hover { background: #ffb627; }`,
      js: `const display = document.getElementById('display');\nconst startBtn = document.getElementById('startBtn');\nconst resetBtn = document.getElementById('resetBtn');\n\nlet seconds = 10;\nlet timerId = null;\n\nfunction render() {\n  const m = String(Math.floor(seconds / 60)).padStart(2, '0');\n  const s = String(seconds % 60).padStart(2, '0');\n  display.textContent = m + ':' + s;\n}\n\nfunction tick() {\n  seconds--;\n  render();\n  if (seconds <= 0) {\n    clearInterval(timerId);\n    timerId = null;\n    console.log('Time is up!');\n  }\n}\n\nstartBtn.addEventListener('click', () => {\n  if (timerId) return;\n  timerId = setInterval(tick, 1000);\n});\n\nresetBtn.addEventListener('click', () => {\n  clearInterval(timerId);\n  timerId = null;\n  seconds = 10;\n  render();\n});\n\nrender();`
    }
  };

  const exampleSelect = $('#exampleSelect');

  /* ---------- Pane bookkeeping shared by the Web (HTML/CSS/JS) tabs
     and the three standalone compiler languages ---------- */
  const PANE_ID = { html: 'editHtml', css: 'editCss', js: 'editJs', python: 'editPython', java: 'editJava', cpp: 'editCpp' };
  const MONACO_LANG = { html: 'html', css: 'css', js: 'javascript', python: 'python', java: 'java', cpp: 'cpp' };
  const LANG_LABELS = { python: 'Python', java: 'Java', cpp: 'C++' };

  let currentPlaygroundMode = 'web'; // 'web' | 'python' | 'java' | 'cpp'
  let lastWebTab = 'html';

  function getPaneValue(key) {
    if (monacoEditors[key]) return monacoEditors[key].getValue();
    const ta = $(`#${PANE_ID[key]}`);
    return ta ? ta.value : '';
  }

  function setPaneValue(key, code) {
    if (monacoEditors[key]) monacoEditors[key].setValue(code);
    const ta = $(`#${PANE_ID[key]}`);
    if (ta) ta.value = code;
  }

  function showPane(key) {
    Object.keys(PANE_ID).forEach(k => {
      $(`#${PANE_ID[k]}`)?.classList.remove('active');
      document.getElementById(`${PANE_ID[k]}Monaco`)?.classList.remove('active');
    });
    $(`#${PANE_ID[key]}`)?.classList.add('active');
    document.getElementById(`${PANE_ID[key]}Monaco`)?.classList.add('active');
    monacoEditors[key]?.layout();
  }

  /* ---------- Monaco Editor — lazy-loaded the first time the Playground
     opens, so it never slows down the rest of the site. Each language
     gets its own persistent editor instance mounted over its fallback
     textarea; if the CDN can't be reached the textareas keep working. ---------- */
  const monacoEditors = {};
  let monacoLoadStarted = false;

  function mountMonacoEditor(key) {
    const ta = $(`#${PANE_ID[key]}`);
    if (!ta || monacoEditors[key]) return;

    const host = document.createElement('div');
    host.className = `editor-pane monaco-host${ta.classList.contains('active') ? ' active' : ''}`;
    host.id = `${PANE_ID[key]}Monaco`;
    ta.insertAdjacentElement('afterend', host);
    ta.classList.add('hidden');

    const editor = monaco.editor.create(host, {
      value: ta.value,
      language: MONACO_LANG[key],
      theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vs-dark',
      automaticLayout: false,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      // The editor host sits inside .playground-editor, which clips overflow
      // for its rounded-corner/box-shadow chrome. Without this, Monaco's
      // suggestion/hover/parameter-hint widgets get cut off at that boundary
      // instead of floating above the rest of the page.
      fixedOverflowWidgets: true
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCurrentPlayground());
    monacoEditors[key] = editor;
  }

  function loadMonaco() {
    if (monacoLoadStarted || typeof require === 'undefined' || !require.config) return;

    // On phones/tablets with no real keyboard, the plain text areas are more
    // reliable to type in than Monaco (native autocorrect, no fiddly small
    // touch targets for its gutter/scrollbars) — so skip the CDN entirely there.
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouchDevice) return;

    monacoLoadStarted = true;

    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
      Object.keys(PANE_ID).forEach(mountMonacoEditor);
      const activeKey = currentPlaygroundMode === 'web' ? lastWebTab : currentPlaygroundMode;
      monacoEditors[activeKey]?.layout();
    }, () => {
      showToast('Could not load the code editor from the CDN — falling back to plain text areas.', 'info');
    });
  }

  function switchPlaygroundMode(mode) {
    currentPlaygroundMode = mode;
    $$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

    const isWeb = mode === 'web';
    $('#webSubTabs')?.classList.toggle('hidden', !isWeb);
    previewFrame?.classList.toggle('hidden', !isWeb);
    exampleSelect?.classList.toggle('hidden', !isWeb);

    const label = $('#consolePanelLabel');
    if (label) label.textContent = isWeb ? 'Console' : 'Output';

    showPane(isWeb ? lastWebTab : mode);
    clearConsole();

    if (isWeb) {
      runPlayground();
    } else {
      logToConsole(
  'log',
  [`${LANG_LABELS[mode]} runs through a public code-execution API (Wandbox) — click Run.`]
);
    }
  }

  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPlaygroundMode(btn.dataset.mode));
  });

  openPlaygroundBtn?.addEventListener('click', () => {
    const isHidden = playgroundEditor.classList.toggle('hidden');
    openPlaygroundBtn.textContent = isHidden ? 'Open Playground' : 'Close Playground';
    if (!isHidden) {
      playgroundEditor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      loadMonaco();
      if (currentPlaygroundMode === 'web') runPlayground();
    }
  });

  $$('#webSubTabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#webSubTabs .tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      lastWebTab = tab.dataset.tab;
      showPane(lastWebTab);
    });
  });

  // Keep the active Monaco editor correctly sized through device rotation
  // or the browser window being resized (automaticLayout is off for
  // performance, so this is done by hand, debounced).
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeKey = currentPlaygroundMode === 'web' ? lastWebTab : currentPlaygroundMode;
      monacoEditors[activeKey]?.layout();
    }, 150);
  });

  function clearConsole() {
    if (consoleOutput) consoleOutput.innerHTML = '';
  }

  function logToConsole(level, args) {
    if (!consoleOutput) return;
    const line = document.createElement('div');
    line.className = `console-line console-${level}`;

    const badge = document.createElement('span');
    badge.className = 'console-badge';
    badge.textContent = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';

    const msg = document.createElement('span');
    msg.className = 'console-msg';
    msg.textContent = args.join(' ');

    line.append(badge, msg);
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  // Listen for console/error messages relayed from the sandboxed iframe
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'forge-playground') return;
    if (e.data.type === 'console') logToConsole(e.data.level, e.data.args);
    if (e.data.type === 'error') logToConsole('error', [e.data.message]);
  });

  // Injected into every preview doc so console calls and runtime errors
  // are relayed to the parent page's console panel instead of vanishing.
  const CONSOLE_BRIDGE = `
    <script>
      (function() {
        const post = (type, payload) => parent.postMessage(Object.assign({ source: 'forge-playground', type }, payload), '*');
        ['log', 'warn', 'error'].forEach(level => {
          const original = console[level];
          console[level] = function(...args) {
            post('console', { level, args: args.map(a => {
              try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
              catch { return String(a); }
            }) });
            original.apply(console, args);
          };
        });
        window.addEventListener('error', (e) => post('error', { message: e.message }));
      })();
    <\/script>
  `;

  function runPlayground() {
    const html = getPaneValue('html');
    const css = getPaneValue('css');
    const js = getPaneValue('js');

    clearConsole();

    const doc = `<!DOCTYPE html><html><head>${CONSOLE_BRIDGE}<style>${css}</style></head><body>${html}<script>
      try {
        ${js}
      } catch (err) {
        parent.postMessage({ source: 'forge-playground', type: 'error', message: err.message }, '*');
      }
    <\/script></body></html>`;
    previewFrame.srcdoc = doc;
    markPlaygroundUsed();
  }

  function markPlaygroundUsed() {
    const state = loadProgress();
    if (!state.playgroundUsed) {
      state.playgroundUsed = true;
      saveProgress(state);
      showToast('Badge earned: Code Runner ⚡', 'success');
    }
  }

  /* ---------- Python / Java / C++ — executed through Wandbox ----------
   The previous Piston API was returning HTTP 401 Unauthorized.
   Wandbox is used here instead for browser-based educational execution.
   ------------------------------------------------------------------- */

const WANDBOX_LIST_URL = 'https://wandbox.org/api/list.json';
const WANDBOX_EXECUTE_URL = 'https://wandbox.org/api/compile.json';

let wandboxCompilers = null;

/* ============================================================
   Get available Wandbox compilers
   ============================================================ */

async function getWandboxCompilers() {
  if (wandboxCompilers) {
    return wandboxCompilers;
  }

  const response = await fetch(WANDBOX_LIST_URL, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `Compiler list request failed (${response.status})`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid compiler list received from Wandbox');
  }

  wandboxCompilers = data;

  return wandboxCompilers;
}


/* ============================================================
   Select a suitable compiler
   ============================================================ */

function chooseWandboxCompiler(language, compilers) {

  const languageName = {
    python: 'Python',
    java: 'Java',
    cpp: 'C++'
  }[language];

  const candidates = compilers.filter(
    compiler =>
      compiler &&
      compiler.language === languageName
  );

  if (!candidates.length) {
    throw new Error(
      `Wandbox does not currently provide a ${LANG_LABELS[language]} compiler`
    );
  }

  /* ---------- Python ---------- */

  if (language === 'python') {

    const preferred = candidates.find(
      compiler =>
        /python3|cpython.*3/i.test(compiler.name) &&
        !/pypy/i.test(compiler.name)
    );

    if (preferred) {
      return preferred;
    }
  }


  /* ---------- Java ---------- */

  if (language === 'java') {

    const preferred = candidates.find(
      compiler => /java/i.test(compiler.name)
    );

    if (preferred) {
      return preferred;
    }
  }


  /* ---------- C++ ---------- */

  if (language === 'cpp') {

    const gccCompiler = candidates.find(
      compiler => /gcc/i.test(compiler.name)
    );

    if (gccCompiler) {
      return gccCompiler;
    }

    const clangCompiler = candidates.find(
      compiler => /clang/i.test(compiler.name)
    );

    if (clangCompiler) {
      return clangCompiler;
    }
  }


  /* ---------- Fallback ---------- */

  return candidates[0];
}


/* ============================================================
   Add output lines to playground console
   ============================================================ */

function addOutputLines(text, level) {

  if (!text) {
    return false;
  }

  const cleaned = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n$/, '');

  if (!cleaned.trim()) {
    return false;
  }

  cleaned.split('\n').forEach(line => {
    logToConsole(level, [line]);
  });

  return true;
}


/* ============================================================
   Run Python / Java / C++
   ============================================================ */

async function runCompiledCode(language) {

  let code = getPaneValue(language);

  clearConsole();

  logToConsole(
    'log',
    [`Running ${LANG_LABELS[language]}...`]
  );


  /* ============================================================
     EMPTY CODE
     ============================================================ */

  if (!code.trim()) {

    logToConsole(
      'error',
      ['The editor is empty. Write some code first.']
    );

    return;
  }


  try {

    /* ==========================================================
       JAVA FIX

       Wandbox uses a generated filename such as prog.java.

       Therefore:

           public class Main

       causes:

           class Main is public, should be declared in a
           file named Main.java

       We remove "public" from the Main class automatically.

       The code shown in the editor is NOT changed.
       ========================================================== */

    if (language === 'java') {

      code = code.replace(
        /\bpublic\s+(?=(?:final\s+|abstract\s+)?class\s+Main\b)/,
        ''
      );

    }


    /* ==========================================================
       STEP 1 — GET COMPILER LIST
       ========================================================== */

    const compilers =
      await getWandboxCompilers();


    /* ==========================================================
       STEP 2 — SELECT COMPILER
       ========================================================== */

    const compiler =
      chooseWandboxCompiler(
        language,
        compilers
      );


    logToConsole(
      'log',
      [`Compiler: ${compiler.name}`]
    );


    /* ==========================================================
       STEP 3 — SEND CODE TO WANDBOX
       ========================================================== */

    const response =
      await fetch(
        WANDBOX_EXECUTE_URL,
        {
          method: 'POST',

          mode: 'cors',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            compiler:
              compiler.name,

            code:
              code,

            stdin:
              ''

          })

        }
      );


    /* ==========================================================
       STEP 4 — READ RESPONSE
       ========================================================== */

    const data =
      await response
        .json()
        .catch(() => null);


    /* ==========================================================
       STEP 5 — HANDLE HTTP ERROR
       ========================================================== */

    if (!response.ok) {

      const serverMessage =
        data?.message ||
        data?.error ||
        data?.compiler_error ||
        '';

      throw new Error(

        serverMessage ||
        `Server responded ${response.status}`

      );

    }


    /* ==========================================================
       STEP 6 — CLEAR RUNNING MESSAGE
       ========================================================== */

    clearConsole();


    /* ==========================================================
       STEP 7 — GET COMPILER OUTPUT
       ========================================================== */

    const compileOutput =
      data?.compiler_output || '';

    const compileError =
      data?.compiler_error || '';

    const compilerMessage =
      data?.compiler_message || '';

    const programOutput =
      data?.program_output || '';

    const programMessage =
      data?.program_message || '';


    /* ==========================================================
       STEP 8 — SHOW COMPILER ERRORS
       ========================================================== */

    if (compileError.trim()) {

      addOutputLines(
        compileError,
        'error'
      );

    }


    /* ==========================================================
       STEP 9 — SHOW COMPILER MESSAGES
       ========================================================== */

    if (
      compilerMessage.trim() &&
      compilerMessage.trim() !== compileError.trim()
    ) {

      addOutputLines(
        compilerMessage,
        'log'
      );

    }


    /* ==========================================================
       STEP 10 — SHOW COMPILER OUTPUT
       ========================================================== */

    if (
      compileOutput.trim() &&
      compileOutput.trim() !== compileError.trim() &&
      compileOutput.trim() !== compilerMessage.trim()
    ) {

      addOutputLines(
        compileOutput,
        'log'
      );

    }


    /* ==========================================================
       STEP 11 — SHOW PROGRAM OUTPUT
       ========================================================== */

    if (programOutput.trim()) {

      addOutputLines(
        programOutput,
        'log'
      );

    }


    /* ==========================================================
       STEP 12 — SHOW PROGRAM MESSAGE
       ========================================================== */

    if (
      programMessage.trim() &&
      programMessage.trim() !== programOutput.trim()
    ) {

      addOutputLines(
        programMessage,
        'log'
      );

    }


    /* ==========================================================
       STEP 13 — NO OUTPUT
       ========================================================== */

    const hasOutput =
      compileOutput.trim() ||
      compileError.trim() ||
      compilerMessage.trim() ||
      programOutput.trim() ||
      programMessage.trim();


    if (!hasOutput) {

      logToConsole(
        'log',
        ['Program finished successfully with no output.']
      );

    }


    /* ==========================================================
       PLAYGROUND PROGRESS
       ========================================================== */

    markPlaygroundUsed();


  } catch (error) {

    clearConsole();

    logToConsole(
      'error',
      [
        error?.message ||
        'Could not execute the code.'
      ]
    );

  }

}


/* ============================================================
   Run currently selected playground
   ============================================================ */

function runCurrentPlayground() {

  if (currentPlaygroundMode === 'web') {

    runPlayground();

  } else {

    runCompiledCode(
      currentPlaygroundMode
    );
  }
}


/* ============================================================
   Run button
   ============================================================ */

runCodeBtn?.addEventListener(
  'click',
  runCurrentPlayground
);


/* ============================================================
   Reset button
   ============================================================ */

resetCodeBtn?.addEventListener(
  'click',
  () => {

    if (currentPlaygroundMode === 'web') {

      setPaneValue(
        'html',
        DEFAULT_CODE.html
      );

      setPaneValue(
        'css',
        DEFAULT_CODE.css
      );

      setPaneValue(
        'js',
        DEFAULT_CODE.js
      );

      if (exampleSelect) {
        exampleSelect.value = 'starter';
      }

      runPlayground();

    } else {

      setPaneValue(
        currentPlaygroundMode,
        COMPILER_DEFAULTS[currentPlaygroundMode]
      );

      clearConsole();
    }

    showToast(
      'Playground reset to defaults.',
      'info'
    );
  }
);


/* ============================================================
   Example selector
   ============================================================ */

exampleSelect?.addEventListener(
  'change',
  () => {

    const example =
      PLAYGROUND_EXAMPLES[exampleSelect.value];

    if (!example) {
      return;
    }

    setPaneValue(
      'html',
      example.html
    );

    setPaneValue(
      'css',
      example.css
    );

    setPaneValue(
      'js',
      example.js
    );

    runPlayground();

    showToast(
      `Loaded example: ${example.label}`,
      'info'
    );
  }
);


/* ============================================================
   Ctrl + Enter / Cmd + Enter
   ============================================================ */

$$('.editor-pane').forEach(pane => {

  if (pane.tagName !== 'TEXTAREA') {
    return;
  }

  pane.addEventListener(
    'keydown',
    event => {

      /* ---------- Run ---------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'Enter'
      ) {

        event.preventDefault();

        runCurrentPlayground();

        return;
      }


      /* ---------- Tab indentation ---------- */

      if (event.key === 'Tab') {

        event.preventDefault();

        const start =
          pane.selectionStart;

        const end =
          pane.selectionEnd;

        pane.value =
          pane.value.slice(0, start) +
          '  ' +
          pane.value.slice(end);

        pane.selectionStart =
          pane.selectionEnd =
          start + 2;
      }

    }
  );

});

  /* ============================================================
     Topic filter — narrows MCQ Quiz + Fill in the Blanks to one
     course, or "all" for the original mixed pool
     ============================================================ */
  let currentTopic = 'all';
  const topicPills = $$('.topic-pill');
  const TOPIC_LABELS = { all: 'All', html: 'HTML', css: 'CSS', javascript: 'JavaScript' };

  function setTopic(topic) {
    currentTopic = topic;
    topicPills.forEach(p => p.classList.toggle('active', p.dataset.topic === topic));
  }

  topicPills.forEach(pill => {
    pill.addEventListener('click', () => setTopic(pill.dataset.topic));
  });

  // Arriving from a course page's "Start Practicing ___" button pre-selects
  // that topic and scrolls straight to the practice zone.
  const practiceParam = new URLSearchParams(window.location.search).get('practice');
  if (['html', 'css', 'javascript'].includes(practiceParam)) {
    setTopic(practiceParam);
    $('#quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Practicing ${TOPIC_LABELS[practiceParam]} — pick MCQ Quiz or Fill in the Blanks below.`, 'info');
  }

  // Arriving from a course page's "Open ___ Playground" button opens the
  // Playground pre-set to that language's compiler mode.
  const modeParam = new URLSearchParams(window.location.search).get('mode');
  if (['python', 'java', 'cpp'].includes(modeParam)) {
    playgroundEditor?.classList.remove('hidden');
    if (openPlaygroundBtn) openPlaygroundBtn.textContent = 'Close Playground';
    switchPlaygroundMode(modeParam);
    loadMonaco();
    $('#playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ============================================================
     MCQ Quiz — large question pool, randomized each attempt
     ============================================================ */
  const QUIZ_QUESTIONS_HTML = [
    { q: 'Which HTML tag is used to link an external stylesheet?', options: ['<style>', '<link>', '<script>', '<css>'], answer: 1 },
    { q: 'Which attribute specifies alternate text for an image?', options: ['title', 'alt', 'src', 'label'], answer: 1 },
    { q: 'Which tag defines the largest heading?', options: ['<h6>', '<heading>', '<h1>', '<head>'], answer: 2 },
    { q: 'Which tag inserts a single line break?', options: ['<break>', '<lb>', '<br>', '<newline>'], answer: 2 },
    { q: 'Which attribute makes a form input mandatory?', options: ['mandatory', 'required', 'validate', 'needed'], answer: 1 },
    { q: 'Which element is used to group related form controls?', options: ['<group>', '<fieldset>', '<section>', '<formgroup>'], answer: 1 },
    { q: 'What is the correct HTML5 doctype declaration?', options: ['<!DOCTYPE html5>', '<!DOCTYPE HTML PUBLIC>', '<!DOCTYPE html>', '<html5>'], answer: 2 },
    { q: 'Which tag embeds a video in a page?', options: ['<media>', '<video>', '<movie>', '<embed>'], answer: 1 },
    { q: 'Which tag defines a section of navigation links?', options: ['<nav>', '<menu>', '<links>', '<navigation>'], answer: 0 },
    { q: 'Which attribute uniquely identifies an HTML element?', options: ['class', 'name', 'id', 'key'], answer: 2 },
    { q: 'Which tag creates an unordered list?', options: ['<ol>', '<list>', '<ul>', '<li>'], answer: 2 },
    { q: 'Which input type shows a date picker?', options: ['calendar', 'date', 'day', 'datetime'], answer: 1 },
    { q: 'Which tag represents the main content of a page?', options: ['<content>', '<body>', '<main>', '<primary>'], answer: 2 },
    { q: 'Which attribute makes a link open in a new tab?', options: ['target="_blank"', 'newtab="true"', 'open="new"', 'rel="new"'], answer: 0 },
    { q: 'Which tag defines a row in an HTML table?', options: ['<td>', '<tr>', '<row>', '<th>'], answer: 1 },
    { q: 'Which element represents a self-contained piece of content?', options: ['<section>', '<div>', '<article>', '<content>'], answer: 2 },
    { q: 'Which tag is used to embed an image?', options: ['<image>', '<img>', '<pic>', '<src>'], answer: 1 },
    { q: 'Which attribute specifies the source file of an image?', options: ['href', 'src', 'link', 'source'], answer: 1 },
    { q: 'Which tag creates a dropdown selection list?', options: ['<dropdown>', '<list>', '<select>', '<options>'], answer: 2 },
    { q: 'Which meta tag controls the responsive viewport?', options: ['<meta name="responsive">', '<meta name="viewport">', '<meta name="screen">', '<meta name="device">'], answer: 1 },
  ].map(q => ({ ...q, topic: 'html' }));

  const QUIZ_QUESTIONS_CSS = [
    { q: 'Which CSS property controls the space between content and its border?', options: ['margin', 'padding', 'spacing', 'border-gap'], answer: 1 },
    { q: 'Which CSS layout model is designed for one-dimensional row or column layouts?', options: ['Grid', 'Flexbox', 'Float', 'Table'], answer: 1 },
    { q: 'Which property changes text color?', options: ['text-color', 'font-color', 'color', 'foreground'], answer: 2 },
    { q: 'Which selector targets elements by class?', options: ['#classname', '.classname', '*classname', ':classname'], answer: 1 },
    { q: 'Which property rounds the corners of an element?', options: ['corner-radius', 'border-radius', 'round-corner', 'edge-radius'], answer: 1 },
    { q: 'Which value allows flex items to wrap onto new lines?', options: ['flex-wrap: wrap', 'flex-flow: multi', 'wrap: true', 'flex-break: wrap'], answer: 0 },
    { q: 'Which property sets the size of text?', options: ['text-size', 'font-size', 'size', 'font-scale'], answer: 1 },
    { q: 'Which CSS unit is relative to the root element\u2019s font size?', options: ['em', 'px', 'rem', 'vh'], answer: 2 },
    { q: 'Which property hides an element but still keeps its layout space?', options: ['display: none', 'visibility: hidden', 'opacity: none', 'hide: true'], answer: 1 },
    { q: 'Which pseudo-class targets an element when the mouse is over it?', options: [':active', ':hover', ':focus', ':target'], answer: 1 },
    { q: 'Which property sets a background image?', options: ['background-src', 'image-source', 'background-image', 'bg-img'], answer: 2 },
    { q: 'Which display value removes an element completely, including its space?', options: ['display: none', 'visibility: hidden', 'opacity: 0', 'display: hide'], answer: 0 },
    { q: 'Which property controls the stacking order of positioned elements?', options: ['stack-order', 'layer', 'z-index', 'depth'], answer: 2 },
    { q: 'Which CSS layout system is designed for two-dimensional layouts?', options: ['Flexbox', 'Grid', 'Float', 'Inline-block'], answer: 1 },
    { q: 'Which property adds a shadow to a box element?', options: ['drop-shadow', 'box-shadow', 'element-shadow', 'shadow'], answer: 1 },
    { q: 'Which unit represents a percentage of the viewport width?', options: ['%', 'vw', 'vmin', 'em'], answer: 1 },
    { q: 'Which property controls spacing outside an element\u2019s border?', options: ['padding', 'margin', 'gap', 'outline'], answer: 1 },
    { q: 'Which selector targets the first child of its parent?', options: [':first-of-type', ':first-child', ':nth-child(0)', ':first'], answer: 1 },
    { q: 'Which property sets how long a CSS transition takes?', options: ['transition-speed', 'animation-duration', 'transition-duration', 'transition-time'], answer: 2 },
    { q: 'Which flexbox property centers items along the main axis?', options: ['align-items: center', 'justify-content: center', 'text-align: center', 'place-content: middle'], answer: 1 },
  ].map(q => ({ ...q, topic: 'css' }));

  const QUIZ_QUESTIONS_JS = [
    { q: 'Which method adds an item to the end of an array?', options: ['array.push()', 'array.pop()', 'array.shift()', 'array.append()'], answer: 0 },
    { q: 'What does DOM stand for?', options: ['Document Object Model', 'Data Object Method', 'Document Order Map', 'Dynamic Object Model'], answer: 0 },
    { q: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const var', 'global'], answer: 1 },
    { q: 'Which method converts a JSON string into a JavaScript object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.toObject()', 'Object.parse()'], answer: 1 },
    { q: 'Which operator checks for strict equality (value and type)?', options: ['==', '=', '===', '!='], answer: 2 },
    { q: 'Which method selects the first element matching a CSS selector?', options: ['getElementById()', 'querySelector()', 'getElementsByClass()', 'selectFirst()'], answer: 1 },
    { q: 'Which array method returns a new array with transformed elements?', options: ['forEach()', 'map()', 'filter()', 'reduce()'], answer: 1 },
    { q: 'Which keyword declares a constant that cannot be reassigned?', options: ['let', 'var', 'const', 'static'], answer: 2 },
    { q: 'Which method removes the last element from an array?', options: ['pop()', 'push()', 'shift()', 'splice(0)'], answer: 0 },
    { q: 'What does `typeof null` return in JavaScript?', options: ['"null"', '"undefined"', '"object"', '"number"'], answer: 2 },
    { q: 'Which method attaches an event listener to an element?', options: ['onEvent()', 'addEventListener()', 'bindEvent()', 'listen()'], answer: 1 },
    { q: 'Which method converts a JavaScript object into a JSON string?', options: ['JSON.parse()', 'JSON.stringify()', 'Object.toJSON()', 'JSON.toString()'], answer: 1 },
    { q: 'Which array method returns a new array containing only elements that pass a test?', options: ['map()', 'reduce()', 'filter()', 'find()'], answer: 2 },
    { q: 'Which keyword is used to declare a function?', options: ['func', 'function', 'def', 'lambda'], answer: 1 },
    { q: 'What does NaN stand for?', options: ['Not a Number', 'Null and Nil', 'No available Number', 'Not Assigned Number'], answer: 0 },
    { q: 'Which method removes the first element from an array?', options: ['pop()', 'shift()', 'unshift()', 'splice(-1)'], answer: 1 },
    { q: 'Which array method executes a function once for each element without returning a new array?', options: ['map()', 'filter()', 'forEach()', 'reduce()'], answer: 2 },
    { q: 'Which built-in object stores key-value pairs and remembers insertion order?', options: ['Set', 'Map', 'Object', 'Array'], answer: 1 },
    { q: 'Which method converts a string into an integer?', options: ['Number.toInt()', 'parseInt()', 'Integer.parse()', 'toNumber()'], answer: 1 },
    { q: 'Which array method combines all elements into a single value?', options: ['reduce()', 'map()', 'filter()', 'concat()'], answer: 0 }
  ].map(q => ({ ...q, topic: 'javascript' }));

  const QUIZ_QUESTIONS = [...QUIZ_QUESTIONS_HTML, ...QUIZ_QUESTIONS_CSS, ...QUIZ_QUESTIONS_JS];

  const QUIZ_QUESTION_COUNT = 10;

  const quizPanel = $('#quizPanel');
  let quizSet = [];
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  /* ---------- 10-minute countdown, auto-submits when it hits 0 ---------- */
  const QUIZ_TIME_LIMIT = 600; // seconds
  let quizTimeLeft = QUIZ_TIME_LIMIT;
  let quizTimerId = null;

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function buildTimerBar(idAttr, seconds) {
    const bar = document.createElement('div');
    bar.className = 'timer-bar';
    if (seconds <= 60) bar.classList.add('time-warning');
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '⏱';
    const time = document.createElement('span');
    time.id = idAttr;
    time.textContent = formatTime(seconds);
    bar.append(icon, time);
    return bar;
  }

  function stopQuizTimer() {
    if (quizTimerId) clearInterval(quizTimerId);
    quizTimerId = null;
  }

  function startQuizTimer() {
    stopQuizTimer();
    quizTimeLeft = QUIZ_TIME_LIMIT;
    quizTimerId = setInterval(() => {
      quizTimeLeft--;
      const display = $('#quizTimeDisplay');
      if (display) {
        display.textContent = formatTime(quizTimeLeft);
        display.closest('.timer-bar')?.classList.toggle('time-warning', quizTimeLeft <= 60);
      }
      if (quizTimeLeft <= 0) {
        stopQuizTimer();
        showToast("Time's up — submitting your quiz.", 'info');
        finishQuiz();
      }
    }, 1000);
  }

  function getQuizPool() {
    return currentTopic === 'all' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter(q => q.topic === currentTopic);
  }

  $('#startQuizBtn')?.addEventListener('click', () => {
    quizSet = pickRandom(getQuizPool(), QUIZ_QUESTION_COUNT);
    quizIndex = 0;
    quizScore = 0;
    quizPanel.classList.remove('hidden');
    $('#blanksPanel').classList.add('hidden');
    stopBlanksTimer();
    renderQuizQuestion();
    startQuizTimer();
    quizPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderQuizQuestion() {
    quizAnswered = false;
    const item = quizSet[quizIndex];
    // Shuffle option order (and track the new index of the correct answer) so
    // the same question doesn't always show the answer in the same slot.
    const optionOrder = shuffle(item.options.map((_, i) => i));
    const correctSlot = optionOrder.indexOf(item.answer);

    quizPanel.innerHTML = '';

    quizPanel.appendChild(buildTimerBar('quizTimeDisplay', quizTimeLeft));

    const progressEl = document.createElement('p');
    progressEl.className = 'q-progress';
    progressEl.textContent = `Question ${quizIndex + 1} of ${quizSet.length}`;
    quizPanel.appendChild(progressEl);

    const qText = document.createElement('p');
    qText.className = 'q-text';
    qText.textContent = item.q;
    quizPanel.appendChild(qText);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'q-options';

    optionOrder.forEach((originalIndex, slot) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'q-option';
      optBtn.textContent = item.options[originalIndex];
      optBtn.addEventListener('click', () => handleQuizAnswer(slot, optBtn, optionsWrap, correctSlot));
      optionsWrap.appendChild(optBtn);
    });

    quizPanel.appendChild(optionsWrap);
  }

  function handleQuizAnswer(selected, btnEl, optionsWrap, correctIndex) {
    if (quizAnswered) return;
    quizAnswered = true;

    $$('.q-option', optionsWrap).forEach((opt, i) => {
      opt.disabled = true;
      if (i === correctIndex) opt.classList.add('correct');
      else if (i === selected) opt.classList.add('incorrect');
    });

    if (selected === correctIndex) quizScore++;

    setTimeout(() => {
      if (quizIndex < quizSet.length - 1) {
        quizIndex++;
        renderQuizQuestion();
      } else {
        finishQuiz();
      }
    }, 900);
  }

  function finishQuiz() {
    stopQuizTimer();
    const pct = Math.round((quizScore / quizSet.length) * 100);

    quizPanel.innerHTML = '';
    const result = document.createElement('div');
    result.className = 'quiz-result';

    const scoreEl = document.createElement('p');
    scoreEl.className = 'result-score';
    scoreEl.textContent = `${pct}%`;

    const detailEl = document.createElement('p');
    detailEl.textContent = `You got ${quizScore} of ${quizSet.length} correct.`;

    const retryBtn = document.createElement('button');
    retryBtn.className = 'startBtn';
    retryBtn.style.marginTop = '18px';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', () => {
      quizSet = pickRandom(getQuizPool(), QUIZ_QUESTION_COUNT);
      quizIndex = 0;
      quizScore = 0;
      renderQuizQuestion();
      startQuizTimer();
    });

    result.append(scoreEl, detailEl, retryBtn);
    quizPanel.appendChild(result);

    const state = loadProgress();
    const isNewBest = pct > state.quizBest;
    if (isNewBest) state.quizBest = pct;
    state.quizAttempts = (state.quizAttempts || 0) + 1;

    let unlockedTopic = null;
    if (currentTopic !== 'all') {
      const wasUnlocked = isCertUnlocked(state, currentTopic);
      if (pct > state.quizBestByTopic[currentTopic]) state.quizBestByTopic[currentTopic] = pct;
      if (!wasUnlocked && isCertUnlocked(state, currentTopic)) unlockedTopic = currentTopic;
    }

    saveProgress(state);

    if (isNewBest) showToast(`New best quiz score: ${pct}%`, 'success');
    if (pct >= 80) showToast('Badge earned: Quiz Master 🏆', 'success');
    if (pct === 100) showToast('Badge earned: Perfectionist 💯', 'success');
    if (unlockedTopic) showToast(`🏅 ${TOPIC_LABELS[unlockedTopic]} certificate unlocked!`, 'success');
  }

  /* ============================================================
     Fill in the Blanks — large question pool, randomized each attempt
     ============================================================ */
  const BLANK_QUESTIONS = [
    { code: `document.querySelector('___').addEventListener('click', fn);`, answer: '.btn', hint: 'A CSS selector for class "btn"', topic: 'javascript' },
    { code: 'p { color: ___; }', answer: 'red', hint: 'A basic CSS color keyword', topic: 'css' },
    { code: '<a href="#" ___="Visit our homepage">Home</a>', answer: 'title', hint: 'HTML attribute for a tooltip', topic: 'html' },
    { code: 'let sum = a ___ b;', answer: '+', hint: 'Arithmetic addition operator', topic: 'javascript' },
    { code: 'array.___(); // adds an item to the end', answer: 'push', hint: 'Array method that appends an item', topic: 'javascript' },
    { code: '<___ src="image.png" alt="pic">', answer: 'img', hint: 'HTML tag for embedding an image', topic: 'html' },
    { code: '.box { display: ___; } /* flex layout */', answer: 'flex', hint: 'CSS display value for flexbox', topic: 'css' },
    { code: 'const obj = ___.parse(jsonString);', answer: 'JSON', hint: 'Global object used to parse JSON', topic: 'javascript' },
    { code: 'for (let i = 0; i ___ 10; i++) {}', answer: '<', hint: 'Comparison operator: less than', topic: 'javascript' },
    { code: '<input type="___" required>', answer: 'email', hint: 'Input type that validates an email address', topic: 'html' },
    { code: '.card:___ { transform: scale(1.05); }', answer: 'hover', hint: 'Pseudo-class triggered on mouse-over', topic: 'css' },
    { code: 'let arr = [1,2,3]; arr.___(); // removes last item', answer: 'pop', hint: 'Array method that removes the last item', topic: 'javascript' },
    { code: '<link rel="___" href="style.css">', answer: 'stylesheet', hint: 'Value describing the linked resource type', topic: 'html' },
    { code: '.container { display: ___; grid-template-columns: 1fr 1fr; }', answer: 'grid', hint: 'CSS display value for a two-dimensional layout', topic: 'css' },
    { code: 'const x = typeof "hello"; // returns "___"', answer: 'string', hint: 'The type of a text value', topic: 'javascript' },
    { code: '<button ___="submitForm()">Submit</button>', answer: 'onclick', hint: 'Inline HTML event attribute', topic: 'html' },
    { code: '.box { margin: 0 ___; } /* centers horizontally */', answer: 'auto', hint: 'Value that lets the browser calculate side margins', topic: 'css' },
    { code: `document.___('myId'); // get element by id`, answer: 'getElementById', hint: 'DOM method to find an element by its id', topic: 'javascript' },
    { code: '<ul><___>Item 1</___></ul>', answer: 'li', hint: 'Tag for a single list item', topic: 'html' },
    { code: '.text { font-weight: ___; } /* bold */', answer: 'bold', hint: 'Keyword value for bold text', topic: 'css' },
    { code: 'array.___(x => x * 2); // returns a new array', answer: 'map', hint: 'Array method that transforms each item', topic: 'javascript' },
    { code: '<form ___="POST">', answer: 'method', hint: 'Attribute that sets the HTTP request type', topic: 'html' },
    { code: '.box { position: ___; top: 0; } /* sticks to the viewport */', answer: 'fixed', hint: 'Position value relative to the browser window', topic: 'css' },
    { code: `let name = "Claude"; console.___(name);`, answer: 'log', hint: 'Console method that prints to the console', topic: 'javascript' },
    { code: '<select><___ value="1">One</___></select>', answer: 'option', hint: 'Tag for a single dropdown choice', topic: 'html' },
    { code: '.item { opacity: ___; } /* fully visible */', answer: '1', hint: 'Opacity value meaning fully opaque', topic: 'css' },
    { code: 'array.___(x => x > 2); // filters items', answer: 'filter', hint: 'Array method that keeps items passing a test', topic: 'javascript' },
    { code: '<meta charset="___">', answer: 'UTF-8', hint: 'Standard character encoding for web pages', topic: 'html' },
    { code: '.box { border-radius: ___; } /* fully rounded circle */', answer: '50%', hint: 'Radius value that turns a square into a circle', topic: 'css' },
    { code: 'const arr = new ___();', answer: 'Array', hint: 'Constructor used to create an array', topic: 'javascript' },
    { code: '<table><___><td>1</td></___></table>', answer: 'tr', hint: 'Tag for a table row', topic: 'html' },
    { code: '.flex { justify-content: ___; } /* items centered horizontally */', answer: 'center', hint: 'Value that centers flex items along the main axis', topic: 'css' },
    { code: `window.___.setItem('key','value');`, answer: 'localStorage', hint: 'Browser API for persistent client-side storage', topic: 'javascript' },
    { code: '<___ type="checkbox" checked>', answer: 'input', hint: 'Tag used for form controls like checkboxes', topic: 'html' },
    { code: '.box { transition: all ___ ease; } /* half a second */', answer: '0.5s', hint: 'Duration value equal to 500 milliseconds', topic: 'css' },
    { code: 'let arr = [3,1,2]; arr.___();', answer: 'sort', hint: 'Array method that orders elements', topic: 'javascript' },
    { code: '<nav><___ href="#">Home</___></nav>', answer: 'a', hint: 'Tag used for hyperlinks', topic: 'html' },
    { code: '.box { background-color: ___; }', answer: 'transparent', hint: 'Value meaning no visible color', topic: 'css' },
    { code: `document.querySelectorAll('.item').___(el => {});`, answer: 'forEach', hint: 'Method used to loop over a NodeList', topic: 'javascript' },
    { code: '<textarea ___="4"></textarea>', answer: 'rows', hint: 'Attribute controlling visible textarea height', topic: 'html' }
  ];

  const BLANK_QUESTION_COUNT = 10;

  const blanksPanel = $('#blanksPanel');
  let blanksSet = [];

  /* ---------- 10-minute countdown, auto-checks when it hits 0 ---------- */
  const BLANKS_TIME_LIMIT = 600; // seconds
  let blanksTimeLeft = BLANKS_TIME_LIMIT;
  let blanksTimerId = null;

  function stopBlanksTimer() {
    if (blanksTimerId) clearInterval(blanksTimerId);
    blanksTimerId = null;
  }

  function startBlanksTimer() {
    stopBlanksTimer();
    blanksTimeLeft = BLANKS_TIME_LIMIT;
    blanksTimerId = setInterval(() => {
      blanksTimeLeft--;
      const display = $('#blanksTimeDisplay');
      if (display) {
        display.textContent = formatTime(blanksTimeLeft);
        display.closest('.timer-bar')?.classList.toggle('time-warning', blanksTimeLeft <= 60);
      }
      if (blanksTimeLeft <= 0) {
        stopBlanksTimer();
        showToast("Time's up — checking your answers.", 'info');
        checkBlanks();
      }
    }, 1000);
  }

  function getBlanksPool() {
    return currentTopic === 'all' ? BLANK_QUESTIONS : BLANK_QUESTIONS.filter(q => q.topic === currentTopic);
  }

  $('#startBlanksBtn')?.addEventListener('click', () => {
    blanksSet = pickRandom(getBlanksPool(), BLANK_QUESTION_COUNT);
    blanksPanel.classList.remove('hidden');
    $('#quizPanel').classList.add('hidden');
    stopQuizTimer();
    renderBlanks();
    startBlanksTimer();
    blanksPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderBlanks() {
    blanksPanel.innerHTML = '';

    blanksPanel.appendChild(buildTimerBar('blanksTimeDisplay', blanksTimeLeft));

    const heading = document.createElement('p');
    heading.className = 'q-progress';
    heading.textContent = `Fill in the missing piece of each snippet (${blanksSet.length} questions), then check your answers.`;
    blanksPanel.appendChild(heading);

    blanksSet.forEach((item, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'blank-line';

      const code = document.createElement('div');
      code.className = 'blank-code';
      code.textContent = item.code; // textContent — never innerHTML, avoids XSS from any future dynamic content

      const input = document.createElement('input');
      input.className = 'blank-input';
      input.type = 'text';
      input.placeholder = item.hint;
      input.dataset.index = String(i);

      wrap.append(code, input);
      blanksPanel.appendChild(wrap);
    });

    const checkBtn = document.createElement('button');
    checkBtn.className = 'startBtn';
    checkBtn.textContent = 'Check Answers';
    checkBtn.addEventListener('click', checkBlanks);
    blanksPanel.appendChild(checkBtn);
  }

  function checkBlanks() {
    stopBlanksTimer();
    const inputs = $$('.blank-input', blanksPanel);
    let correctCount = 0;

    inputs.forEach(input => {
      const idx = Number(input.dataset.index);
      const expected = blanksSet[idx].answer.trim().toLowerCase();
      const given = input.value.trim().toLowerCase();
      const isCorrect = given === expected;
      input.classList.toggle('correct', isCorrect);
      input.classList.toggle('incorrect', !isCorrect && given.length > 0);
      if (isCorrect) correctCount++;
    });

    const pct = Math.round((correctCount / inputs.length) * 100);
    showToast(`${correctCount} of ${inputs.length} correct.`, correctCount === inputs.length ? 'success' : 'info');

    const state = loadProgress();
    state.blanksAttempts = (state.blanksAttempts || 0) + 1;

    if (correctCount === inputs.length) {
      if (!state.blanksCompleted) {
        state.blanksCompleted = true;
        showToast('Badge earned: Blank Filler ✏️', 'success');
      }
    }

    let unlockedTopic = null;
    if (currentTopic !== 'all') {
      const wasUnlocked = isCertUnlocked(state, currentTopic);
      if (pct > state.blanksBestByTopic[currentTopic]) state.blanksBestByTopic[currentTopic] = pct;
      if (!wasUnlocked && isCertUnlocked(state, currentTopic)) unlockedTopic = currentTopic;
    }

    saveProgress(state);
    if (unlockedTopic) showToast(`🏅 ${TOPIC_LABELS[unlockedTopic]} certificate unlocked!`, 'success');
  }

  /* ============================================================
     Init
     ============================================================ */
  renderProgress();
})();
