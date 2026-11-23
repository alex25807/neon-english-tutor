import { GAP_TASKS, SENTENCES, WORDS_BY_TOPIC, ZONES } from "./content";
import { todayStr, yesterdayStr } from "./storage";
import type { CardState, Exercise, FinishEffects, FinishPayload, GameState, QuestDef, Word, Zone } from "./types";

export const SRS_INTERVALS = [0, 10 * 60_000, 60 * 60_000, 12 * 3_600_000, 86_400_000, 3 * 86_400_000];

export const emptyCard = (): CardState => ({ box: 0, due: 0, lapses: 0, seen: 0, correct: 0 });

export function updCard(card: CardState, correct: boolean, now: number): CardState {
  const c: CardState = { ...card, seen: card.seen + 1 };
  if (correct) { c.box = Math.min(5, c.box + 1); c.correct += 1; }
  else { c.box = 0; c.lapses += 1; }
  c.due = now + SRS_INTERVALS[c.box];
  return c;
}

export function dueWords(state: GameState, now = Date.now()): Word[] {
  const all = ZONES.flatMap((z) => WORDS_BY_TOPIC(z.id));
  return all.filter((w) => { const c = state.cards[w.id]; return c && c.seen > 0 && c.due <= now; });
}

export function masteredCount(state: GameState): number {
  return Object.values(state.cards).filter((c) => c.box >= 3).length;
}

export function xpNeed(level: number): number { return 80 + (level - 1) * 40; }

export function xpToReachLevel(level: number): number {
  const target = Math.max(1, Math.floor(level));
  let xp = 0;
  for (let l = 1; l < target; l++) xp += xpNeed(l);
  return xp;
}

export function levelInfo(xp: number): { level: number; into: number; need: number } {
  let level = 1; let rest = xp;
  while (rest >= xpNeed(level)) { rest -= xpNeed(level); level += 1; }
  return { level, into: rest, need: xpNeed(level) };
}

export const zoneUnlocked = (zone: Zone, level: number) => level >= zone.reqLevel;

export function questUnlocked(state: GameState, zone: Zone, idx: number): boolean {
  if (!zoneUnlocked(zone, levelInfo(state.xp).level)) return false;
  if (idx === 0) return true;
  const prev = zone.quests[idx - 1];
  return (state.quests[prev.id]?.done ?? 0) > 0;
}

export function questDoneCount(state: GameState): number { return Object.values(state.quests).filter((q) => q.done > 0).length; }
export function starsCount(state: GameState): number { return Object.values(state.quests).reduce((s, q) => s + q.stars, 0); }
export function bossesDownCount(state: GameState): number { return ZONES.filter((z) => (state.quests[z.quests[2].id]?.done ?? 0) > 0).length; }

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function distractors(word: Word, count: number, key: "en" | "ru"): string[] {
  const sameTopic = WORDS_BY_TOPIC(word.topic).filter((w) => w.id !== word.id);
  const others = ZONES.flatMap((z) => WORDS_BY_TOPIC(z.id)).filter((w) => w.id !== word.id && w.topic !== word.topic);
  const pool = shuffle([...shuffle(sameTopic), ...shuffle(others)]);
  const set = new Set<string>();
  for (const w of pool) { const v = w[key]; if (!set.has(v) && v.toLowerCase() !== word[key].toLowerCase()) set.add(v); if (set.size >= count) break; }
  return [...set];
}

const isSpellable = (w: Word) => !w.en.includes(" ") && w.en.length <= 10;

export function buildQuestRun(zone: Zone, quest: QuestDef, state: GameState, now = Date.now()): Exercise[] {
  const questIdx = zone.quests.findIndex((q) => q.id === quest.id);
  const isBoss = quest.kind === "boss";
  const level = levelInfo(state.xp).level;
  const zoneOrder = ZONES.map((z) => z.id);
  const upTo = zoneOrder.indexOf(zone.id);
  const pool: Word[] = isBoss ? zoneOrder.slice(0, upTo + 1).flatMap((t) => WORDS_BY_TOPIC(t)) : WORDS_BY_TOPIC(zone.id);
  const lvlCap = isBoss ? 3 : Math.min(3, questIdx + 1);

  const score = (w: Word): number => {
    const c = state.cards[w.id]; let s = Math.random() * 20;
    if (!c || c.seen === 0) { s += 1000 + (lvlCap - w.lvl) * 60; }
    else { if (c.due <= now) s += 600; s += (5 - c.box) * 30 + c.lapses * 45; }
    return s;
  };

  const sorted = [...pool].sort((a, b) => score(b) - score(a));
  const maxNew = isBoss ? 0 : questIdx === 0 ? 4 : 3;
  const target = isBoss ? 8 : 7;
  const words: Word[] = [];
  let newCount = 0;
  for (const w of sorted) {
    if (words.length >= target) break;
    const c = state.cards[w.id]; const unseen = !c || c.seen === 0;
    if (unseen) { if (newCount >= maxNew) continue; newCount++; }
    words.push(w);
  }
  while (words.length < (isBoss ? 6 : 5)) { const extra = sorted.find((w) => !words.includes(w)); if (!extra) break; words.push(extra); }
  const optsCount = level >= 4 || state.startLevel >= 3 ? 3 : state.startLevel >= 2 ? 3 : 2;

  const steps: Exercise[] = [];
  const singleKinds = new Set(["listenChoice", "ruToEn", "enToRu", "spell", "speak"]);

  for (const w of words) {
    const c = state.cards[w.id]; const box = c?.box ?? 0;
    if ((!c || c.seen === 0) && !isBoss) steps.push({ kind: "intro", word: w });
    let kind: Exercise["kind"];
    if (box < 2) { kind = Math.random() < 0.5 ? "listenChoice" : "ruToEn"; }
    else if (box < 4) { kind = isSpellable(w) ? (Math.random() < 0.55 ? "spell" : "enToRu") : "enToRu"; }
    else { kind = isSpellable(w) ? (Math.random() < 0.5 ? "speak" : "spell") : "speak"; }
    switch (kind) {
      case "listenChoice": steps.push({ kind, word: w, options: shuffle([w.ru, ...distractors(w, optsCount, "ru")]) }); break;
      case "ruToEn": steps.push({ kind, word: w, options: shuffle([w.en, ...distractors(w, optsCount, "en")]) }); break;
      case "enToRu": steps.push({ kind, word: w, options: shuffle([w.ru, ...distractors(w, optsCount, "ru")]) }); break;
      case "spell": { const letters = w.en.split(""); let tiles = shuffle(letters); if (tiles.join("") === w.en && letters.length > 2) tiles = [...tiles].reverse(); steps.push({ kind, word: w, tiles }); break; }
      case "speak": steps.push({ kind, word: w }); break;
    }
  }

  if (words.length >= 4) {
    const candidates = steps.map((s, i) => ({ s, i })).filter(({ s }) => singleKinds.has(s.kind) && s.kind !== "speak");
    if (candidates.length >= 4) {
      const chosen = shuffle(candidates).slice(0, 4).sort((a, b) => a.i - b.i);
      const pairs = chosen.map(({ s }) => (s as { word: Word }).word);
      const at = chosen[0].i;
      const dropIdx = new Set(chosen.map(({ i }) => i));
      const rebuilt = steps.filter((_, i) => !dropIdx.has(i));
      rebuilt.splice(Math.max(0, at - 1), 0, { kind: "match", pairs });
      steps.length = 0; steps.push(...rebuilt);
    }
  }

  const gapPool = GAP_TASKS.filter((g) => g.lvl <= Math.min(3, level + 1));
  const topicGaps = gapPool.filter((g) => g.topic === zone.id);
  const gapSrc = topicGaps.length && Math.random() < 0.7 ? topicGaps : gapPool;
  const gap = gapSrc[Math.floor(Math.random() * gapSrc.length)];
  if (gap) steps.push({ kind: "gap", task: gap });

  if (questIdx >= 1 || isBoss) {
    const sentPool = SENTENCES.filter((s) => s.lvl <= Math.min(3, level + 1));
    const topicSent = sentPool.filter((s) => s.topic === zone.id);
    const sentSrc = topicSent.length ? topicSent : sentPool;
    const sent = sentSrc[Math.floor(Math.random() * sentSrc.length)];
    if (sent) steps.push({ kind: "build", sentence: sent, tiles: shuffle([...sent.tokens, sent.distractor]) });
  }

  while (steps.length > quest.steps) {
    const countFor = new Map<string, number>();
    for (const s of steps) { const w = (s as { word?: Word }).word; if (w && s.kind !== "intro") countFor.set(w.id, (countFor.get(w.id) ?? 0) + 1); }
    let rm = -1;
    for (let i = steps.length - 1; i >= 0; i--) { const s = steps[i]; const w = (s as { word?: Word }).word; if (w && s.kind !== "intro" && (countFor.get(w.id) ?? 0) > 1) { rm = i; break; } }
    if (rm === -1) { for (let i = steps.length - 1; i >= 0; i--) { const k = steps[i].kind; if (k === "ruToEn" || k === "enToRu" || k === "listenChoice") { rm = i; break; } } }
    if (rm === -1) rm = steps.length - 1;
    steps.splice(rm, 1);
  }
  return steps;
}

export function buildReviewRun(state: GameState, maxSteps = 10): Exercise[] {
  const now = Date.now();
  const due = dueWords(state, now).sort((a, b) => (state.cards[a.id].box - state.cards[b.id].box) || state.cards[a.id].due - state.cards[b.id].due);
  const words = due.slice(0, Math.min(6, due.length));
  const level = levelInfo(state.xp).level;
  const optsCount = level >= 4 ? 3 : 2;
  const steps: Exercise[] = [];
  for (const w of words) {
    const box = state.cards[w.id].box;
    if (box >= 4 && isSpellable(w) && Math.random() < 0.5) { steps.push({ kind: "speak", word: w }); }
    else if (box >= 2 && isSpellable(w)) { const letters = w.en.split(""); let tiles = shuffle(letters); if (tiles.join("") === w.en && letters.length > 2) tiles = [...tiles].reverse(); steps.push({ kind: "spell", word: w, tiles }); }
    else if (Math.random() < 0.5) { steps.push({ kind: "listenChoice", word: w, options: shuffle([w.ru, ...distractors(w, optsCount, "ru")]) }); }
    else { steps.push({ kind: "ruToEn", word: w, options: shuffle([w.en, ...distractors(w, optsCount, "en")]) }); }
  }
  if (words.length >= 4) { steps.unshift({ kind: "match", pairs: words.slice(0, 4) }); }
  return steps.slice(0, maxSteps);
}

export function checkAchievements(state: GameState): string[] {
  const fresh: string[] = [];
  const has = (id: string) => state.achievements.includes(id) || fresh.includes(id);
  const add = (id: string) => { if (!has(id)) fresh.push(id); };
  const done = questDoneCount(state);
  if (done >= 1) add("first"); if (done >= 3) add("trio"); if (done >= 10) add("ten");
  if (levelInfo(state.xp).level >= 3) add("lvl3"); if (levelInfo(state.xp).level >= 5) add("lvl5");
  if (state.streak.count >= 3) add("streak3"); if (masteredCount(state) >= 25) add("words25");
  if (bossesDownCount(state) >= 1) add("boss1"); if (bossesDownCount(state) >= ZONES.length) add("bossall");
  if (state.speakDone >= 10) add("voice10"); if (state.perfects >= 1) add("perfect");
  return fresh;
}

export function matchStepResults(pairs: Word[], errorIds: Iterable<string>): {
  wordResults: Record<string, boolean>;
  wrongWords: Word[];
  allCorrect: boolean;
} {
  const errors = errorIds instanceof Set ? errorIds : new Set(errorIds);
  const wordResults: Record<string, boolean> = {};
  const wrongWords: Word[] = [];
  for (const w of pairs) {
    const ok = !errors.has(w.id);
    wordResults[w.id] = ok;
    if (!ok) wrongWords.push(w);
  }
  return { wordResults, wrongWords, allCorrect: wrongWords.length === 0 };
}

export const EXTRA_HEART_COST = 25;
export const BASE_HEARTS = 3;

export function questStartHearts(bonusHearts: number, isRetry = false): number {
  return BASE_HEARTS + (isRetry ? 0 : Math.max(0, bonusHearts));
}

export function buyExtraHeart(state: GameState): GameState | null {
  if (state.coins < EXTRA_HEART_COST) return null;
  return {
    ...state,
    coins: state.coins - EXTRA_HEART_COST,
    boosts: { extraHearts: (state.boosts?.extraHearts ?? 0) + 1 },
  };
}

export function applyQuestFinish(
  state: GameState,
  payload: FinishPayload,
  now = Date.now(),
  today = todayStr(),
  yesterday = yesterdayStr(),
): { state: GameState; effects: FinishEffects } {
  const prevLevel = levelInfo(state.xp).level;
  const cards = { ...state.cards };
  for (const [wid, ok] of Object.entries(payload.wordResults)) {
    cards[wid] = updCard(cards[wid] ?? emptyCard(), ok, now);
  }
  const mistakes = { ...state.mistakes };
  for (const [wid, count] of Object.entries(payload.wrongCounts)) {
    mistakes[wid] = (mistakes[wid] ?? 0) + count;
  }
  const quests = { ...state.quests };
  if (payload.completed && payload.questId) {
    const prev = quests[payload.questId] ?? { stars: 0, done: 0 };
    const total = payload.stats.correct + payload.stats.wrong;
    const acc = total ? payload.stats.correct / total : 1;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    quests[payload.questId] = { stars: Math.max(prev.stars, stars), done: prev.done + 1 };
  }
  const streak = state.streak.lastDay === today
    ? state.streak
    : { count: state.streak.lastDay === yesterday ? state.streak.count + 1 : 1, lastDay: today };

  const drafted: GameState = {
    ...state,
    xp: state.xp + payload.stats.xpEarned,
    coins: state.coins + payload.stats.coinsEarned,
    speakDone: state.speakDone + payload.stats.speakCount,
    cards,
    mistakes,
    quests,
    streak,
    perfects: state.perfects + (payload.completed && payload.perfect ? 1 : 0),
    bossesDown: state.bossesDown + (payload.completed && payload.questId?.endsWith("-3") && payload.stats.correct > 0 ? 1 : 0),
  };
  const newAchievements = checkAchievements(drafted);
  const next: GameState = newAchievements.length
    ? { ...drafted, achievements: [...drafted.achievements, ...newAchievements] }
    : drafted;
  const newLevel = levelInfo(next.xp).level;
  return {
    state: next,
    effects: {
      leveledUpTo: newLevel > prevLevel ? newLevel : null,
      newAchievements,
    },
  };
}
