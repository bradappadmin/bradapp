import { describe, expect, it } from "vitest";
import { canOpenPartner, openPartnerHref, openPartnerLabel } from "./trade-open-partner";

describe("trade Open partner deep-links", () => {
  it("links the public garage for a real partner", () => {
    expect(canOpenPartner(177, 2)).toBe(true);
    expect(openPartnerHref(177, 2)).toBe("/members/177");
    expect(openPartnerLabel()).toBe("Open partner");
  });

  it("hides when the partner id is missing", () => {
    expect(canOpenPartner(0, 2)).toBe(false);
    expect(openPartnerHref(0, 2)).toBeNull();
    expect(openPartnerHref(null, 2)).toBeNull();
    expect(openPartnerHref(undefined, 2)).toBeNull();
  });

  it("hides when the partner is the viewer", () => {
    expect(canOpenPartner(2, 2)).toBe(false);
    expect(openPartnerHref(2, 2)).toBeNull();
  });
});
