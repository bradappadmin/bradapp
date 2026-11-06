import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const plain = "TestPassword-123!";
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
