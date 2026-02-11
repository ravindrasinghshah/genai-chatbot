import "server-only";
import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

const getTokenFromRequest = (request: NextRequest) => {
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) {
    return cookieToken;
  }
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
};

export const requireAuth = async (
  request: NextRequest,
  expectedIdentifier: string,
) => {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new Error("Missing token");
  }

  const payload = await verifyAccessToken(token);
  const tokenIdentifier = payload.sub || payload.identifier;
  if (!tokenIdentifier || tokenIdentifier !== expectedIdentifier) {
    throw new Error("Token mismatch");
  }

  return payload;
};
