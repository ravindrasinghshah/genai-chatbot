import "server-only";
import { SignJWT, jwtVerify } from "jose";

type TokenPayload = {
  identifier: string;
  username: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing.");
  }
  return new TextEncoder().encode(secret);
};

export const createAccessToken = async (
  payload: TokenPayload,
  expiresInMinutes = 60,
) => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInMinutes * 60;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.identifier)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getJwtSecret());
};

export const verifyAccessToken = async (token: string) => {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as TokenPayload & { sub?: string; exp?: number; iat?: number };
};
