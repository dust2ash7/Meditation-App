(() => {
  "use strict";

  const STORAGE_KEY = "stillpoint-v1";
  const AUDIO_SRC = "./nastelbom-meditation.mp3";
  const MIN_LOG_SECONDS = 15;

  const TYPES = {
    sit: {
      label: "Timed sit",
      hint: "Follow the light. Inhale as it grows, exhale as it recedes.",
      phases: [
        { id: "inhale", name: "Breathe in", seconds: 4 },
        { id: "exhale", name: "Breathe out", seconds: 6 }
      ]
    },
    box: {
      label: "Box breathing",
      hint: "A square of four: in, hold, out, hold.",
      phases: [
        { id: "inhale", name: "Inhale", seconds: 4 },
        { id: "hold-in", name: "Hold", seconds: 4 },
        { id: "exhale", name: "Exhale", seconds: 4 },
        { id: "hold-out", name: "Hold", seconds: 4 }
      ]
    },
    wind: {
      label: "Wind-down",
      hint: "Four in, seven hold, eight out. Let the day leave.",
      phases: [
        { id: "inhale", name: "Inhale", seconds: 4 },
        { id: "hold-in", name: "Hold", seconds: 7 },
        { id: "exhale", name: "Exhale", seconds: 8 }
      ]
    }
  };

  const els = {
    begin: document.getElementById("begin-btn"),
    pause: document.getElementById("pause-btn"),
    stop: document.getElementById("stop-btn"),
    audioBtn: document.getElementById("audio-btn"),
    mute: document.getElementById("mute-btn"),
    home: document.getElementById("home-btn"),
    install: document.getElementById("install-btn"),
    historyBtn: document.getElementById("history-btn"),
    historyClose: document.getElementById("history-close"),
    historyBackdrop: document.getElementById("history-backdrop"),
    historySheet: document.getElementById("history-sheet"),
    historyList: document.getElementById("history-list"),
    historyEmpty: document.getElementById("history-empty"),
    customMinutes: document.getElementById("custom-minutes"),
    timer: document.getElementById("timer-display"),
    timerLive: document.getElementById("timer-live"),
    phase: document.getElementById("phase-label"),
    hint: document.getElementById("session-hint"),
    kicker: document.getElementById("session-kicker"),
    soundscape: document.getElementById("soundscape"),
    views: {
      home: document.getElementById("view-home"),
      session: document.getElementById("view-session"),
      complete: document.getElementById("view-complete")
    },
    stats: {
      streak: document.getElementById("stat-streak"),
      total: document.getElementById("stat-total"),
      count: document.getElementById("stat-count")
    },
    hist: {
      streak: document.getElementById("hist-streak"),
      total: document.getElementById("hist-total")
    },
    complete: {
      title: document.getElementById("complete-title"),
      meta: document.getElementById("complete-meta"),
      streak: document.getElementById("complete-streak")
    }
  };

  const state = {
    status: "idle",
    type: "sit",
    durationMinutes: 10,
    isOpen: false,
    remaining: 600,
    elapsed: 0,
    musicEnabled: true,
    muted: false,
    timerId: null,
    phaseId: null,
    phaseIndex: 0,
    phaseEndsAt: 0,
    hiddenWhileRunning: false,
    installEvent: null
  };

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { history: [], musicEnabled: true, muted: false };
      const data = JSON.parse(raw);
      return {
        history: Array.isArray(data.history) ? data.history : [],
        musicEnabled: data.musicEnabled !== false,
        muted: Boolean(data.muted)
      };
    } catch {
      return { history: [], musicEnabled: true, muted: false };
    }
  }

  function saveStore(patch) {
    const current = loadStore();
    const next = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function computeStreak(history) {
    const days = new Set(history.filter((item) => item.completed).map((item) => item.day));
    if (!days.size) return 0;
    const cursor = new Date();
    let key = todayKey(cursor);
    if (!days.has(key)) {
      cursor.setDate(cursor.getDate() - 1);
      key = todayKey(cursor);
      if (!days.has(key)) return 0;
    }
    let streak = 0;
    while (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      key = todayKey(cursor);
    }
    return streak;
  }

  function totalMinutes(history) {
    return history.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function selectedType() {
    const node = document.querySelector('input[name="session-type"]:checked');
    return (node && node.value) || "sit";
  }

  function selectedDuration() {
    const custom = Number.parseInt(els.customMinutes.value, 10);
    if (els.customMinutes.value !== "" && Number.isFinite(custom) && custom >= 1) {
      return { minutes: Math.min(180, custom), isOpen: false };
    }
    const node = document.querySelector('input[name="duration"]:checked');
    const value = node ? Number(node.value) : 10;
    if (value === 0) return { minutes: 0, isOpen: true };
    return { minutes: value, isOpen: false };
  }

  function renderConfiguredTime() {
    const { minutes, isOpen } = selectedDuration();
    els.timer.textContent = isOpen ? "0:00" : formatTime(minutes * 60);
  }

  function setView(name) {
    Object.entries(els.views).forEach(([key, node]) => {
      node.hidden = key !== name;
    });
    document.body.classList.toggle("is-session", name === "session");
    document.body.classList.toggle("is-complete", name === "complete");
  }

  function syncMusicButtons() {
    els.audioBtn.setAttribute("aria-pressed", String(state.musicEnabled));
    els.audioBtn.textContent = state.musicEnabled ? "Soundscape on" : "Soundscape off";
    els.mute.setAttribute("aria-pressed", String(state.muted));
    els.mute.setAttribute("aria-label", state.muted ? "Unmute" : "Mute");
    els.soundscape.muted = state.muted;
  }

  function renderStats() {
    const { history } = loadStore();
    const streak = computeStreak(history);
    const total = totalMinutes(history);
    els.stats.streak.textContent = streak === 1 ? "1 day" : `${streak} days`;
    els.stats.total.textContent = `${total} min`;
    els.stats.count.textContent = String(history.length);
    els.hist.streak.textContent = els.stats.streak.textContent;
    els.hist.total.textContent = String(total);
    els.historyList.replaceChildren();
    const recent = [...history].reverse().slice(0, 24);
    recent.forEach((item) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const right = document.createElement("strong");
      left.textContent = `${item.day} · ${item.typeLabel}`;
      right.textContent = item.isOpen ? `${item.minutes} min · open` : `${item.minutes} min`;
      li.append(left, right);
      els.historyList.append(li);
    });
    els.historyEmpty.hidden = history.length > 0;
  }

  function clearTimers() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (state.phaseId) {
      clearTimeout(state.phaseId);
      state.phaseId = null;
    }
  }

  function playChime(kind) {
    if (state.muted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = playChime.ctx || new AudioCtx();
    playChime.ctx = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const freqs = kind === "start" ? [392, 523] : [523, 392, 330];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02 + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1 + i * 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + 1.4 + i * 0.18);
    });
  }

  function ensureAudioReady() {
    if (els.soundscape.getAttribute("src") !== AUDIO_SRC) {
      els.soundscape.src = AUDIO_SRC;
    }
    els.soundscape.loop = true;
    els.soundscape.muted = state.muted;
  }

  function startAudioFromGesture() {
    ensureAudioReady();
    if (!state.musicEnabled) return;
    const play = els.soundscape.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {});
    }
  }

  function pauseAudio() {
    els.soundscape.pause();
  }

  function setPhase(index) {
    const type = TYPES[state.type];
    const phases = type.phases;
    const phase = phases[index % phases.length];
    state.phaseIndex = index % phases.length;
    els.phase.textContent = phase.name;
    document.body.classList.remove("phase-inhale", "phase-exhale", "phase-hold-in", "phase-hold-out");
    document.body.classList.add(`phase-${phase.id}`);
    document.body.classList.toggle("is-sit", state.type === "sit");
    document.body.classList.toggle("is-box", state.type === "box");
    document.body.classList.toggle("is-wind", state.type === "wind");
    return phase;
  }

  function schedulePhases() {
    if (state.phaseId) clearTimeout(state.phaseId);
    const phase = setPhase(state.phaseIndex);
    state.phaseId = setTimeout(() => {
      if (state.status !== "running") return;
      state.phaseIndex += 1;
      schedulePhases();
    }, phase.seconds * 1000);
  }

  function renderTimerNow() {
    if (state.isOpen) {
      els.timer.textContent = formatTime(state.elapsed);
    } else {
      els.timer.textContent = formatTime(state.remaining);
    }
  }

  function announceTime() {
    if (state.isOpen) {
      els.timerLive.textContent = `Elapsed ${formatTime(state.elapsed)}`;
    } else {
      els.timerLive.textContent = `${formatTime(state.remaining)} remaining`;
    }
  }

  function tick() {
    state.elapsed += 1;
    if (state.isOpen) {
      renderTimerNow();
      if (state.elapsed % 30 === 0) announceTime();
      return;
    }
    state.remaining = Math.max(0, state.remaining - 1);
    renderTimerNow();
    if (state.remaining === 0) {
      completeSession(true);
      return;
    }
    if (state.remaining % 30 === 0) announceTime();
  }

  function startTicking() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(tick, 1000);
  }

  function beginSession() {
    const { minutes, isOpen } = selectedDuration();
    state.type = selectedType();
    state.durationMinutes = minutes;
    state.isOpen = isOpen;
    state.elapsed = 0;
    state.remaining = isOpen ? 0 : minutes * 60;
    state.phaseIndex = 0;
    state.status = "running";
    state.hiddenWhileRunning = false;
    document.body.classList.add("is-running");
    els.kicker.textContent = TYPES[state.type].label;
    els.hint.textContent = TYPES[state.type].hint;
    els.pause.textContent = "Pause";
    els.pause.setAttribute("aria-pressed", "false");
    renderTimerNow();
    announceTime();
    setView("session");
    setPhase(0);
    schedulePhases();
    playChime("start");
    startAudioFromGesture();
    startTicking();
  }

  function pauseSession() {
    if (state.status !== "running") return;
    state.status = "paused";
    clearTimers();
    pauseAudio();
    document.body.classList.remove("is-running");
    els.pause.textContent = "Resume";
    els.pause.setAttribute("aria-pressed", "true");
    els.phase.textContent = "Paused";
  }

  function resumeSession() {
    if (state.status !== "paused") return;
    state.status = "running";
    document.body.classList.add("is-running");
    els.pause.textContent = "Pause";
    els.pause.setAttribute("aria-pressed", "false");
    renderTimerNow();
    schedulePhases();
    startAudioFromGesture();
    startTicking();
  }

  function resetToConfiguredTime() {
    renderConfiguredTime();
    els.phase.textContent = "Settle";
    els.hint.textContent = "Follow the light";
  }

  function stopSession() {
    const elapsed = state.elapsed;
    clearTimers();
    pauseAudio();
    els.soundscape.currentTime = 0;
    document.body.classList.remove(
      "is-running", "is-sit", "is-box", "is-wind",
      "phase-inhale", "phase-exhale", "phase-hold-in", "phase-hold-out"
    );
    state.status = "idle";
    setView("home");
    resetToConfiguredTime();
    if (elapsed >= MIN_LOG_SECONDS) {
      logSession(false, elapsed);
    }
    renderStats();
  }

  function logSession(completed, elapsedSeconds) {
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const store = loadStore();
    store.history.push({
      day: todayKey(),
      type: state.type,
      typeLabel: TYPES[state.type].label,
      minutes: state.isOpen ? Math.max(1, Math.round(elapsedSeconds / 60)) : (completed ? state.durationMinutes : minutes),
      completed,
      isOpen: state.isOpen,
      at: Date.now()
    });
    saveStore({ history: store.history });
  }

  function completeSession(natural) {
    const elapsed = state.elapsed;
    clearTimers();
    pauseAudio();
    els.soundscape.currentTime = 0;
    state.status = "complete";
    document.body.classList.remove("is-running");
    playChime("end");
    const minutes = state.isOpen
      ? Math.max(1, Math.round(elapsed / 60) || (elapsed > 0 ? 1 : 0))
      : state.durationMinutes;
    if (elapsed >= MIN_LOG_SECONDS || natural) {
      logSession(true, Math.max(elapsed, state.isOpen ? elapsed : state.durationMinutes * 60));
    }
    const store = loadStore();
    const streak = computeStreak(store.history);
    els.complete.title.textContent = natural ? "Well held." : "A pause, then rest.";
    els.complete.meta.textContent = `${minutes} min · ${TYPES[state.type].label}`;
    els.complete.streak.textContent = streak
      ? `Streak: ${streak} day${streak === 1 ? "" : "s"} · ${totalMinutes(store.history)} minutes all told.`
      : "The first sitting is the one that matters.";
    setView("complete");
    renderStats();
  }

  function goHome() {
    state.status = "idle";
    document.body.classList.remove(
      "is-running", "is-sit", "is-box", "is-wind", "is-complete",
      "phase-inhale", "phase-exhale", "phase-hold-in", "phase-hold-out"
    );
    setView("home");
    resetToConfiguredTime();
  }

  function toggleMusic() {
    state.musicEnabled = !state.musicEnabled;
    saveStore({ musicEnabled: state.musicEnabled });
    syncMusicButtons();
    if (!state.musicEnabled) {
      pauseAudio();
      return;
    }
    if (state.status === "running" || state.status === "paused") {
      startAudioFromGesture();
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    saveStore({ muted: state.muted });
    syncMusicButtons();
  }

  function openHistory() {
    els.historySheet.hidden = false;
    els.historyBtn.setAttribute("aria-expanded", "true");
    els.historyClose.focus();
  }

  function closeHistory() {
    els.historySheet.hidden = true;
    els.historyBtn.setAttribute("aria-expanded", "false");
    els.historyBtn.focus();
  }

  function onVisibility() {
    if (document.hidden) {
      if (state.status === "running") {
        state.hiddenWhileRunning = true;
        pauseSession();
      }
      return;
    }
    if (state.hiddenWhileRunning && state.status === "paused") {
      state.hiddenWhileRunning = false;
      resumeSession();
    }
  }

  function bind() {
    els.begin.addEventListener("click", () => {
      beginSession();
    });
    els.pause.addEventListener("click", () => {
      if (state.status === "running") pauseSession();
      else if (state.status === "paused") resumeSession();
    });
    els.stop.addEventListener("click", () => {
      stopSession();
    });
    els.audioBtn.addEventListener("click", toggleMusic);
    els.mute.addEventListener("click", toggleMute);
    els.home.addEventListener("click", goHome);
    els.historyBtn.addEventListener("click", openHistory);
    els.historyClose.addEventListener("click", closeHistory);
    els.historyBackdrop.addEventListener("click", closeHistory);
    document.querySelectorAll('input[name="duration"]').forEach((input) => {
      input.addEventListener("change", () => {
        if (els.customMinutes.value) els.customMinutes.value = "";
        if (state.status === "idle") renderConfiguredTime();
      });
    });
    els.customMinutes.addEventListener("input", () => {
      if (state.status === "idle") renderConfiguredTime();
    });
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.historySheet.hidden) {
        closeHistory();
        return;
      }
      const tag = (event.target && event.target.tagName) || "";
      if (["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(tag)) return;
      if (event.key === " " && state.status === "running") {
        event.preventDefault();
        pauseSession();
      } else if (event.key === " " && state.status === "paused") {
        event.preventDefault();
        resumeSession();
      }
    });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installEvent = event;
      els.install.hidden = false;
    });
    els.install.addEventListener("click", async () => {
      if (!state.installEvent) return;
      state.installEvent.prompt();
      await state.installEvent.userChoice.catch(() => {});
      state.installEvent = null;
      els.install.hidden = true;
    });
  }

  function registerWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  function init() {
    const store = loadStore();
    state.musicEnabled = store.musicEnabled;
    state.muted = store.muted;
    ensureAudioReady();
    syncMusicButtons();
    renderConfiguredTime();
    renderStats();
    bind();
    registerWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
