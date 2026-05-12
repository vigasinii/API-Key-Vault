// api/keys.js — GET list, POST create
import { getDb, initDb } from "./_db.js";

function mask(val) {
  if (!val || val.length < 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

export default async function handler(req, res) {
  await initDb();
  const db = getDb();

  // ── GET /api/keys ── list all (value is masked)
  if (req.method === "GET") {
    const result = await db.execute(
      "SELECT id, name, service, tags, note, expires_at, last_used, created_at, value FROM keys ORDER BY created_at DESC"
    );
    const rows = result.rows.map((r) => ({
      ...r,
      masked_value: mask(r.value),
      value: undefined, // never send raw value in list
    }));
    return res.status(200).json({ keys: rows });
  }

  // ── POST /api/keys ── create a new key
  if (req.method === "POST") {
    const { name, service, value, tags = "", note = "", expires_at = null } = req.body;
    if (!name || !service || !value) {
      return res.status(400).json({ error: "name, service, and value are required" });
    }
    const result = await db.execute({
      sql: "INSERT INTO keys (name, service, value, tags, note, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [name, service, value, tags, note, expires_at],
    });
    return res.status(201).json({ id: Number(result.lastInsertRowid) });
  }

  res.status(405).json({ error: "Method not allowed" });
}
