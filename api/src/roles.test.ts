import { describe, expect, it } from "vitest";
import { isRole, roleLabel, type Role } from "./roles.js";

describe("roles", () => {
  it("accepts known roles only", () => {
    expect(isRole("super_admin")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("member")).toBe(true);
    expect(isRole("parent")).toBe(false);
  });

  it("labels every role", () => {
    const roles: Role[] = ["super_admin", "admin", "member"];
    for (const role of roles) {
      expect(roleLabel(role).length).toBeGreaterThan(0);
    }
  });
});
