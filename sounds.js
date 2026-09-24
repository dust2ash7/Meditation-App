(() => {
  "use strict";

  const VOL = {
    white: 0.22,
    tone: 0.045,
    rain: 0.22,
    fall: 0.26,
    shore: 0.2,
    wild: 0.16
  };

  const FILE_KINDS = new Set(["soft", "shore", "wild", "rain", "fall"]);
  const CARRIER_L = 200;
  const CARRIER_R = 210;

  let ctx = null;
  let master = null;
  let nodes = [];
  let timers = [];
  let kind = "soft";
  let muted = false;
  let enabled = true;
  let running = false;

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

  function brownBuffer(seconds) {
    const c = audioCtx();
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

  function stopAll() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    nodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    });
    nodes = [];
    running = false;
  }

  function startWhite() {
    const c = audioCtx();
    const now = c.currentTime;

    const src = track(sourceFrom(brownBuffer(3)));
    const lp = track(filter("lowpass", 320, 0.7));
    const noiseG = track(gain(VOL.white));
    src.connect(lp);
    lp.connect(noiseG);
    noiseG.connect(master);
    src.start();

    const lfo = track(c.createOscillator());
    const lfoG = track(gain(VOL.white * 0.12));
    lfo.type = "sine";
    lfo.frequency.value = 10;
    lfo.connect(lfoG);
    lfoG.connect(noiseG.gain);
    lfo.start(now);

    const merge = track(c.createChannelMerger(2));
    const toneG = track(gain(VOL.tone));
    const left = track(c.createOscillator());
    const right = track(c.createOscillator());
    left.type = "sine";
    right.type = "sine";
    left.frequency.value = CARRIER_L;
    right.frequency.value = CARRIER_R;
    left.connect(merge, 0, 0);
    right.connect(merge, 0, 1);
    merge.connect(toneG);
    toneG.connect(master);
    left.start(now);
    right.start(now);
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
