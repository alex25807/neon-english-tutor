import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultState, exportState, formatLocalDate, hydrateState, parseImportedState, todayStr, yesterdayStr } from "./storage";

describe("local calendar dates", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats with local Y-M-D, not UTC ISO", () => {
    const utcLate = new Date(Date.UTC(2026, 0, 1, 23, 30, 0));
    const local = formatLocalDate(utcLate);
    const iso = utcLate.toISOString().slice(0, 10);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(local).toBe(
      `${utcLate.getFullYear()}-${String(utcLate.getMonth() + 1).padStart(2, "0")}-${String(utcLate.getDate()).padStart(2, "0")}`,
    );
    if (utcLate.getDate() !== utcLate.getUTCDate()) {
      expect(local).not.toBe(iso);
    }
  });

  it("uses the same local calendar for today and yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 0, 30, 0));
    expect(todayStr()).toBe("2026-01-01");
    expect(yesterdayStr()).toBe("2025-12-31");
  });
});

describe("import / hydrate", () => {
  it("fills missing boosts from older saves", () => {
    const next = hydrateState({ v: 1, coins: 40, profile: { name: "Лео", avatar: 1 } });
    expect(next.boosts.extraHearts).toBe(0);
    expect(next.coins).toBe(40);
    expect(next.profile?.name).toBe("Лео");
    expect(next.settings.voiceOn).toBe(true);
  });

  it("accepts a v1 export and rejects junk", () => {
    const raw = JSON.stringify({ ...defaultState(), profile: { name: "Мира", avatar: 0 }, xp: 80 });
    const ok = parseImportedState(raw);
    expect(ok?.profile?.name).toBe("Мира");
    expect(ok?.xp).toBe(80);
    expect(parseImportedState("{")).toBeNull();
    expect(parseImportedState(JSON.stringify({ v: 2 }))).toBeNull();
    expect(parseImportedState(JSON.stringify({ v: 1, profile: "nope" }))).toBeNull();
  });

  it("round-trips an export including boosts", () => {
    const src = { ...defaultState(), coins: 40, boosts: { extraHearts: 2 }, profile: { name: "Лео", avatar: 1 } };
    const back = parseImportedState(exportState(src));
    expect(back?.coins).toBe(40);
    expect(back?.boosts.extraHearts).toBe(2);
    expect(back?.profile?.name).toBe("Лео");
  });
});
