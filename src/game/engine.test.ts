import { describe, expect, it } from "vitest";
import { ZONES } from "./content";
import {
  applyQuestFinish,
  buyExtraHeart,
  emptyCard,
  EXTRA_HEART_COST,
  questStartHearts,
  levelInfo,
  matchStepResults,
  updCard,
  xpNeed,
  xpToReachLevel,
  zoneUnlocked,
} from "./engine";
import { defaultState } from "./storage";
import type { FinishPayload, Word } from "./types";

const word = (id: string, en = id, ru = id): Word => ({
  id,
  en,
  ru,
  topic: "animals",
  lvl: 1,
  emoji: "✨",
});

const payload = (over: Partial<FinishPayload> = {}): FinishPayload => ({
  questId: "greet-1",
  stats: {
    correct: 4,
    wrong: 1,
    xpEarned: 50,
    coinsEarned: 8,
    maxCombo: 3,
    wrongWords: [],
    newWords: [],
    speakCount: 1,
  },
  wordResults: { "animals-cat": true, "animals-dog": false },
  wrongCounts: { "animals-dog": 1 },
  perfect: false,
  completed: true,
  ...over,
});

describe("SRS updCard", () => {
  it("promotes box and schedules due on a correct answer", () => {
    const now = 1_000_000;
    const next = updCard(emptyCard(), true, now);
    expect(next.seen).toBe(1);
    expect(next.correct).toBe(1);
    expect(next.box).toBe(1);
    expect(next.lapses).toBe(0);
    expect(next.due).toBeGreaterThan(now);
  });

  it("resets box on a wrong answer", () => {
    const now = 1_000_000;
    const learned = updCard(updCard(emptyCard(), true, now), true, now + 1);
    const failed = updCard(learned, false, now + 2);
    expect(failed.box).toBe(0);
    expect(failed.lapses).toBe(1);
    expect(failed.correct).toBe(2);
    expect(failed.seen).toBe(3);
  });

  it("does not mutate the original card", () => {
    const card = emptyCard();
    updCard(card, true, 10);
    expect(card).toEqual(emptyCard());
  });
});

describe("start level XP", () => {
  it("gives enough XP to stand on the chosen level", () => {
    expect(xpToReachLevel(1)).toBe(0);
    expect(levelInfo(xpToReachLevel(1)).level).toBe(1);
    expect(levelInfo(xpToReachLevel(2)).level).toBe(2);
    expect(levelInfo(xpToReachLevel(3)).level).toBe(3);
    expect(xpToReachLevel(3)).toBe(xpNeed(1) + xpNeed(2));
  });

  it("unlocks planets that match the placement level", () => {
    const level2 = levelInfo(xpToReachLevel(2)).level;
    const level3 = levelInfo(xpToReachLevel(3)).level;
    const greet = ZONES.find((z) => z.id === "greet")!;
    const animals = ZONES.find((z) => z.id === "animals")!;
    const food = ZONES.find((z) => z.id === "food")!;
    expect(zoneUnlocked(greet, 1)).toBe(true);
    expect(zoneUnlocked(animals, 1)).toBe(false);
    expect(zoneUnlocked(animals, level2)).toBe(true);
    expect(zoneUnlocked(food, level2)).toBe(false);
    expect(zoneUnlocked(food, level3)).toBe(true);
  });
});

describe("matchStepResults", () => {
  const pairs = [word("a", "cat", "кот"), word("b", "dog", "собака"), word("c", "fox", "лиса")];

  it("marks every pair once", () => {
    const result = matchStepResults(pairs, ["b"]);
    expect(result.wordResults).toEqual({ a: true, b: false, c: true });
    expect(result.wrongWords.map((w) => w.id)).toEqual(["b"]);
    expect(result.allCorrect).toBe(false);
  });

  it("treats a clean match as a single success for all words", () => {
    const result = matchStepResults(pairs, []);
    expect(result.allCorrect).toBe(true);
    expect(Object.values(result.wordResults).every(Boolean)).toBe(true);
  });
});

describe("applyQuestFinish", () => {
  it("copies cards and does not mutate the previous state", () => {
    const prev = defaultState();
    prev.cards = { "animals-cat": emptyCard() };
    const beforeCards = prev.cards;
    const { state } = applyQuestFinish(prev, payload(), 5_000, "2026-11-18", "2026-11-17");
    expect(state.cards).not.toBe(beforeCards);
    expect(beforeCards["animals-cat"]).toEqual(emptyCard());
    expect(state.cards["animals-cat"].seen).toBe(1);
    expect(state.cards["animals-dog"].box).toBe(0);
    expect(state.xp).toBe(50);
  });

  it("updates SRS on fail but does not mark the quest done", () => {
    const prev = defaultState();
    const { state } = applyQuestFinish(
      prev,
      payload({ completed: false, perfect: true, questId: "greet-3" }),
      5_000,
      "2026-11-18",
      "2026-11-17",
    );
    expect(state.cards["animals-cat"].seen).toBe(1);
    expect(state.quests["greet-3"]).toBeUndefined();
    expect(state.perfects).toBe(0);
    expect(state.bossesDown).toBe(0);
    expect(state.streak).toEqual({ count: 1, lastDay: "2026-11-18" });
  });

  it("marks a completed quest and can count a boss", () => {
    const prev = defaultState();
    const { state, effects } = applyQuestFinish(
      prev,
      payload({ questId: "greet-3", stats: { ...payload().stats, correct: 6, wrong: 0, xpEarned: 200 }, perfect: true }),
      5_000,
      "2026-11-18",
      "2026-11-17",
    );
    expect(state.quests["greet-3"]).toEqual({ stars: 3, done: 1 });
    expect(state.perfects).toBe(1);
    expect(state.bossesDown).toBe(1);
    expect(state.achievements).toContain("first");
    expect(effects.newAchievements).toContain("first");
  });
});

describe("buyExtraHeart", () => {
  it("spends volts and stocks a heart", () => {
    const prev = { ...defaultState(), coins: EXTRA_HEART_COST };
    const next = buyExtraHeart(prev);
    expect(next).not.toBeNull();
    expect(next!.coins).toBe(0);
    expect(next!.boosts.extraHearts).toBe(1);
    expect(prev.coins).toBe(EXTRA_HEART_COST);
  });

  it("stacks a second heart", () => {
    const first = buyExtraHeart({ ...defaultState(), coins: EXTRA_HEART_COST * 2 })!;
    const second = buyExtraHeart(first)!;
    expect(second.coins).toBe(0);
    expect(second.boosts.extraHearts).toBe(2);
  });

  it("refuses when there are not enough volts", () => {
    expect(buyExtraHeart({ ...defaultState(), coins: EXTRA_HEART_COST - 1 })).toBeNull();
  });
});

describe("questStartHearts", () => {
  it("adds a bonus heart only on the first attempt", () => {
    expect(questStartHearts(1)).toBe(4);
    expect(questStartHearts(1, true)).toBe(3);
    expect(questStartHearts(0)).toBe(3);
  });
});
