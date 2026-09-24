(() => {
  "use strict";

  const PREF_KEY = "stillpoint-prefs-v1";

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function savePrefs(patch) {
    const next = { ...loadPrefs(), ...patch };
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
    return next;
  }

  function playStartBell() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const mute = document.getElementById("mute-btn");
    if (mute && mute.getAttribute("aria-pressed") === "true") return;
    const ctx = playStartBell.ctx || new AudioCtx();
    playStartBell.ctx = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 528;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.45);
  }

  function restorePrefs() {
    const prefs = loadPrefs();
    if (prefs.type) {
      const type = document.querySelector(`input[name="session-type"][value="${prefs.type}"]`);
      if (type) {
        type.checked = true;
        type.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    if (prefs.custom) {
      const custom = document.getElementById("custom-minutes");
      if (custom) {
        custom.value = String(prefs.custom);
        custom.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else if (prefs.duration != null) {
      const dur = document.querySelector(`input[name="duration"][value="${prefs.duration}"]`);
      if (dur) {
        dur.checked = true;
        dur.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function bind() {
    document.querySelectorAll('input[name="session-type"]').forEach((input) => {
      input.addEventListener("change", () => savePrefs({ type: input.value }));
    });
    document.querySelectorAll('input[name="duration"]').forEach((input) => {
      input.addEventListener("change", () => savePrefs({ duration: input.value, custom: "" }));
    });
    const custom = document.getElementById("custom-minutes");
    if (custom) {
      custom.addEventListener("input", () => {
        const n = Number.parseInt(custom.value, 10);
        savePrefs({ custom: Number.isFinite(n) && n >= 1 ? n : "" });
      });
    }
    const begin = document.getElementById("begin-btn");
    if (begin) begin.addEventListener("click", playStartBell);
  }

  function init() {
    restorePrefs();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
