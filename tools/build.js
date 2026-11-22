// Generates the Doorgesh multi-page site (Harborlux look) into the project folder.
const fs = require("fs");
const path = require("path");
const OUT = process.argv[2];

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261117_";
const RAIN = CDN + "063703_04e54df7-2236-4dff-b95b-a9a34c1f78ec.mp4";
const hig = (id, w) => "https://images.higgs.ai/?default=1&amp;output=webp&amp;url=" + encodeURIComponent(CDN + id + ".png") + "&amp;w=" + w + "&amp;q=85";
const STORM = "063251_24fbd7cc-00df-49ec-8fbf-d8a0349b1e98";
const FONT = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2";

const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const OUTA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>';
const mood = (n) => `src="assets/img/mood/${n}.webp" srcset="assets/img/mood/${n}.webp 1400w, assets/img/mood/${n}-hd.webp 2400w" sizes="(max-width:900px) 100vw, 60vw"`;
const hd = (p) => `src="assets/img/${p}.webp" srcset="assets/img/${p}.webp 1x, assets/img/${p}-hd.webp 2x"`;

const EARLY = `<script>(function(){var h=document.documentElement,home=h.getAttribute("data-page")==="home",s;window.DG_EXTRA=[];try{s=sessionStorage;var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload"){s.removeItem("dg-seen");s.removeItem("dg-home");s.removeItem("dg-wipe")}if(matchMedia("(prefers-reduced-motion: reduce)").matches){s.removeItem("dg-wipe");h.classList.add("nointro");return}if(home&&!s.getItem("dg-home")){s.removeItem("dg-wipe");h.classList.add("intro","filming","loading");return}if(home)h.classList.add("nointro");if(s.getItem("dg-wipe"))h.classList.add("arriving");else if(!s.getItem("dg-seen"))h.classList.add("loading")}catch(e){if(home)h.classList.add("nointro")}})()</script>
`;
const ARRIVE = `<div class="loader" id="loader" aria-hidden="true">
  <div class="loader__bg"></div>
  <div class="loader__top"><span>Doorgesh</span><span>Zenn Prxd · Mauritius</span></div>
  <div class="loader__word"><div class="loader__w"><span class="loader__out">Doorgesh</span><span class="loader__fill">Doorgesh</span></div></div>
  <div class="loader__bottom"><span class="loader__msg">Loading the drive</span><span class="loader__num">000</span></div>
  <div class="loader__line"><i></i></div>
</div>
<div class="wipe" id="wipe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><span></span></div>
`;
const FILM = `<div class="film" id="film">
  <canvas class="film__amb" aria-hidden="true"></canvas>
  <video muted playsinline preload="auto" aria-label="Intro film: a drive into a neon city ending on the name Doorgesh"></video>
  <button type="button" class="film__snd" aria-pressed="false">Sound off</button>
  <button type="button" class="film__skip">Skip intro →</button>
</div>
<div class="flash" id="flash" aria-hidden="true"></div>
`;
function head({ title, desc, extra = "", home = false }) {
  return `<!doctype html>
<html lang="en"${home ? ' data-page="home"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#0D0A22">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/doorgesh-4-sunset.webp">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://images.higgs.ai" crossorigin>
<link rel="preconnect" href="https://d8j0ntlcm91z4.cloudfront.net" crossorigin>
<link rel="preload" href="${FONT}" as="font" type="font/woff2" crossorigin>
${EARLY}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,62..125,900&amp;display=swap">
<link rel="stylesheet" href="css/site.css?v=10">
<link rel="stylesheet" href="css/intro.css?v=10">
<link rel="stylesheet" href="css/motion.css?v=10">
${extra}<script src="js/site.js?v=10" defer></script>
<script src="js/intro.js?v=10" defer></script>
</head>`;
}

function nav(active) {
  const L = [["index.html", "Home"], ["work.html", "Builds"], ["sound.html", "Sound"], ["about.html", "About"]];
  return `<a class="skip" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <a class="brand" href="index.html" aria-label="Doorgesh, home">DOORGESH</a>
  <nav class="pills" aria-label="Main">
    ${L.map(([h, t]) => `<a href="${h}"${t === active ? ' aria-current="page"' : ""}>${t}</a>`).join("\n    ")}
  </nav>
  <div class="nav__right">
    <span class="lang">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c-3.2 3-3.2 15 0 18M12 3c3.2 3 3.2 15 0 18"/></svg>
      Eng
    </span>
    <a class="btn" href="contact.html"${active === "Contact" ? ' aria-current="page"' : ""}>Say hi</a>
  </div>
</header>`;
}

const footer = `<footer class="foot">
  <div class="wrap">
    <p class="foot__word" aria-hidden="true"><span>DOORGESH</span></p>
    <div class="foot__row">
      <div><p>© 2026 Doorgesh · Zenn Prxd · Mauritius</p><p class="foot__warn">High-voltage experiments are dangerous. Don't try them without proper training and supervision.</p></div>
      <nav class="foot__nav" aria-label="Footer"><a href="index.html">Home</a><a href="work.html">Builds</a><a href="sound.html">Sound</a><a href="about.html">About</a><a href="web.html">Websites</a><a href="contact.html">Contact</a></nav>
      <div class="foot__nav"><a href="https://www.youtube.com/results?search_query=Zenn+Prxd" target="_blank" rel="noopener">YouTube ↗</a><a href="https://www.tiktok.com/@r0shibhadain" target="_blank" rel="noopener">TikTok ↗</a><a href="https://webluxe.github.io/WebLuxe/" target="_blank" rel="noopener">WebLuxe ↗</a></div>
    </div>
  </div>
</footer>`;

const cta = (title, lede, btn = "Get in touch") => `<section class="cta" aria-label="Contact">
  <div class="cta__bg" data-rain="${RAIN}" aria-hidden="true">
    <img src="${hig(STORM, 2000)}" alt="" loading="lazy" decoding="async">
    <video muted playsinline preload="none"></video>
    <video muted playsinline preload="none"></video>
  </div>
  <div class="wrap">
    <p class="kick" data-reveal>Let's talk</p>
    <h2 class="h1" data-reveal="2">${title}</h2>
    <p class="lede" data-reveal="3">${lede}</p>
    <div class="btns" data-reveal="4"><a class="btn" href="contact.html">${btn} ${ARROW}</a></div>
  </div>
</section>`;

const phead = (img, eyebrow, h1, lede, extra = "", style = "") => `<section class="phead">
  <div class="phead__bg" aria-hidden="true"><img ${img} alt=""${style}></div>
  <div class="wrap">
    <p class="eyebrow">${eyebrow}</p>
    <h1 class="h1">${h1}</h1>
    <p class="lede">${lede}</p>
    ${extra}
  </div>
</section>`;

function page(file, { title, desc, active, main, extraHead = "", home = false, bodyEnd = "" }) {
  const html = `${head({ title, desc, extra: extraHead, home })}
<body>
${ARRIVE}${home ? FILM : ""}${nav(active)}
<main id="main">
${main}
</main>
${footer}
${bodyEnd}</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, file), html);
}

/* =========================================================
   HOME
   ========================================================= */
const heroCss = fs.readFileSync(path.join(__dirname, "hero.css"), "utf8");
const heroJs = fs.readFileSync(path.join(__dirname, "hero.js"), "utf8");

const heroHtml = `<section class="hero" id="hero" aria-label="Doorgesh — Claim Your Summit">
  <div class="stage" id="stage">
    <div class="layer back" id="back">
      <img id="imgBack" alt="" decoding="async">
      <video class="rain" id="rainA" muted playsinline preload="auto" aria-hidden="true"></video>
      <video class="rain" id="rainB" muted playsinline preload="auto" aria-hidden="true"></video>
      <div class="shade" id="shade"></div>
    </div>
    <div class="headline" id="headline">
      <p class="kicker" id="kicker" aria-hidden="true">Claim Your</p>
      <h1 class="word" id="word" aria-label="Claim Your Summit"><span class="w" id="wordInner" aria-hidden="true"><span class="l">S</span><span class="l">u</span><span class="l">m</span><span class="l">m</span><span class="l">i</span><span class="l">t</span><i class="bl" id="baseline"></i></span></h1>
    </div>
    <div class="layer mid" id="mid">
      <img id="imgMid" alt="" decoding="async">
    </div>
    <div class="layer front" id="front">
      <div class="glass" aria-hidden="true"></div>
      <img id="imgFront" alt="A man in a long dark coat stands at a glass balcony railing, looking out over a rainy neon harbour at night" decoding="async">
    </div>
  </div>
  <div class="opening" id="opening" aria-hidden="true">
    <img id="imgAerial" alt="" decoding="async">
    <video id="tilt" muted playsinline preload="auto"></video>
  </div>
  <div class="doors" id="doors" aria-hidden="true">
    <div class="door door--l" id="doorL"></div>
    <div class="door door--r" id="doorR"></div>
  </div>
  <button class="cue" type="button" aria-label="Scroll to the next section">Scroll<i></i></button>
</section>`;

const homeMain = `${heroHtml}

<section class="sec" aria-labelledby="me-title">
  <div class="glow glow--a" aria-hidden="true"></div>
  <div class="wrap me">
    <figure class="frame me__photo" data-reveal><img src="assets/img/doorgesh-4-sunset.webp" srcset="assets/img/doorgesh-4-sunset.webp 1x, assets/img/doorgesh-4-sunset-hd.webp 2x" alt="Doorgesh flexing, mirror selfie in sunset colours" loading="lazy" decoding="async" style="object-position:45% 35%"></figure>
    <div class="me__text">
      <p class="eyebrow" data-reveal>Hey</p>
      <h2 id="me-title" class="h2" data-reveal="2">I'm <span class="hl">Doorgesh.</span></h2>
      <p class="lede" data-reveal="3">Better known online as Zenn Prxd. I build high-voltage experiments, custom audio systems and camera-powered gadgets, then write the code and make the content around them.</p>
      <p class="muted" data-reveal="3">Drummer and leader of a school band, first place at the RGSC Science Quest 2026, and always in the middle of a new build.</p>
      <ul class="facts" data-reveal="4">
        <li><span>Based in</span>Mauritius</li>
        <li><span>Plays</span>Drums</li>
        <li><span>Won</span>Science Quest 2026</li>
      </ul>
      <div class="btns" data-reveal="4"><a class="btn btn--ghost" href="about.html">More about me ${ARROW}</a></div>
    </div>
  </div>
</section>

<section class="sec sec--tight" aria-labelledby="built-title">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow" data-reveal>Things I've built</p><h2 id="built-title" class="h2" data-reveal="2">Made with <span class="hl">my hands.</span></h2></div>
      <p class="lede" data-reveal="3">Everything here I wired, coded and tested myself.</p>
    </div>
    <div class="tiles">
      <a class="tile" data-cursor="View" href="work.html" data-reveal><img ${mood("ionic")} alt="" loading="lazy" decoding="async"><span class="tile__go">${OUTA}</span><span class="tile__k">01 · Physics</span><span class="tile__t">The Ionic Engine</span><span class="tile__d">Air pushed by electricity alone. First place, Science Quest 2026.</span></a>
      <a class="tile" data-cursor="View" href="work.html" data-reveal="2"><img ${hd("real/tb21")} alt="" loading="lazy" decoding="async"><span class="tile__go">${OUTA}</span><span class="tile__k">02 · Audio</span><span class="tile__t">Amp &amp; sub systems</span><span class="tile__d">Class-D amp boards in boxes I built and tuned myself.</span></a>
      <a class="tile" data-cursor="View" href="work.html" data-reveal><img ${mood("sim")} alt="" loading="lazy" decoding="async"><span class="tile__go">${OUTA}</span><span class="tile__k">03 · Sim rig</span><span class="tile__t">EuroSim wheel</span><span class="tile__d">A force-feedback wheel and shifter for Euro Truck Simulator 2.</span></a>
      <a class="tile" data-cursor="View" href="work.html" data-reveal="2"><img src="assets/video/real/wiring.jpg" alt="" loading="lazy" decoding="async"><span class="tile__go">${OUTA}</span><span class="tile__k">04 · Vision</span><span class="tile__t">AI sorting bin</span><span class="tile__d">An ESP32-CAM bin that sees what you drop in and sorts it.</span></a>
    </div>
    <div class="more"><a class="btn btn--ghost" href="work.html">All my builds ${ARROW}</a></div>
  </div>
</section>

<section class="sec" aria-labelledby="reel-title">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow" data-reveal>Real footage</p><h2 id="reel-title" class="h2" data-reveal="2">Caught <span class="hl">on camera.</span></h2></div>
      <p class="lede" data-reveal="3">Straight off my phone: the bench, the garage and the nights out.</p>
    </div>
  </div>
  <div class="reel" data-reveal>
    <figure class="clip"><div class="frame"><video muted loop playsinline preload="none" poster="assets/video/real/solder.jpg" data-src="assets/video/real/solder.mp4" aria-label="Doorgesh soldering a board at his desk"></video></div><figcaption><span>01</span>On the iron</figcaption></figure>
    <figure class="clip"><div class="frame"><video muted loop playsinline preload="none" poster="assets/video/real/ee111.jpg" data-src="assets/video/real/ee111.mp4" aria-label="A Corolla EE111 under garage lights, headlights cycling colours"></video></div><figcaption><span>02</span>The EE111</figcaption></figure>
    <figure class="clip"><div class="frame"><video muted loop playsinline preload="none" poster="assets/video/real/bike.jpg" data-src="assets/video/real/bike.mp4" aria-label="Close-ups of the wrapped Raleigh bicycle with purple spokes"></video></div><figcaption><span>03</span>The Raleigh</figcaption></figure>
    <figure class="clip"><div class="frame"><video muted loop playsinline preload="none" poster="assets/video/real/leds.jpg" data-src="assets/video/real/leds.mp4" aria-label="An Arduino and breadboard with LEDs flashing"></video></div><figcaption><span>04</span>LEDs on the beat</figcaption></figure>
    <figure class="clip"><div class="frame"><video muted loop playsinline preload="none" poster="assets/video/real/school.jpg" data-src="assets/video/real/school.mp4" aria-label="A school party under coloured lights"></video></div><figcaption><span>05</span>School nights</figcaption></figure>
  </div>
</section>

<section class="sec movie-sec" aria-labelledby="movie-title">
  <div class="movie-sec__bg" aria-hidden="true"><img src="assets/img/the-end-sm.webp" alt="" loading="lazy" decoding="async"></div>
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow" data-reveal>Doorgesh presents</p><h2 id="movie-title" class="h2" data-reveal="2">The <span class="hl">End.</span></h2></div>
      <div class="sec-head__side"><p class="lede" data-reveal="3">A movie I made from my Minecraft survival world, InfiniteSMPS4. Shot, edited and upscaled to 8K by me.</p>
        <a class="btn btn--ghost" href="https://www.youtube.com/watch?v=R4aH7zbozoE" target="_blank" rel="noopener" data-reveal="4">Watch on YouTube ${OUTA}</a></div>
    </div>
    <div class="movie frame" data-reveal="2" data-yt="R4aH7zbozoE">
      <a class="movie__poster" href="https://www.youtube.com/watch?v=R4aH7zbozoE" target="_blank" rel="noopener" data-cursor="Play" aria-label="Play The End, a Minecraft movie by Doorgesh">
        <img src="assets/img/the-end.webp" srcset="assets/img/the-end-sm.webp 640w, assets/img/the-end.webp 1280w" sizes="(max-width:900px) 100vw, 80vw" alt="The End dimension at night: obsidian pillars under a starry sky and the ender dragon overhead" loading="lazy" decoding="async">
        <span class="movie__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
        <span class="movie__meta" aria-hidden="true"><b>InfiniteSMPS4</b><span>The End Movie · 8K upscaled · 1:53</span></span>
      </a>
      <div class="movie__hit" aria-hidden="true"><span class="movie__pop"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></span></div>
      <div class="mbar" role="group" aria-label="Movie controls" hidden>
        <button class="mbar__pp" type="button" aria-label="Pause"><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></button>
        <span class="mbar__t"><b class="mbar__now">0:00</b> / <span class="mbar__dur">1:53</span></span>
        <div class="mbar__track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="113" aria-valuenow="0"><i class="mbar__buf"></i><i class="mbar__fill"></i><i class="mbar__knob"></i></div>
        <div class="mbar__spd">
          <button class="mbar__sb" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Playback speed, 1 times"><b>1×</b></button>
          <div class="mbar__menu" role="menu" aria-label="Playback speed" hidden>
            <p>Speed</p>
            ${[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => `<button type="button" role="menuitemradio" aria-checked="${r === 1}" data-rate="${r}">${r === 1 ? "Normal" : r + "×"}</button>`).join("")}
          </div>
        </div>
        <button class="mbar__snd" type="button" aria-label="Mute" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9h4l5-4v14l-5-4H4z"/><path class="wav" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="off" d="M16 9l6 6M22 9l-6 6"/></svg></button>
        <button class="mbar__fs" type="button" aria-label="Full screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      </div>
    </div>
  </div>
</section>

<section class="sec band" aria-labelledby="music-title">
  <div class="band__bg" aria-hidden="true"><img ${mood("drums-violet")} alt="" loading="lazy" decoding="async"></div>
  <div class="wrap music">
    <div>
      <p class="eyebrow" data-reveal>Zenn Prxd</p>
      <h2 id="music-title" class="h2" data-reveal="2">I make <span class="hl">noise.</span></h2>
      <p class="lede" data-reveal="3">Drums in a school band, DSP remasters and visualisers on YouTube, and amps that shake the room.</p>
      <div class="btns" data-reveal="4"><a class="btn" href="sound.html">Play my drum kit ${ARROW}</a></div>
    </div>
    <dl class="nums" data-reveal="3">
      <div class="num"><dd><b><span data-count="200">200</span>K+</b></dd><dt><span>YouTube views</span></dt></div>
      <div class="num"><dd><b><span data-count="1">1</span>K+</b></dd><dt><span>Subscribers</span></dt></div>
    </dl>
  </div>
</section>

<section class="sec" aria-labelledby="sq-title">
  <div class="glow glow--b" aria-hidden="true"></div>
  <div class="wrap sq">
    <div>
      <p class="eyebrow" data-reveal>Side quest</p>
      <h2 id="sq-title" class="h3" data-reveal="2">I also make <span class="hl">websites.</span></h2>
      <p class="lede" data-reveal="3" style="margin-top:20px">Live sites I've designed and coded, from a car dealer with a 3D showroom to a hotel booking system.</p>
      <div class="btns" data-reveal="4"><a class="btn btn--ghost" href="web.html">See them ${ARROW}</a></div>
    </div>
    <div class="sq__shots" data-reveal="2">
      <img ${hd("sites/v8motors")} alt="V8 Motors website" loading="lazy" decoding="async">
      <img ${hd("sites/edenvilla")} alt="Eden Villa website" loading="lazy" decoding="async">
      <img ${hd("sites/signtuning")} alt="SIGNTUNING website" loading="lazy" decoding="async">
    </div>
  </div>
</section>

${cta("Say hi.", "A collab, a build, a jam or just a hello. My inbox is open.")}`;

page("index.html", {
  title: "Doorgesh — Claim Your Summit",
  desc: "Doorgesh (Zenn Prxd): builder, drummer and producer from Mauritius. High-voltage experiments, custom audio systems, sim rigs and websites. Claim your summit.",
  active: "Home",
  main: homeMain,
  home: true,
  extraHead: `<style>\n${heroCss}</style>\n`,
  bodyEnd: `<script>\n${heroJs}</script>\n`
});

/* =========================================================
   BUILDS
   ========================================================= */
const pcard = (o) => `<button type="button" data-cursor="Open" class="pcard${o.wide ? " wide" : ""}"${o.wide ? ' data-wide="1"' : ""} data-cat="${o.cat}" data-tagline="${o.tagline}" data-uses="${o.uses}" data-reveal>
        <div class="pcard__art" aria-hidden="true">${o.art}</div>
        <span class="pcard__plus" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg></span>
        <div class="pcard__body"><p class="pcard__tag">${o.tag}</p><h3>${o.title}</h3><p>${o.short}</p></div>
        <template>${o.long}</template>
      </button>`;
const vid = (n) => `<video muted loop playsinline preload="none" poster="assets/video/real/${n}.jpg" data-src="assets/video/real/${n}.mp4"></video>`;
const mimg = (n) => `<img ${mood(n)} alt="" loading="lazy" decoding="async">`;
const builds = [
  { wide: 1, cat: "audio hardware", tagline: "Audio hardware", uses: "TPA3116D2|ZK-TB21|ZK-HT21|Custom subwoofer boxes", art: vid("ampcase"), tag: "Audio hardware", title: "Amp &amp; sub systems", short: "High-power class-D boards in custom-built boxes, tuned by ear.", long: "<p>I build and tune amplifier systems on TPA3116D2, ZK-TB21 and ZK-HT21 boards, paired with custom subwoofers and speaker enclosures.</p><p>Every build gets tuned by ear first, then cleaned up with DSP.</p>" },
  { cat: "physics hardware", tagline: "1st place · RGSC Science Quest 2026", uses: "High voltage|Electrohydrodynamics|Physics research", art: mimg("ionic"), tag: "Applied physics<em>1st place</em>", title: "The Ionic Engine", short: "Air moved by electricity alone. No propeller, no motor.", long: "<p>A high-voltage atmospheric electrohydrodynamic propulsion project. A strong electric field ionises the air, the ions drift toward a collector and drag the air with them, so it makes thrust with no moving parts.</p><p>It took first place at the 11th Science Quest, the Rajiv Gandhi Science Centre&rsquo;s national competition, with winners announced on 28 May 2026.</p>" },
  { cat: "hardware code", tagline: "Sim rig", uses: "Microcontrollers|Potentiometers|3D-modelled enclosures|Tinkercad", art: mimg("sim"), tag: "Sim rig", title: "EuroSim wheel &amp; shifter", short: "A force-feedback wheel and gear shifter for Euro Truck Simulator 2.", long: "<p>A force-feedback steering wheel and gear shifter for Euro Truck Simulator 2, built from microcontrollers, potentiometers and enclosures I modelled in 3D.</p>" },
  { cat: "code hardware", tagline: "Computer vision", uses: "ESP32-CAM|Computer vision|Arduino C++", art: vid("wiring"), tag: "Computer vision", title: "AI sorting bin", short: "An ESP32-CAM bin that sees what you drop in and sorts it.", long: "<p>An ESP32-CAM waste-sorting bin that recognises objects and sends each one to the right compartment automatically.</p>" },
  { cat: "code audio", tagline: "Embedded", uses: "WS2812B|Microcontroller|Audio-reactive code", art: vid("leds"), tag: "Embedded", title: "Music-reactive ARGB", short: "Addressable LEDs that hit on the beat.", long: "<p>WS2812B addressable LED setups driven by a microcontroller that listens to the music and lights up on the beat.</p>" },
  { cat: "audio", tagline: "Zenn Prxd on YouTube", uses: "DaVinci Resolve|Avee Player|Shotcut|Filmora", art: mimg("dsp"), tag: "Media", title: "DSP remasters", short: "Remasters and visualisers with 200K+ views on YouTube.", long: "<p>Remasters and visualisers on YouTube as Zenn Prxd: more than 200,000 views and over 1,000 subscribers.</p>" },
  { cat: "garage", tagline: "Garage", uses: "Derailleur tuning|Brake servicing|Vinyl wrapping", art: vid("bike"), tag: "Garage", title: "Raleigh 21-speed", short: "Tuned, serviced and wrapped in custom vinyl.", long: "<p>A 21-speed Raleigh with derailleur adjustment, brake servicing, gear tuning and a custom vinyl wrap. I do car vinyl wraps too.</p>" },
  { cat: "garage", tagline: "In progress", uses: "4E-FE|4A-GE Blacktop|Corolla EE111", art: vid("ee111"), tag: "Automotive", title: "Toyota engine study", short: "The 4E-FE, the 4A-GE Blacktop and a Corolla EE111 plan.", long: "<p>Studying the 4E-FE and 4A-GE Blacktop engines, with long-term performance-tuning plans for a Corolla EE111.</p>" }
];
const filt = [["all", "All", 8], ["hardware", "Hardware", 4], ["physics", "Physics", 1], ["code", "Code &amp; IoT", 3], ["audio", "Audio", 3], ["garage", "Garage", 2]];
const tool = (k, h, items) => `<article class="gcard" data-reveal><p class="small">${k}</p><h3>${h}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></article>`;

page("work.html", {
  title: "Builds — Doorgesh",
  desc: "Doorgesh's builds: amp and sub systems, The Ionic Engine, a sim-racing wheel, an AI sorting bin, music-reactive LEDs and more.",
  active: "Builds",
  main: `${phead(mood("argb").replace('sizes="(max-width:900px) 100vw, 60vw"', 'sizes="100vw"'), "<b>02</b> Builds", "The builds", "Everything here I wired, coded and tested myself. Pick a filter, or open a build for the story.",
    `<div class="filters" role="group" aria-label="Filter builds">${filt.map(([f, t, n], i) => `<button type="button" data-f="${f}" aria-pressed="${i === 0}">${t}<i>${n}</i></button>`).join("")}</div>`)}

<section class="sec sec--tight" aria-label="Builds">
  <div class="wrap grid-work">
      ${builds.map(pcard).join("\n      ")}
  </div>
</section>

<dialog class="modal" id="modal" aria-label="Build details">
  <div class="modal__in">
    <div class="modal__media"></div>
    <div class="modal__body">
      <p class="small modal__tag" style="color:var(--pink)"></p>
      <h3 class="modal__title"></h3>
      <div class="modal__text"></div>
      <ul class="chips modal__uses"></ul>
    </div>
  </div>
  <button type="button" class="modal__x" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
</dialog>

<section class="sec" aria-labelledby="tk">
  <div class="glow glow--a" aria-hidden="true"></div>
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow" data-reveal>Toolkit</p><h2 id="tk" class="h2" data-reveal="2">What's on <span class="hl">the bench.</span></h2></div></div>
    <div class="cards4">
      ${tool("Hands-on", "Hardware", ["Soldering and circuit benchwork", "Board mods and troubleshooting", "Amplifier builds", "Mechanical CAD in Tinkercad"])}
      ${tool("Code", "IT &amp; software", ["Web development", "Microcontroller C++ (Arduino, ESP32)", "ESP32-CAM computer vision", "Linux and PC infrastructure"])}
      ${tool("Science", "Physics", ["Electrohydrodynamics", "High-voltage systems", "Mechanics", "Award-winning research"])}
      ${tool("Media", "Audio &amp; video", ["DSP remastering", "Video editing", "Band leadership and drumming", "Visualisers for YouTube"])}
    </div>
  </div>
</section>

${cta("Got an idea?", "Collabs and custom builds are always fun. Tell me what you have in mind.")}`
});

/* =========================================================
   SOUND
   ========================================================= */
const board = (b, s) => `<div class="board" data-reveal><svg viewBox="0 0 52 52" aria-hidden="true"><rect x="6" y="10" width="40" height="32" rx="3"/><path d="M13 42v5M39 42v5M13 18h10v8H13zM29 18h10M29 24h10M29 30h6"/><circle cx="18" cy="34" r="3"/></svg><p><b>${b}</b><span>${s}</span></p></div>`;
const pads = [["kick", "a", "Kick"], ["snare", "s", "Snare"], ["hat", "d", "Hi-hat"], ["clap", "f", "Clap"], ["bass", "g", "808"], ["zap", "h", "Zap"]];
page("sound.html", {
  title: "Sound — Doorgesh",
  desc: "Play Doorgesh's drum kit in your browser, and see the amps, remasters and band behind Zenn Prxd.",
  active: "Sound",
  main: `${phead(mood("stage").replace('sizes="(max-width:900px) 100vw, 60vw"', 'sizes="100vw"'), "<b>03</b> Sound", "Sound check", "Drummer, band leader and the producer behind <strong style=\"color:#fff\">Zenn Prxd</strong>. Go on, hit something. Every sound is made live in your browser.")}
<div class="kit-pulse" aria-hidden="true"></div>
<section class="sec sec--tight" aria-label="Drum kit">
  <div class="wrap kit" id="kit">
    <div class="pads">${pads.map(([v, k, t]) => `<button type="button" class="pad" data-cursor="Hit" data-v="${v}" data-key="${k}"><b>${t}</b><span>Key ${k.toUpperCase()}</span></button>`).join("")}</div>
    <figure class="scope" aria-label="Oscilloscope showing the sound you play">
      <canvas id="scope" aria-hidden="true"></canvas>
      <figcaption class="scope__bar"><b>CH1 · Live output</b><span id="scopeLvl">idle</span></figcaption>
    </figure>
    <div class="kit__bar"><button class="btn" type="button" id="beat" aria-pressed="false"><span>Play a beat</span> <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l9 5-9 5z" fill="currentColor" stroke="none"/></svg></button><p>Tap the pads, or use keys A S D F G H</p></div>
  </div>
</section>

<section class="sec">
  <div class="glow glow--a" aria-hidden="true"></div>
  <div class="wrap split">
    <div><p class="eyebrow" data-reveal>Audio hardware</p><h2 class="h3" data-reveal="2">Amps &amp; subs,<br><span class="hl">built to shake.</span></h2>
      <p class="lede" data-reveal="3">I build and tune amplifier systems on these boards, then put them in custom subwoofer and speaker enclosures. Tuned by ear first, then by DSP.</p>
      <figure class="frame" data-reveal="3"><video muted loop playsinline preload="none" poster="assets/video/real/solder.jpg" data-src="assets/video/real/solder.mp4" aria-label="Doorgesh soldering a board"></video></figure></div>
    <div class="boards">${board("TPA3116D2", "Class-D stereo amp board")}${board("ZK-TB21", "Amp board with a bass channel")}${board("ZK-HT21", "Stereo + subwoofer amp board")}</div>
  </div>
</section>

<section class="sec sec--tight">
  <div class="wrap split">
    <div><p class="eyebrow" data-reveal>Zenn Prxd</p><p class="big hl" data-reveal="2"><span data-count="200">200</span>K+</p><p class="small" style="margin-top:14px" data-reveal="3">views on YouTube · 1K+ subscribers</p></div>
    <div><h2 class="h3" data-reveal>Remasters &amp;<br><span class="hl">visualisers.</span></h2>
      <p class="lede" data-reveal="2">DSP remasters and music visualisers on YouTube under the name Zenn Prxd, edited and rendered with:</p>
      <ul class="chips" data-reveal="3"><li>DaVinci Resolve</li><li>Avee Player</li><li>Shotcut</li><li>Filmora</li></ul>
      <figure class="frame" data-reveal="3"><img ${mood("dsp")} alt="" loading="lazy" decoding="async"></figure>
      <div class="btns"><a class="btn btn--ghost" href="https://www.youtube.com/results?search_query=Zenn+Prxd" target="_blank" rel="noopener">Find Zenn Prxd on YouTube ${OUTA}</a></div></div>
  </div>
</section>

<section class="sec">
  <div class="glow glow--b" aria-hidden="true"></div>
  <div class="wrap split">
    <div><p class="eyebrow" data-reveal>The band</p><h2 class="h3" data-reveal="2">Behind<br><span class="hl">the kit.</span></h2><figure class="frame" data-reveal="3"><img ${mood("drums")} alt="" loading="lazy" decoding="async"></figure></div>
    <div><p class="lede" data-reveal>Drummer and leader of a school band. Keeping time for a whole band is where the ear for tuning amps and remasters comes from.</p></div>
  </div>
</section>

${cta("Need it to sound right?", "Amp builds, remasters, visualisers or video edits. Tell me about it.", "Start a conversation")}`
});

/* =========================================================
   ABOUT
   ========================================================= */
const duo = `<svg class="duo-defs" aria-hidden="true" focusable="false"><filter id="duo-sunset" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues=".1 .78 1"/><feFuncG type="table" tableValues=".05 .36 .86"/><feFuncB type="table" tableValues=".2 .62 .9"/></feComponentTransfer></filter><filter id="duo-pink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues=".09 .78 1"/><feFuncG type="table" tableValues=".04 .3 .82"/><feFuncB type="table" tableValues=".22 .6 .9"/></feComponentTransfer></filter><filter id="duo-teal" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues=".05 .32 .85"/><feFuncG type="table" tableValues=".05 .4 .95"/><feFuncB type="table" tableValues=".2 .78 1"/></feComponentTransfer></filter><filter id="duo-violet" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues=".08 .5 1"/><feFuncG type="table" tableValues=".04 .26 .84"/><feFuncB type="table" tableValues=".22 .9 1"/></feComponentTransfer></filter></svg>`;
const cards = [
  ["doorgesh-1", "Doorgesh in a black Adidas tee, mirror selfie", "duo-teal", "52% 18%"],
  ["doorgesh-2", "Doorgesh, side-on mirror selfie", "duo-violet", "30% 35%"],
  ["doorgesh-3", "Doorgesh in a dark blazer", "duo-pink", "40% 25%"],
  ["doorgesh-4", "Doorgesh flexing, black and white", "duo-sunset", "45% 40%"],
  ["real/me-86", "Doorgesh in sunglasses next to a white Toyota 86", "duo-sunset", "72% 40%"],
  ["real/me-mirror", "Doorgesh in a blue tee, mirror selfie", "duo-teal", "50% 10%"]
];
const road = [["Now", "Push the high-voltage research further", "Build on The Ionic Engine and go deeper into electrohydrodynamics and high-voltage systems."], ["Next", "Custom boards, smarter vision", "Design custom PCB layouts and grow the ESP32-CAM vision work into real products."], ["Then", "The Corolla EE111 build", "Turn the Toyota engine study into hands-on performance tuning."], ["Later", "Electronics &amp; engineering", "Study and build toward a career in electronics and applied physics."], ["The goal", "A tech company that ships", "Turn the hardware, audio and IT skills into a business that makes real products."]];
page("about.html", {
  title: "About — Doorgesh",
  desc: "About Doorgesh (Zenn Prxd): drummer, builder and producer from Mauritius, and where it's all heading.",
  active: "About",
  main: `${duo}
<section class="phead" style="align-items:center">
  <div class="phead__bg" aria-hidden="true"><img src="${hig(STORM, 2000)}" alt=""></div>
  <div class="wrap about">
    <div>
      <p class="eyebrow"><b>04</b> About</p>
      <h1 class="h1" aria-label="Hi, I'm Doorgesh">Hi, I'm<br><span class="hl">Doorgesh</span></h1>
      <p class="lede">Better known online as Zenn Prxd. I build custom audio systems, sim rigs, computer-vision hardware and high-voltage experiments, then write the code and make the content around them.</p>
      <p class="muted">Drummer and leader of a school band, first-place winner at RGSC Science Quest 2026, and always in the middle of a new build.</p>
      <p class="muted">I also design and code websites. <a class="ulink" href="web.html">Here are a few I've made.</a></p>
      <ul class="handles"><li><span>YouTube</span>Zenn Prxd</li><li><span>TikTok</span>@r0shibhadain</li><li><span>Based in</span>Mauritius</li></ul>
    </div>
    <div class="deck">
      <div class="deck__cards" id="deckCards" data-cursor="Drag" tabindex="0" aria-label="Photos of Doorgesh. Use the arrow keys to flip through.">${cards.map(([p, a, f, o], i) => `<figure class="card"><img ${hd(p)} alt="${a}" style="filter:url(#${f});object-position:${o}" decoding="async"${i ? ' loading="lazy"' : ""}><figcaption>0${i + 1} / 06</figcaption></figure>`).join("")}</div>
      <div class="deck__ctrl">
        <button type="button" class="rbtn" id="deckPrev" aria-label="Previous photo"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4"/></svg></button>
        <span id="deckCount" aria-live="polite">01 / 06</span>
        <button type="button" class="rbtn" id="deckNext" aria-label="Next photo">${ARROW}</button>
      </div>
      <p class="deck__hint">Throw the photo · hold it for colour</p>
    </div>
  </div>
</section>

<section class="sec sec--tight" aria-labelledby="rm">
  <div class="glow glow--a" aria-hidden="true"></div>
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow" data-reveal>Roadmap</p><h2 id="rm" class="h2" data-reveal="2">Where it's <span class="hl">heading.</span></h2></div></div>
    <ol class="trace">${road.map(([s, h, p], i) => `<li data-reveal="${(i % 4) + 1}"><span>${s}</span><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="sec sec--tight" aria-labelledby="al">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow" data-reveal>Also</p><h2 id="al" class="h2" data-reveal="2">Side <span class="hl">quests.</span></h2></div></div>
    <div class="also">
      <article data-reveal><figure class="frame"><img src="assets/video/real/bike.jpg" alt="" loading="lazy" style="object-position:50% 30%"></figure><p class="small" style="color:var(--pink)">Wraps</p><h3>Bicycle &amp; car vinyl</h3><p>Custom vinyl wrapping, from my own 21-speed Raleigh to cars.</p></article>
      <article data-reveal="2"><figure class="frame"><img ${hd("sites/edenvilla")} alt="" loading="lazy"></figure><p class="small" style="color:var(--pink)">Web</p><h3>Websites</h3><p>I design and code sites too. <a class="ulink" href="web.html">See some</a>.</p></article>
      <article data-reveal="3"><figure class="frame"><img ${mood("stage")} alt="" loading="lazy"></figure><p class="small" style="color:var(--pink)">Content</p><h3>TikTok &amp; YouTube</h3><p>Builds, remasters and visualisers as Zenn Prxd and @r0shibhadain.</p></article>
    </div>
  </div>
</section>

${cta("Say hi.", "A collab, a build, a jam or just a hello.")}`
});

/* =========================================================
   WEBSITES
   ========================================================= */
const sites = [
  ["v8motors", "V8-Motors-Website", "01 · Used-car dealership", "V8 Motors", "A used-car dealership site with an engine-start intro and a real 3D showroom you can turn the cars around in, plus stock pages and enquiries.", ["3D showroom", "Car stock pages", "Mobile-first"]],
  ["signtuning", "SignTuning-Website", "02 · Auto styling workshop", "SIGNTUNING", "Window tint, full wraps, chrome delete, stickers and number plates. A cinematic, dark site that sends quote requests straight to WhatsApp.", ["Cinematic hero", "WhatsApp quotes", "Work gallery"]],
  ["edenvilla", "HighTier_EdenVilla", "03 · Hotel, Belle Mare", "Eden Villa", "A booking website for a small family hotel: availability calendars, payments, staff logins and an admin panel to run it all.", ["Booking calendar", "Payments", "Admin panel"]],
  ["achardware", "ACHardware-Website", "04 · Tools dealer", "AC Hardware", "A one-stop tools station and TOTAL tools dealer: searchable catalogue, aisles, a saved list and click-to-call.", ["Product search", "Catalogue", "Saved list"]],
  ["moris", "moris-mauritius", "05 · Showcase project", "Moris", "Mauritius, shown off properly: a 3D flyover of the real coastline, an orbit-dive intro and a video reel.", ["3D flyover", "Real map data", "Video reel"]],
  ["conneqt", "conneqt", "06 · Education platform", "ConneQt", "A transparent platform connecting donors with verified students who need help with tuition.", ["Donor flow", "Verified students", "Animated story"]],
  ["niadelta", "niadelta", "07 · Leadership consultancy", "NiaDelta", "A warm, illustrated site for a leadership and culture-change consultancy that runs programmes for leaders and executives.", ["Custom illustration", "Scroll story", "Programmes"]],
  ["webluxe", "WebLuxe", "08 · My web studio", "WebLuxe", "My own studio site: animated, fast, with clear tiers so any business in Mauritius can get online.", ["Studio brand", "Pricing tiers", "Portfolio"]]
];
page("web.html", {
  title: "Websites — Doorgesh",
  desc: "Live websites designed and coded by Doorgesh for businesses and projects in Mauritius.",
  active: "",
  main: `${phead(hd("sites/v8motors"), "Side quest", "Websites<br>I've made", "Besides hardware and music, I design and code websites. These are live ones I built for businesses and projects in Mauritius.")}
<section class="sec sec--tight" aria-label="Websites">
  <div class="wrap sites">
    ${sites.map(([img, repo, k, h, p, chips]) => `<article class="site">
      <div class="site__shot" data-reveal><div class="shot"><div class="shot__bar"><i></i><i></i><i></i><span>webluxe.github.io/${repo}</span></div><div class="shot__img"><img ${hd("sites/" + img)} alt="${h} website" loading="lazy" decoding="async" width="1120" height="700"></div></div></div>
      <div class="site__body"><p class="small" data-reveal>${k}</p><h3 data-reveal="2">${h}</h3><p class="lede" data-reveal="3">${p}</p>
        <ul class="chips" data-reveal="3">${chips.map((c) => `<li>${c}</li>`).join("")}</ul>
        <a class="btn btn--ghost" href="https://webluxe.github.io/${repo}/" target="_blank" rel="noopener" data-cursor="Visit" data-reveal="4">Visit live site ${OUTA}</a></div>
    </article>`).join("\n    ")}
  </div>
</section>

${cta("Need a site?", "A business, a project or an idea that deserves a proper home online. Let's build it.")}`
});

/* =========================================================
   CONTACT
   ========================================================= */
const opts = [["Hardware / electronics", "Hardware"], ["Audio / media", "Audio"], ["Web / IT", "Web &amp; IT"], ["Wrapping / automotive", "Wraps"], ["Collab", "Collab"], ["Just saying hi", "Just hi"]];
page("contact.html", {
  title: "Contact — Doorgesh",
  desc: "Get in touch with Doorgesh (Zenn Prxd) about a build, a collab, audio, websites or just to say hi.",
  active: "Contact",
  main: `${phead(hd("real/ee111-red"), "<b>05</b> Contact", "Let's build<br><span class=\"hl\">something</span>", "A project, a collab or a business idea: send a message and I will get back to you.", "", ' style="object-position:50% 58%"')}
<section class="sec sec--tight" aria-label="Get in touch">
  <div class="glow glow--b" aria-hidden="true"></div>
  <div class="wrap contact">
    <ul class="links" data-reveal>
      <li><a href="mailto:doorgeshsungkur3@gmail.com"><span>Email</span>doorgeshsungkur3@gmail.com<i aria-hidden="true">↗</i></a></li>
      <li><a href="https://www.tiktok.com/@r0shibhadain" target="_blank" rel="noopener"><span>TikTok</span>@r0shibhadain<i aria-hidden="true">↗</i></a></li>
      <li><a href="https://www.youtube.com/results?search_query=Zenn+Prxd" target="_blank" rel="noopener"><span>YouTube</span>Zenn Prxd<i aria-hidden="true">↗</i></a></li>
      <li><a href="https://webluxe.github.io/WebLuxe/" target="_blank" rel="noopener"><span>Websites</span>WebLuxe studio<i aria-hidden="true">↗</i></a></li>
    </ul>
    <form class="form" id="form" novalidate data-reveal="2">
      <label><span>Name</span><input name="name" required autocomplete="name"></label>
      <label><span>Email</span><input name="email" type="email" required autocomplete="email" inputmode="email"></label>
      <fieldset><legend>It's about</legend><div class="opts">${opts.map(([v, t], i) => `<label><input type="radio" name="type" value="${v}"${i ? "" : " checked"}><span>${t}</span></label>`).join("")}</div></fieldset>
      <label><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
      <button class="btn" type="submit">Send message ${ARROW}</button>
      <p class="form__note" id="note" role="status"></p>
    </form>
  </div>
</section>`
});

/* =========================================================
   404
   ========================================================= */
page("404.html", {
  title: "Lost at sea — Doorgesh",
  desc: "That page isn't here.",
  active: "",
  main: `<section class="cta lost" aria-label="Page not found">
  <div class="cta__bg" data-rain="${RAIN}" aria-hidden="true">
    <img src="${hig(STORM, 2000)}" alt="">
    <video muted playsinline preload="none"></video>
    <video muted playsinline preload="none"></video>
  </div>
  <div class="wrap">
    <p class="kick">404</p>
    <h1 class="h1">Lost at sea</h1>
    <p class="lede">That page isn't here. Head back to shore.</p>
    <a class="btn" href="index.html">Back home ${ARROW}</a>
  </div>
</section>`
});

console.log("built", fs.readdirSync(OUT).filter((f) => f.endsWith(".html")).join(", "));
