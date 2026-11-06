import { describe, expect, it } from "vitest";
import { roleLabel, type Role } from "./types";

describe("roleLabel", () => {
  it("covers every role", () => {
    const roles: Role[] = ["super_admin", "admin", "member"];
    expect(roles.map(roleLabel)).toEqual(["Super admin", "Admin", "Member"]);
  });
});
