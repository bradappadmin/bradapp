import { describe, expect, it } from "vitest";
import { bioSnippet } from "./bio-snippet";

describe("bioSnippet", () => {
  it("returns null for empty bios", () => {
    expect(bioSnippet(null)).toBeNull();
    expect(bioSnippet("   ")).toBeNull();
  });

  it("keeps short bios intact", () => {
    expect(bioSnippet("Collects pace.")).toBe("Collects pace.");
  });

  it("truncates long bios on a word boundary", () => {
    const long =
      "Weekend bay runs and fair trades across the family garage with more words than fit.";
    const snippet = bioSnippet(long, 40);
    expect(snippet).not.toBeNull();
    expect(snippet!.endsWith("…")).toBe(true);
    expect(snippet!.length).toBeLessThanOrEqual(40);
  });
});
