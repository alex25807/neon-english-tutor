import { describe, expect, it } from "vitest";
import { normalizeSpoken, speechMatches } from "./speech";

describe("normalizeSpoken", () => {
  it("strips punctuation and extra spaces", () => {
    expect(normalizeSpoken(" Hello, CAT! ")).toBe("hello cat");
  });
});

describe("speechMatches", () => {
  it("accepts an exact word", () => {
    expect(speechMatches("hello", "hello")).toBe(true);
    expect(speechMatches("hello", "Hello!")).toBe(true);
  });

  it("does not accept a short substring of the target", () => {
    expect(speechMatches("hello", "h")).toBe(false);
    expect(speechMatches("hello", "he")).toBe(false);
    expect(speechMatches("hello", "hel")).toBe(false);
  });

  it("accepts the target as a whole word inside a longer phrase", () => {
    expect(speechMatches("hello", "hello there")).toBe(true);
    expect(speechMatches("thank you", "please thank you")).toBe(true);
  });

  it("does not treat a short typed fragment as the whole word", () => {
    expect(speechMatches("elephant", "e")).toBe(false);
    expect(speechMatches("elephant", "ele")).toBe(false);
  });

  it("allows a small pronunciation typo of similar length", () => {
    expect(speechMatches("hello", "helo")).toBe(true);
    expect(speechMatches("cat", "cats")).toBe(true);
  });

  it("rejects empty input", () => {
    expect(speechMatches("hello", "")).toBe(false);
    expect(speechMatches("", "hello")).toBe(false);
  });
});
