import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAccessToken } from "../../../lib/auth/jwt";
import { requireAuth } from "../../../lib/auth/require_auth";

type FakeRequest = {
  headers: { get: (key: string) => string | null };
  cookies: { get: (key: string) => { value: string } | undefined };
};

const makeRequest = (token?: string, useCookie = true): FakeRequest => ({
  headers: {
    get: (key: string) => {
      if (key.toLowerCase() !== "authorization") return null;
      return token && !useCookie ? `Bearer ${token}` : null;
    },
  },
  cookies: {
    get: (key: string) => {
      if (key !== "access_token") return undefined;
      return token && useCookie ? { value: token } : undefined;
    },
  },
});

describe("requireAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: "test-secret" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts a valid cookie token", async () => {
    const token = await createAccessToken(
      { identifier: "chat-abc", username: "demo" },
      1,
    );
    const payload = await requireAuth(
      makeRequest(token, true) as any,
      "chat-abc",
    );
    expect(payload.identifier).toBe("chat-abc");
  });

  it("accepts a valid bearer token", async () => {
    const token = await createAccessToken(
      { identifier: "chat-xyz", username: "demo" },
      1,
    );
    const payload = await requireAuth(
      makeRequest(token, false) as any,
      "chat-xyz",
    );
    expect(payload.identifier).toBe("chat-xyz");
  });

  it("rejects missing token", async () => {
    await expect(
      requireAuth(makeRequest(undefined, true) as any, "chat-abc"),
    ).rejects.toThrow("Missing token");
  });

  it("rejects mismatched identifier", async () => {
    const token = await createAccessToken(
      { identifier: "chat-abc", username: "demo" },
      1,
    );
    await expect(
      requireAuth(makeRequest(token, true) as any, "chat-wrong"),
    ).rejects.toThrow("Token mismatch");
  });
});
