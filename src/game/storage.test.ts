import { afterEach, describe, expect, it, vi } from "vitest";
import { formatLocalDate, todayStr, yesterdayStr } from "./storage";

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
