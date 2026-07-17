import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { users } from "@nexus/db";
import { db, isDbConnected, JWT_SECRET } from "../db";

export function isValidUUID(str: string) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

export async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    throw new Error("Unauthorized: Invalid JWT");
  }
  
  if (!payload || !payload.sub) {
    throw new Error("Unauthorized: Invalid payload");
  }

  const walletAddress = payload.wallet || payload.user_metadata?.wallet || payload.app_metadata?.wallet || "mock-wallet-address";

  if (!isDbConnected) {
    return { id: payload.sub, wallet: walletAddress };
  }

  let dbUser;
  if (isValidUUID(payload.sub)) {
    const userRows = await db.select().from(users).where(eq(users.id, payload.sub));
    dbUser = userRows[0];
  }

  if (!dbUser && walletAddress !== "mock-wallet-address") {
    const userRows = await db.select().from(users).where(eq(users.wallet, walletAddress));
    dbUser = userRows[0];
  }

  if (!dbUser) {
    throw new Error("Unauthorized: User not found in database");
  }

  return { id: dbUser.id, wallet: dbUser.wallet };
}

export async function optionalAuthenticate(req: Request) {
  try {
    return await authenticate(req);
  } catch (e) {
    return null;
  }
}
