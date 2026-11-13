(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
const PAGE_NAMES = { 'index.html': 'Home', '': 'Home', 'work.html': 'Work', 'sound.html': 'Sound', 'about.html': 'About', 'contact.html': 'Contact' };

/* seeded random so the skyline and palms look the same every visit */
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* =========================================================
   1. ARRIVAL: intro loader (first visit) or sunset wipe (between pages)
   ========================================================= */
const wipe = $('#wipe');
const fromWipe = ss.get('wipe');
let startIntro;
const introReady = new Promise(r => (startIntro = r));
function releaseHold() { document.body.classList.remove('hold'); startIntro(); }

if (reduce) { ss.set('seen', '1'); ss.del('wipe'); $('#loader')?.remove(); releaseHold(); }
else if (fromWipe) {
  ss.del('wipe');
  $('#loader')?.remove();
  wipe.querySelector('span').textContent = fromWipe;
  wipe.classList.add('reveal');
  setTimeout(releaseHold, 250);
  wipe.addEventListener('animationend', e => { if (e.target === wipe) wipe.classList.remove('reveal'); });
} else if (!ss.get('seen')) {
  ss.set('seen', '1');
  runLoader();
} else { $('#loader')?.remove(); releaseHold(); }

function runLoader() {
  const L = $('#loader'); if (!L) { releaseHold(); return; }
  document.body.classList.add('loading');
  const num = $('.loader__num', L), name = $('.loader__name', L);
  $$('span', name).forEach((s, i) => (s.style.transitionDelay = (i * .05) + 's'));
  requestAnimationFrame(() => requestAnimationFrame(() => name.classList.add('on')));
  const t0 = performance.now(), MIN = 1900, MAX = 4500;
  let loaded = false;
  Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r)))]).then(() => (loaded = true));
  let shown = 0;
  (function tick(now) {
    const el = now - t0;
    const done = loaded && el > MIN;
    const target = done ? 100 : Math.min(90, el / MIN * 90);
    shown += (target - shown) * (done ? .18 : .08);
    if (el > MAX) shown = 100;
    const v = Math.min(100, Math.round(shown + .4));
    L.style.setProperty('--lp', v + '%');
    num.textContent = String(v).padStart(3, '0');
    if (v < 100) requestAnimationFrame(tick);
    else setTimeout(() => {
      L.classList.add('out');
      document.body.classList.remove('loading');
      setTimeout(releaseHold, 200);
      setTimeout(() => L.remove(), 1300);
    }, 250);
  })(t0);
}

// leaving: cover with the wipe, then go
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
  if (url.pathname === location.pathname) return;
  if (reduce) return;
  e.preventDefault();
  const name = PAGE_NAMES[url.pathname.split('/').pop()] || '';
  wipe.querySelector('span').textContent = name;
  wipe.classList.remove('reveal'); wipe.classList.add('cover');
  ss.set('wipe', name);
  setTimeout(() => { location.href = url.href; }, 640);
});
addEventListener('pageshow', e => { if (e.persisted) { wipe.classList.remove('cover', 'reveal'); ss.del('wipe'); } });

/* =========================================================
   2. NAV
   ========================================================= */
const nav = $('#nav'), menuBtn = $('#menuBtn'), sheet = $('#sheet');
let lastY = scrollY, sheetOpen = false;
function navScroll() {
  const y = scrollY;
  nav.classList.toggle('solid', y > 40);
  if (!sheetOpen && y > lastY + 2 && y > 400) nav.classList.add('away');
  if (y < lastY - 2) nav.classList.remove('away');
  lastY = y;
}
addEventListener('scroll', navScroll, { passive: true }); navScroll();
function setSheet(open) {
  sheetOpen = open; menuBtn.setAttribute('aria-expanded', open);
  if (open) { sheet.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open'))); document.body.style.overflow = 'hidden'; nav.classList.remove('away'); }
  else { sheet.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => { if (!sheetOpen) sheet.hidden = true; }, reduce ? 0 : 800); }
}
menuBtn.addEventListener('click', () => setSheet(!sheetOpen));
sheet.addEventListener('click', e => { const a = e.target.closest('a'); if (a && a.getAttribute('aria-current') === 'page') { e.preventDefault(); setSheet(false); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen) { setSheet(false); menuBtn.focus(); } });

/* =========================================================
   3. SCROLL REVEALS + one shared scroll loop
   ========================================================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0 });
function reveal(sel, cls = 'rv', step = .08) {
  $$(sel).forEach(el => {
    if (reduce) { el.classList.add('in'); return; }
    el.classList.add(cls);
    const sibs = [...el.parentElement.children];
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * step + 's');
    io.observe(el);
  });
}
// footer word is split right away so it never flashes
const fw = $('.foot__word');
if (fw) { fw.setAttribute('aria-label', fw.textContent); fw.innerHTML = [...fw.textContent].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c}</span>`).join(''); }
introReady.then(() => {
  reveal('.eyebrow, .lede, .h2, .h3, .stats div, .tool, .board, .split p, .chips, .bio p, .handles, .also__grid article, .links, .form, .kit__bar, .cta .btn, .rail-head > *, .posters__head > *, .filters');
  reveal('.grid-work .pcard, .scope, .pads', 'clip', .07);
  if (fw) reduce ? fw.classList.add('in') : io.observe(fw);
});

const countIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; countIO.unobserve(e.target);
  const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1800;
  if (reduce) { el.textContent = end; return; }
  const tick = t => { const p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * k); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}), { threshold: .6 });
$$('[data-count]').forEach(el => countIO.observe(el));

const scrollFx = [];
let sraf = 0, vel = 0, prevY = scrollY;
function runFx() {
  sraf = 0;
  const y = scrollY; vel = vel * .8 + (y - prevY) * .2; prevY = y;
  for (const f of scrollFx) f(y, vel);
  if (Math.abs(vel) > .3) sraf = requestAnimationFrame(runFx);
}
const kick = () => { if (!sraf) sraf = requestAnimationFrame(runFx); };
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);

/* =========================================================
   4. HOME: sunset scene
   ========================================================= */
const scene = $('#scene');
if (scene) {
  const stars = $('.stars', scene);
  [0, 1].forEach(() => {
    const i = document.createElement('i'), sh = [];
    for (let n = 0; n < 70; n++) sh.push(`${(rnd() * 100).toFixed(2)}vw ${(rnd() * 60).toFixed(2)}svh 0 ${rnd() < .15 ? 1 : 0}px rgba(255,${200 + (rnd() * 55 | 0)},${220 + (rnd() * 35 | 0)},${(.35 + rnd() * .6).toFixed(2)})`);
    i.style.boxShadow = sh.join(','); stars.append(i);
  });

  const sky = $('.skyline', scene);
  function buildSkyline() {
    seed = 21;
    const W = Math.max(1, sky.clientWidth), H = Math.max(1, sky.clientHeight);
    let x = 0, out = '', win = '';
    while (x < W) {
      const bw = 18 + rnd() * 54, mid = Math.abs(x / W - .5) < .22;
      const bh = H * (mid ? .25 + rnd() * .45 : .3 + rnd() * .7);
      const y = H - bh;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}"/>`;
      if (rnd() < .18) out += `<rect x="${(x + bw / 2 - 1).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="2" height="14"/>`;
      for (let wy = y + 6; wy < H - 6; wy += 7) for (let wx = x + 4; wx < x + bw - 5; wx += 6) {
        if (rnd() < .13) win += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2.4" height="3" fill="${rnd() < .6 ? '#ffd36e' : '#ff6fb0'}" opacity="${(.5 + rnd() * .5).toFixed(2)}"/>`;
      }
      x += bw + (rnd() < .3 ? 2 + rnd() * 10 : 0);
    }
    sky.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><g fill="#2a0e3c">${out}</g><g>${win}</g></svg>`;
  }

  // palm trees drawn from code: curved trunk + drooping, serrated fronds
  function palm(cx, by, h, lean, s) {
    const L1 = [], R1 = [], top = { x: cx + lean, y: by - h };
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, mx = cx + lean * .15, my = by - h * .5;
      const x = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * mx + t * t * top.x;
      const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * top.y;
      const w = (17 - 9 * t) * s * (i % 3 === 0 ? 1.08 : 1);
      L1.push([x - w / 2, y]); R1.unshift([x + w / 2, y]);
    }
    let d = 'M' + L1.concat(R1).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
    [-172, -150, -128, -104, -80, -55, -32, -10, -160, -20].forEach((a0, k) => {
      const a = (a0 + (rnd() - .5) * 12) * Math.PI / 180, L = h * (.36 + rnd() * .14) * (k > 7 ? .7 : 1);
      const dx = Math.cos(a), dy = Math.sin(a), g = .9 + rnd() * .5;
      const left = [], right = [], N = 16;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = top.x + dx * L * t, y = top.y + dy * L * t + g * L * t * t * .75;
        const tx = dx, ty = dy + 2 * g * t * .75, tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const w = 13 * s * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (i % 2 ? 1 : .35) + 1.2;
        left.push([x + nx * w, y + ny * w + (i % 2 ? 6 * s * t : 0)]);
        right.unshift([x - nx * w, y - ny * w + (i % 2 ? 6 * s * t : 0)]);
      }
      d += 'M' + left.concat(right).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
    });
    return d;
  }
  function buildPalms() {
    const mk = (flip, sd) => {
      seed = sd;
      const big = palm(170, 1000, 860, 70, 1.25), small = palm(40, 1000, 560, 34, .85);
      return `<svg viewBox="0 -120 600 1120" preserveAspectRatio="xMinYMax meet" aria-hidden="true"${flip ? ' style="transform:scaleX(-1)"' : ''}><g fill="#12051c"><path class="palm" d="${big}"/><path class="palm b" d="${small}"/></g></svg>`;
    };
    $('.palm-l', scene).innerHTML = mk(false, 99);
    $('.palm-r', scene).innerHTML = mk(true, 314);
  }

  // ocean: sun reflection broken up by little waves, plus swell lines
  const oc = $('.ocean canvas', scene), octx = oc.getContext('2d');
  let OW = 1, OH = 1, ot = 0, oraf = 0, ovis = true;
  function sizeOcean() { const d = Math.min(devicePixelRatio || 1, 1.5); OW = oc.clientWidth || 1; OH = oc.clientHeight || 1; oc.width = OW * d | 0; oc.height = OH * d | 0; octx.setTransform(d, 0, 0, d, 0, 0); }
  function drawOcean() {
    ot += 1 / 60;
    const g = octx.createLinearGradient(0, 0, 0, OH);
    g.addColorStop(0, '#5a1a6a'); g.addColorStop(.25, '#2c0d40'); g.addColorStop(1, '#0d0614');
    octx.fillStyle = g; octx.fillRect(0, 0, OW, OH);
    const cx = OW / 2, sw = Math.min(OW * .64, 620) * .5;
    for (let y = 2; y < OH; y += 3) {
      const k = y / OH, persp = Math.pow(k, .7);
      const w = sw * (1 - k * .55) * (.55 + .45 * Math.sin(ot * 1.6 + y * .21) * Math.sin(ot * .7 + y * .05));
      if (w <= 2) continue;
      const off = Math.sin(ot * 1.1 + y * .09) * (6 + 14 * k);
      const gg = 211 - 170 * persp | 0, b = 110 + 28 * persp | 0;
      octx.fillStyle = `rgba(255,${gg},${b},${(.75 * (1 - k * .85)).toFixed(3)})`;
      octx.fillRect(cx - w + off, y, w * 2, 1.4 + k * 1.2);
    }
    octx.strokeStyle = 'rgba(255,140,200,.08)'; octx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const k = ((i / 14) + ot * .02) % 1, y = Math.pow(k, 1.8) * OH;
      octx.beginPath(); octx.moveTo(0, y); octx.lineTo(OW, y); octx.stroke();
    }
    oraf = ovis && !reduce && !document.hidden ? requestAnimationFrame(drawOcean) : 0;
  }
  const startOcean = () => { if (!oraf && ovis && !document.hidden && !reduce) oraf = requestAnimationFrame(drawOcean); };
  new IntersectionObserver(([e]) => { ovis = e.isIntersecting; startOcean(); }).observe(scene);
  document.addEventListener('visibilitychange', startOcean);

  const h1 = $('.title h1', scene);
  h1.setAttribute('aria-label', h1.textContent.trim());
  h1.innerHTML = [...h1.textContent.trim()].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c}</span>`).join('');

  let lw = 0;
  function layoutScene() {
    sizeOcean();
    if (Math.abs(innerWidth - lw) < 2) return;
    lw = innerWidth; buildSkyline(); buildPalms();
    if (reduce) drawOcean();
  }
  layoutScene();
  new ResizeObserver(layoutScene).observe(scene);
  startOcean();

  let tx = 0, ty = 0, px = 0, py = 0, praf = 0;
  const pl = () => { px += (tx - px) * .06; py += (ty - py) * .06; scene.style.setProperty('--px', px.toFixed(3)); scene.style.setProperty('--py', py.toFixed(3)); praf = Math.abs(tx - px) + Math.abs(ty - py) > .002 ? requestAnimationFrame(pl) : 0; };
  if (fine && !reduce) addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; if (!praf) praf = requestAnimationFrame(pl); }, { passive: true });

  // fly-through while the scene is pinned
  const pin = $('.scene-pin');
  scrollFx.push(() => {
    const r = pin.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight);
    scene.style.setProperty('--p', clamp(-r.top / span, 0, 1).toFixed(4));
  });
}

/* statement: words light up as you read down */
const stmt = $('.statement p');
if (stmt) {
  const text = stmt.textContent.trim();
  const hot = (stmt.dataset.hot || '').split(',').map(s => s.trim().toLowerCase());
  stmt.setAttribute('aria-label', text);
  stmt.innerHTML = text.split(/\s+/).map(w => `<span class="wd${hot.includes(w.replace(/[^\w-]/g, '').toLowerCase()) ? ' hot' : ''}" aria-hidden="true">${w}</span>`).join(' ');
  const wds = $$('.wd', stmt);
  scrollFx.push(() => {
    const r = stmt.getBoundingClientRect();
    const p = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
    const n = Math.round(p * wds.length);
    wds.forEach((w, i) => w.classList.toggle('lit', i < n));
  });
}

/* posters: fan in, then tilt with the mouse */
const prow = $('.poster-row');
if (prow) {
  $$('.poster', prow).forEach((p, i) => p.style.setProperty('--n', i));
  if (!reduce && innerWidth > 760) {
    prow.classList.add('fan');
    introReady.then(() => io.observe(prow));
    prow.addEventListener('transitionend', e => { if (e.propertyName === 'transform' && e.target.classList.contains('poster')) e.target.classList.add('settled'); });
  }
  if (fine && !reduce) $$('.poster', prow).forEach(p => {
    p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      p.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg'); p.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
      p.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); p.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    p.addEventListener('pointerleave', () => { p.style.setProperty('--rx', '0deg'); p.style.setProperty('--ry', '0deg'); });
  });
}

/* horizontal pinned rail: scrolling down slides the builds sideways */
const hpin = $('.hpin');
if (hpin && !reduce) {
  const track = $('.hpin__track', hpin);
  let dist = 0;
  const size = () => { dist = Math.max(0, track.scrollWidth - innerWidth); hpin.style.height = (dist + innerHeight) + 'px'; kick(); };
  size(); addEventListener('resize', size); document.fonts?.ready.then(size); addEventListener('load', size);
  scrollFx.push(() => {
    const r = hpin.getBoundingClientRect();
    const p = dist ? clamp(-r.top / dist, 0, 1) : 0;
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    hpin.style.setProperty('--hp', p.toFixed(4));
  });
}

/* marquee reacts to scroll speed and direction */
const mq = $('.marquee div');
if (mq && !reduce) {
  mq.style.animation = 'none';
  let x = 0, dir = 1, mraf = 0, w = 0, vis = false;
  const loop = () => {
    if (!w) w = mq.scrollWidth / 2;
    if (Math.abs(vel) > 1) dir = vel > 0 ? 1 : -1;
    x -= (1.1 + Math.min(Math.abs(vel) * .5, 22)) * dir;
    if (x < -w) x += w; if (x > 0) x -= w;
    mq.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    mraf = vis ? requestAnimationFrame(loop) : 0;
  };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !mraf) mraf = requestAnimationFrame(loop); }).observe(mq);
}

/* =========================================================
   5. WORK: filters (with FLIP animation) + detail drawer
   ========================================================= */
const grid = $('.grid-work');
if (grid) {
  const cards = $$('.pcard', grid), btns = $$('.filters button');
  function filter(cat) {
    const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.f === cat));
    cards.forEach(c => { c.hidden = !(cat === 'all' || c.dataset.cat.split(' ').includes(cat)); c.classList.add('in'); });
    if (reduce) return;
    cards.forEach(c => {
      if (c.hidden) return;
      const a = first.get(c), b = c.getBoundingClientRect();
      if (!a.width) { c.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.7,.1,1)' }); return; }
      c.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.7,.1,1)' });
    });
  }
  btns.forEach(b => b.addEventListener('click', () => { filter(b.dataset.f); history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : '#' + b.dataset.f); }));
  const h = location.hash.slice(1);
  if (h && btns.some(b => b.dataset.f === h)) filter(h);

  const dlg = $('#drawer');
  cards.forEach(c => c.addEventListener('click', () => {
    const art = $('.drawer__art', dlg);
    art.className = 'drawer__art ' + ([...c.classList].find(k => k.startsWith('bg-')) || '');
    art.innerHTML = $('.pcard__art', c).innerHTML;
    $('.drawer__tag', dlg).textContent = c.dataset.tagline || '';
    $('h2', dlg).textContent = $('h3', c).textContent;
    $('.drawer__text', dlg).innerHTML = $('template', c).innerHTML;
    $('.drawer__uses', dlg).innerHTML = (c.dataset.uses || '').split('|').filter(Boolean).map(u => `<li>${u}</li>`).join('');
    $('.drawer__usesWrap', dlg).hidden = !c.dataset.uses;
    dlg.showModal(); dlg.scrollTop = 0; document.body.style.overflow = 'hidden';
  }));
  const close = () => {
    if (!dlg.open) return;
    if (reduce) { dlg.close(); return; }
    dlg.classList.add('closing');
    setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); }, 380);
  };
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; });
  $('.drawer__close', dlg).addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* =========================================================
   6. SOUND: playable kit + live oscilloscope
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
  const flash = p => { p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('hit'), 110); };
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
   7. ABOUT: photo deck you can throw + roadmap trace
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
const trace = $('#trace');
if (trace) {
  const items = $$('li', trace);
  scrollFx.push(() => {
    const r = trace.getBoundingClientRect(), line = innerHeight * .65;
    trace.style.setProperty('--tp', clamp((line - r.top) / r.height, 0, 1).toFixed(3));
    items.forEach(li => li.classList.toggle('on', li.getBoundingClientRect().top < line));
  });
}

/* =========================================================
   8. CONTACT form (opens the visitor's mail app)
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
   9. CURSOR + magnetic buttons (mouse only)
   ========================================================= */
if (fine && !reduce) {
  const cur = document.createElement('div'); cur.className = 'cursor hide'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<i></i><b></b>'; document.body.append(cur);
  const lab = cur.querySelector('b');
  let mx = -100, my = -100, cx = -100, cy = -100, craf = 0;
  const loop = () => { cx += (mx - cx) * .2; cy += (my - cy) * .2; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; craf = Math.abs(mx - cx) + Math.abs(my - cy) > .3 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.remove('hide'); if (!craf) craf = requestAnimationFrame(loop); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cur.classList.add('hide'));
  addEventListener('pointerdown', () => cur.classList.add('down')); addEventListener('pointerup', () => cur.classList.remove('down'));
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], a, button, .card, .pad');
    cur.classList.toggle('big', !!t);
    lab.textContent = t ? (t.dataset.cursor || '') : '';
  });
  $$('.btn, .rbtn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

introReady.then(kick);
kick();
})();
