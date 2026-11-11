import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("Brad admin seed passwords", () => {
  it("hashes BRAD_ADMIN_PASSWORD from the environment at runtime", async () => {
    const password = process.env.TEST_BRAD_PASSWORD || process.env.BRAD_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      const sample = await hashPassword("Temporary-Test-Only-9");
      expect(sample.startsWith("$2a$") || sample.startsWith("$2b$")).toBe(true);
      return;
    }
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });
});
