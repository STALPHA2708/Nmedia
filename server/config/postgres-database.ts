import { Pool, PoolClient, QueryResult } from "pg";
import "dotenv/config";

// PostgreSQL database configuration for development and production
export class PostgreSQLDatabase {
  private static instance: PostgreSQLDatabase;
  private pool: Pool;

  private constructor() {
    const config = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "nomedia_production",
      user: process.env.DB_USER || "nomedia_user",
      password: process.env.DB_PASSWORD || "nomedia_password",
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 5000, // How long to wait when connecting a new client
    };

    // Use DATABASE_URL if provided (for production environments like Heroku)
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      this.pool = new Pool(config);
    }

    // Handle pool errors
    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });

    // Handle pool connect events
    this.pool.on("connect", () => {
      console.log("🔗 New PostgreSQL client connected");
    });

    console.log("🗄️ PostgreSQL connection pool initialized");
    console.log(
      `📊 Database: ${config.database}@${config.host}:${config.port}`,
    );
  }

  public static getInstance(): PostgreSQLDatabase {
    if (!PostgreSQLDatabase.instance) {
      PostgreSQLDatabase.instance = new PostgreSQLDatabase();
    }
    return PostgreSQLDatabase.instance;
  }

  // Helper function to run a query that returns rows
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const client = await this.pool.connect();
      try {
        console.log(
          "🔍 PostgreSQL Query:",
          sql.substring(0, 100) + "...",
          params,
        );
        const result: QueryResult = await client.query(sql, params);
        console.log("✅ Query returned", result.rows?.length || 0, "rows");
        return result.rows || [];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Helper function to run a query that modifies data
  public async run(sql: string, params: any[] = []): Promise<any> {
    try {
      const client = await this.pool.connect();
      try {
        console.log(
          "🔧 PostgreSQL Run:",
          sql.substring(0, 100) + "...",
          params,
        );
        const result: QueryResult = await client.query(sql, params);
        console.log("✅ Query affected", result.rowCount, "rows");
        return {
          rowCount: result.rowCount,
          rows: result.rows,
          lastInsertRowid: result.rows[0]?.id || null, // PostgreSQL doesn't have lastInsertRowid like SQLite
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Helper function to get a single row
  public async get(sql: string, params: any[] = []): Promise<any> {
    try {
      const client = await this.pool.connect();
      try {
        console.log(
          "🔍 PostgreSQL Get:",
          sql.substring(0, 100) + "...",
          params,
        );
        const result: QueryResult = await client.query(sql, params);
        const row = result.rows[0] || null;
        console.log("✅ Get returned:", row ? "row found" : "no row");
        return row;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Transaction support
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      console.log("🔄 Transaction started");

      const result = await callback(client);

      await client.query("COMMIT");
      console.log("✅ Transaction committed");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Transaction rolled back:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query("SELECT 1 as health");
      return result[0]?.health === 1;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Close database connection pool
  public async close(): Promise<void> {
    await this.pool.end();
    console.log("✅ PostgreSQL connection pool closed");
  }

  // Get the raw pool for advanced usage
  public getPool(): Pool {
    return this.pool;
  }
}

// Export convenience functions that match the SQLite interface
const db = PostgreSQLDatabase.getInstance();

export const query = (sql: string, params: any[] = []) => db.query(sql, params);
export const run = (sql: string, params: any[] = []) => db.run(sql, params);
export const get = (sql: string, params: any[] = []) => db.get(sql, params);
export const close = () => db.close();

export { db };
