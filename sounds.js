(() => {
  "use strict";

  const VOL = {
    white: 0.18,
    rain: 0.22,
    fall: 0.26,
    shore: 0.2,
    wild: 0.16
  };

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

  function startRain(heavy) {
    const buf = noiseBuffer(2.4);
    const src = track(sourceFrom(buf));
    const bp = track(filter("bandpass", heavy ? 1800 : 1400, heavy ? 0.6 : 0.9));
    const hp = track(filter("highpass", 400));
    const g = track(gain(heavy ? VOL.fall : VOL.rain));
    src.connect(bp);
    bp.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start();

    const drip = () => {
      if (!running || (kind !== "rain" && kind !== "fall")) return;
      const drop = track(sourceFrom(buf, false));
      const f = track(filter("highpass", 2500));
      const dg = track(gain(0.0001));
      drop.connect(f);
      f.connect(dg);
      dg.connect(master);
      const now = ctx.currentTime;
      const peak = heavy ? 0.08 : 0.045;
      dg.gain.setValueAtTime(0.0001, now);
      dg.gain.exponentialRampToValueAtTime(peak, now + 0.012);
      dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      drop.start(now);
      drop.stop(now + 0.14);
      const wait = (heavy ? 90 : 180) + Math.random() * (heavy ? 220 : 420);
      timers.push(setTimeout(drip, wait));
    };
    drip();
  }

  function startShore() {
    const buf = noiseBuffer(3);
    const src = track(sourceFrom(buf));
    const lp = track(filter("lowpass", 520, 0.8));
    const g = track(gain(VOL.shore));
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();

    const swell = () => {
      if (!running || kind !== "shore") return;
      const now = ctx.currentTime;
      const peak = VOL.shore * (1.35 + Math.random() * 0.4);
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(peak, now + 1.8 + Math.random());
      g.gain.linearRampToValueAtTime(VOL.shore * 0.75, now + 5 + Math.random() * 2);
      timers.push(setTimeout(swell, 5200 + Math.random() * 2400));
    };
    swell();
  }

  function startWild() {
    const buf = noiseBuffer(3);
    const src = track(sourceFrom(buf));
    const lp = track(filter("lowpass", 280));
    const g = track(gain(VOL.wild));
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();

    const chirp = () => {
      if (!running || kind !== "wild") return;
      const osc = track(ctx.createOscillator());
      const cg = track(gain(0.0001));
      osc.type = "sine";
      const base = 1800 + Math.random() * 1400;
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.2), now + 0.16);
      cg.gain.setValueAtTime(0.0001, now);
      cg.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(cg);
      cg.connect(master);
      osc.start(now);
      osc.stop(now + 0.2);
      timers.push(setTimeout(chirp, 1400 + Math.random() * 3200));
    };
    chirp();
  }

  function setOutput(vol, mute) {
    if (!master) return;
    const next = mute ? 0 : Math.max(0, Math.min(1, vol));
    master.gain.setTargetAtTime(next, audioCtx().currentTime, 0.05);
  }

  function start(nextKind) {
    kind = nextKind || kind;
    // soft / shore / wild use HTMLAudio file beds in script.js — no synth.
    if (kind === "soft" || kind === "shore" || kind === "wild" || !enabled) {
      stopAll();
      return;
    }
    audioCtx();
    stopAll();
    running = true;
    if (kind === "white") startWhite();
    else if (kind === "rain") startRain(false);
    else if (kind === "fall") startRain(true);
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
      if (next === "soft" || next === "shore" || next === "wild") stopAll();
      else start(next);
    },
    getKind() { return kind; },
    setEnabled(on) {
      enabled = Boolean(on);
      if (!enabled) stopAll();
      else if (kind !== "soft" && kind !== "shore" && kind !== "wild") start(kind);
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
      // File beds: soft (mode), wild (Nature), shore (Beach). Synth: white/rain/fall.
      return id === "white" || id === "rain" || id === "fall";
    }
  };
})();
