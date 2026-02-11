import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAccessToken, verifyAccessToken } from "../../../lib/auth/jwt";

describe("jwt helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: "test-secret" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates and verifies a token", async () => {
    const token = await createAccessToken(
      { identifier: "chat-123", username: "demo" },
      1,
    );
    const payload = await verifyAccessToken(token);
    expect(payload.identifier).toBe("chat-123");
    expect(payload.username).toBe("demo");
  });
});
