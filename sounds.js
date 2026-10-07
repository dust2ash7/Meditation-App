(() => {
  "use strict";

  const VOL = {
    white: 0.20,
    rain: 0.22,
    fall: 0.26,
    shore: 0.2,
    wild: 0.16
  };

  const FILE_KINDS = new Set(["soft", "shore", "wild", "rain", "fall"]);

  let ctx = null;
  let master = null;
  let nodes = [];
  let timers = [];
  let kind = "soft";
  let muted = false;
  let enabled = true;
  let running = false;
  let voiceOut = null;
  let brownCache = null;

  // Fade the outgoing voice over ~40 ms on the audio clock before stopping it (no hard cut).
  const STOP_RAMP_S = 0.04;

  function audioCtx() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!ctx) ctx = new C();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (!master) {
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  // The 20 s brown buffer takes 30-40 ms of main-thread work to fill, so build it once per
  // AudioContext and reuse it on every start.
  function brownBuffer(seconds) {
    const c = audioCtx();
    if (brownCache && brownCache.ctx === c && brownCache.seconds === seconds) return brownCache.buf;
    const n = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last;
    }
    let peak = 0.0001;
    for (let i = 0; i < n; i += 1) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
    const scale = 0.9 / peak;
    for (let i = 0; i < n; i += 1) data[i] *= scale;
    brownCache = { ctx: c, seconds, buf };
    return buf;
  }

  function sourceFrom(buf, loop = true) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    return src;
  }

  function filter(type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    return f;
  }

  function gain(value) {
    const g = ctx.createGain();
    g.gain.value = value;
    return g;
  }

  function track(node) {
    nodes.push(node);
    return node;
  }

  function hardStop(list) {
    list.forEach((node) => {
      try {
        if (node.stop) node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    });
  }

  function stopAll() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    const old = nodes;
    const out = voiceOut;
    nodes = [];
    voiceOut = null;
    running = false;
    if (!old.length) return;
    if (!ctx || ctx.state !== "running" || !out) {
      hardStop(old);
      return;
    }
    const now = ctx.currentTime;
    const end = now + STOP_RAMP_S;
    try {
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, end);
    } catch {}
    old.forEach((node) => {
      try {
        if (node.stop) node.stop(end + 0.01);
      } catch {}
    });
    // Disconnect after the ramp and the scheduled stop have run (not tracked in timers,
    // so a following start()/stopAll() can't cancel the cleanup).
    setTimeout(() => hardStop(old), Math.ceil((STOP_RAMP_S + 0.08) * 1000));
  }

  function startWhite() {
    audioCtx();
    const src = track(sourceFrom(brownBuffer(20)));
    const lp = track(filter("lowpass", 320, 0.7));
    const noiseG = track(gain(VOL.white));
    voiceOut = noiseG;
    src.connect(lp);
    lp.connect(noiseG);
    noiseG.connect(master);
    src.start();
  }

  function setOutput(vol, mute) {
    if (!master) return;
    const next = mute ? 0 : Math.max(0, Math.min(1, vol));
    master.gain.setTargetAtTime(next, audioCtx().currentTime, 0.05);
  }

  function start(nextKind) {
    kind = nextKind || kind;
    if (FILE_KINDS.has(kind) || !enabled) {
      stopAll();
      return;
    }
    audioCtx();
    stopAll();
    running = true;
    if (kind === "white") startWhite();
    else running = false;
    setOutput(1, muted);
  }

  window.StillpointSound = {
    kinds: ["soft", "white", "rain", "fall", "shore", "wild"],
    start,
    stop: stopAll,
    setKind(next) {
      if (next === kind && running) return;
      kind = next;
      if (FILE_KINDS.has(next)) stopAll();
      else start(next);
    },
    getKind() { return kind; },
    setEnabled(on) {
      enabled = Boolean(on);
      if (!enabled) stopAll();
      else if (!FILE_KINDS.has(kind)) start(kind);
    },
    setMuted(on) {
      muted = Boolean(on);
      setOutput(1, muted);
    },
    setFade(t) {
      if (!master) return;
      const v = muted || !enabled ? 0 : Math.max(0, Math.min(1, t));
      master.gain.setTargetAtTime(v, audioCtx().currentTime, 0.08);
    },
    resume() {
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    },
    isSynth(id) {
      return id === "white";
    }
  };
})();
