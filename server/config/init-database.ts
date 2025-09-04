import { initializePostgreSQLDatabase } from "./init-postgres-database";

export async function initializeDatabase() {
  return await initializePostgreSQLDatabase();
}
