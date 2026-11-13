/* Home: a live 3D sunset drive (three.js) + the cinematic intro.
   Falls back to the CSS sunset if WebGL isn't available. */
import * as THREE from 'three';

const DG = window.DG || {};
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, SplitText = window.SplitText;
const sceneEl = document.getElementById('scene');
const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 760;

let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ---------- state the intro + scroll drive ---------- */
const S = { camY: 2.4, camZ: 8, lookY: 7.5, speed: 14, sunY: 24, fovAdd: 0, shake: 0, p: 0, px: 0, py: 0, tpx: 0, tpy: 0, hold: document.documentElement.classList.contains('loading') };

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (!renderer) {
  sceneEl.classList.add('nogl');
} else {
  sceneEl.classList.add('gl-on');
  build();
}

function build() {
  let pr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#5a1660');
  scene.fog = new THREE.Fog(FOG, 26, 165);

  // sky
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = 512;
  const sg = sky.getContext('2d'), grd = sg.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#07030d'); grd.addColorStop(.3, '#1d0b33'); grd.addColorStop(.5, '#4a1468'); grd.addColorStop(.6, '#a3237c'); grd.addColorStop(.68, '#ff6a4f'); grd.addColorStop(.75, '#5a1660'); grd.addColorStop(1, '#14061e');
  sg.fillStyle = grd; sg.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;

  const camera = new THREE.PerspectiveCamera(small ? 70 : 60, 1, .1, 600);

  // stars
  {
    const n = 600, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - .5) * 700; pos[i * 3 + 1] = 30 + rnd() * 220; pos[i * 3 + 2] = -260 - rnd() * 60; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffe6f2', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .85 })));
  }

  // sun: gradient disc with sliding synthwave stripes + soft glow
  const sunU = { uTime: { value: 0 } };
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShaderMaterial({
    uniforms: sunU, transparent: true, depthWrite: false, fog: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform float uTime;
      void main(){
        vec2 p = vUv - .5; float r = length(p);
        float y = p.y * 2.;
        vec3 top = vec3(1., .95, .66), mid = vec3(1., .57, .28), bot = vec3(1., .18, .54);
        vec3 col = mix(bot, mid, smoothstep(-1., .1, y)); col = mix(col, top, smoothstep(.1, .95, y));
        float disc = 1. - smoothstep(.335, .34, r);
        float k = clamp(-y / .68, 0., 1.);
        float band = fract(pow(k, .85) * 7. - uTime * .35);
        float cut = step(band, k * .55) * step(.02, k);
        float a = disc * (1. - cut);
        float glow = exp(-max(r - .3, 0.) * 9.) * .55 * (1. - disc);
        gl_FragColor = vec4(col * (a + glow * 1.2) + vec3(1., .3, .5) * glow * .6, max(a, glow));
      }`
  }));
  sun.position.set(0, 15, -205);
  scene.add(sun);

  // skyline: buildings with lit windows, silhouetted against the sun
  {
    const wc = document.createElement('canvas'); wc.width = 64; wc.height = 128;
    const w = wc.getContext('2d'); w.fillStyle = '#14061f'; w.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 124; y += 8) for (let x = 4; x < 60; x += 8) if (rnd() < .28) { w.fillStyle = rnd() < .65 ? '#ffcf6a' : '#ff6fb0'; w.globalAlpha = .55 + rnd() * .45; w.fillRect(x, y, 3, 4); }
    const base = new THREE.CanvasTexture(wc); base.colorSpace = THREE.SRGBColorSpace; base.wrapS = base.wrapT = THREE.RepeatWrapping; base.magFilter = THREE.NearestFilter;
    for (let x = -150; x < 150;) {
      const bw = 4 + rnd() * 10, near = Math.abs(x) < 30;
      const bh = near ? 6 + rnd() * 16 : 8 + rnd() * 34;
      const t = base.clone(); t.needsUpdate = true; t.repeat.set(bw / 6, bh / 10);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: t, fog: false }));
      m.position.set(x + bw / 2, bh / 2 - .5, -175 - rnd() * 12);
      scene.add(m);
      x += bw + (rnd() < .25 ? rnd() * 4 : 0);
    }
  }

  // ground: road with dashed centre line + neon grid either side, scrolling toward the camera
  const gU = { uOff: { value: 0 }, uFog: { value: FOG }, uNear: { value: 26 }, uFar: { value: 165 } };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 420, 1, 1), new THREE.ShaderMaterial({
    uniforms: gU,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform float uOff; uniform vec3 uFog; uniform float uNear, uFar;
      void main(){
        float z = vW.z - uOff; float ax = abs(vW.x);
        vec2 c = vec2(vW.x / 5., z / 5.);
        vec2 g = abs(fract(c - .5) - .5) / fwidth(c);
        float grid = 1. - min(min(g.x, g.y), 1.);
        vec3 col = vec3(.07, .02, .1);
        col += vec3(1., .18, .62) * grid * .9 * step(5.2, ax);
        // road
        float road = 1. - step(4.6, ax);
        col = mix(col, vec3(.045, .02, .06), road);
        float edge = (1. - smoothstep(.06, .12, abs(ax - 4.3))) * road;
        col += vec3(1., .35, .7) * edge;
        float dash = (1. - smoothstep(.08, .14, ax)) * step(.5, fract(z / 7.));
        col += vec3(1., .82, .4) * dash;
        // sun reflection running down the road
        float far = smoothstep(20., 170., -vW.z);
        col += vec3(1., .45, .35) * exp(-ax / 9.) * far * .55;
        float d = length(vW - cameraPosition);
        col = mix(col, uFog, smoothstep(uNear, uFar, d));
        gl_FragColor = vec4(col, 1.);
      }`
  }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -190;
  scene.add(ground);

  // palms: generated silhouettes on cards, two rows along the road
  function palmCanvas(sd) {
    seed = sd;
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const x = c.getContext('2d'); x.fillStyle = '#16061f';
    const cx = 128, by = 512, h = 400, lean = (rnd() - .5) * 60, s = .62;
    const top = { x: cx + lean, y: by - h };
    x.beginPath();
    for (let i = 0; i <= 24; i++) { const t = i / 24, X = cx + (top.x - cx) * t * t, Y = by - h * t, w = (17 - 9 * t) * s; i ? x.lineTo(X - w / 2, Y) : x.moveTo(X - w / 2, Y); }
    for (let i = 24; i >= 0; i--) { const t = i / 24, X = cx + (top.x - cx) * t * t, Y = by - h * t, w = (17 - 9 * t) * s; x.lineTo(X + w / 2, Y); }
    x.fill();
    [-172, -150, -128, -104, -80, -56, -32, -10, -160, -22].forEach((a0, k) => {
      const a = (a0 + (rnd() - .5) * 12) * Math.PI / 180, L = h * (.32 + rnd() * .12) * (k > 7 ? .7 : 1), dx = Math.cos(a), dy = Math.sin(a), gg = .9 + rnd() * .5;
      const left = [], right = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, X = top.x + dx * L * t, Y = top.y + dy * L * t + gg * L * t * t * .75;
        const tx = dx, ty = dy + 2 * gg * t * .75, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
        const w = 13 * s * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (i % 2 ? 1 : .35) + 1;
        left.push([X + nx * w, Y + ny * w + (i % 2 ? 6 * s * t : 0)]); right.unshift([X - nx * w, Y - ny * w + (i % 2 ? 6 * s * t : 0)]);
      }
      x.beginPath(); left.concat(right).forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill();
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const palmTex = [palmCanvas(3), palmCanvas(77), palmCanvas(140)];
  const palmMats = palmTex.map(t => new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .45, depthWrite: true }));
  const palmGeo = new THREE.PlaneGeometry(9, 18); palmGeo.translate(0, 9, 0);
  const movers = [];
  const SPAN = 240, STEP = small ? 20 : 15;
  for (let z = 4, i = 0; z > -SPAN + 4; z -= STEP, i++) {
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(palmGeo, palmMats[(i + (side > 0 ? 1 : 0)) % 3]);
      const sc = .85 + rnd() * .45;
      m.scale.set(sc * (rnd() < .5 ? -1 : 1), sc, sc);
      m.position.set(side * (7.2 + rnd() * 2.5), 0, z - (side > 0 ? STEP / 2 : 0));
      scene.add(m); movers.push(m);
    }
  }
  // street lights: soft pink glows on tall poles
  const gc = document.createElement('canvas'); gc.width = gc.height = 64;
  const gx = gc.getContext('2d'), rg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,240,230,1)'); rg.addColorStop(.25, 'rgba(255,120,190,.85)'); rg.addColorStop(1, 'rgba(255,45,138,0)');
  gx.fillStyle = rg; gx.fillRect(0, 0, 64, 64);
  const glowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const poleMat = new THREE.MeshBasicMaterial({ color: '#1a0824' });
  const poleGeo = new THREE.BoxGeometry(.12, 7, .12); poleGeo.translate(0, 3.5, 0);
  for (let z = -6; z > -SPAN; z -= 30) {
    for (const side of [-1, 1]) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(poleGeo, poleMat));
      const s = new THREE.Sprite(glowMat); s.scale.set(3.2, 3.2, 1); s.position.set(-side * .6, 7, 0); g.add(s);
      g.position.set(side * 5.3, 0, z - (side > 0 ? 15 : 0));
      scene.add(g); movers.push(g);
    }
  }

  /* ---------- size, render loop, pause offscreen ---------- */
  function size() {
    const w = sceneEl.clientWidth, h = sceneEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 2 || !small) { lastW = innerWidth; size(); } });

  const clock = new THREE.Clock();
  let visible = true, raf = 0, warm = 0, frames = 0, acc = 0, settle = 30, tried = null, locked = false;
  const PR_MIN = Math.min(pr, .7);
  const look = new THREE.Vector3();
  function frame() {
    const dt = Math.min(clock.getDelta(), .05);
    sunU.uTime.value += dt;
    const speed = S.speed + S.p * 95;
    gU.uOff.value += speed * dt;
    for (const m of movers) { m.position.z += speed * dt; if (m.position.z > 10) m.position.z -= SPAN; }
    S.px += (S.tpx - S.px) * .05; S.py += (S.tpy - S.py) * .05;
    S.shake *= .88;
    const sh = S.shake;
    camera.position.set(S.px * 1.6 + (Math.random() - .5) * sh, S.camY + S.p * 1.2 - S.py * .6 + (Math.random() - .5) * sh, S.camZ);
    look.set(S.px * 4, S.lookY - S.py * 1.5, -100);
    camera.lookAt(look);
    camera.rotation.z = Math.sin(performance.now() / 2400) * .006 + S.px * -.02;
    const fov = (small ? 70 : 60) + S.fovAdd + S.p * 26;
    if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    sun.position.y = S.sunY - S.p * 30;
    renderer.render(scene, camera);
    // Keep every effect and trade resolution for smoothness instead: whenever a run of frames comes in slow,
    // the scene is drawn a step smaller (and upscaled). It never drops below 0.7x.
    if (settle > 0) settle--;
    else if (!S.hold) {
      frames++; acc += dt;
      if (frames >= 45) {
        const avg = acc / frames;
        if (tried && avg > tried.avg * .93) {
          // the smaller picture did not buy smoother frames, so something else is the limit: go back up and stay
          pr = tried.pr; renderer.setPixelRatio(pr); locked = true; tried = null; settle = 20;
        } else {
          tried = null;
          if (!locked && avg > 1 / 50 && pr > PR_MIN) { tried = { pr, avg }; pr = Math.max(PR_MIN, pr * .8); renderer.setPixelRatio(pr); settle = 20; }
        }
        frames = 0; acc = 0;
      }
    }
    // while the loader or the intro film covers the scene, draw two frames to warm the shaders up, then wait
    warm++;
    raf = visible && !document.hidden && !(S.hold && warm > 2) ? requestAnimationFrame(frame) : 0;
  }
  const start = () => { if (!raf && visible && !document.hidden && !(S.hold && warm > 2)) { clock.getDelta(); raf = requestAnimationFrame(frame); } };
  DG.wake = () => { if (!S.hold) return; S.hold = false; settle = 30; frames = 0; acc = 0; start(); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(sceneEl);
  document.addEventListener('visibilitychange', start);
  start();

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', e => { S.tpx = e.clientX / innerWidth - .5; S.tpy = e.clientY / innerHeight - .5; }, { passive: true });
  DG.shake = (a = .5) => { S.shake = Math.max(S.shake, a); };
}

/* ---------- title + intro + scroll ---------- */
const title = document.getElementById('heroTitle');
const ui = document.getElementById('introUI');
const flash = document.getElementById('flash');
const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]);

fontsReady.then(() => {
  const split = SplitText ? new SplitText(title, { type: 'chars', charsClass: 'tch' }) : null;
  const chars = split ? split.chars : [title];
  const reveals = [...document.querySelectorAll('[data-intro]')];
  const first = document.documentElement.classList.contains('first') && !reduce;
  setTimeout(() => DG.sceneReadyResolve && DG.sceneReadyResolve(), 0);

  const HIT = 6.27;                         // where the big hit sits in the track: it lands as the name slams in
  let music = null, soundOK = false, muted = false, musicReady = Promise.resolve(false);
  try { muted = localStorage.getItem('dg-mute') === '1'; } catch (e) {}
  const wake = () => { DG.wake ? DG.wake() : (S.hold = false); };
  const done = () => { wake(); document.documentElement.classList.remove('first'); DG.introDone && DG.introDone(); };

  if (!gsap || reduce) { gsap && gsap.set([chars, reveals], { opacity: 1, clearProps: 'transform' }); ui && ui.remove(); document.getElementById('film')?.remove(); done(); setupScroll(chars); return; }

  if (first) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0); DG.stopScroll && DG.stopScroll();
    gsap.set(chars, { opacity: 0 }); gsap.set(title, { opacity: 1 }); gsap.set(reveals, { opacity: 0, y: 30 });
    const filmEl = document.getElementById('film');
    if (filmEl) {
      const vid = filmEl.querySelector('video');
      vid.src = 'assets/video/intro-' + (innerHeight > innerWidth ? 'portrait' : 'landscape') + '.mp4';
      vid.load();
      const src = { p: 0 }; (DG.extra = DG.extra || []).push(src);
      const upd = () => { try { if (vid.duration && vid.buffered.length) src.p = Math.max(src.p, vid.buffered.end(vid.buffered.length - 1) / vid.duration); } catch (e) {} if (vid.readyState >= 4) src.p = 1; };
      ['progress', 'loadeddata', 'canplay'].forEach(ev => vid.addEventListener(ev, upd));
      vid.addEventListener('canplaythrough', () => (src.p = 1), { once: true });
      vid.addEventListener('error', () => (src.p = 1), { once: true });
      setTimeout(() => (src.p = 1), 6500);
      // the loader asks this when it reaches 100: start the film underneath it, answer once it is really rolling
      loadMusic();
      DG.gate = () => soundGate().then(() => startFilm(filmEl));
      if (DG.arrivedDone) startFilm(filmEl);
    } else DG.arrived.then(cinematic);
  } else {
    ui && ui.remove();
    const go = () => {
      gsap.fromTo(chars, { yPercent: 115, rotate: 8, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: .05, duration: 1.1, ease: 'expo.out', delay: .05 });
      gsap.fromTo(reveals, { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .08, duration: .9, ease: 'expo.out', clearProps: 'transform', delay: .4 });
      wake();
      Object.assign(S, { speed: 60 }); gsap.to(S, { speed: 14, duration: 2.2, ease: 'power3.out' });
      done();
    };
    DG.arrived ? DG.arrived.then(go) : go();
  }

  /* ---- intro music: an original synthwave sting cut to the film (assets/audio/intro.mp3) ----
     Browsers only let a page make sound after a tap, click or key press. So when the loader reaches 100 we
     test whether sound may start; if not, the loader asks for one tap ("tap to start") and carries on
     silently after a few seconds if nobody does. A sound button in the film turns it on or off at any time. */
  function loadMusic() {
    // fetched whole and played from memory: that way jumping to any point in the track is exact on every server
    try {
      music = new Audio(); music.preload = 'auto'; music.volume = .85; DG.music = music;
      const src = { p: 0 }; (DG.extra = DG.extra || []).push(src);       // the loader waits for it like it does for the film
      musicReady = fetch('assets/audio/intro.mp3').then(r => (r.ok ? r.blob() : Promise.reject())).then(b => { music.src = URL.createObjectURL(b); return true; })
        .catch(() => { music = null; return false; }).then(ok => { src.p = 1; return ok; });
      setTimeout(() => (src.p = 1), 5000);
    } catch (e) { music = null; }
  }
  const unlock = () => {                    // must run inside the tap itself so phones allow playback later
    if (!music) return;
    try { const pr = music.play(); if (pr && pr.then) pr.then(() => { if (!music.dataset.live) music.pause(); }).catch(() => {}); } catch (e) {}
  };
  function playMusic(at) {
    if (!music || !soundOK || muted) return;
    music.dataset.live = '1';
    try { music.currentTime = Math.max(0, at); } catch (e) {}
    music.volume = .85;
    const pr = music.play(); if (pr && pr.catch) pr.catch(() => {});
  }
  function soundGate() {
    if (!music || muted) return Promise.resolve();
    return Promise.race([musicReady, new Promise(r => setTimeout(() => r(false), 1500))]).then(ok => (ok && music ? probeSound() : undefined));
  }
  function probeSound() {
    music.volume = .001;                    // not zero: browsers treat a silent element as "muted" and always allow it, which tells us nothing
    let pr; try { pr = music.play(); } catch (e) { pr = Promise.reject(e); }
    const probe = (pr && pr.then ? pr : Promise.resolve()).then(() => { music.pause(); try { music.currentTime = 0; } catch (e) {} soundOK = true; });
    // a refusal means "ask for a tap" (and wait for it); no answer at all within a second and a half means carry on silently
    return Promise.race([probe.then(() => 'ok', () => 'ask'), new Promise(r => setTimeout(() => r('skip'), 1500))]).then(r => (r === 'ask' ? askTap() : undefined));
  }
  function askTap() {
    return new Promise(res => {
      const L = document.getElementById('loader');
      if (!L) return res();
      const coarse = matchMedia('(pointer: coarse)').matches;
      const btn = document.createElement('p');
      btn.className = 'loader__start';
      btn.innerHTML = '<b>' + (coarse ? 'Tap' : 'Click') + ' to start</b><span class="mono">Sound on</span>';
      L.append(btn); L.classList.add('ask');
      let done = false;
      const go = sound => {
        if (done) return; done = true;
        removeEventListener('pointerdown', tap, true); removeEventListener('keydown', key, true); clearTimeout(timer);
        if (sound) { soundOK = true; unlock(); }
        L.classList.remove('ask'); L.classList.add('asked');
        res();
      };
      const tap = () => go(true);
      const key = e => { if (!e.metaKey && !e.ctrlKey && !e.altKey) go(true); };
      addEventListener('pointerdown', tap, true); addEventListener('keydown', key, true);
      const timer = setTimeout(() => go(false), 6000);
    });
  }
  function soundButton(btn, clock) {       // clock() says where in the track we should be right now
    if (!btn || !music) { btn && btn.remove(); return; }
    const paint = () => { const on = soundOK && !muted; btn.textContent = on ? 'Sound on' : 'Sound off'; btn.setAttribute('aria-pressed', on); };
    paint();
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const on = soundOK && !muted;
      if (on) { muted = true; music.pause(); }
      else { muted = false; soundOK = true; playMusic(clock()); }
      try { localStorage.setItem('dg-mute', muted ? '1' : '0'); } catch (err) {}
      paint();
    });
  }

  function cinematic() {
    wake();
    playMusic(HIT - 4.13);                 // the 3D fallback intro is shorter: join the track so the hit still lands on the name
    document.getElementById('film')?.remove();
    ui && gsap.set(ui, { autoAlpha: 1 }); gsap.set('#introBlack', { opacity: 1 });
    // ---- cinematic first-visit intro ----
    Object.assign(S, { camY: 38, camZ: 70, lookY: -6, speed: 140, sunY: -14, fovAdd: 18 });
    gsap.set(chars, { opacity: 0 }); gsap.set(title, { opacity: 1 });
    gsap.set(reveals, { opacity: 0, y: 30 });
    const num = ui.querySelector('.intro__num'), bar = ui.querySelector('.intro__bar i'), word = ui.querySelectorAll('.intro__word i');
    const cnt = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { ui.remove(); DG.startScroll && DG.startScroll(); done(); } });
    tl.to('#introBlack', { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
      .to(S, { camY: 2.4, camZ: 8, lookY: 7.5, fovAdd: 0, duration: 3.4, ease: 'power3.inOut' }, 0)
      .to(S, { speed: 14, duration: 3.8, ease: 'power2.out' }, 0)
      .to(S, { sunY: 24, duration: 3.2, ease: 'power2.out' }, .2)
      .fromTo(word, { yPercent: 110 }, { yPercent: 0, stagger: .08, duration: .9, ease: 'expo.out' }, .2)
      .to(cnt, { v: 100, duration: 3.1, ease: 'power1.inOut', onUpdate: () => { num.textContent = String(Math.round(cnt.v)).padStart(3, '0'); bar.style.transform = `scaleX(${cnt.v / 100})`; } }, 0)
      .to(ui, { opacity: 0, y: -20, duration: .4, ease: 'power2.in' }, 3.25);
    // the name slams in letter by letter: flash + shake on each hit
    chars.forEach((c, i) => {
      const at = 3.45 + i * .085;
      tl.fromTo(c, { opacity: 0, scale: 2.8, yPercent: -30, filter: 'blur(14px)' }, { opacity: 1, scale: 1, yPercent: 0, filter: 'blur(0px)', duration: .5, ease: 'expo.out' }, at)
        .call(() => { DG.shake && DG.shake(i === chars.length - 1 ? 1.1 : .35); }, null, at + .06);
    });
    const end = 3.45 + chars.length * .085;
    tl.fromTo(flash, { opacity: .9 }, { opacity: 0, duration: .7, ease: 'power2.out', immediateRender: false }, end)
      .call(() => { title.classList.add('rgb'); setTimeout(() => title.classList.remove('rgb'), 650); }, null, end)
      .to(reveals, { opacity: 1, y: 0, stagger: .08, duration: .9, ease: 'expo.out', clearProps: 'transform' }, end + .1);
    const skip = ui.querySelector('.intro__skip');
    skip && skip.addEventListener('click', () => tl.timeScale(5));
    sceneEl.addEventListener('pointerdown', () => tl.progress() < .95 && tl.timeScale(5), { once: true });
  }

  // ---- the rendered intro film (already buffered by the loader) ----
  let filmStart = null;
  function startFilm(filmEl) {
    if (filmStart) return filmStart;
    const vid = filmEl.querySelector('video'), skip = filmEl.querySelector('.film__skip');
    ui && gsap.set(ui, { autoAlpha: 0 });
    gsap.set('#introBlack', { opacity: 0 });
    let finished = false, rolling = false, answer;
    filmStart = new Promise(r => (answer = r));
    const fallback = () => { if (finished) return; finished = true; answer('page'); DG.arrived.then(cinematic); };
    const finish = () => {
      if (finished) return; finished = true; answer('film');
      wake();
      // skipped early: jump the track to just before its big hit so it still lands with the name
      if (music && music.dataset.live && !music.paused && vid.duration && vid.currentTime < vid.duration - .4) { try { music.currentTime = HIT - .56; } catch (e) {} }
      Object.assign(S, { speed: 70 }); gsap.to(S, { speed: 14, duration: 2.4, ease: 'power3.out' });
      gsap.timeline({ onComplete: () => { filmEl.remove(); DG.startScroll && DG.startScroll(); done(); } })
        .fromTo(flash, { opacity: 0 }, { opacity: 1, duration: .14, ease: 'power2.in' })
        .set(filmEl, { opacity: 0 })
        .to(flash, { opacity: 0, duration: .9, ease: 'power2.out' })
        .fromTo(chars, { opacity: 0, scale: 2.2, yPercent: -20, filter: 'blur(10px)' }, { opacity: 1, scale: 1, yPercent: 0, filter: 'blur(0px)', stagger: .045, duration: .55, ease: 'expo.out', immediateRender: false }, .12)
        .call(() => { DG.shake && DG.shake(1); title.classList.add('rgb'); setTimeout(() => title.classList.remove('rgb'), 650); }, null, .12 + chars.length * .045)
        .to(reveals, { opacity: 1, y: 0, stagger: .08, duration: .9, ease: 'expo.out', clearProps: 'transform' }, .5);
    };
    // phones taller than the film: fill the bars above and below with the film's own colours (a tiny live copy, stretched soft)
    const ambient = () => {
      const c = filmEl.querySelector('.film__amb');
      if (!c || !vid.videoWidth || innerWidth / innerHeight > vid.videoWidth / vid.videoHeight * .985) return;
      c.width = 18; c.height = 32;
      const x = c.getContext('2d'); c.classList.add('on');
      const draw = () => { if (finished) return; try { x.drawImage(vid, 0, 0, c.width, c.height); } catch (e) {} vid.requestVideoFrameCallback ? vid.requestVideoFrameCallback(draw) : requestAnimationFrame(draw); };
      draw();
    };
    const roll = () => {
      if (rolling || finished) return; rolling = true;
      filmEl.classList.add('on'); ambient(); answer('film');
      playMusic(vid.currentTime);
      const snd = filmEl.querySelector('.film__snd');
      soundButton(snd, () => vid.currentTime);
      gsap.to([skip, snd].filter(Boolean), { opacity: 1, duration: .6, delay: 1.2 });
    };
    vid.addEventListener('timeupdate', () => {
      if (!vid.duration) return;
      if (vid.currentTime > vid.duration - .6) wake();          // the 3D scene starts drawing again just before the cut
      if (vid.currentTime > vid.duration - .12) finish();
    });
    vid.addEventListener('ended', finish);
    vid.addEventListener('error', fallback, { once: true });
    vid.addEventListener('playing', roll, { once: true });
    skip.addEventListener('click', finish);
    const pr = vid.play();
    if (pr && pr.catch) pr.catch(fallback);
    setTimeout(() => { if (rolling || finished) return; if (vid.paused || vid.readyState < 3) fallback(); else roll(); }, 2000);
    return filmStart;
  }
  setupScroll(chars);
});

function setupScroll(chars) {
  if (!ScrollTrigger || reduce) return;
  // the drive speeds up, the camera widens and the name breaks apart in 3D as you scroll
  ScrollTrigger.create({ trigger: '.scene-pin', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => { S.p = s.progress; } });
  const n = chars.length;
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.scene-pin', start: 'top top', end: 'bottom bottom', scrub: .6 } });
  tl.to(chars, {
    x: i => (i - (n - 1) / 2) * innerWidth * .16, z: 400, rotationY: i => (i - (n - 1) / 2) * 18, rotationX: -25, opacity: 0,
    ease: 'power2.in', duration: 1, stagger: { each: .02, from: 'center' }
  }, 0)
    .to('.scene__copy, .scene__kicker, .scroll-cue', { opacity: 0, y: -60, duration: .35, ease: 'power2.in' }, 0)
    .to('.scene .shade', { opacity: .85, duration: .2, ease: 'none' }, .8);
}
