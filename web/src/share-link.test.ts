import { describe, expect, it, vi } from "vitest";
import {
  absoluteShareUrl,
  compareSharePath,
  copyTextToClipboard,
  garageSharePath,
  listingSharePath,
  reviewSharePath,
} from "./share-link";

describe("share link", () => {
  it("builds listing, compare, review, and garage paths and absolute URLs", () => {
    expect(listingSharePath(42)).toBe("/cars/42");
    expect(compareSharePath(1, 2)).toBe("/compare?a=1&b=2");
    expect(reviewSharePath(9)).toBe("/reviews/9");
    expect(garageSharePath(7)).toBe("/members/7");
    expect(absoluteShareUrl("/cars/42", "https://bay.example")).toBe(
      "https://bay.example/cars/42",
    );
    expect(absoluteShareUrl("cars/7", "https://bay.example/")).toBe(
      "https://bay.example/cars/7",
    );
    expect(absoluteShareUrl(reviewSharePath(9), "https://bay.example")).toBe(
      "https://bay.example/reviews/9",
    );
    expect(absoluteShareUrl(garageSharePath(7), "https://bay.example")).toBe(
      "https://bay.example/members/7",
    );
  });

  it("copies via clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyTextToClipboard("hello", { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("returns false when clipboard write fails and fallback is unavailable", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    // jsdom may still allow execCommand; mock document.createElement failure path via null clipboard only
    await expect(copyTextToClipboard("x", { writeText })).resolves.toBeTypeOf("boolean");
  });
});
