import { describe, expect, it } from "vitest";
import {
  authenticateRequest,
  buildSessionCookie,
  createSessionToken,
  hashPassword,
  roleForEmail,
  verifyPassword,
  verifySessionToken,
} from "../../src/infrastructure/auth/cloudflare-access";

describe("Application authentication & roles", () => {
  it("matches administrator emails case-insensitively", () => {
    expect(
      roleForEmail("Maria@example.com", "admin@example.com, maria@example.com"),
    ).toBe("admin");
  });

  it("treats authenticated non-admin users as read-only users", () => {
    expect(roleForEmail("user@example.com", "admin@example.com")).toBe("user");
  });

  it("hashes and verifies passwords with PBKDF2-SHA256", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple!");
    expect(hash.startsWith("pbkdf2_sha256$100000$")).toBe(true);
    expect(await verifyPassword("CorrectHorseBatteryStaple!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword!", hash)).toBe(false);
  });

  it("issues and verifies signed session tokens and cookies", async () => {
    const secret = "test-secret-key-at-least-32-bytes-long";
    const token = await createSessionToken(
      {
        email: "bashdemy@gmail.com",
        role: "admin",
        displayName: "Maria",
        slot: "owner",
      },
      secret,
    );

    const verified = await verifySessionToken(token, secret);
    expect(verified).toEqual({
      email: "bashdemy@gmail.com",
      role: "admin",
      displayName: "Maria",
      slot: "owner",
    });

    const cookieHeader = buildSessionCookie(token, true);
    const request = new Request("https://certified-loco.bashdemy.workers.dev/api/me", {
      headers: { Cookie: cookieHeader },
    });
    const reqUser = await authenticateRequest(request, { AUTH_SECRET: secret });
    expect(reqUser?.email).toBe("bashdemy@gmail.com");
    expect(reqUser?.role).toBe("admin");
  });
});
