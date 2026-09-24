(() => {
  "use strict";

  const VOL = {
    white: 0.18,
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

  function noiseBuffer(seconds) {
    const c = audioCtx();
    const n = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < n; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = b0 + b1 + b2 + white * 0.1848;
    }
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
    const buf = noiseBuffer(2);
    const src = track(sourceFrom(buf));
    const lp = track(filter("lowpass", 900, 0.7));
    const g = track(gain(VOL.white));
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();
  }

  function setOutput(vol, mute) {
    if (!master) return;
    const next = mute ? 0 : Math.max(0, Math.min(1, vol));
    master.gain.setTargetAtTime(next, audioCtx().currentTime, 0.05);
  }

  function start(nextKind) {
    kind = nextKind || kind;
    // File beds play through HTMLAudio in script.js. Only white stays synth.
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
