(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
const gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
const page = document.body.dataset.page;
const PAGE_NAMES = { 'index.html': 'Home', '': 'Home', 'work.html': 'Work', 'web.html': 'Web', 'sound.html': 'Sound', 'about.html': 'About', 'contact.html': 'Contact' };
if (gsap) gsap.registerPlugin(...[ST, Split].filter(Boolean));

let arrivedResolve; const arrived = new Promise(r => (arrivedResolve = r));
arrived.then(() => { if (window.DG) window.DG.arrivedDone = true; });
let introResolve; const introDone = new Promise(r => (introResolve = r));
const DG = window.DG = { arrived, introDone: () => introResolve(), lenis: null, shake: null, extra: [] };
// Big screens with a mouse get the full-quality media (2x clips, 1080p drive loop, 1800 px photos via srcset);
// phones, data-saver and slow connections keep the light files.
const conn = navigator.connection || {};
const HD = DG.HD = fine && !conn.saveData && !(conn.effectiveType && /2g|3g/.test(conn.effectiveType)) && Math.max(screen.width, screen.height) * (devicePixelRatio || 1) >= 1280;
const hd = src => (HD && /assets\/video\/(real\/[\w-]+|drive-loop)\.mp4$/.test(src || '') ? src.replace(/\.mp4$/, '-hd.mp4') : src);
if (HD) $$('img[data-hd]').forEach(i => { i.src = i.dataset.hd; });   // 2x AI-enhanced photos
if (HD) $$('video[data-src]').forEach(v => { if (hd(v.dataset.src) !== v.dataset.src && v.getAttribute('poster')) v.poster = v.getAttribute('poster').replace(/\.jpg$/, '-hd.jpg'); });
const sceneReady = page === 'home' ? new Promise(r => (DG.sceneReadyResolve = r)) : Promise.resolve();

/* safety net: if anything fails to load, never leave the page hidden */
setTimeout(() => { if (!html.classList.contains('loading')) return; html.classList.remove('first', 'arriving', 'loading', 'lock'); $('#loader')?.remove(); locked = 0; arrivedResolve(); introResolve(); }, 15000);
if (!gsap) { html.classList.remove('first', 'arriving', 'loading'); $('#loader')?.remove(); arrivedResolve(); introResolve(); }

/* =========================================================
   SCROLL: one wheel tick / swipe / key = one screen, eased.
   Stops are measured from the real layout: every section, plus cut points
   inside sections taller than the screen (so half a section fits).
   ========================================================= */
const SNAP = !!gsap && !reduce;
const CUTS = '[data-screen], .tiles, .pcard, .site, .trace li, .also__grid article, .boards, .about-hero > *, .contact-grid > *, .kit > *, .split > *';
const snap = DG.snap = { stops: [0], target: 0, tween: null, how: '', endAt: 0 };
let locked = 0;
// while the loader, the menu or a build drawer is up the page itself must not move at all (html.lock)
const stopScroll = () => { locked++; html.classList.add('lock'); if (!SNAP) document.body.style.overflow = 'hidden'; };
const startScroll = () => { locked = Math.max(0, locked - 1); if (locked) return; html.classList.remove('lock'); if (!SNAP) document.body.style.overflow = ''; };
DG.stopScroll = stopScroll; DG.startScroll = startScroll;
const docTop = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
const maxY = () => Math.max(0, html.scrollHeight - innerHeight);

function measure() {
  const H = innerHeight, max = maxY(), out = [];
  const blocks = [...$$('main > *'), $('.foot')].filter(el => el && el.offsetHeight > 0 && !/fixed|absolute/.test(getComputedStyle(el).position));
  blocks.forEach(b => {
    const top = docTop(b), h = b.offsetHeight, last = top + h - H;
    out.push([top, 0]);
    if (h <= H + 12 || b.classList.contains('scene-pin')) return;
    // taller than the screen: step through it, starting each screen at the top of a card or row where one fits
    const cuts = [...new Set($$(CUTS, b).filter(c => c.offsetHeight > 0).map(c => Math.round(docTop(c) - (parseFloat(getComputedStyle(c).scrollMarginTop) || 0))))].sort((x, y) => x - y);
    let at = top;
    for (let guard = 0; guard < 40 && last - at > 12; guard++) {
      const fit = cuts.filter(c => c > at + H * .25 && c <= at + H + 2 && c <= last + 12);
      at = fit.length ? fit[fit.length - 1] : Math.min(at + H, last);
      out.push([at, 1]);                                         // a stop the content needs: never merged away
    }
  });
  out.sort((x, y) => x[0] - y[0]);
  const stops = [];
  out.forEach(([y, need]) => { y = clamp(Math.round(y), 0, max); const gap = stops.length ? y - stops[stops.length - 1] : 1e9; if (gap > H * .16 || (need && gap > 12)) stops.push(y); });
  if (max - stops[stops.length - 1] > H * .1) stops.push(max); else if (stops.length > 1) stops[stops.length - 1] = max;
  if (stops[0] !== 0) stops.unshift(0);
  snap.stops = stops;
  return stops;
}
// Safety net for odd window sizes: when a one-screen section comes out a little taller than the window,
// its content is scaled down just enough to fit (instead of leaving a tiny extra scroll step).
function fit() {
  if (!SNAP || !window.CSS || !CSS.supports('zoom', '0.9')) return;
  const H = innerHeight;
  $$('main > section, [data-screen], .site, .about-hero > *').forEach(el => {
    const kids = [...el.children].filter(c => !/absolute|fixed/.test(getComputedStyle(c).position));
    kids.forEach(c => (c.style.zoom = ''));
    const h = el.offsetHeight;
    if (h <= H + 2 || h > H * 1.34) return;
    const cs = getComputedStyle(el), pads = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const z = Math.max(.74, (H - pads - 2) / (h - pads));
    kids.forEach(c => (c.style.zoom = z.toFixed(3)));
  });
}
DG.fit = fit;
const nearest = y => snap.stops.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), snap.stops[0]);
const moving = () => !!(snap.tween && snap.tween.isActive());

function scrollToY(y, how = 'wheel') {
  const from = scrollY, dist = Math.abs(y - from);
  snap.target = y; snap.how = how;
  if (snap.tween) snap.tween.kill();
  if (dist < 1) return;
  const o = { y: from }, screens = dist / innerHeight;
  const dur = how === 'touch' ? clamp(.55 + screens * .32, .6, 1.25) : how === 'fix' ? .55 : clamp(.72 + screens * .34, .8, 1.5);
  snap.tween = gsap.to(o, {
    y, duration: dur, ease: how === 'touch' ? 'power3.out' : how === 'fix' ? 'power2.out' : 'power2.inOut',
    onUpdate: () => { scrollTo(0, o.y); ST && ST.update(); },
    onComplete: () => { snap.endAt = performance.now(); }
  });
}
function step(dir, how) {
  if (locked) return false;
  // a gesture during the slow tail of the last move chains on from where that move was heading
  if (moving() && snap.tween.progress() < (snap.how === 'touch' ? .55 : .8)) return false;
  const base = moving() ? snap.target : scrollY;
  const next = dir > 0 ? snap.stops.find(s => s > base + 4) : [...snap.stops].reverse().find(s => s < base - 4);
  if (next == null) return false;
  scrollToY(next, how);
  return true;
}
DG.go = (dir, how) => step(dir, how);
DG.scrollTo = (y, how) => scrollToY(clamp(y, 0, maxY()), how);

if (SNAP) {
  html.classList.add('snap');
  if (ST) ST.config({ ignoreMobileResize: true });
  gsap.ticker.lagSmoothing(0);
  const inOverlay = t => t && t.closest && t.closest('dialog[open], .sheet.open');
  const inField = t => t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable);

  // wheel + trackpad. Trackpads keep sending a fading tail after the fingers lift: that tail must not count as a new scroll.
  let wLast = 0, wAbs = 0;
  addEventListener('wheel', e => {
    if (e.ctrlKey || inOverlay(e.target)) return;
    e.preventDefault();
    const now = performance.now(), abs = Math.abs(e.deltaY), gap = now - wLast, prev = wAbs;
    wLast = now; wAbs = abs;
    if (locked || abs < 2 || Math.abs(e.deltaX) > abs) return;
    if (moving() && snap.tween.progress() < .8) return;
    const fresh = gap > 130 || abs > prev * 1.5 + 6 || (abs >= 80 && !moving() && now - snap.endAt > 260);
    if (!fresh) return;
    step(e.deltaY > 0 ? 1 : -1, 'wheel');
  }, { passive: false });

  // touch: the page never free-scrolls (html.snap sets touch-action); a swipe starts the move straight away
  let t0 = null;
  addEventListener('touchstart', e => { t0 = e.touches.length === 1 && !inOverlay(e.target) && !inField(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, done: false } : null; }, { passive: true });
  addEventListener('touchmove', e => {
    if (!t0 || t0.done || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - t0.x, dy = e.touches[0].clientY - t0.y;
    if (Math.abs(dy) < 22 || Math.abs(dy) < Math.abs(dx) * 1.3) return;
    t0.done = true; step(dy < 0 ? 1 : -1, 'touch');
  }, { passive: true });
  addEventListener('touchend', () => { t0 = null; }, { passive: true });
  addEventListener('touchcancel', () => { t0 = null; }, { passive: true });

  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || inField(e.target) || inOverlay(e.target) || inOverlay(document.activeElement)) return;
    const k = e.key, onBtn = e.target.closest && e.target.closest('button, a, [tabindex], summary');
    let dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey && !onBtn)) dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey && !onBtn)) dir = -1;
    else if (k === 'Home') { e.preventDefault(); if (!locked) scrollToY(0); return; }
    else if (k === 'End') { e.preventDefault(); if (!locked) scrollToY(snap.stops[snap.stops.length - 1]); return; }
    if (!dir) return;
    e.preventDefault(); step(dir, 'wheel');
  });

  // anything else that moves the page (tabbing to a link, find-in-page) settles on the nearest screen
  let idle = 0;
  addEventListener('scroll', () => {
    clearTimeout(idle);
    idle = setTimeout(() => { if (locked || moving() || inField(document.activeElement)) return; const n = nearest(scrollY); if (Math.abs(n - scrollY) > 2) scrollToY(n, 'fix'); }, 170);
  }, { passive: true });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); scrollToY(nearest(docTop(t)));
  });

  let rz = 0, lastW = innerWidth, lastH = innerHeight;
  const remeasure = () => { measure(); if (!locked && !moving()) scrollTo(0, nearest(scrollY)); };
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      // phones fire resize when the keyboard or address bar moves: only a real change of size re-lays the page out
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120 && matchMedia('(pointer: coarse)').matches) return;
      lastW = innerWidth; lastH = innerHeight; fit(); ST && ST.refresh(); remeasure();
    }, 220);
  });
  if (ST) ST.addEventListener('refresh', measure);
  addEventListener('load', () => setTimeout(remeasure, 60));
  DG.measure = measure;
  measure();

  // slim progress line on the right edge
  const pg = document.createElement('div'); pg.className = 'pg'; pg.setAttribute('aria-hidden', 'true'); pg.innerHTML = '<i></i>'; document.body.append(pg);
  const pgi = pg.firstChild;
  addEventListener('scroll', () => { pgi.style.transform = `scaleY(${(scrollY / (maxY() || 1)).toFixed(4)})`; }, { passive: true });
}

/* =========================================================
   ARRIVAL: page wipe (between pages), 2D loader (first visit, inner pages),
   or the 3D intro (home, handled in scene.js)
   ========================================================= */
const wipe = $('#wipe'), bars = wipe ? $$('i', wipe) : [], wlabel = wipe ? $('span', wipe) : null;
function label(t) {
  wlabel.textContent = t;
  return Split ? new Split(wlabel, { type: 'chars' }).chars : [wlabel];
}
if (gsap) {
  if (html.classList.contains('arriving') && !reduce) {
    $('#loader')?.remove(); html.classList.remove('loading');
    const ch = label(ss.get('wipe') || ''); ss.del('wipe');
    gsap.set(bars, { scaleY: 1, transformOrigin: '50% 0%' });
    gsap.timeline({ onComplete: () => { html.classList.remove('arriving'); gsap.set(wipe, { clearProps: 'all' }); } })
      .to(ch, { yPercent: -120, stagger: .03, duration: .45, ease: 'power3.in' }, .05)
      .to(bars, { scaleY: 0, stagger: { each: .06, from: 'start' }, duration: .8, ease: 'expo.inOut' }, .2)
      .call(arrivedResolve, null, .5);
    if (page !== 'home') introResolve();
  } else if (html.classList.contains('loading') && !reduce) {
    runLoader();
  } else {
    html.classList.remove('arriving', 'loading');
    $('#loader')?.remove();
    arrivedResolve();
    if (page !== 'home') { html.classList.remove('first'); introResolve(); }
  }
  ss.set('seen', '1');
}

function runLoader() {
  const L = $('#loader');
  if (!L) { html.classList.remove('loading', 'first'); arrivedResolve(); introResolve(); return; }
  scrollTo(0, 0); stopScroll();
  const num = $('.loader__num', L), msg = $('.loader__msg', L);
  const t0 = performance.now(), MIN = 1500, MAX = 9000;
  // real progress: fonts, the page's images, window load, plus anything the page registers (the intro film)
  let fontsOk = false, loadOk = document.readyState === 'complete', sceneOk = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => (fontsOk = true));
  addEventListener('load', () => (loadOk = true));
  Promise.race([sceneReady, new Promise(r => setTimeout(r, 5000))]).then(() => (sceneOk = true));
  const imgs = $$('img').filter(i => i.loading !== 'lazy');
  let shown = 0, last = t0, lastV = -1;
  const msgs = ['Loading the drive', 'Tuning the amps', 'Charging the ions', 'Warming up the kit'];
  // Everything that moves in the loader is a CSS transition on transform/opacity, so it keeps gliding on the
  // compositor even while the main thread is busy starting the 3D scene. JS only feeds it the number.
  (function tick(now) {
    const el = now - t0, dt = Math.min(now - last, 100) / 1000; last = now;
    const parts = [fontsOk ? 1 : 0, loadOk ? 1 : 0, sceneOk ? 1 : 0, imgs.length ? imgs.filter(i => i.complete).length / imgs.length : 1, ...DG.extra.map(x => Math.min(1, x.p || 0))];
    const real = parts.reduce((a, b) => a + b, 0) / parts.length;
    const creep = 64 * (1 - Math.exp(-el / 3000));                 // never sits still while things download
    let target = Math.min(Math.max(real * 100, creep), el / MIN * 100, 99);
    if ((real >= 1 && el >= MIN) || el > MAX) target = 100;
    const gap = target - shown;                                     // eased and rate-limited: a slow frame can't make it jump
    if (gap > 0) shown += Math.min(gap, clamp(gap * 4.2, 9, 80) * dt);
    const v = Math.min(100, Math.floor(shown + .5));
    if (v !== lastV) {
      lastV = v;
      L.style.setProperty('--lp', (v / 100).toFixed(2));
      num.textContent = String(v).padStart(3, '0');
      msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(v / 26))];
    }
    if (v < 100) return requestAnimationFrame(tick);
    setTimeout(leave, 340);                                         // let the fill finish gliding to the last letter
  })(t0);

  async function leave() {
    // home, first visit: the film starts underneath and the loader cross-fades into it. Everywhere else the
    // word lifts away and the whole panel slides up off the page.
    let mode = 'page';
    try { if (DG.gate) mode = (await Promise.race([DG.gate(), new Promise(r => setTimeout(() => r('page'), 9500))])) || 'page'; } catch (e) {}
    const film = mode === 'film';
    L.classList.add('done', film ? 'to-film' : 'to-page');
    setTimeout(arrivedResolve, film ? 0 : 480);
    setTimeout(() => {
      L.remove(); html.classList.remove('loading');
      if (page !== 'home') { html.classList.remove('first'); introResolve(); }
      startScroll();
    }, film ? 950 : 1500);
    // last resort: if the home intro never got going (a script failed), don't leave a black film over the page
    if (page === 'home') setTimeout(() => {
      const f = $('#film'), v = f && $('video', f);
      if (!html.classList.contains('first') || !f || !v || !(v.paused && v.currentTime === 0)) return;
      f.remove(); $('#introUI')?.remove(); html.classList.remove('first', 'lock'); locked = 0; introResolve();
      gsap.set('[data-intro], #heroTitle, #heroTitle *', { opacity: 1, clearProps: 'transform' }); gsap.set('#introBlack', { opacity: 0 }); DG.wake && DG.wake();
    }, 7000);
  }
}

// leaving: sunset panels sweep up, page name rises, then go
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || !gsap || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname) || url.pathname === location.pathname) return;
  e.preventDefault();
  const name = PAGE_NAMES[url.pathname.split('/').pop()] || '';
  ss.set('wipe', name);
  const ch = label(name);
  gsap.set(wipe, { visibility: 'visible' });
  gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set(ch, { yPercent: 120 });
  gsap.timeline()
    .to(bars, { scaleY: 1, stagger: .055, duration: .62, ease: 'expo.inOut' })
    .to(ch, { yPercent: 0, stagger: .03, duration: .5, ease: 'expo.out' }, .35)
    .call(() => { location.href = url.href; }, null, .9);
});
addEventListener('pageshow', e => { if (e.persisted && gsap) { gsap.set(bars, { scaleY: 0 }); gsap.set(wipe, { clearProps: 'all' }); html.classList.remove('arriving'); } });

/* =========================================================
   SECTION VIDEOS (lazy, play only when visible)
   ========================================================= */
const vidIO = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) {
    if (!v.src && v.dataset.src) { v.src = hd(v.dataset.src); }
    if (!reduce) v.play().catch(() => {});
  } else v.pause();
}), { rootMargin: '200px 0px' });
$$('video[data-src]').forEach(v => vidIO.observe(v));

/* =========================================================
   NAV
   ========================================================= */
const nav = $('#nav'), menuBtn = $('#menuBtn'), sheet = $('#sheet');
let sheetOpen = false, lastY = 0;
const onScroll = y => {
  nav.classList.toggle('solid', y > 40);
  if (!sheetOpen && y > lastY + 4 && y > innerHeight * .4) nav.classList.add('away');
  if (y < lastY - 4) nav.classList.remove('away');
  lastY = y;
};
addEventListener('scroll', () => onScroll(scrollY), { passive: true });
function setSheet(open) {
  sheetOpen = open; menuBtn.setAttribute('aria-expanded', open);
  if (open) { sheet.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open'))); stopScroll(); nav.classList.remove('away'); }
  else { sheet.classList.remove('open'); startScroll(); setTimeout(() => { if (!sheetOpen) sheet.hidden = true; }, 800); }
}
menuBtn.addEventListener('click', () => setSheet(!sheetOpen));
sheet.addEventListener('click', e => { const a = e.target.closest('a'); if (a && a.getAttribute('aria-current') === 'page') { e.preventDefault(); setSheet(false); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen) { setSheet(false); menuBtn.focus(); } });

/* =========================================================
   SCROLL ANIMATIONS (GSAP + ScrollTrigger + SplitText)
   ========================================================= */
const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]);
const BLOCKS = '.eyebrow, .chips, .handles, .links li, .form, .kit__bar, .cta .btn, .filters, .site__go, .deck, .facts, .rows__more, .sidequest__grid, .music__nums div, .me__photo, .me__text .btn, .music .btn, .photo-card';
const CARDS = '.grid-work .pcard, .tool, .board, .also__grid article, .pad, .scope, .site__shot, .tile, .shot-clip';

Promise.all([fontsReady, arrived]).then(() => {
  if (!gsap || !ST || reduce) { countAll(); return; }
  fit();

  // headings: letters flip up out of a mask
  $$('.h2, .h3, .split-chars').forEach(el => {
    if (el.closest('.scene')) return;
    const sp = new Split(el, { type: 'lines,words,chars', mask: 'lines', charsClass: 'ch' });
    el.classList.add('is-split'); $$('.sun-text, .sun-text-x', el).forEach(n => n.classList.add('is-split'));
    gsap.from(sp.chars, { yPercent: 120, rotate: 12, transformOrigin: '0% 100%', duration: 1.1, ease: 'expo.out', stagger: .016, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  // inner page titles slam in right after arrival
  $$('.phead .h1').forEach(el => {
    const sp = new Split(el, { type: 'words,chars', wordsClass: 'wd-nb', charsClass: 'ch' });
    el.classList.add('is-split');
    gsap.from(sp.chars, { yPercent: 130, rotate: 14, opacity: 0, scale: 1.4, duration: 1.2, ease: 'expo.out', stagger: .045, delay: .05 });
  });
  // paragraphs rise line by line
  $$('.lede, .split p:not(.bignum):not(.mono), .bio > p:not(.lede):not(.eyebrow), .site__body p:not(.mono)').forEach(el => {
    if (el.closest('.scene')) return;
    const sp = new Split(el, { type: 'lines', mask: 'lines' });
    gsap.from(sp.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  // general blocks
  if ($$(BLOCKS).length) gsap.set(BLOCKS, { opacity: 0, y: 50 });
  if ($$(BLOCKS).length) ST.batch(BLOCKS, { start: 'top 94%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .07, overwrite: true }) });
  // cards fall into place in 3D
  if ($$(CARDS).length) gsap.set(CARDS, { opacity: 0, y: 110, rotateX: -28, transformPerspective: 1000, transformOrigin: '50% 0%' });
  if ($$(CARDS).length) ST.batch(CARDS, { start: 'top 94%', once: true, onEnter: b => gsap.to(b, { y: 0, rotateX: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: .08, overwrite: true }) });
  // image parallax inside frames
  $$('[data-parallax]').forEach(el => {
    const img = $('img', el); if (!img) return;
    gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // mini sun on inner pages sinks as you scroll
  $$('.phead__mini-sun').forEach(s => gsap.to(s, { yPercent: 70, ease: 'none', scrollTrigger: { trigger: s.closest('section') || s, start: 'top top', end: 'bottom top', scrub: true } }));

  // statement: words light up as you read down
  const st = $('.statement p');
  if (st) {
    const sp = new Split(st, { type: 'words', wordsClass: 'wd' });
    const hot = (st.dataset.hot || '').split(',');
    sp.words.forEach(w => { if (hot.includes(w.textContent.replace(/[^\w-]/g, '').toLowerCase())) w.classList.add('hot'); });
    gsap.fromTo(sp.words, { opacity: .12 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 40%', scrub: true } });
  }

  // posters: fanned deck straightens out as it scrolls in
  const posters = $$('.poster');
  if (posters.length && innerWidth > 760) {
    gsap.fromTo(posters, { y: i => 220 + i * 40, rotation: i => (i - 1.5) * 14, rotationY: i => (i - 1.5) * -20, scale: .82, opacity: 0, transformPerspective: 1200 },
      { y: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.poster-row', start: 'top 98%', end: 'top 35%', scrub: 1 } });
  }

  // shipped-websites stack: each card shrinks back as the next slides over it
  const stack = $$('.stack__card');
  stack.forEach((c, i) => {
    const next = stack[i + 1]; if (!next) return;
    gsap.to(c, { scale: .9, filter: 'brightness(.4)', ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 18%', scrub: true } });
  });

  // featured builds: pinned, slide sideways, cards lean with scroll speed
  const hpin = $('.hpin'), track = $('.hpin__track');
  if (hpin && track) {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const leaners = $$('.pcard, .end', track);
    const skew = gsap.quickTo(leaners, 'skewX', { duration: .5, ease: 'power3' });
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: hpin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => { hpin.style.setProperty('--hp', s.progress.toFixed(4)); skew(clamp(s.getVelocity() / -350, -8, 8)); } }
    });
  }

  // marquee: direction + speed follow your scroll
  const mq = $('.marquee div');
  if (mq) {
    const loop = gsap.to(mq, { xPercent: -50, repeat: -1, duration: 22, ease: 'none' });
    let dir = 1;
    ST.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onUpdate: s => {
      const v = s.getVelocity(); if (Math.abs(v) > 20) dir = v < 0 ? -1 : 1;
      gsap.timeline({ overwrite: true }).to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 250, 8)), duration: .2 }).to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' }, .3);
    } });
    gsap.fromTo('.marquee', { rotate: -5 }, { rotate: 2, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // big footer name builds up letter by letter
  $$('.foot__word').forEach(fw => {
    const sp = new Split(fw, { type: 'chars', charsClass: 'ch' }); fw.classList.add('is-split');
    gsap.from(sp.chars, { yPercent: 110, rotate: 10, opacity: 0, stagger: .04, ease: 'expo.out', scrollTrigger: { trigger: fw, start: 'top 98%', end: 'top 60%', scrub: 1 } });
  });

  // roadmap trace
  $$('.trace').forEach(trace => {
    gsap.fromTo(trace, { '--tp': 0 }, { '--tp': 1, ease: 'none', scrollTrigger: { trigger: trace, start: 'top 65%', end: 'bottom 65%', scrub: true } });
    $$('li', trace).forEach(li => ST.create({ trigger: li, start: 'top 65%', end: 'max', onToggle: s => li.classList.toggle('on', s.isActive) }));
  });

  fit();            // again now the headings are split into lines, which can add a few pixels
  countAll();
  ST.refresh();
  addEventListener('load', () => ST.refresh());
});

function countAll() {
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count;
    if (!gsap || !ST || reduce) { el.textContent = end; return; }
    const o = { v: 0 };
    ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v)) }) });
  });
}

/* =========================================================
   TILT + spotlight under the mouse
   ========================================================= */
if (fine && !reduce && gsap) $$('.tile, .site__shot, .me__photo, .shot-clip').forEach(p => {
  const rx = gsap.quickTo(p, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(p, 'rotationY', { duration: .6, ease: 'power3' });
  gsap.set(p, { transformPerspective: 1100 });
  const k = p.classList.contains('tile') || p.classList.contains('shot-clip') ? .7 : .3;
  p.addEventListener('pointermove', e => {
    const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    ry((x - .5) * 14 * k); rx((.5 - y) * 10 * k);
    p.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); p.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  });
  p.addEventListener('pointerleave', () => { rx(0); ry(0); });
});

/* =========================================================
   WORK: filters (FLIP) + detail drawer
   ========================================================= */
const grid = $('.grid-work');
if (grid) {
  const cards = $$('.pcard', grid), btns = $$('.filters button');
  function filter(cat) {
    const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.f === cat));
    cards.forEach(c => { c.hidden = !(cat === 'all' || c.dataset.cat.split(' ').includes(cat)); if (gsap) gsap.set(c, { opacity: 1, y: 0, rotateX: 0 }); });
    if (reduce) { ST && ST.refresh(); return; }
    cards.forEach(c => {
      if (c.hidden) return;
      const a = first.get(c), b = c.getBoundingClientRect();
      if (!a.width) { c.animate([{ opacity: 0, transform: 'scale(.85) rotate(-3deg)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.7,.1,1)' }); return; }
      c.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px)` }, { transform: 'none' }], { duration: 800, easing: 'cubic-bezier(.2,.7,.1,1)' });
    });
    ST && setTimeout(() => ST.refresh(), 820);
  }
  btns.forEach(b => b.addEventListener('click', () => { filter(b.dataset.f); history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : '#' + b.dataset.f); }));
  const h = location.hash.slice(1);
  if (h && btns.some(b => b.dataset.f === h)) arrived.then(() => setTimeout(() => filter(h), 400));

  const dlg = $('#drawer');
  cards.forEach(c => c.addEventListener('click', () => {
    const art = $('.drawer__art', dlg);
    art.className = 'drawer__art ' + ([...c.classList].find(k => k.startsWith('bg-')) || '');
    art.innerHTML = $('.pcard__art', c).innerHTML;
    const dv = $('video', art);                      // a build with real footage: it plays in the drawer too
    if (dv) { dv.src = hd(dv.dataset.src); if (dv.getAttribute('poster') && hd(dv.dataset.src) !== dv.dataset.src) dv.poster = dv.getAttribute('poster').replace(/\.jpg$/, '-hd.jpg'); if (!reduce) dv.play().catch(() => {}); }
    $('.drawer__tag', dlg).textContent = c.dataset.tagline || '';
    $('h2', dlg).textContent = $('h3', c).textContent;
    $('.drawer__text', dlg).innerHTML = $('template', c).innerHTML;
    $('.drawer__uses', dlg).innerHTML = (c.dataset.uses || '').split('|').filter(Boolean).map(u => `<li>${u}</li>`).join('');
    $('.drawer__usesWrap', dlg).hidden = !c.dataset.uses;
    dlg.showModal(); dlg.scrollTop = 0; stopScroll();
    if (gsap && !reduce) gsap.from($$('.drawer__body > *', dlg), { y: 40, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', delay: .15 });
  }));
  const close = () => {
    if (!dlg.open) return;
    if (reduce) { dlg.close(); return; }
    dlg.classList.add('closing');
    setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); }, 380);
  };
  dlg.addEventListener('close', () => { $('.drawer__art video', dlg)?.pause(); startScroll(); });
  $('.drawer__close', dlg).addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* =========================================================
   SOUND: playable kit + live oscilloscope
   ========================================================= */
const kit = $('#kit');
if (kit) {
  let ac, master, analyser, noiseBuf;
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4;
    master = ac.createGain(); master.gain.value = .8;
    analyser = ac.createAnalyser(); analyser.fftSize = 2048;
    master.connect(comp); comp.connect(analyser); analyser.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
  const noise = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.start(t, Math.random() * .5); s.stop(t + dur); return s; };
  const V = {
    kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .35); env(g, t, .002, 1, .5); o.connect(g).connect(master); o.start(t); o.stop(t + .6); },
    snare(t) { const n = noise(t, .25), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 1200; env(g, t, .002, .7, .2); n.connect(f).connect(g).connect(master);
      const o = ac.createOscillator(), g2 = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + .1); env(g2, t, .002, .5, .12); o.connect(g2).connect(master); o.start(t); o.stop(t + .2); },
    hat(t) { const n = noise(t, .08), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 7500; env(g, t, .001, .35, .05); n.connect(f).connect(g).connect(master); },
    clap(t) { const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = .8; f.connect(master);
      [0, .012, .024, .04].forEach((d, i) => { const n = noise(t + d, .2), g = ac.createGain(); env(g, t + d, .001, i === 3 ? .8 : .5, i === 3 ? .16 : .02); n.connect(g).connect(f); }); },
    bass(t) { const o = ac.createOscillator(), g = ac.createGain(), sh = ac.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) c[i] = Math.tanh((i / 128 - 1) * 2.4); sh.curve = c;
      o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(48, t + .12); env(g, t, .004, .9, .9); o.connect(sh).connect(g).connect(master); o.start(t); o.stop(t + 1.1); },
    zap(t) { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(2400, t); o.frequency.exponentialRampToValueAtTime(90, t + .3); f.type = 'lowpass'; f.frequency.value = 3200; env(g, t, .002, .35, .28); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + .35); },
  };
  const pads = $$('.pad', kit), byKey = {}, byV = {};
  pads.forEach(p => { byKey[p.dataset.key] = p; byV[p.dataset.v] = p; });
  const pulse = $('.kit-pulse');
  const flash = p => {
    p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('hit'), 110);
    if (pulse && gsap && !reduce && (p.dataset.v === 'kick' || p.dataset.v === 'bass')) gsap.fromTo(pulse, { opacity: .55, scale: .96 }, { opacity: 0, scale: 1.04, duration: .5, ease: 'power2.out', overwrite: true });
  };
  function hit(p) { audio(); V[p.dataset.v](ac.currentTime + .005); flash(p); }
  pads.forEach(p => {
    p.addEventListener('pointerdown', e => { e.preventDefault(); hit(p); });
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(p); } });
  });
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || /input|textarea/i.test(e.target.tagName)) return; const p = byKey[e.key.toLowerCase()]; if (p) hit(p); });

  const PAT = { kick: [0, 3, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15], clap: [12], bass: [0, 7, 10], zap: [14] };
  const playBtn = $('#beat'); let playing = false, step = 0, next = 0, timer = 0;
  function schedule() {
    const spb = 60 / 96 / 4;
    while (next < ac.currentTime + .12) {
      for (const v in PAT) if (PAT[v].includes(step)) { V[v](next); const p = byV[v]; setTimeout(() => flash(p), Math.max(0, (next - ac.currentTime) * 1000)); }
      next += spb; step = (step + 1) % 16;
    }
  }
  playBtn.addEventListener('click', () => {
    audio(); playing = !playing;
    playBtn.setAttribute('aria-pressed', playing);
    playBtn.querySelector('span').textContent = playing ? 'Stop the beat' : 'Play a beat';
    if (playing) { step = 0; next = ac.currentTime + .05; timer = setInterval(schedule, 25); } else clearInterval(timer);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) playBtn.click(); });

  const c = $('#scope'), ctx = c.getContext('2d'), lvl = $('#scopeLvl');
  let W = 1, H = 1, buf, ph = 0, vis = false, raf = 0;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth || 1; H = c.clientHeight || 1; c.width = W * d | 0; c.height = H * d | 0; ctx.setTransform(d, 0, 0, d, 0, 0); };
  size(); new ResizeObserver(size).observe(c);
  function frame() {
    ph += .03;
    ctx.fillStyle = 'rgba(15,7,22,.38)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,236,245,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < 10; i++) { const x = (W * i / 10 | 0) + .5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let i = 1; i < 6; i++) { const y = (H * i / 6 | 0) + .5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    let peak = 0;
    const n = Math.ceil(W / 2) + 1, ys = new Float32Array(n);
    if (analyser) {
      if (!buf) buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      let z = 0; for (let i = 1; i < buf.length / 2; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { z = i; break; }
      for (let k = 0; k < n; k++) { const v = buf[z + (k * (buf.length / 2) / n | 0)] || 0; ys[k] = v; peak = Math.max(peak, Math.abs(v)); }
    }
    const idle = peak < .01;
    const grad = ctx.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#ffd36e'); grad.addColorStop(.5, '#ff2d8a'); grad.addColorStop(1, '#8b4dff');
    const path = () => { ctx.beginPath(); for (let k = 0; k < n; k++) { const x = k * 2, v = idle ? Math.sin(x / W * 12 + ph) * .06 + Math.sin(x / W * 31 - ph * 1.7) * .02 : Math.max(-1, Math.min(1, ys[k] * 2.4)); const y = H / 2 - v * H * .42; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
    path(); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,45,138,.14)'; ctx.stroke();
    path(); ctx.lineWidth = 2; ctx.strokeStyle = grad; ctx.stroke();
    lvl.textContent = idle ? 'idle' : (20 * Math.log10(peak)).toFixed(1) + ' dB';
    raf = vis && !reduce ? requestAnimationFrame(frame) : 0;
  }
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }).observe(c);
}

/* =========================================================
   ABOUT: photo deck you can throw
   ========================================================= */
const deckWrap = $('#deckCards');
if (deckWrap) {
  const cards = $$('.card', deckWrap), count = $('#deckCount');
  let order = cards.map((_, i) => i);
  const slot = i => `translate3d(${i * 7}px, ${i * -11}px, 0) rotate(${[0, -4, 3.5, -2][i] || 0}deg) scale(${1 - i * .045})`;
  const tr = 'transform .8s cubic-bezier(.2,.8,.15,1)';
  function layout() {
    order.forEach((ci, i) => {
      const el = cards[ci];
      el.style.zIndex = cards.length - i; el.classList.toggle('top', i === 0); el.setAttribute('aria-hidden', i !== 0);
      el.style.transition = reduce ? 'none' : tr; el.style.transform = slot(i);
    });
    count.textContent = String(order[0] + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
  }
  function next(dir = 1) {
    const top = cards[order[0]];
    if (reduce) { order.push(order.shift()); layout(); return; }
    top.style.transition = 'transform .38s cubic-bezier(.4,0,.6,1)';
    top.style.transform = `translate3d(${dir * 125}%, -6%, 0) rotate(${dir * 20}deg)`;
    setTimeout(() => { order.push(order.shift()); layout(); }, 300);
  }
  function prev() {
    order.unshift(order.pop());
    const el = cards[order[0]]; el.style.transition = 'none'; el.style.transform = 'translate3d(-125%, -6%, 0) rotate(-20deg)'; el.getBoundingClientRect(); layout();
  }
  $('#deckNext').addEventListener('click', () => next(1));
  $('#deckPrev').addEventListener('click', prev);
  deckWrap.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next(1); if (e.key === 'ArrowLeft') prev(); });
  let drag = null;
  deckWrap.addEventListener('pointerdown', e => { const el = e.target.closest('.card'); if (!el || el !== cards[order[0]]) return; drag = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, t: performance.now(), vx: 0, lx: e.clientX, decided: false }; });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.decided) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.decided = true;
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && e.pointerType !== 'mouse') { drag = null; return; }
      drag.el.setPointerCapture?.(e.pointerId); drag.el.style.transition = 'none'; drag.el.classList.add('held');
    }
    const now = performance.now(); drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.t); drag.lx = e.clientX; drag.t = now; drag.dx = dx;
    drag.el.style.transform = `translate3d(${dx}px, ${dy * .35}px, 0) rotate(${dx * .06}deg)`;
  }, { passive: true });
  const end = () => {
    if (!drag) return; const { el, dx, vx, decided } = drag; drag = null; el.classList.remove('held');
    if (!decided) return;
    if (Math.abs(dx) > deckWrap.clientWidth * .28 || Math.abs(vx) > .6) next(Math.sign(dx || vx));
    else { el.style.transition = 'transform .7s cubic-bezier(.3,1.5,.4,1)'; el.style.transform = slot(0); }
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  layout();
}

/* =========================================================
   CONTACT form (opens the visitor's mail app)
   ========================================================= */
const form = $('#form');
if (form) {
  const EMAIL = 'buildyourdreamwebsitedotcom@gmail.com';
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, note = $('#note'), ok = /^\S+@\S+\.\S+$/;
    const name = f.elements.name.value.trim(), email = f.elements.email.value.trim(), msg = f.elements.msg.value.trim(), type = f.elements.type.value;
    if (!name || !ok.test(email) || !msg) {
      note.className = 'form__note err';
      note.textContent = !name ? 'Add your name.' : !ok.test(email) ? 'That email doesn\'t look right.' : 'Write a short message.';
      (!name ? f.elements.name : !ok.test(email) ? f.elements.email : f.elements.msg).focus();
      return;
    }
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(type + ' enquiry from ' + name)}&body=${encodeURIComponent(msg + '\n\n' + name + ' (' + email + ')')}`;
    note.className = 'form__note'; note.textContent = 'Opening your mail app…';
  });
}

/* =========================================================
   CURSOR + magnetic buttons (mouse only)
   ========================================================= */
if (fine && !reduce && gsap) {
  const cur = document.createElement('div'); cur.className = 'cursor hide'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<i></i><b></b>'; document.body.append(cur);
  const lab = cur.querySelector('b');
  const xTo = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), yTo = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); cur.classList.remove('hide'); }, { passive: true });
  html.addEventListener('pointerleave', () => cur.classList.add('hide'));
  addEventListener('pointerdown', () => cur.classList.add('down')); addEventListener('pointerup', () => cur.classList.remove('down'));
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], a, button, .card, .pad');
    cur.classList.toggle('big', !!t);
    lab.textContent = t ? (t.dataset.cursor || '') : '';
  });
  $$('.btn, .rbtn').forEach(b => {
    const mx = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), my = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .25); my((e.clientY - r.top - r.height / 2) * .35); });
    b.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}
})();
