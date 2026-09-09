(() => {
  "use strict";

  const STORAGE_KEY = "stillpoint-v1";
  /** Legacy single bed kept in repo; unused by the mode map (Sound Design owns MP3s). */
  const LEGACY_AUDIO_SRC = "./nastelbom-meditation.mp3.mp3";
  /**
   * Per-mode looping beds. Sound Design lands binaries separately —
   * expected paths (do not invent empty files in this PR):
   *   ./audio/stillpoint-sit.mp3
   *   ./audio/stillpoint-box.mp3
   *   ./audio/stillpoint-wind.mp3
   */
  const AUDIO_BY_MODE = {
    sit: "./audio/stillpoint-sit.mp3",
    box: "./audio/stillpoint-box.mp3",
    wind: "./audio/stillpoint-wind.mp3"
  };
  const MUSIC_VOL = 0.32;
  const BELL_VOL = 0.72;
  const MIN_LOG_SECONDS = 15;
  const DEFAULT_GOALS = { dailyMinutes: 10, weeklySits: 5 };

  const BADGE_DEFS = [
    { id: "first-sit", label: "First sit", desc: "Complete your first practice" },
    { id: "streak-3", label: "3-day streak", desc: "Practice three days in a row" },
    { id: "streak-7", label: "7-day streak", desc: "A full week of consecutive days" },
    { id: "minutes-60", label: "60 minutes", desc: "Sixty minutes total practiced" },
    { id: "week-sits-7", label: "Busy week", desc: "Seven sits in one Mon–Sun week" }
  ];

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

  void LEGACY_AUDIO_SRC;

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
      total: document.getElementById("hist-total"),
      weekMinutes: document.getElementById("week-minutes"),
      weekSits: document.getElementById("week-sits")
    },
    goals: {
      dailyNow: document.getElementById("goal-daily-now"),
      dailyTarget: document.getElementById("goal-daily-target"),
      dailyBar: document.getElementById("goal-daily-bar"),
      weeklyNow: document.getElementById("goal-weekly-now"),
      weeklyTarget: document.getElementById("goal-weekly-target"),
      weeklyBar: document.getElementById("goal-weekly-bar")
    },
    cal: {
      title: document.getElementById("cal-title"),
      grid: document.getElementById("cal-grid"),
      prev: document.getElementById("cal-prev"),
      next: document.getElementById("cal-next"),
      selectedLabel: document.getElementById("cal-selected-label")
    },
    badgesList: document.getElementById("badges-list"),
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
    sessionActive: false,
    bellArmed: false,
    installEvent: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    selectedDay: todayKey()
  };

  function defaultStore() {
    return {
      history: [],
      musicEnabled: true,
      muted: false,
      goals: { ...DEFAULT_GOALS },
      badges: []
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      const data = JSON.parse(raw);
      const goals = data.goals && typeof data.goals === "object" ? data.goals : {};
      return {
        history: Array.isArray(data.history) ? data.history : [],
        musicEnabled: data.musicEnabled !== false,
        muted: Boolean(data.muted),
        goals: {
          dailyMinutes: Number(goals.dailyMinutes) > 0 ? Number(goals.dailyMinutes) : DEFAULT_GOALS.dailyMinutes,
          weeklySits: Number(goals.weeklySits) > 0 ? Number(goals.weeklySits) : DEFAULT_GOALS.weeklySits
        },
        badges: Array.isArray(data.badges) ? data.badges : []
      };
    } catch {
      return defaultStore();
    }
  }

  function saveStore(patch) {
    const current = loadStore();
    const next = { ...current, ...patch };
    if (patch.goals) next.goals = { ...current.goals, ...patch.goals };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function audioSrcFor(type) {
    return AUDIO_BY_MODE[type] || AUDIO_BY_MODE.sit;
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

  function startOfLocalWeek(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function weekBounds(date = new Date()) {
    const start = startOfLocalWeek(date);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { startKey: todayKey(start), endKey: todayKey(end) };
  }

  function weekStats(history, date = new Date()) {
    const { startKey, endKey } = weekBounds(date);
    let minutes = 0;
    let sits = 0;
    history.forEach((item) => {
      const day = item && item.day;
      if (!day || day < startKey || day > endKey) return;
      minutes += Number(item.minutes) || 0;
      sits += 1;
    });
    return { minutes, sits };
  }

  function dayMinutes(history, dayKey) {
    return history
      .filter((item) => item.day === dayKey)
      .reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  }

  function sessionsForDay(history, dayKey) {
    return history.filter((item) => item.day === dayKey);
  }

  function practiceDays(history) {
    const set = new Set();
    history.forEach((item) => {
      if (item && item.day) set.add(item.day);
    });
    return set;
  }

  function maxWeekSits(history) {
    const byWeek = new Map();
    history.forEach((item) => {
      if (!item || !item.day) return;
      const parts = item.day.split("-").map(Number);
      if (parts.length !== 3) return;
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      const { startKey } = weekBounds(date);
      byWeek.set(startKey, (byWeek.get(startKey) || 0) + 1);
    });
    let max = 0;
    byWeek.forEach((n) => {
      if (n > max) max = n;
    });
    return max;
  }

  function evaluateBadges(store) {
    const history = store.history;
    const streak = computeStreak(history);
    const total = totalMinutes(history);
    const unlocked = new Set(store.badges || []);
    const earned = [];
    if (history.some((h) => h.completed) || history.length > 0) earned.push("first-sit");
    if (streak >= 3) earned.push("streak-3");
    if (streak >= 7) earned.push("streak-7");
    if (total >= 60) earned.push("minutes-60");
    if (maxWeekSits(history) >= 7 || weekStats(history).sits >= 7) earned.push("week-sits-7");
    let changed = false;
    earned.forEach((id) => {
      if (!unlocked.has(id)) {
        unlocked.add(id);
        changed = true;
      }
    });
    if (changed) {
      return saveStore({ badges: [...unlocked] });
    }
    return store;
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

  function setGoalBar(el, now, target) {
    if (!el) return;
    const pct = target > 0 ? Math.min(100, Math.round((now / target) * 100)) : 0;
    el.style.width = `${pct}%`;
  }

  function renderGoals(store) {
    const history = store.history;
    const goals = store.goals || DEFAULT_GOALS;
    const todayMins = dayMinutes(history, todayKey());
    const week = weekStats(history);
    if (els.goals.dailyNow) els.goals.dailyNow.textContent = String(todayMins);
    if (els.goals.dailyTarget) els.goals.dailyTarget.textContent = String(goals.dailyMinutes);
    if (els.goals.weeklyNow) els.goals.weeklyNow.textContent = String(week.sits);
    if (els.goals.weeklyTarget) els.goals.weeklyTarget.textContent = String(goals.weeklySits);
    setGoalBar(els.goals.dailyBar, todayMins, goals.dailyMinutes);
    setGoalBar(els.goals.weeklyBar, week.sits, goals.weeklySits);
  }

  function renderBadges(store) {
    if (!els.badgesList) return;
    const unlocked = new Set(store.badges || []);
    els.badgesList.replaceChildren();
    BADGE_DEFS.forEach((def) => {
      const li = document.createElement("li");
      const on = unlocked.has(def.id);
      li.className = on ? "badge is-unlocked" : "badge is-locked";
      li.title = def.desc;
      const name = document.createElement("span");
      name.className = "badge-name";
      name.textContent = def.label;
      const mark = document.createElement("span");
      mark.className = "badge-mark";
      mark.textContent = on ? "✦" : "·";
      li.append(mark, name);
      els.badgesList.append(li);
    });
  }

  function renderCalendar(store) {
    if (!els.cal.grid) return;
    const days = practiceDays(store.history);
    const year = state.calYear;
    const month = state.calMonth;
    const first = new Date(year, month, 1);
    const monthLabel = first.toLocaleString(undefined, { month: "long", year: "numeric" });
    els.cal.title.textContent = monthLabel;

    const startPad = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    els.cal.grid.replaceChildren();

    for (let i = 0; i < startPad; i += 1) {
      const empty = document.createElement("span");
      empty.className = "cal-cell is-empty";
      empty.setAttribute("aria-hidden", "true");
      els.cal.grid.append(empty);
    }

    const today = todayKey();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const key = todayKey(date);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-cell";
      btn.textContent = String(d);
      btn.dataset.day = key;
      if (days.has(key)) btn.classList.add("has-practice");
      if (key === today) btn.classList.add("is-today");
      if (key === state.selectedDay) btn.classList.add("is-selected");
      btn.setAttribute("aria-label", `${key}${days.has(key) ? ", practice logged" : ""}`);
      btn.addEventListener("click", () => {
        state.selectedDay = key;
        renderStats();
      });
      els.cal.grid.append(btn);
    }

    if (els.cal.selectedLabel) {
      const count = sessionsForDay(store.history, state.selectedDay).length;
      els.cal.selectedLabel.textContent = count
        ? `${state.selectedDay} · ${count} session${count === 1 ? "" : "s"}`
        : `${state.selectedDay} · no sessions`;
    }
  }

  function renderHistoryList(store) {
    els.historyList.replaceChildren();
    const dayKey = state.selectedDay;
    const items = sessionsForDay(store.history, dayKey).slice().reverse();
    items.forEach((item) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const right = document.createElement("strong");
      const done = item.completed ? "completed" : "stopped early";
      left.textContent = `${item.day} · ${item.typeLabel}`;
      right.textContent = item.isOpen
        ? `${item.minutes} min · open · ${done}`
        : `${item.minutes} min · ${done}`;
      li.append(left, right);
      els.historyList.append(li);
    });
    els.historyEmpty.hidden = items.length > 0 || store.history.length > 0;
    if (!items.length) {
      els.historyEmpty.hidden = false;
      els.historyEmpty.textContent = store.history.length
        ? "No sittings on this day."
        : "No sittings yet. Begin when you are ready.";
    } else {
      els.historyEmpty.hidden = true;
    }
  }

  function renderStats() {
    let store = loadStore();
    store = evaluateBadges(store);
    const history = store.history;
    const streak = computeStreak(history);
    const total = totalMinutes(history);
    const week = weekStats(history);
    els.stats.streak.textContent = streak === 1 ? "1 day" : `${streak} days`;
    els.stats.total.textContent = `${total} min`;
    els.stats.count.textContent = String(history.length);
    els.hist.streak.textContent = els.stats.streak.textContent;
    els.hist.total.textContent = String(total);
    if (els.hist.weekMinutes) els.hist.weekMinutes.textContent = String(week.minutes);
    if (els.hist.weekSits) els.hist.weekSits.textContent = String(week.sits);
    renderGoals(store);
    renderBadges(store);
    renderCalendar(store);
    renderHistoryList(store);
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

  function playEndBell() {
    if (state.muted || !state.bellArmed) return;
    state.bellArmed = false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = playEndBell.ctx || new AudioCtx();
    playEndBell.ctx = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const freqs = [528, 792, 1056];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(BELL_VOL / freqs.length, now + 0.03 + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.25);
    });
  }

  /**
   * Pause, swap #soundscape src for mode, load, optionally reset to 0.
   * Called on Begin and when practice mode changes while idle.
   */
  function applyModeAudio(type, { reset = false, play = false } = {}) {
    const src = audioSrcFor(type);
    const current = els.soundscape.getAttribute("src") || "";
    const needsSwap = current !== src;
    if (needsSwap || reset) {
      els.soundscape.pause();
      if (needsSwap) {
        els.soundscape.src = src;
        els.soundscape.load();
      }
      if (reset) els.soundscape.currentTime = 0;
    }
    els.soundscape.loop = true;
    els.soundscape.muted = state.muted;
    updateSoundscapeVolume();
    if (play && state.musicEnabled) {
      const p = els.soundscape.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  function ensureAudioReady() {
    applyModeAudio(state.type || selectedType(), { reset: false, play: false });
  }

  /** Linear fade of els.soundscape over last 30s of a timed sit only. */
  function updateSoundscapeVolume() {
    if (!state.musicEnabled || state.muted || state.isOpen || !state.sessionActive) {
      els.soundscape.volume = MUSIC_VOL;
      return;
    }
    if (state.remaining > 30) {
      els.soundscape.volume = MUSIC_VOL;
      return;
    }
    const t = Math.max(0, state.remaining) / 30;
    els.soundscape.volume = MUSIC_VOL * t;
  }

  function stopSoundscapeFade() {
    els.soundscape.volume = MUSIC_VOL;
  }

  function startAudioFromGesture(reset) {
    applyModeAudio(state.type, { reset: Boolean(reset), play: true });
  }

  function pauseAudio(reset) {
    els.soundscape.pause();
    if (reset) els.soundscape.currentTime = 0;
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
    updateSoundscapeVolume();
    renderTimerNow();
    if (state.remaining === 0) {
      if (state.status === "running") completeSession(true);
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
    state.sessionActive = true;
    state.bellArmed = true;
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
    startAudioFromGesture(true);
    startTicking();
  }

  function pauseSession() {
    if (state.status !== "running") return;
    state.status = "paused";
    clearTimers();
    stopSoundscapeFade();
    pauseAudio(false);
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
    startAudioFromGesture(false);
    updateSoundscapeVolume();
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
    state.sessionActive = false;
    stopSoundscapeFade();
    pauseAudio(true);
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
    let next = saveStore({ history: store.history });
    next = evaluateBadges(next);
    return next;
  }

  function completeSession(natural) {
    if (state.status !== "running" && state.status !== "paused") return;
    const elapsed = state.elapsed;
    clearTimers();
    state.sessionActive = false;
    stopSoundscapeFade();
    pauseAudio(true);
    state.status = "complete";
    document.body.classList.remove("is-running");
    if (natural) playEndBell();
    const minutes = state.isOpen
      ? Math.max(1, Math.round(elapsed / 60) || (elapsed > 0 ? 1 : 0))
      : state.durationMinutes;
    if (elapsed >= MIN_LOG_SECONDS || natural) {
      logSession(true, Math.max(elapsed, state.isOpen ? elapsed : state.durationMinutes * 60));
    }
    const store = loadStore();
    const streak = computeStreak(store.history);
    els.complete.title.textContent = natural ? "Well held." : "A pause, then rest.";
    els.complete.meta.textContent = `${minutes} min \u00b7 ${TYPES[state.type].label}`;
    els.complete.streak.textContent = streak
      ? `Streak: ${streak} day${streak === 1 ? "" : "s"} \u00b7 ${totalMinutes(store.history)} minutes all told.`
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
      pauseAudio(false);
      return;
    }
    if (state.sessionActive) {
      startAudioFromGesture(false);
      updateSoundscapeVolume();
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    saveStore({ muted: state.muted });
    syncMusicButtons();
    updateSoundscapeVolume();
  }

  function openHistory() {
    renderStats();
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
    if (state.sessionActive && state.musicEnabled && !state.muted) {
      startAudioFromGesture(false);
    }
  }

  function onModeChange() {
    const type = selectedType();
    state.type = type;
    if (state.status === "idle" || state.status === "complete") {
      applyModeAudio(type, { reset: false, play: false });
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
    document.querySelectorAll('input[name="session-type"]').forEach((input) => {
      input.addEventListener("change", onModeChange);
    });
    els.customMinutes.addEventListener("input", () => {
      if (state.status === "idle") renderConfiguredTime();
    });
    if (els.cal.prev) {
      els.cal.prev.addEventListener("click", () => {
        state.calMonth -= 1;
        if (state.calMonth < 0) {
          state.calMonth = 11;
          state.calYear -= 1;
        }
        renderStats();
      });
    }
    if (els.cal.next) {
      els.cal.next.addEventListener("click", () => {
        state.calMonth += 1;
        if (state.calMonth > 11) {
          state.calMonth = 0;
          state.calYear += 1;
        }
        renderStats();
      });
    }
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
    state.type = selectedType();
    state.selectedDay = todayKey();
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
