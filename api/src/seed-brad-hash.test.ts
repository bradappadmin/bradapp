import { describe, expect, it } from "vitest";
import { verifyPassword } from "./password.js";

/** Committed Brad admin hash from seed.ts — plaintext never appears in source. */
const BRAD_ADMIN_PASSWORD_HASH =
  "$2a$12$EpJhNF5BOG5tE8Un1njOw.QPa6MGZJ.Hd264KxKounBEWe5q0aohm";

describe("Brad admin seed hash", () => {
  it("matches TEST_BRAD_PASSWORD when provided", async () => {
    const password = process.env.TEST_BRAD_PASSWORD;
    if (!password) {
      expect(BRAD_ADMIN_PASSWORD_HASH.startsWith("$2a$")).toBe(true);
      return;
    }
    expect(await verifyPassword(password, BRAD_ADMIN_PASSWORD_HASH)).toBe(true);
  });
});
