// Run: node --test tests/
// Loads sounds.js against a fake Web Audio context and checks the Hush engine fixes from #24 QA.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const src = fs.readFileSync(path.join(__dirname, "..", "sounds.js"), "utf8");

function param(value) {
  return {
    value,
    calls: [],
    setValueAtTime(v, t) { this.calls.push(["set", v, t]); },
    setTargetAtTime(v, t, c) { this.calls.push(["target", v, t, c]); },
    linearRampToValueAtTime(v, t) { this.calls.push(["linear", v, t]); },
    cancelScheduledValues(t) { this.calls.push(["cancel", t]); },
  };
}

function load() {
  const log = { buffers: 0, sources: [], gains: [] };
  class FakeCtx {
    constructor() { this.sampleRate = 8000; this.currentTime = 10; this.state = "running"; this.destination = {}; }
    resume() { return Promise.resolve(); }
    node(extra) { return { connected: true, connect() {}, disconnect() { this.connected = false; }, ...extra }; }
    createGain() { const g = this.node({ gain: param(1) }); log.gains.push(g); return g; }
    createBiquadFilter() { return this.node({ frequency: param(0), Q: param(0), type: "" }); }
    createBuffer(ch, n, sr) { log.buffers += 1; const d = new Float32Array(n); return { length: n, sampleRate: sr, getChannelData: () => d }; }
    createBufferSource() {
      const s = this.node({ started: false, stopAt: null, start() { this.started = true; }, stop(t) { this.stopAt = t === undefined ? "now" : t; } });
      log.sources.push(s);
      return s;
    }
  }
  const window = { AudioContext: FakeCtx };
  const sandbox = { window, setTimeout, clearTimeout, Math, Float32Array, Set, Promise, Boolean, Number };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return { S: window.StillpointSound, log };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("brown buffer is built once and reused across starts", () => {
  const { S, log } = load();
  S.setKind("white");
  S.stop();
  S.setKind("white");
  S.stop();
  S.start("white");
  assert.strictEqual(log.sources.length, 3);
  assert.strictEqual(log.buffers, 1);
});

test("stopAll ramps the voice gain to 0 over ~40 ms before stopping, then disconnects", async () => {
  const { S, log } = load();
  S.setKind("white");
  const srcNode = log.sources[0];
  const voice = log.gains[log.gains.length - 1]; // per-voice gain (master is created first)
  S.stop();
  const ramp = voice.gain.calls.find((c) => c[0] === "linear");
  assert.ok(ramp, "linear ramp scheduled");
  assert.strictEqual(ramp[1], 0);
  assert.ok(Math.abs(ramp[2] - 10.04) < 1e-9, `ramp ends at ctx time + 0.04 (got ${ramp[2]})`);
  assert.ok(typeof srcNode.stopAt === "number" && srcNode.stopAt >= ramp[2], "source stop scheduled after the ramp");
  assert.strictEqual(srcNode.connected, true, "not disconnected before the ramp has run");
  await wait(160);
  assert.strictEqual(srcNode.connected, false, "disconnected after the ramp");
});

test("a following start() does not cancel the old voice's cleanup", async () => {
  const { S, log } = load();
  S.setKind("white");
  const first = log.sources[0];
  S.stop();
  S.start("white");
  await wait(160);
  assert.strictEqual(first.connected, false);
  assert.strictEqual(log.sources[1].connected, true);
});

test("Hush -> file bed -> mute/unmute does not restart Hush", () => {
  const { S, log } = load();
  S.setKind("white");
  S.setKind("rain"); // page now calls setKind for file beds
  const before = log.sources.length;
  for (const m of [true, false]) { S.setMuted(m); S.setEnabled(true); }
  assert.strictEqual(log.sources.length, before);
  assert.strictEqual(S.getKind(), "rain");
});

test("setEnabled(true) never starts the synth on its own (old page path that only called stop())", () => {
  const { S, log } = load();
  S.setKind("white");
  S.stop();
  const before = log.sources.length;
  S.setMuted(true); S.setEnabled(true); S.setMuted(false); S.setEnabled(true);
  assert.strictEqual(log.sources.length, before);
});

test("muting while Hush is on keeps the label 'Hush'", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const labels = /const SOUND_LABELS = \{([\s\S]*?)\};/.exec(script)[1];
  assert.match(labels, /white:\s*"Hush"/);
  assert.doesNotMatch(labels, /"White"/);
});
