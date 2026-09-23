import type { GameState } from "./types";

const KEY = "neon-english-tutor-v1";

export function defaultState(): GameState {
  return {
    v: 1,
    profile: null,
    startLevel: 1,
    xp: 0,
    coins: 0,
    streak: { count: 0, lastDay: "" },
    cards: {},
    quests: {},
    achievements: [],
    mistakes: {},
    speakDone: 0,
    bossesDown: 0,
    perfects: 0,
    chat: [],
    settings: { voiceOn: true, voltTalks: true, rate: 0.85, voiceGender: "default" },
    createdAt: Date.now(),
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const base = defaultState();
    return { ...base, ...parsed, streak: { ...base.streak, ...(parsed.streak ?? {}) }, settings: { ...base.settings, ...(parsed.settings ?? {}) } };
  } catch { return defaultState(); }
}

export function saveState(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function todayStr(): string { return new Date().toISOString().slice(0, 10); }
export function yesterdayStr(): string { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
