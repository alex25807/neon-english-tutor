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
