(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- nav: solid after hero top, hides on scroll down, menu sheet ---------- */
const nav = $('#nav'), menuBtn = $('#menuBtn'), sheet = $('#sheet');
let lastY = scrollY, sheetOpen = false;
function onScrollNav() {
  const y = scrollY;
  nav.classList.toggle('solid', y > 40);
  nav.classList.toggle('away', !sheetOpen && y > lastY && y > innerHeight * .6);
  lastY = y;
}
addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();
function setSheet(open) {
  sheetOpen = open;
  menuBtn.setAttribute('aria-expanded', open);
  if (open) { sheet.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open'))); document.body.style.overflow = 'hidden'; nav.classList.remove('away'); nav.classList.add('solid'); }
  else { sheet.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => { if (!sheetOpen) sheet.hidden = true; }, reduce ? 0 : 700); }
}
menuBtn.addEventListener('click', () => setSheet(!sheetOpen));
sheet.addEventListener('click', e => { if (e.target.closest('a')) setSheet(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen) { setSheet(false); menuBtn.focus(); } });

// highlight the section you're in
const navLinks = $$('.nav__links a');
const secObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['ionic-leap', 'work', 'sound', 'about'].forEach(id => secObs.observe(document.getElementById(id)));

/* ---------- headings split into words; reveal on scroll ---------- */
$$('.h2').forEach(h => {
  let k = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--k', k++);
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  walk(h);
  $$('.w', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
});
const revealTargets = [...$$('.h2'), ...$$('.lede, .leap__award, .skill, .garage article, .scope, .handles, .links, .form, .about__text > p:not(.eyebrow):not(.lede), .sound__text .btn, .eyebrow')];
if (reduce) revealTargets.forEach(el => el.classList.add('in'));
else {
  const ro = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); ro.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px', threshold: .05 });
  revealTargets.forEach(el => {
    if (!el.classList.contains('h2')) {
      el.classList.add('rv');
      const sibs = [...el.parentElement.children].filter(c => revealTargets.includes(c));
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * .08 + 's');
    }
    ro.observe(el);
  });
}

/* ---------- hero counters ---------- */
function counters() {
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, t0 = performance.now(), dur = 1600;
    if (reduce) { el.textContent = end; return; }
    const tick = t => { const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}
setTimeout(counters, reduce ? 0 : 900);

/* ---------- hero: live ion-wind field ----------
   Positive emitter wire, negative collector. Ions follow the electric field
   from one to the other. Your cursor (or finger) is a positive charge that bends them. */
const cvs = $('#field'), hero = $('.hero');
(function field() {
  const ctx = cvs.getContext('2d', { alpha: false });
  let W, H, dpr, charges = [], P = [], N, emit, coll, mobile;
  const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, last: -1e9, q: 0 };
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = cvs.clientWidth; H = cvs.clientHeight;
    cvs.width = W * dpr | 0; cvs.height = H * dpr | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 760;
    emit = mobile ? { x0: W * .1, x1: W * .9, y: H * .13 } : { x0: W * .5, x1: W * .95, y: H * .135 };
    coll = mobile ? { x0: -W * .1, x1: W * 1.1, y: H * .99 } : { x0: W * .44, x1: W * 1.02, y: H * .84 };
    charges = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      charges.push({ x: emit.x0 + (emit.x1 - emit.x0) * t, y: emit.y, q: 1 });
      charges.push({ x: coll.x0 + (coll.x1 - coll.x0) * t, y: coll.y, q: -1.15 });
    }
    N = mobile ? 420 : 1000;
    P = Array.from({ length: N }, () => spawn({}, true));
    ctx.fillStyle = '#0b0c0e'; ctx.fillRect(0, 0, W, H);
  }
  function spawn(p, anywhere) {
    p.x = emit.x0 + Math.random() * (emit.x1 - emit.x0);
    p.y = emit.y + (Math.random() - .5) * 6;
    if (anywhere) p.y = emit.y + Math.random() * (coll.y - emit.y);
    p.age = 0; p.life = 220 + Math.random() * 260;
    p.px = p.x; p.py = p.y;
    return p;
  }
  function E(x, y) {
    let ex = 0, ey = 0;
    for (let i = 0; i < charges.length; i++) {
      const c = charges[i], dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 120;
      const f = c.q / r2; ex += dx * f; ey += dy * f;
    }
    if (ptr.q > .01) {
      const dx = x - ptr.x, dy = y - ptr.y, r2 = dx * dx + dy * dy + 400;
      const f = 14 * ptr.q / r2; ex += dx * f; ey += dy * f;
    }
    return [ex, ey];
  }
  function drawElectrodes() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(236,233,226,.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(emit.x0, emit.y); ctx.lineTo(emit.x1, emit.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(157,140,255,.18)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(emit.x0, emit.y); ctx.lineTo(emit.x1, emit.y); ctx.stroke();
    ctx.fillStyle = 'rgba(38,40,48,.9)';
    ctx.fillRect(coll.x0, coll.y - 3, coll.x1 - coll.x0, 6);
    if (!mobile) {
      ctx.font = '500 10px "Geist Mono", monospace'; ctx.fillStyle = 'rgba(155,154,148,.7)'; ctx.textAlign = 'right';
      ctx.fillText('+ EMITTER WIRE', emit.x1, emit.y - 12);
      ctx.fillText('− COLLECTOR', Math.min(coll.x1, W) - 16, coll.y + 20);
    }
    ctx.restore();
  }
  let t = 0;
  function step() {
    t++;
    // a gentle wandering charge when nobody is touching it, so the field never sits still
    const idle = performance.now() - ptr.last > 2500;
    if (idle) {
      const cx = (emit.x0 + emit.x1) / 2, cy = (emit.y + coll.y) / 2;
      ptr.tx = cx + Math.cos(t * .006) * (emit.x1 - emit.x0) * .32;
      ptr.ty = cy + Math.sin(t * .011) * (coll.y - emit.y) * .22;
      ptr.q += (.55 - ptr.q) * .02;
    } else ptr.q += (1 - ptr.q) * .1;
    ptr.x += (ptr.tx - ptr.x) * .12; ptr.y += (ptr.ty - ptr.y) * .12;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(11,12,14,.16)';
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.1;
    ctx.globalCompositeOperation = 'lighter';
    const span = coll.y - emit.y;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      let [ex, ey] = E(p.x, p.y);
      const m = Math.hypot(ex, ey) || 1;
      const sp = clamp(m * 900, .9, 4.2);
      p.px = p.x; p.py = p.y;
      p.x += ex / m * sp; p.y += ey / m * sp;
      p.age++;
      if (p.age > p.life || p.y > coll.y - 2 && p.x > coll.x0 && p.x < coll.x1 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) { spawn(p); continue; }
      const k = clamp((p.y - emit.y) / span, 0, 1);
      // violet near the wire (corona), warming to amber as ions reach the collector
      const r = 157 + 98 * k | 0, g = 140 - 49 * k | 0, b = 255 - 224 * k | 0;
      const a = .5 * Math.min(1, p.age / 20) * (1 - Math.max(0, (p.age - p.life + 40) / 40));
      ctx.strokeStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (t % 2 === 0) drawElectrodes();
  }
  let raf = 0, visible = true;
  const loop = () => { step(); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  layout();
  if (reduce) { for (let i = 0; i < 160; i++) step(); drawElectrodes(); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  let rw = W, rh = H;
  new ResizeObserver(() => {
    // ignore the small height jumps from mobile address bars
    if (Math.abs(cvs.clientWidth - rw) < 2 && Math.abs(cvs.clientHeight - rh) < 120) return;
    rw = cvs.clientWidth; rh = cvs.clientHeight; layout(); if (reduce) { for (let i = 0; i < 160; i++) step(); drawElectrodes(); }
  }).observe(cvs);
  const move = e => { const r = cvs.getBoundingClientRect(); ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top; ptr.last = performance.now(); };
  hero.addEventListener('pointermove', move, { passive: true });
  hero.addEventListener('pointerdown', e => { move(e); ptr.x = ptr.tx; ptr.y = ptr.ty; }, { passive: true });
  start();
})();

/* ---------- Ionic Leap: steps drive the diagram ---------- */
const rig = $('#rig'), rigLabel = $('#rigLabel'), rigMeter = $('#rigMeter'), ionsG = $('#rigIons');
const labels = ['Step 0 · Idle', 'Step 1 · High voltage on', 'Step 2 · Corona discharge', 'Step 3 · Ionic wind', 'Step 4 · Thrust'];
const steps = $$('.step');
function setStep(n) {
  rig.dataset.step = n;
  rigLabel.textContent = labels[n];
  rigMeter.style.width = n * 25 + '%';
  steps.forEach(s => s.classList.toggle('on', +s.dataset.step === n));
}
// on phones the diagram is pinned over the top of the screen, so read the step lower down
const stepMargin = matchMedia('(max-width: 760px)').matches ? '-66% 0px -32% 0px' : '-48% 0px -48% 0px';
const stepObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: stepMargin });
steps.forEach(s => stepObs.observe(s));
new IntersectionObserver(([e]) => { if (!e.isIntersecting && e.boundingClientRect.top > 0) setStep(0); }).observe($('.leap__steps'));
// ions in the diagram
const NS = 'http://www.w3.org/2000/svg';
const ions = Array.from({ length: 34 }, () => {
  const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 1.8); ionsG.append(c);
  return { el: c, x: 70 + Math.random() * 260, y: 116 + Math.random() * 170, v: .9 + Math.random() * 1.3, w: Math.random() * 6.28 };
});
let ionRaf = 0, rigVisible = false;
function ionLoop() {
  const run = +rig.dataset.step >= 3;
  if (run) for (const p of ions) {
    p.y += p.v * 1.4; p.w += .05;
    if (p.y > 288) { p.y = 116; p.x = 70 + Math.random() * 260; }
    p.el.setAttribute('cx', (p.x + Math.sin(p.w) * 2).toFixed(1));
    p.el.setAttribute('cy', p.y.toFixed(1));
    p.el.setAttribute('opacity', (Math.min(1, (p.y - 116) / 20) * Math.min(1, (288 - p.y) / 16)).toFixed(2));
  }
  ionRaf = rigVisible && !reduce ? requestAnimationFrame(ionLoop) : 0;
}
ions.forEach(p => { p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1)); });
new IntersectionObserver(([e]) => { rigVisible = e.isIntersecting; if (rigVisible && !ionRaf) ionRaf = requestAnimationFrame(ionLoop); }).observe(rig);

/* ---------- work index accordion ---------- */
$$('.row').forEach((row, i) => {
  const btn = $('.row__head', row);
  const set = open => { row.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', () => set(!row.classList.contains('open')));
  if (i === 0) set(true);
});

/* ---------- sound: oscilloscope (scroll speed adds energy, pointer tunes it) ---------- */
(function scope() {
  const c = $('#scope'), ctx = c.getContext('2d'), hz = $('#scopeHz');
  let W, H, dpr, energy = .35, tune = .5, ph = 0, raf = 0, vis = false, ly = scrollY;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth; H = c.clientHeight; c.width = W * dpr | 0; c.height = H * dpr | 0; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0d0f0d'; ctx.fillRect(0, 0, W, H); }
  function grid() {
    ctx.strokeStyle = 'rgba(236,233,226,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < 10; i++) { const x = W * i / 10 | 0; ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (let i = 1; i < 8; i++) { const y = H * i / 8 | 0; ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236,233,226,.12)'; ctx.beginPath(); ctx.moveTo(0, H / 2 + .5); ctx.lineTo(W, H / 2 + .5); ctx.stroke();
  }
  function frame() {
    const dy = Math.abs(scrollY - ly); ly = scrollY;
    energy += (clamp(.35 + dy * .02, .35, 1) - energy) * .08;
    ph += .045 + tune * .03;
    ctx.fillStyle = 'rgba(13,15,13,.34)'; ctx.fillRect(0, 0, W, H);
    grid();
    const f1 = 2 + tune * 4, A = H * .32 * energy;
    const draw = (lw, col) => {
      ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const u = x / W * Math.PI * 2;
        const y = Math.sin(u * f1 + ph) * .62 + Math.sin(u * f1 * 2.01 - ph * 1.7) * .24 * energy + Math.sin(u * f1 * 3.97 + ph * .6) * .12 + Math.sin(u * 17 + ph * 3) * .04 * energy;
        x ? ctx.lineTo(x, H / 2 + y * A) : ctx.moveTo(x, H / 2 + y * A);
      }
      ctx.stroke();
    };
    draw(6, 'rgba(255,91,31,.12)');
    draw(1.6, 'rgba(255,150,90,.95)');
    if ((ph * 10 | 0) % 6 === 0) hz.textContent = Math.round(55 * Math.pow(2, f1 / 2)) + ' Hz';
    raf = vis && !reduce ? requestAnimationFrame(frame) : 0;
  }
  size();
  new ResizeObserver(size).observe(c);
  if (reduce) { vis = false; frame(); }
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf && !reduce) raf = requestAnimationFrame(frame); }).observe(c);
  c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); tune = clamp((e.clientX - r.left) / r.width, 0, 1); }, { passive: true });
})();

/* ---------- about: photo deck you can throw ---------- */
(function deck() {
  const wrap = $('#deckCards'), cards = $$('.card', wrap), count = $('#deckCount');
  let order = cards.map((_, i) => i);
  const slot = i => {
    const rot = [0, -4, 3.5, -2][i] || 0;
    return `translate3d(${i * 6}px, ${i * -10}px, 0) rotate(${rot}deg) scale(${1 - i * .045})`;
  };
  const tr = 'transform .8s cubic-bezier(.2,.8,.15,1)';
  function layout(skip) {
    order.forEach((ci, i) => {
      const el = cards[ci];
      el.style.zIndex = cards.length - i;
      el.classList.toggle('top', i === 0);
      el.setAttribute('aria-hidden', i !== 0);
      if (skip !== ci) { el.style.transition = reduce ? 'none' : tr; el.style.transform = slot(i); }
    });
    count.textContent = String(order[0] + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
  }
  function next(dir = 1) {
    const top = cards[order[0]];
    if (reduce) { order.push(order.shift()); layout(); return; }
    top.style.transition = 'transform .38s cubic-bezier(.4,0,.6,1)';
    top.style.transform = `translate3d(${dir * 120}%, -6%, 0) rotate(${dir * 18}deg)`;
    setTimeout(() => { order.push(order.shift()); layout(); }, 300);
  }
  function prev() {
    order.unshift(order.pop());
    const el = cards[order[0]];
    el.style.transition = 'none';
    el.style.transform = 'translate3d(-120%, -6%, 0) rotate(-18deg)';
    el.getBoundingClientRect();
    layout();
  }
  $('#deckNext').addEventListener('click', () => next(1));
  $('#deckPrev').addEventListener('click', prev);
  wrap.setAttribute('tabindex', '0'); wrap.setAttribute('aria-label', 'Photos of Doorgesh. Use the arrow keys to flip through.');
  wrap.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next(1); if (e.key === 'ArrowLeft') prev(); });

  // drag with a little physics: follow the finger, throw if fast or far enough, spring back otherwise
  let drag = null;
  wrap.addEventListener('pointerdown', e => {
    const el = e.target.closest('.card'); if (!el || el !== cards[order[0]]) return;
    drag = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t: performance.now(), vx: 0, lx: e.clientX, decided: false };
  });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.decided) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.decided = true;
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && e.pointerType !== 'mouse') { drag = null; return; } // let the page scroll
      drag.el.setPointerCapture?.(e.pointerId);
      drag.el.style.transition = 'none';
      drag.el.classList.add('held');
    }
    const now = performance.now();
    drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.t); drag.lx = e.clientX; drag.t = now;
    drag.dx = dx; drag.dy = dy;
    drag.el.style.transform = `translate3d(${dx}px, ${dy * .35}px, 0) rotate(${dx * .06}deg)`;
  }, { passive: true });
  const end = () => {
    if (!drag) return;
    const { el, dx, vx, decided } = drag; drag = null;
    el.classList.remove('held');
    if (!decided) return;
    if (Math.abs(dx) > wrap.clientWidth * .28 || Math.abs(vx) > .6) next(Math.sign(dx || vx));
    else { el.style.transition = 'transform .7s cubic-bezier(.3,1.5,.4,1)'; el.style.transform = slot(0); }
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  layout();
})();

/* ---------- roadmap trace draws with scroll ---------- */
const trace = $('#trace'), traceItems = $$('li', trace);
let traceRaf = 0;
function traceUpdate() {
  traceRaf = 0;
  const r = trace.getBoundingClientRect(), line = innerHeight * .65;
  trace.style.setProperty('--tp', clamp((line - r.top) / r.height, 0, 1).toFixed(3));
  traceItems.forEach(li => li.classList.toggle('on', li.getBoundingClientRect().top < line));
}
addEventListener('scroll', () => { if (!traceRaf) traceRaf = requestAnimationFrame(traceUpdate); }, { passive: true });
traceUpdate();

/* ---------- magnetic buttons (mouse only) ---------- */
if (finePointer && !reduce) $$('.btn, .deck__btn').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`; });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});

/* ---------- contact form: opens the visitor's mail app ---------- */
const EMAIL = 'buildyourdreamwebsitedotcom@gmail.com';
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, note = $('#note');
  const name = f.name.value.trim(), email = f.email.value.trim(), msg = f.msg.value.trim(), type = f.type.value;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) {
    note.className = 'form__note err';
    note.textContent = !name ? 'Add your name.' : !/^\S+@\S+\.\S+$/.test(email) ? 'That email doesn\'t look right.' : 'Write a short message.';
    (!name ? f.name : !/^\S+@\S+\.\S+$/.test(email) ? f.email : f.msg).focus();
    return;
  }
  const body = `${msg}\n\n${name} (${email})`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(type + ' enquiry from ' + name)}&body=${encodeURIComponent(body)}`;
  note.className = 'form__note';
  note.textContent = 'Opening your mail app…';
});
})();
