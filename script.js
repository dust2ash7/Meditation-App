(() => {
  "use strict";

  const STORAGE_KEY = "stillpoint-v1";
  const CACHE_ID = "stillpoint-v21";
  const AUDIO_BY_MODE = {
    sit: "./audio/stillpoint-sit.mp3",
    box: "./audio/stillpoint-box.mp3",
    wind: "./audio/stillpoint-wind.mp3"
  };
  // File beds for Nature (wild) and Beach (shore); Soft still uses AUDIO_BY_MODE.
  const AUDIO_BY_SOUND = {
    wild: "./audio/stillpoint-wild.mp3",
    shore: "./audio/stillpoint-shore.mp3",
    rain: "./audio/stillpoint-rain.mp3",
    fall: "./audio/stillpoint-fall.mp3"
  };
  const AUDIO_REMOTE_FALLBACK = {
    rain: "https://bigsoundbank.com/UPLOAD/mp3/1019.mp3",
    fall: "https://bigsoundbank.com/UPLOAD/mp3/1294.mp3"
  };
  const SOUND_KINDS = ["soft", "white", "rain", "fall", "shore", "wild"];
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
