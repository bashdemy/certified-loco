import { describe, expect, it } from "vitest";
import { roleForEmail } from "../../src/infrastructure/auth/cloudflare-access";

describe("Cloudflare Access application roles", () => {
  it("matches administrator emails case-insensitively", () => {
    expect(
      roleForEmail("Maria@example.com", "admin@example.com, maria@example.com"),
    ).toBe("admin");
  });

  it("treats authenticated non-admin users as read-only users", () => {
    expect(roleForEmail("user@example.com", "admin@example.com")).toBe("user");
  });
});
