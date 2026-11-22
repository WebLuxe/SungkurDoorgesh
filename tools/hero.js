(function () {
  "use strict";

  /* ---------- media ---------- */
  var CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261117_";
  var IDS = {
    doors:  "063048_97fd9a70-adbe-46bd-bfce-ec1004f6c7d8",
    aerial: "063055_ee1debcd-d200-484f-b94f-fad6dcffd4eb",
    back:   "063251_24fbd7cc-00df-49ec-8fbf-d8a0349b1e98",
    mid:    "063252_b9f2fecf-9be0-485f-842f-3aa6bbc251f2",
    front:  "063151_7804d758-a2eb-4499-9b56-8f493edbb206"
  };
  var TILT_SRC = "assets/video/hero-tilt.mp4";      // re-encoded 2.3 MB copy of the spec clip
  var RAIN_SRC = "assets/video/hero-rain.mp4";      // only the 3.75 s the loop uses, 0.7 MB
  function img(id, w) {
    return "https://images.higgs.ai/?default=1&output=webp&url=" +
      encodeURIComponent(CDN + id + ".png") + "&w=" + w + "&q=85";
  }
  function pickW(cssPx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.ceil((cssPx * dpr) / 100) * 100;
    return Math.max(600, Math.min(2700, w));
  }

  /* ---------- elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var hero = $("hero"), stage = $("stage"), back = $("back"), mid = $("mid"), front = $("front");
  var headline = $("headline"), word = $("word"), wordInner = $("wordInner"), baseline = $("baseline");
  var kicker = $("kicker"), nav = $("nav"), shade = $("shade");
  var opening = $("opening"), doors = $("doors"), doorL = $("doorL"), doorR = $("doorR");
  var tilt = $("tilt"), rainA = $("rainA"), rainB = $("rainB");
  var letters = Array.prototype.slice.call(word.querySelectorAll(".l"));

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var playIntro = root.classList.contains("intro");

  /* ---------- layout ---------- */
  var wpe = 3.4, blr = 0.8633;
  function measure() {
    var prev = word.style.fontSize;
    word.style.fontSize = "100px";
    var wr = wordInner.getBoundingClientRect(), hr = word.getBoundingClientRect(), br = baseline.getBoundingClientRect();
    if (wr.width > 0) { wpe = wr.width / 100; blr = (br.bottom - hr.top) / 100; }
    word.style.fontSize = prev;
  }
  function layout() {
    var vw = hero.clientWidth, vh = hero.clientHeight;
    var sw = Math.max(vw, vh * 16 / 9), sh = sw * 9 / 16;
    var sl = (vw - sw) / 2, st = (vh - sh) / 2;
    stage.classList.add("is-sized");
    stage.style.width = sw + "px";
    stage.style.height = sh + "px";
    stage.style.left = sl + "px";
    stage.style.top = st + "px";
    headline.style.left = (-sl) + "px";
    headline.style.width = vw + "px";

    var portrait = vh > 1.2 * vw;
    var bStage = sh * (portrait ? 0.362 : 0.43);
    var bView = st + bStage;
    var navBottom = (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight;

    var a = (0.625 * sw) / wpe;
    var b = (0.92 * vw) / wpe;
    var c = (bView - (navBottom + 0.035 * vh)) / 0.88;
    var F = Math.max(24, Math.min(a, b, c));

    word.style.fontSize = F + "px";
    word.style.top = (bStage - blr * F) + "px";
    kicker.style.fontSize = (0.118 * F) + "px";
    kicker.style.top = (bStage - (0.727 + 0.02) * F) + "px";
  }
  var rz = 0;
  window.addEventListener("resize", function () { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  layout();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 100px "Inter"', "Summit").then(function () { measure(); layout(); }, function () {});
    document.fonts.ready.then(function () { measure(); layout(); });
  } else { measure(); layout(); }

  /* ---------- images, sized to the screen ---------- */
  var wStage = pickW(Math.max(hero.clientWidth, hero.clientHeight * 16 / 9)), wHero = pickW(hero.clientWidth);
  function loadImg(el, src) {
    return new Promise(function (res) {
      var done = function () { res(); };
      el.onload = function () { if (el.decode) el.decode().then(done, done); else done(); };
      el.onerror = done;
      el.src = src;
    });
  }
  function loadBg(el, src) {
    return new Promise(function (res) {
      var i = new Image();
      var done = function () { el.style.backgroundImage = 'url("' + src + '")'; res(); };
      i.onload = function () { if (i.decode) i.decode().then(done, done); else done(); };
      i.onerror = function () { res(); };
      i.src = src;
    });
  }
  var backReady = loadImg($("imgBack"), img(IDS.back, wStage));
  var imgReady = [backReady, loadImg($("imgMid"), img(IDS.mid, wStage)), loadImg($("imgFront"), img(IDS.front, wStage))];

  /* ---------- rain loop ---------- */
  var RAIN = [rainA, rainB], LOOP = 3.6, LEAD = 0.75, activeRain = -1, rainStarted = false, heroVisible = true;
  function safePlay(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function rainOn(i) { var v = RAIN[i]; try { v.currentTime = 0; } catch (e) {} safePlay(v); v.classList.add("on"); }
  RAIN.forEach(function (v, i) {
    v.addEventListener("timeupdate", function () {
      if (i !== activeRain || !heroVisible) return;
      if (v.currentTime >= LOOP - LEAD) {
        var n = 1 - i; activeRain = n; rainOn(n); v.classList.remove("on");
        setTimeout(function () { if (activeRain !== i) v.pause(); }, 800);
      }
    });
  });
  // both crossfade players share one download
  var rainLoading = false;
  function loadRain() {
    if (rainLoading) return; rainLoading = true;
    var use = function (src) { RAIN.forEach(function (v) { v.src = src; v.load(); }); if (rainStarted) rainOn(activeRain < 0 ? 0 : activeRain); };
    if (window.fetch && window.URL && URL.createObjectURL) fetch(RAIN_SRC).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { use(URL.createObjectURL(b)); }).catch(function () { use(RAIN_SRC); });
    else use(RAIN_SRC);
  }
  function startRain() { if (rainStarted) return; rainStarted = true; activeRain = 0; if (rainLoading && RAIN[0].getAttribute("src")) rainOn(0); else loadRain(); }
  function resumeRain() { if (rainStarted && activeRain >= 0 && heroVisible && !document.hidden) { var v = RAIN[activeRain]; if (v.paused) safePlay(v); } }
  document.addEventListener("visibilitychange", resumeRain);
  // pause the rain while the hero is scrolled out of view
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    heroVisible = es[0].isIntersecting;
    if (!rainStarted) return;
    if (heroVisible) resumeRain(); else RAIN.forEach(function (v) { v.pause(); });
  }).observe(hero);

  /* ---------- reduced motion: final frame, nothing plays ---------- */
  if (reduce) { root.classList.remove("intro"); return; }

  /* ---------- already seen this session: final frame + live rain ---------- */
  if (!playIntro) { backReady.then(startRain); depth(); return; }

  /* ---------- the intro ---------- */
  try { window.scrollTo(0, 0); } catch (e) {}
  imgReady.push(loadImg($("imgAerial"), img(IDS.aerial, wStage)));
  imgReady.push(loadBg(doorL, img(IDS.doors, wHero)).then(function () { doorR.style.backgroundImage = doorL.style.backgroundImage; }));
  var tiltReady = new Promise(function (res) {
    var done = function () { res(); };
    tilt.addEventListener("canplaythrough", done, { once: true });
    tilt.addEventListener("error", done, { once: true });
    var go = function () { if (tilt.getAttribute("src")) return; tilt.src = TILT_SRC; tilt.load(); };
    if (root.classList.contains("filming")) { addEventListener("dg:film", go, { once: true }); setTimeout(go, 7000); }
    else go();
  });

  var D = 7400, anims = [];
  var E = {
    door1: "cubic-bezier(.1,.2,.8,1)", door2: "cubic-bezier(.4,.6,.9,1)", io: "ease-in-out",
    open: "cubic-bezier(.45,0,.55,1)", rise: "cubic-bezier(.2,.65,.3,1)", back: "cubic-bezier(.45,0,.35,1)",
    mid1: "cubic-bezier(.45,0,.3,1)", mid2: "cubic-bezier(.45,0,.55,1)", head: "cubic-bezier(.3,0,.4,1)",
    man1: "cubic-bezier(.2,.5,.2,1)", man2: "cubic-bezier(.45,0,.55,1)"
  };
  function track(el, points) {
    var kf = [], first = points[0], last = points[points.length - 1];
    if (first[0] > 0) kf.push(Object.assign({ offset: 0, easing: "linear" }, first[1]));
    points.forEach(function (p) {
      var k = Object.assign({ offset: Math.min(1, (p[0] * 1000) / D) }, p[1]);
      k.easing = p[2] || "linear"; kf.push(k);
    });
    if (last[0] * 1000 < D) kf.push(Object.assign({ offset: 1 }, last[1]));
    var a = el.animate(kf, { duration: D, fill: "both" });
    a.pause(); a.currentTime = 0; anims.push(a);
  }
  track(doorL, [[0.02, { transform: "translateX(0)" }, E.door1], [1.13, { transform: "translateX(-101%)" }]]);
  track(doorR, [[0.02, { transform: "translateX(0)" }, E.door2], [1.24, { transform: "translateX(101%)" }]]);
  track(tilt, [[1.19, { opacity: 0 }, E.io], [1.47, { opacity: 1 }]]);
  track(opening, [[2.45, { opacity: 1 }, E.open], [2.95, { opacity: 0 }]]);
  track(nav, [[2.45, { opacity: 0, transform: "translateY(-6px)" }, "ease-out"], [2.75, { opacity: 1, transform: "translateY(0)" }]]);
  track(kicker, [[2.45, { opacity: 0, transform: "translate(0, .5em)" }, E.rise], [3.10, { opacity: 1, transform: "translate(0, 0)" }]]);
  letters.forEach(function (l, i) {
    var s = 2.45 + i * 0.054;
    track(l, [[s, { opacity: 0, transform: "translateY(.14em)" }, E.rise], [s + 0.70, { opacity: 1, transform: "translateY(0)" }]]);
  });
  track(shade, [[2.90, { opacity: 0 }, E.io], [3.70, { opacity: 1 }]]);
  track(back, [[2.90, { transform: "translateY(0)" }, E.back], [4.30, { transform: "translateY(-1.5%)" }]]);
  track(mid, [[2.90, { transform: "translateY(0)" }, E.mid1], [4.30, { transform: "translateY(-4%)" }], [4.60, { transform: "translateY(-4%)" }, E.mid2], [6.90, { transform: "translateY(0)" }]]);
  track(headline, [[3.00, { transform: "translateY(6%)" }, E.head], [4.80, { transform: "translateY(0)" }]]);
  track(front, [[3.35, { transform: "translateY(66%)" }, E.man1], [6.00, { transform: "translateY(-2.5%)" }, E.man2], [7.30, { transform: "translateY(0)" }]]);

  var T0 = 1.25, T1 = 2.85, WIN = T1 - T0, tiltDone = false, tiltStarted = false;
  function syncTilt(t) {
    if (tiltDone) return;
    var dur = (isFinite(tilt.duration) && tilt.duration > 0) ? tilt.duration : 5.04, base = dur / WIN;
    if (t >= T1) { tiltDone = true; tilt.pause(); try { tilt.currentTime = Math.max(0, dur - 0.03); } catch (e) {} return; }
    if (t < T0) return;
    if (!tiltStarted) { tiltStarted = true; tilt.playbackRate = base; safePlay(tilt); }
    var target = ((t - T0) / WIN) * dur, diff = target - tilt.currentTime;
    var r = Math.max(0.85 * base, Math.min(1.2 * base, base * (1 + diff * 1.5)));
    if (Math.abs(r - tilt.playbackRate) > 0.01 * base) tilt.playbackRate = r;
  }

  var started = false, t0 = 0, failsafe = 0;
  function finish() {
    anims.forEach(function (a) { a.currentTime = D; });
    root.classList.remove("intro");
    anims.forEach(function (a) { a.cancel(); });
    opening.hidden = true; doors.hidden = true;
    tilt.pause(); tilt.removeAttribute("src");
    try { sessionStorage.setItem("dg-seen", "1"); sessionStorage.setItem("dg-home", "1"); } catch (e) {}
    depth();
    try { dispatchEvent(new Event("dg:intro")); } catch (e) {}
  }
  // after the intro, scrolling away splits the scene into depth: sky drifts slow, the man and railing fast
  function depth() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var hero = document.getElementById("hero"), hl = document.getElementById("headline");
    var L = [[back, 0.12, 1.06], [hl, 0.42, 0.92], [mid, 0.2, 1.02], [front, 0.04, 1]];
    var cue = hero.querySelector(".cue"), ticking = false;
    var dim = document.createElement("div");
    dim.setAttribute("aria-hidden", "true");
    dim.style.cssText = "position:absolute;inset:0;z-index:8;pointer-events:none;background:#09061C;opacity:0;will-change:opacity";
    hero.appendChild(dim);
    L.forEach(function (l) { if (l[0]) l[0].style.willChange = "translate, scale"; });
    var paint = function () {
      ticking = false;
      var p = Math.max(0, Math.min(1, window.scrollY / innerHeight));
      L.forEach(function (l) {
        if (!l[0]) return;
        l[0].style.translate = "0 " + (p * l[1] * 100).toFixed(2) + "vh";
        if (l[2] !== 1) l[0].style.scale = String(1 + (l[2] - 1) * p);
      });
      if (hl) hl.style.opacity = String(1 - p * 1.4);
      if (cue) cue.style.opacity = String(1 - p * 3);
      dim.style.opacity = (p * 0.5).toFixed(3);
    };
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }
  function frame(now) {
    var ms = Math.min(now - t0, D);
    for (var i = 0; i < anims.length; i++) anims[i].currentTime = ms;
    var t = ms / 1000;
    syncTilt(t);
    if (t >= 2.40) startRain();
    if (ms >= D) { finish(); return; }
    requestAnimationFrame(frame);
  }
  var onStart = [];
  function start() {
    if (started) return;
    started = true;
    onStart.forEach(function (f) { f(); });
    clearTimeout(failsafe);
    setTimeout(loadRain, 400);
    requestAnimationFrame(function (now) { t0 = now; frame(now); });
  }
  var ready = Promise.all(imgReady.concat([tiltReady]));
  // with the intro film the loader only waits for the film and its music; the hero loads while the film plays
  if (!root.classList.contains("filming")) { var heroP = { p: 0 }; (window.DG_EXTRA = window.DG_EXTRA || []).push(heroP); ready.then(function () { heroP.p = 1; }); }

  if (root.classList.contains("filming")) {
    // the intro film plays first; intro.js calls start() on the flash that cuts from the film to the doors
    window.DG_HERO = {
      start: function (cb) {
        if (cb) { if (started) cb(); else onStart.push(cb); }
        Promise.race([ready, new Promise(function (r) { setTimeout(r, 2500); })]).then(function () { setTimeout(start, 60); });
      }
    };
    failsafe = setTimeout(start, 45000);
  } else {
    failsafe = setTimeout(start, 5000);
    ready.then(function () { setTimeout(start, 120); });
  }
})();
