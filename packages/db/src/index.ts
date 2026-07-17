import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

let connection: postgres.Sql | null = null;

export function getDb(connectionString: string) {
  if (!connection) {
    connection = postgres(connectionString, { max: 10 });
  }
  return drizzle(connection, { schema });
}

export async function closeDb() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}
