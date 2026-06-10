import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";
import { User, Post, Comment, UserRole, PostVisibility, CommentVisibility } from "../shared/types";
import { DatabaseManager } from "./dbManager";

const { Pool } = pg;

// Secure password hashing implementation returning hex string
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export enum AppEnv {
  LOCAL = "local",
  CLOUD = "cloud"
}

export enum StorageMode {
  JSON = "json",
  POSTGRES = "postgres"
}

export interface StorageConfig {
  env: AppEnv;
  mode: StorageMode;
  dbFile: string;
  hasDatabaseUrl: boolean;
}

// Global active configuration state
export const currentConfig: StorageConfig = (() => {
  const env = process.env.APP_ENV === "cloud" ? AppEnv.CLOUD : AppEnv.LOCAL;
  const rawDbUrl = process.env.DATABASE_URL || "";
  const isPlaceholderDbUrl = rawDbUrl.includes("your-db-pass") || rawDbUrl === "";
  const hasDatabaseUrl = !isPlaceholderDbUrl;

  // Selected strictly based on the environment configuration
  let mode = StorageMode.JSON;
  if (env === AppEnv.CLOUD || (process.env.DATABASE_URL && hasDatabaseUrl)) {
    mode = StorageMode.POSTGRES;
  }

  const dbFile = path.join(process.cwd(), "db.json");

  return {
    env,
    mode,
    dbFile,
    hasDatabaseUrl
  };
})();

// Define standard seed data
export function getSeedData(): { users: User[]; posts: Post[]; comments: Comment[] } {
  const users: User[] = [
    {
      id: "u1",
      name: "Sarah Jenkins",
      emailOrPhone: "sarah@gmail.com",
      rolePreference: UserRole.PROBLEM_SHARER,
      onboardingCompleted: true,
      savedPostIds: [],
      createdAt: new Date("2026-05-15T12:00:00Z").toISOString(),
      salt: "seed_salt_sarah",
      hashedPassword: hashPassword("password", "seed_salt_sarah"),
    },
    {
      id: "u2",
      name: "Marcus Thompson",
      emailOrPhone: "marcus@gmail.com",
      rolePreference: UserRole.PROBLEM_SHARER,
      onboardingCompleted: true,
      savedPostIds: [],
      createdAt: new Date("2026-05-16T14:30:00Z").toISOString(),
      salt: "seed_salt_marcus",
      hashedPassword: hashPassword("password", "seed_salt_marcus"),
    },
    {
      id: "u3",
      name: "Alex Rivera",
      emailOrPhone: "alex@dev.com",
      rolePreference: UserRole.DEVELOPER,
      onboardingCompleted: true,
      savedPostIds: ["p1", "p3"],
      createdAt: new Date("2026-05-10T09:00:00Z").toISOString(),
      salt: "seed_salt_alex",
      hashedPassword: hashPassword("password", "seed_salt_alex"),
    },
    {
      id: "u4",
      name: "Emily Chen",
      emailOrPhone: "emily@dev.com",
      rolePreference: UserRole.DEVELOPER,
      onboardingCompleted: true,
      savedPostIds: ["p2"],
      createdAt: new Date("2026-05-11T10:15:00Z").toISOString(),
      salt: "seed_salt_emily",
      hashedPassword: hashPassword("password", "seed_salt_emily"),
    }
  ];

  const posts: Post[] = [
    {
      id: "p1",
      userId: "u1",
      userName: "Sarah Jenkins",
      title: "One-Click Professional Social Media Banner Generator",
      description: "As a small business owner, I spend hours trying to resize and design banners for YouTube, Twitter, and LinkedIn. Canva is fine but has too much overhead for single tasks. I want a clean, single-purpose tool where I can choose a professional gradient, paste my title, select output platforms, and download optimized PNGs in seconds.",
      category: "Web Apps",
      isAnonymous: false,
      visibility: PostVisibility.EVERYONE,
      createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
    },
    {
      id: "p2",
      userId: "u2",
      userName: "Marcus Thompson",
      title: "Local Food Bank Distribution Map & Stock Tracker",
      description: "Our local volunteer group coordinates surplus fresh food pickups from supermarkets but runs into coordination issues. Volunteers need a mobile-friendly map that logs active collection sites and live weight estimates so they don't over-visit or witness food spoilage. Essential to include offline caching since cell coverage inside warehouse basements is poor.",
      category: "Mobile Apps",
      isAnonymous: false,
      visibility: PostVisibility.EVERYONE,
      createdAt: new Date("2026-06-02T15:20:00Z").toISOString(),
    },
    {
      id: "p3",
      userId: "u1",
      userName: "Sarah Jenkins",
      title: "Bulk Invoice PDF Parser for Small Shop Accounting",
      description: "I receive over 50 different invoice configurations in PDF every month. Converting them manually into my spreadsheet takes all weekend. I need a local tool where I can upload a batch of PDFs, and an intelligent engine extracts: Invoice Number, Date, Total Amount, and Supplier, returning a ready-to-import CSV.",
      category: "Developer Tools",
      isAnonymous: true,
      visibility: PostVisibility.DEVELOPERS_ONLY,
      createdAt: new Date("2026-06-03T11:45:00Z").toISOString(),
    }
  ];

  const comments: Comment[] = [
    {
      id: "c1",
      postId: "p1",
      userId: "u3",
      userName: "Alex Rivera",
      content: "I love this idea! I've already scaffolded a clean React SPA model with standard templates, tailwind filters, and HTML Canvas. It uses local browser engines so it doesn't need external hosting databases.\n\nHere is my initial repo: https://github.com/alexrivera/insta-banner\n\nLet's finalize the desired aspect ratios together!",
      visibility: CommentVisibility.EVERYONE,
      createdAt: new Date("2026-06-01T18:30:00Z").toISOString(),
    },
    {
      id: "c2",
      postId: "p2",
      userId: "u4",
      userName: "Emily Chen",
      content: "This fits perfectly into local civic technology initiatives. I developed a light logistics map prototype that logs geographic markers with local storage persistence.\n\nGitHub repo: https://github.com/emilychen/foodlink-map\n\nI can implement this specialized food bank schema. Let's arrange a short sync to mapping coordinates.",
      visibility: CommentVisibility.EVERYONE,
      createdAt: new Date("2026-06-03T09:12:00Z").toISOString(),
    },
    {
      id: "c3",
      postId: "p3",
      userId: "u3",
      userName: "Alex Rivera",
      content: "Hey, since this post is developers-only, I wanted to suggest a private parser pipeline. We can use a visual regex mapping or a light server-side parser. This comment is only visible to you and me!\n\nI can build a responsive desktop mock-up to drag and drop PDFs.",
      visibility: CommentVisibility.OWNER_AND_COMMENTER,
      createdAt: new Date("2026-06-04T14:00:00Z").toISOString(),
    }
  ];

  return { users, posts, comments };
}

// Storage adapter interface with asynchronous init support
export interface IStorageAdapter {
  init(): Promise<void>;
  read(): { users: User[]; posts: Post[]; comments: Comment[] };
  write(data: { users: User[]; posts: Post[]; comments: Comment[] }): void;
}

// Concrete File Database Adapter (Local Mode)
class LocalFileStorageAdapter implements IStorageAdapter {
  private cache: { users: User[]; posts: Post[]; comments: Comment[] } | null = null;

  async init(): Promise<void> {
    console.info("[LOCAL AUTO STORAGE] Verifying local db.json store on filesystem...");
    if (!fs.existsSync(currentConfig.dbFile)) {
      const initialDB = getSeedData();
      fs.writeFileSync(currentConfig.dbFile, JSON.stringify(initialDB, null, 2));
      this.cache = initialDB;
      console.info("[LOCAL AUTO STORAGE] Created missing db.json file with rich seed records.");
    } else {
      try {
        const raw = fs.readFileSync(currentConfig.dbFile, "utf-8");
        this.cache = JSON.parse(raw);
        console.info("[LOCAL AUTO STORAGE] Successfully loaded active database configuration.");
      } catch (err: any) {
        console.error(`[LOCAL AUTO STORAGE ERROR] Failed parsing db.json file: ${err.message}. Re-initializing seeds.`);
        const initialDB = getSeedData();
        fs.writeFileSync(currentConfig.dbFile, JSON.stringify(initialDB, null, 2));
        this.cache = initialDB;
      }
    }
  }

  read() {
    if (!this.cache) {
      // Emergency dynamic load if sync flow is bypassed
      if (fs.existsSync(currentConfig.dbFile)) {
        try {
          this.cache = JSON.parse(fs.readFileSync(currentConfig.dbFile, "utf-8"));
        } catch {
          this.cache = getSeedData();
        }
      } else {
        this.cache = getSeedData();
      }
    }
    return this.cache;
  }

  write(data: { users: User[]; posts: Post[]; comments: Comment[] }) {
    this.cache = data;
    try {
      fs.writeFileSync(currentConfig.dbFile, JSON.stringify(data, null, 2));
      console.info("[LOCAL AUTO STORAGE] Flushed full state snapshot to db.json on disk.");
    } catch (error) {
      console.error("[LOCAL AUTO STORAGE ERROR] Failed flushing state to file:", error);
    }
  }
}

// Cloud PostgreSQL Database Adapter (Production Mode)
// Strictly binds to cloud instances, throwing explicit startup blockades if unreachable or missing credentials
class PostgresStorageAdapter implements IStorageAdapter {
  private cache: { users: User[]; posts: Post[]; comments: Comment[] } | null = null;
  private pool: pg.Pool | null = null;
  private syncInProgress = false;

  constructor() {
    // Rigid validation against unsafe modes or hidden RAM fallbacks.
    if (currentConfig.env === AppEnv.CLOUD && !currentConfig.hasDatabaseUrl) {
      console.error("==================================================================");
      console.error("  [FATAL STORAGE CONFIGURATION ERROR]");
      console.error("  The server is running in CLOUD mode, but DATABASE_URL is missing.");
      console.error("  Memory fallback adapters have been removed to prevent data loss.");
      console.error("==================================================================");
      throw new Error("[FATAL ERROR] DATABASE_URL environment variable is required in CLOUD mode to preserve data.");
    }

    if (currentConfig.hasDatabaseUrl) {
      const dbUrl = process.env.DATABASE_URL || "";
      const isLocalHost = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("::1");
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: isLocalHost ? false : { rejectUnauthorized: false }
      });
    }
  }

  async init(): Promise<void> {
    if (!this.pool) {
      throw new Error("[FATAL ERROR] SQL Client connection pool could not be initialized.");
    }

    try {
      // 1) Auto-run safe transactional migrations
      const dbManager = new DatabaseManager();
      await dbManager.runMigrations();

      // 2) Execute rigorous Startup Diagnostics Scans
      const isHealthy = await dbManager.verifyHealth();
      if (!isHealthy) {
        throw new Error("[FATAL HEALTH CHECK FAILED] Database diagnostics could not be validated.");
      }

      // 3) Bootstrap seed data if database is empty
      const userCheck = await this.pool.query("SELECT COUNT(*) FROM users");
      const userCount = parseInt(userCheck.rows[0].count, 10);
      if (userCount === 0) {
        console.info("[POSTGRES INIT] Database is empty. Bootstrapping pristine seed datasets...");
        const seed = getSeedData();
        await this.syncWriteToDB(seed);
        this.cache = seed;
      } else {
        // Load active state from relational tables
        await this.refreshCloudCache();
        console.info("[POSTGRES INIT] Fully loaded active cloud datasets from relational tables.");
      }

      // Safe background active synchronizer
      setInterval(() => {
        this.refreshCloudCache().catch(err => {
          console.error("[POSTGRES DRIVER ERROR] Background cache refresh iteration failed:", err);
        });
      }, 10000);

    } catch (err: any) {
      console.error("==================================================================");
      console.error("  [FATAL DB CONNECTION/INIT ERROR]");
      console.error(`  Could not connect to or initialize the cloud PostgreSQL database: ${err.message}`);
      console.error("==================================================================");
      throw new Error(`[CLOUD PERSISTENCE REFUSED] ${err.message}`);
    }
  }

  private async refreshCloudCache(): Promise<void> {
    if (!this.pool || this.syncInProgress) return;
    try {
      this.syncInProgress = true;
      
      const usersRes = await this.pool.query("SELECT * FROM users ORDER BY id ASC");
      const postsRes = await this.pool.query("SELECT * FROM posts ORDER BY id ASC");
      const commentsRes = await this.pool.query("SELECT * FROM comments ORDER BY id ASC");

      const parseJSONB = (val: any) => {
        if (!val) return [];
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return []; }
        }
        return val;
      };

      const parseJSONBObject = (val: any) => {
        if (!val) return undefined;
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return undefined; }
        }
        return val;
      };

      const users: User[] = usersRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        emailOrPhone: row.email_or_phone,
        rolePreference: row.role_preference,
        onboardingCompleted: row.onboarding_completed,
        savedPostIds: parseJSONB(row.saved_post_ids),
        salt: row.salt || undefined,
        hashedPassword: row.hashed_password || undefined,
        createdAt: row.created_at
      }));

      const posts: Post[] = postsRes.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        title: row.title,
        description: row.description,
        category: row.category,
        isAnonymous: row.is_anonymous,
        visibility: row.visibility,
        likes: parseJSONB(row.likes),
        difficultyRatings: parseJSONB(row.difficulty_ratings),
        createdAt: row.created_at
      }));

      const comments: Comment[] = commentsRes.rows.map(row => ({
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        userName: row.user_name,
        content: row.content,
        visibility: row.visibility,
        repositoryUrl: row.repository_url || undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        ratings: parseJSONB(row.ratings),
        isAnonymous: row.is_anonymous,
        likes: parseJSONB(row.likes),
        reply: parseJSONBObject(row.reply),
        createdAt: row.created_at
      }));

      this.cache = { users, posts, comments };
    } finally {
      this.syncInProgress = false;
    }
  }
   
  read() {
    if (!this.cache) {
      if (currentConfig.env === AppEnv.CLOUD) {
        throw new Error("Cloud storage is not initialized.");
      }
      return getSeedData();
    }
    return this.cache;
  } 
   
  write(data: { users: User[]; posts: Post[]; comments: Comment[] }) {
    this.cache = data;
    this.syncWriteToDB(data).catch(err => {
      console.error("[POSTGRES WRITE ERROR] Failed to flush state to database:", err);
    });
  }

  private async syncWriteToDB(data: { users: User[]; posts: Post[]; comments: Comment[] }): Promise<void> {
    if (!this.pool) return;

    // Begin single database client session transactions for data safety
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1) Write/Update Users
      for (const u of data.users) {
        await client.query(
          `INSERT INTO users (id, name, email_or_phone, role_preference, onboarding_completed, saved_post_ids, salt, hashed_password, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = $2,
             email_or_phone = $3,
             role_preference = $4,
             onboarding_completed = $5,
             saved_post_ids = $6,
             salt = $7,
             hashed_password = $8,
             created_at = $9`,
          [
            u.id,
            u.name,
            u.emailOrPhone,
            u.rolePreference,
            u.onboardingCompleted,
            JSON.stringify(u.savedPostIds || []),
            u.salt || null,
            u.hashedPassword || null,
            u.createdAt
          ]
        );
      }

      // Delete removed Users safely
      const userIds = data.users.map(u => u.id);
      if (userIds.length > 0) {
        await client.query(`DELETE FROM users WHERE id NOT IN (${userIds.map((_, i) => `$${i + 1}`).join(",")})`, userIds);
      } else {
        await client.query("DELETE FROM users");
      }

      // 2) Write/Update Posts
      for (const p of data.posts) {
        await client.query(
          `INSERT INTO posts (id, user_id, user_name, title, description, category, is_anonymous, visibility, likes, difficulty_ratings, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             user_id = $2,
             user_name = $3,
             title = $4,
             description = $5,
             category = $6,
             is_anonymous = $7,
             visibility = $8,
             likes = $9,
             difficulty_ratings = $10,
             created_at = $11`,
          [
            p.id,
            p.userId,
            p.userName,
            p.title,
            p.description,
            p.category,
            p.isAnonymous,
            p.visibility,
            JSON.stringify(p.likes || []),
            JSON.stringify(p.difficultyRatings || []),
            p.createdAt
          ]
        );
      }

      // Delete removed Posts safely
      const postIds = data.posts.map(p => p.id);
      if (postIds.length > 0) {
        await client.query(`DELETE FROM posts WHERE id NOT IN (${postIds.map((_, i) => `$${i + 1}`).join(",")})`, postIds);
      } else {
        await client.query("DELETE FROM posts");
      }

      // 3) Write/Update Comments
      for (const c of data.comments) {
        await client.query(
          `INSERT INTO comments (id, post_id, user_id, user_name, content, visibility, repository_url, rating, is_anonymous, likes, reply, ratings, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             post_id = $2,
             user_id = $3,
             user_name = $4,
             content = $5,
             visibility = $6,
             repository_url = $7,
             rating = $8,
             is_anonymous = $9,
             likes = $10,
             reply = $11,
             ratings = $12,
             created_at = $13`,
          [
            c.id,
            c.postId,
            c.userId,
            c.userName,
            c.content,
            c.visibility,
            c.repositoryUrl || null,
            c.rating !== undefined ? c.rating : null,
            c.isAnonymous || false,
            JSON.stringify(c.likes || []),
            c.reply ? JSON.stringify(c.reply) : null,
            JSON.stringify(c.ratings || []),
            c.createdAt
          ]
        );
      }

      // Delete removed Comments safely
      const commentIds = data.comments.map(c => c.id);
      if (commentIds.length > 0) {
        await client.query(`DELETE FROM comments WHERE id NOT IN (${commentIds.map((_, i) => `$${i + 1}`).join(",")})`, commentIds);
      } else {
        await client.query("DELETE FROM comments");
      }

      // 4) Synchronize to secondary 'likes' table for auditing/tracking constraints
      await client.query("DELETE FROM likes");
      for (const p of data.posts) {
        if (p.likes && p.likes.length > 0) {
          for (const uid of p.likes) {
            await client.query(
              "INSERT INTO likes (user_id, target_id, target_type) VALUES ($1, $2, 'post') ON CONFLICT DO NOTHING",
              [uid, p.id]
            );
          }
        }
      }
      for (const c of data.comments) {
        if (c.likes && c.likes.length > 0) {
          for (const uid of c.likes) {
            await client.query(
              "INSERT INTO likes (user_id, target_id, target_type) VALUES ($1, $2, 'comment') ON CONFLICT DO NOTHING",
              [uid, c.id]
            );
          }
        }
      }

      // 5) Synchronize to secondary 'replies' table
      await client.query("DELETE FROM replies");
      for (const c of data.comments) {
        if (c.reply) {
          await client.query(
            "INSERT INTO replies (id, comment_id, user_id, reply_content, likes) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
            [`rep_${c.id}`, c.id, c.reply.replyUserId, c.reply.replyContent, JSON.stringify(c.reply.likes || [])]
          );
        }
      }

      await client.query("COMMIT");
      console.info("[POSTGRES SYNCHRONIZER] Relational transaction flushed all records perfectly.");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

// Dynamic selection logic matching precise APP_ENV mapping
export const storage: IStorageAdapter = (() => {
  console.info(`[RUNTIME DETECTED ENV] Mode: ${currentConfig.env.toUpperCase()} | Storage Target: ${currentConfig.mode.toUpperCase()}`);

  if (currentConfig.mode === StorageMode.POSTGRES) {
    return new PostgresStorageAdapter();
  } else {
    return new LocalFileStorageAdapter();
  }
})();
