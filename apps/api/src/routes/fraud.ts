import { sql } from "drizzle-orm";
import { db, isDbConnected } from "../db";
import { fraudAlerts } from "@nexus/db";
import { mockFraudAlerts } from "../mockStore";
import { jsonRes } from "../utils/response";

export async function handleGetFraudAlerts(session: any) {
  if (!isDbConnected) {
    const sorted = [...mockFraudAlerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return jsonRes(sorted);
  }
  const alerts = await db
    .select()
    .from(fraudAlerts)
    .orderBy(sql`${fraudAlerts.createdAt} DESC`);
  return jsonRes(alerts);
}
