import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, WORDS, ZONES } from "./content";

describe("word bank", () => {
  it("gives every word a unique id and an emoji", () => {
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(WORDS.length);
    expect(WORDS.length).toBeGreaterThan(140);
    for (const w of WORDS) {
      expect(w.emoji.trim().length).toBeGreaterThan(0);
      expect(w.en.trim().length).toBeGreaterThan(0);
      expect(w.ru.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("galaxy map", () => {
  it("keeps a quest trio on every planet including Spotlight 4.2", () => {
    expect(ZONES.map((z) => z.id)).toEqual([
      "greet", "animals", "food", "colors", "family", "actions",
      "yesterday", "stories", "memories", "trips",
    ]);
    for (const z of ZONES) {
      expect(z.quests).toHaveLength(3);
      expect(z.quests[2].kind).toBe("boss");
    }
  });
});

describe("achievements", () => {
  it("lists each badge by name, not by raw id", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.name).not.toBe(a.id);
      expect(a.name.length).toBeGreaterThan(2);
      expect(a.desc.length).toBeGreaterThan(4);
    }
  });
});
