// api/_db.js — shared Turso/libSQL client + schema init
import { createClient } from "@libsql/client";

let _client = null;

export function getDb() {
  if (_client) return _client;

  // Turso in prod: set TURSO_URL + TURSO_AUTH_TOKEN in Vercel env vars
  // Local dev: uses a local SQLite file via the libsql embedded driver
  _client = createClient({
    url: process.env.TURSO_URL || "file:./vault.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return _client;
}

// Call once on cold start to create tables
export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS keys (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      service   TEXT NOT NULL,
      value     TEXT NOT NULL,        -- store as-is; encrypt client-side before sending
      tags      TEXT DEFAULT '',      -- comma-separated
      note      TEXT DEFAULT '',
      expires_at TEXT DEFAULT NULL,   -- ISO date string or null
      last_used  TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
