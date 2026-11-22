// node --experimental-websocket perf.mjs <outDir> <url> <w> <h> <cpu> <mbps> <tapAt> <endAt> [port]
// Records: requests (bytes, start/end), html/loader class changes, long tasks, frame gaps.
import { spawn } from "node:child_process";
import fs from "node:fs";
const [, , outDir, url, w, h, cpu, mbps, tapAt, endAt, portArg] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = +(portArg || 9340);
const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${outDir}/prof`, "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = l.find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pend = new Map(); const req = new Map(); let T0 = 0;
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  const p = m.params;
  if (m.method === "Network.requestWillBeSent") req.set(p.requestId, { url: p.request.url, start: p.timestamp, bytes: 0, prio: p.request.initialPriority });
  if (m.method === "Network.dataReceived" && req.has(p.requestId)) req.get(p.requestId).bytes += p.encodedDataLength || p.dataLength;
  if (m.method === "Network.loadingFinished" && req.has(p.requestId)) { const r = req.get(p.requestId); r.end = p.timestamp; r.bytes = Math.max(r.bytes, p.encodedDataLength); }
  if (m.method === "Network.responseReceived" && req.has(p.requestId)) req.get(p.requestId).ts0 = req.get(p.requestId).ts0 || p.timestamp;
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
const bps = (+mbps * 1e6) / 8;
await send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: bps, uploadThroughput: bps / 4 });
await send("Emulation.setCPUThrottlingRate", { rate: +cpu });
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 800 });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__P = { ev: [], lt: [], gaps: [] };
  var t0 = performance.now();
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { __P.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }); }).observe({ type: "longtask", buffered: true }); } catch (e) {}
  var last = 0; (function f(t) { if (last && t - last > 50) __P.gaps.push([Math.round(last), Math.round(t - last)]); last = t; requestAnimationFrame(f); })();
  document.addEventListener("DOMContentLoaded", function () {
    var log = function (k, v) { var s = k + ":" + v; var a = __P.ev; if (!a.length || a[a.length - 1][1] !== s) a.push([Math.round(performance.now()), s]); };
    var h = document.documentElement, L = document.getElementById("loader");
    new MutationObserver(function () { log("html", h.className); }).observe(h, { attributes: true });
    if (L) new MutationObserver(function () { log("loader", L.className); }).observe(L, { attributes: true });
    var v = document.querySelector("#film video");
    if (v) ["playing", "waiting", "ended"].forEach(function (n) { v.addEventListener(n, function () { log("film", n + "@" + v.currentTime.toFixed(2)); }); });
    log("html", h.className);
  });
`});
T0 = Date.now();
const nav = await send("Page.navigate", { url });
const navTs = (await send("Runtime.evaluate", { expression: "performance.timeOrigin", returnByValue: true }));
await sleep(+tapAt);
await send("Runtime.evaluate", { expression: "dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));1" });
await sleep(+endAt - +tapAt);
const out = (await send("Runtime.evaluate", { expression: "JSON.stringify({P:__P, origin: performance.timeOrigin, cls: document.documentElement.className})", returnByValue: true })).result.result.value;
const P = JSON.parse(out);
// network timestamps are monotonic seconds; align with page by using the first document request
const reqs = [...req.values()].filter((r) => r.bytes > 0);
const first = Math.min(...reqs.map((r) => r.start));
const rows = reqs.map((r) => ({ ms0: Math.round((r.start - first) * 1000), ms1: r.end ? Math.round((r.end - first) * 1000) : -1, kb: Math.round(r.bytes / 1024), url: r.url.replace(/^https?:\/\/[^/]+/, "").slice(0, 90) }))
  .sort((a, b) => a.ms0 - b.ms0);
const totalKB = rows.reduce((s, r) => s + r.kb, 0);
fs.writeFileSync(`${outDir}/report.json`, JSON.stringify({ rows, P }, null, 1));
console.log(`total ${(totalKB / 1024).toFixed(1)} MB in ${rows.length} requests; final class "${P.cls}"`);
console.log("--- big requests (>150KB)"); rows.filter((r) => r.kb > 150).forEach((r) => console.log(`${String(r.ms0).padStart(6)}-${String(r.ms1).padStart(6)}ms ${String(r.kb).padStart(6)}KB ${r.url}`));
console.log("--- events"); P.P.ev.forEach((e) => console.log(String(e[0]).padStart(6) + "ms " + e[1]));
const lt = P.P.lt, gaps = P.P.gaps;
console.log(`--- long tasks: ${lt.length}, total ${lt.reduce((s, x) => s + x[1], 0)}ms; worst: ${lt.sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x[1] + "@" + x[0]).join(" ")}`);
console.log(`--- frame gaps >50ms: ${gaps.length}; worst: ${gaps.slice().sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[1] + "@" + x[0]).join(" ")}`);
ws.close(); proc.kill(); process.exit(0);
