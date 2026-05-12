// api/keys/[id].js — GET reveal, PATCH update, DELETE
import { getDb, initDb } from "../_db.js";

export default async function handler(req, res) {
  await initDb();
  const db = getDb();
  const id = req.query.id;

  // ── GET /api/keys/:id ── reveal full value + stamp last_used
  if (req.method === "GET") {
    await db.execute({
      sql: "UPDATE keys SET last_used = datetime('now') WHERE id = ?",
      args: [id],
    });
    const result = await db.execute({
      sql: "SELECT * FROM keys WHERE id = ?",
      args: [id],
    });
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(result.rows[0]);
  }

  // ── PATCH /api/keys/:id ── update fields
  if (req.method === "PATCH") {
    const { name, service, value, tags, note, expires_at } = req.body;
    const fields = [];
    const args = [];
    if (name !== undefined) { fields.push("name = ?"); args.push(name); }
    if (service !== undefined) { fields.push("service = ?"); args.push(service); }
    if (value !== undefined) { fields.push("value = ?"); args.push(value); }
    if (tags !== undefined) { fields.push("tags = ?"); args.push(tags); }
    if (note !== undefined) { fields.push("note = ?"); args.push(note); }
    if (expires_at !== undefined) { fields.push("expires_at = ?"); args.push(expires_at); }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update" });
    args.push(id);
    await db.execute({ sql: `UPDATE keys SET ${fields.join(", ")} WHERE id = ?`, args });
    return res.status(200).json({ ok: true });
  }

  // ── DELETE /api/keys/:id
  if (req.method === "DELETE") {
    await db.execute({ sql: "DELETE FROM keys WHERE id = ?", args: [id] });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
