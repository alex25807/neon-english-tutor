# ============================================
# Скрипт создания проекта Neon English
# Запустите из папки workspace
# ============================================

Write-Host "Создаю файлы проекта..." -ForegroundColor Cyan

# Удаляем старое содержимое src
if (Test-Path src) { Remove-Item -Recurse -Force src }
New-Item -ItemType Directory -Path src | Out-Null
New-Item -ItemType Directory -Path src\components | Out-Null
New-Item -ItemType Directory -Path src\game | Out-Null

Write-Host "Папки созданы. Создаю файлы..." -ForegroundColor Yellow

# ============================================
# src/game/types.ts
# ============================================
@'
export type TopicId = "greet" | "animals" | "food" | "colors" | "family" | "actions";

export interface Word {
  id: string;
  en: string;
  ru: string;
  topic: TopicId;
  lvl: 1 | 2 | 3;
}

export interface QuestDef {
  id: string;
  zone: TopicId;
  title: string;
  kind: "lesson" | "boss";
  steps: number;
}

export interface Zone {
  id: TopicId;
  title: string;
  subtitle: string;
  reqLevel: number;
  hue: string;
  hue2: string;
  ring: boolean;
  quests: QuestDef[];
}

export interface Sentence {
  id: string;
  en: string;
  ru: string;
  topic: TopicId;
  lvl: 1 | 2 | 3;
  tokens: string[];
  distractor: string;
}

export interface GapTask {
  id: string;
  before: string;
  after: string;
  options: string[];
  answer: string;
  hint: string;
  topic: TopicId;
  lvl: 1 | 2 | 3;
}

export interface CardState {
  box: number;
  due: number;
  lapses: number;
  seen: number;
  correct: number;
}

export type Exercise =
  | { kind: "intro"; word: Word }
  | { kind: "listenChoice"; word: Word; options: string[] }
  | { kind: "ruToEn"; word: Word; options: string[] }
  | { kind: "enToRu"; word: Word; options: string[] }
  | { kind: "spell"; word: Word; tiles: string[] }
  | { kind: "match"; pairs: Word[] }
  | { kind: "build"; sentence: Sentence; tiles: string[] }
  | { kind: "gap"; task: GapTask }
  | { kind: "speak"; word: Word };

export interface ChatMsg {
  id: string;
  from: "volt" | "me";
  text: string;
  at: number;
}

export interface Settings {
  voiceOn: boolean;
  voltTalks: boolean;
  rate: number;
  voiceGender: "male" | "female" | "default";
}

export interface GameState {
  v: number;
  profile: { name: string; avatar: number } | null;
  startLevel: number;
  xp: number;
  coins: number;
  streak: { count: number; lastDay: string };
  cards: Record<string, CardState>;
  quests: Record<string, { stars: number; done: number }>;
  achievements: string[];
  mistakes: Record<string, number>;
  speakDone: number;
  bossesDown: number;
  perfects: number;
  chat: ChatMsg[];
  settings: Settings;
  createdAt: number;
}

export interface RunStats {
  correct: number;
  wrong: number;
  xpEarned: number;
  coinsEarned: number;
  maxCombo: number;
  wrongWords: Word[];
  newWords: Word[];
  speakCount: number;
}

export interface Toast {
  id: number;
  title: string;
  desc?: string;
  tone: "gold" | "cyan" | "pink" | "lime";
}
'@ | Set-Content -Path "src\game\types.ts" -Encoding UTF8

Write-Host "  types.ts создан" -ForegroundColor Green

# ============================================
# src/game/storage.ts
# ============================================
@'
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
'@ | Set-Content -Path "src\game\storage.ts" -Encoding UTF8

Write-Host "  storage.ts создан" -ForegroundColor Green

Write-Host ""
Write-Host "Часть 1 готова! Теперь запустите create_project_part2.ps1" -ForegroundColor Cyan
