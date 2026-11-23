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
    boosts: { extraHearts: 0 },
    createdAt: Date.now(),
  };
}

export function hydrateState(parsed: Partial<GameState>): GameState {
  const base = defaultState();
  return {
    ...base,
    ...parsed,
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    boosts: { ...base.boosts, ...(parsed.boosts ?? {}) },
    cards: parsed.cards ?? base.cards,
    quests: parsed.quests ?? base.quests,
    mistakes: parsed.mistakes ?? base.mistakes,
    chat: Array.isArray(parsed.chat) ? parsed.chat : base.chat,
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : base.achievements,
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return hydrateState(JSON.parse(raw) as Partial<GameState>);
  } catch { return defaultState(); }
}

export function parseImportedState(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== "object" || parsed.v !== 1) return null;
    if (parsed.profile != null && (typeof parsed.profile !== "object" || typeof parsed.profile.name !== "string")) return null;
    return hydrateState(parsed);
  } catch {
    return null;
  }
}

export function exportState(s: GameState): string {
  return JSON.stringify(s);
}

export function saveState(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(now = new Date()): string {
  return formatLocalDate(now);
}

export function yesterdayStr(now = new Date()): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}
