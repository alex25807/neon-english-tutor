import { describe, expect, it } from "vitest";
import { defaultState } from "./storage";
import { firstSpeakPrompt, nextSpeakPrompt, SPEAK_SCRIPT, voiceFeedback } from "./voiceTutor";

describe("voiceFeedback", () => {
  it("gives three stars on an exact phrase", () => {
    const fb = voiceFeedback("hello", "Hello!");
    expect(fb.stars).toBe(3);
    expect(fb.ok).toBe(true);
  });

  it("keeps a near miss as retry, not a pass", () => {
    const fb = voiceFeedback("nice to meet you", "pizza");
    expect(fb.ok).toBe(false);
    expect(fb.stars).toBeLessThan(2);
    expect(fb.text.toLowerCase()).toContain("pizza");
  });
});

describe("speak prompts", () => {
  it("starts with a greeting from the script", () => {
    const first = firstSpeakPrompt(defaultState());
    expect(first.en.toLowerCase()).toBe("hello");
    expect(SPEAK_SCRIPT.some((p) => p.id === first.id)).toBe(true);
  });

  it("does not immediately repeat a used prompt when others remain", () => {
    const used = SPEAK_SCRIPT.slice(0, 3).map((p) => p.id);
    const next = nextSpeakPrompt(defaultState(), used);
    expect(used).not.toContain(next.id);
  });
});
