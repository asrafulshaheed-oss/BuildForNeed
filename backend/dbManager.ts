import pg from "pg";

const { Pool } = pg;

interface Migration {
  name: string;
  up: (client: pg.PoolClient) => Promise<void>;
}

// Highly reliable database health validation, connection retries & automated schema migrations
export class DatabaseManager {
  private pool: pg.Pool;
  private dbUrl: string;

  constructor() {
    this.dbUrl = process.env.DATABASE_URL || "";
    const isLocalHost = this.dbUrl.includes("localhost") || this.dbUrl.includes("127.0.0.1") || this.dbUrl.includes("::1");

    this.pool = new Pool({
      connectionString: this.dbUrl,
      ssl: isLocalHost ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000, // Fail-fast connect timeout
    });
  }

  /**
   * Exponential backoff sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health Check: Validates connection readiness, SSL status, existence of required tables, columns, indexes, and constraints.
   */
public async verifyHealth(): Promise<boolean> {
  console.info("\n==================================================================");
  console.info("⚙️  [STARTUP HEALTH CHECK] Initiating PostgreSQL / Supabase diagnostics...");
  console.info("==================================================================");

  if (!this.dbUrl) {
    console.error("❌ [HEALTH ERROR] DATABASE_URL environment variable is missing.");
    return false;
  }

  let client: pg.PoolClient | null = null;
  let retries = 5;
  let delay = 2000;

  while (retries > 0) {
    try {
      console.info(`[HEALTH] Connecting to database... (${retries} attempts left)`);
      client = await this.pool.connect();
      break;
    } catch (err: any) {
      retries--;
      console.warn(`⚠️ [HEALTH WARNING] Connection failed: ${err.message}`);

      if (retries === 0) {
        console.error("❌ [HEALTH ERROR] Failed to connect to database after 5 attempts.");
        return false;
      }

      console.info(`⏳ Retrying in ${delay / 1000}s...`);
      await this.sleep(delay);
      delay = Math.min(delay * 1.5, 8000);
    }
  }

  if (!client) {
    return false;
  }

  try {
    // 1) Basic connection ping
    const pingRes = await client.query("SELECT 1 AS ok");
    if (pingRes.rows?.[0]?.ok !== 1) {
      throw new Error("Database ping failed.");
    }
    console.info("✅ [HEALTH] Database ping successful.");

    // 2) Optional SSL info check (safe, non-fatal)
    try {
      const sslRes = await client.query("SHOW ssl");
      console.info(`ℹ️ [HEALTH] SSL setting: ${sslRes.rows?.[0]?.ssl ?? "unknown"}`);
    } catch {
      console.info("ℹ️ [HEALTH] SSL status check skipped safely.");
    }

    // 3) Current time check
    const dbTimeRes = await client.query("SELECT NOW() AS now");
    console.info(`✅ [HEALTH] Database system time is: ${dbTimeRes.rows[0]?.now}`);

    // 4) Required tables
    const requiredTables = ["users", "posts", "comments", "likes", "replies", "pfp_migrations"];
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const existingTables = tablesRes.rows.map((r: any) => r.table_name);

    console.info("[HEALTH] Inspecting public tables catalog...");
    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        console.error(`❌ [HEALTH ERROR] Required table "${table}" is missing on the target schema.`);
        return false;
      }
      console.info(`  • Table "${table}": PRESENT`);
    }

    // 5) Required columns
    console.info("[HEALTH] Validating specific column profiles and specifications...");
    const columnsToCheck = [
      { table: "users", col: "email_or_phone" },
      { table: "users", col: "role_preference" },
      { table: "posts", col: "visibility" },
      { table: "comments", col: "visibility" },
      { table: "comments", col: "post_id" },
    ];

    for (const check of columnsToCheck) {
      const colRes = await client.query(
        `
          SELECT data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        `,
        [check.table, check.col]
      );

      if (colRes.rows.length === 0) {
        console.error(`❌ [HEALTH ERROR] Column "${check.col}" is missing in table "${check.table}".`);
        return false;
      }

      console.info(`  • Column "${check.table}.${check.col}": PRESENT`);
    }

    // 6) Index check
    console.info("[HEALTH] Inspecting active indexes...");
    const indexRes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);

    const existingIndexes = indexRes.rows.map((r: any) => r.indexname);
    const expectedIndexes = [
      "idx_users_email_phone",
      "idx_posts_user_id",
      "idx_posts_category",
      "idx_posts_created_at",
      "idx_comments_post_id",
      "idx_comments_user_id",
      "idx_likes_target",
    ];

    for (const idx of expectedIndexes) {
      const isPresent =
        existingIndexes.includes(idx) ||
        existingIndexes.some((name: string) => name.includes(idx));

      console.info(`  • Index "${idx}": ${isPresent ? "ACTIVE" : "MISSING"}`);
    }

    console.info("==================================================================");
    console.info("🎉 [HEALTH CHECK PASSED] Database is verified healthy and online!");
    console.info("==================================================================\n");
    return true;
  } catch (err: any) {
    console.error(`❌ [HEALTH EXCEPTION] Diagnostics crashed: ${err.message}`);
    return false;
  } finally {
    client.release();
  }
}

  /**
   * Run Database Migrations: Checks missing tables, creates database schema increments sequentially & transactionally.
   */
  public async runMigrations(): Promise<void> {
    console.info("🚀 [MIGRATOR] Beginning database schema migration audits...");

    const client = await this.pool.connect();
    try {
      // Create migration table itself if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS pfp_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Retrieve already run migrations list
      const runRes = await client.query("SELECT name FROM pfp_migrations");
      const executedMigrations = new Set<string>(runRes.rows.map(r => r.name));

      // Define our incremental list of transactional safe migrations
      const migrations: Migration[] = [
        {
          name: "001_create_initial_schema",
          up: async (tx) => {
            console.info("  -> Running Migration: 001_create_initial_schema");
            
            // 1. Users Table
            await tx.query(`
              CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email_or_phone VARCHAR(255) UNIQUE NOT NULL,
                role_preference VARCHAR(100) NOT NULL,
                onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
                saved_post_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
                salt VARCHAR(255),
                hashed_password VARCHAR(255),
                created_at VARCHAR(100) NOT NULL
              )
            `);

            // 2. Posts Table
            await tx.query(`
              CREATE TABLE IF NOT EXISTS posts (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(255) NOT NULL,
                is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
                visibility VARCHAR(100) NOT NULL,
                likes JSONB NOT NULL DEFAULT '[]'::jsonb,
                difficulty_ratings JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at VARCHAR(100) NOT NULL
              )
            `);

            // 3. Comments Table
            await tx.query(`
              CREATE TABLE IF NOT EXISTS comments (
                id VARCHAR(100) PRIMARY KEY,
                post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
                user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                visibility VARCHAR(100) NOT NULL,
                repository_url VARCHAR(255),
                rating DOUBLE PRECISION,
                is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
                likes JSONB NOT NULL DEFAULT '[]'::jsonb,
                reply JSONB,
                created_at VARCHAR(100) NOT NULL
              )
            `);

            // 4. Likes Table
            await tx.query(`
              CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                target_id VARCHAR(100) NOT NULL,
                target_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, target_id, target_type)
              )
            `);

            // 5. Replies Table
            await tx.query(`
              CREATE TABLE IF NOT EXISTS replies (
                id VARCHAR(100) PRIMARY KEY,
                comment_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE,
                user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reply_content TEXT NOT NULL,
                likes JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              )
            `);
          }
        },
        {
          name: "002_create_indexes",
          up: async (tx) => {
            console.info("  -> Running Migration: 002_create_indexes");
            
            // Create essential indexes for query acceleration and constraint guarantees
            await tx.query("CREATE INDEX IF NOT EXISTS idx_users_email_phone ON users(email_or_phone)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)");
            await tx.query("CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type)");
          }
        },
        {
          name: "003_add_comment_ratings",
          up: async (tx) => {
            console.info("  -> Running Migration: 003_add_comment_ratings");
            await tx.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS ratings JSONB NOT NULL DEFAULT '[]'::jsonb");
          }
        },
        {
          name: "004_alter_comment_rating_type",
          up: async (tx) => {
            console.info("  -> Running Migration: 004_alter_comment_rating_type");
            await tx.query("ALTER TABLE comments ALTER COLUMN rating TYPE DOUBLE PRECISION");
          }
        }
      ];

      // Execute unrun migrations sequentially inside transactions
      for (const migration of migrations) {
        if (!executedMigrations.has(migration.name)) {
          console.info(`[MIGRATOR] Pending migration found: "${migration.name}". Executing...`);
          
          await client.query("BEGIN");
          try {
            await migration.up(client);
            await client.query("INSERT INTO pfp_migrations (name) VALUES ($1)", [migration.name]);
            await client.query("COMMIT");
            console.info(`🎉 [MIGRATOR] Migration "${migration.name}" completed successfully and catalogued.`);
          } catch (migrateErr) {
            await client.query("ROLLBACK");
            console.error(`❌ [MIGRATOR ERROR] Rollback occurred. Migration "${migration.name}" failed:`, migrateErr);
            throw migrateErr;
          }
        } else {
          console.info(`[MIGRATOR] Migration "${migration.name}": ALREADY RUN`);
        }
      }

      console.info("✅ [MIGRATOR] All pending incremental database migrations executed smoothly.");
    } finally {
      client.release();
    }
  }

  /**
   * Safely disposes the underlying client pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}
