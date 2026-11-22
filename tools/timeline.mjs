// node --experimental-websocket timeline.mjs <outDir> <url> <w> <h> <steps json>
// steps: [{at:ms, name?, click?:true, eval?:string}]
import { spawn } from "node:child_process";
import fs from "node:fs";
const [, , outDir, url, w, h, stepsJson] = process.argv;
const steps = JSON.parse(stepsJson);
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9334;
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${outDir}/prof2`, "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = l.find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pend = new Map(); const logs = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === "Runtime.consoleAPICalled" && /error|warning/.test(m.params.type)) logs.push(m.params.type + " " + m.params.args.map((a) => a.value || a.description).join(" "));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") logs.push("LOG " + m.params.entry.text + " " + (m.params.entry.url || "")); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 800 });
await send("Page.navigate", { url });
const t0 = Date.now();
for (const s of steps) {
  const wait = s.at - (Date.now() - t0); if (wait > 0) await sleep(wait);
  if (s.click) { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: 200, y: 200, button: "left", clickCount: 1 }); }
  if (s.eval) { const r = await send("Runtime.evaluate", { expression: s.eval, returnByValue: true }); console.log(`${s.at}ms eval:`, JSON.stringify(r.result?.result?.value)); }
  if (s.name) { const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 }); fs.writeFileSync(`${outDir}/${s.name}.jpg`, Buffer.from(shot.result.data, "base64")); }
}
console.log(logs.length ? logs.join("\n") : "no console errors");
ws.close(); proc.kill(); process.exit(0);
