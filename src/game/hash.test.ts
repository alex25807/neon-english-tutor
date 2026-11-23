import { describe, expect, it } from "vitest";
import { hashFor, parseHash } from "./hash";

describe("parseHash", () => {
  it("reads known tabs and play", () => {
    expect(parseHash("#/map")).toBe("map");
    expect(parseHash("#/chat")).toBe("chat");
    expect(parseHash("#/progress")).toBe("progress");
    expect(parseHash("#/play")).toBe("play");
  });

  it("treats empty, junk and extra segments as map", () => {
    expect(parseHash("")).toBe("map");
    expect(parseHash("#/")).toBe("map");
    expect(parseHash("#/secret")).toBe("map");
    expect(parseHash("#/CHAT/extra")).toBe("chat");
  });
});

describe("hashFor", () => {
  it("writes a slash hash", () => {
    expect(hashFor("progress")).toBe("#/progress");
  });
});
