// api/stats.js — summary counts for the dashboard header
import { getDb, initDb } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  await initDb();
  const db = getDb();

  const [total, expired, usedToday] = await Promise.all([
    db.execute("SELECT COUNT(*) as n FROM keys"),
    db.execute("SELECT COUNT(*) as n FROM keys WHERE expires_at IS NOT NULL AND expires_at < date('now')"),
    db.execute("SELECT COUNT(*) as n FROM keys WHERE last_used >= date('now')"),
  ]);

  res.status(200).json({
    total: Number(total.rows[0].n),
    expired: Number(expired.rows[0].n),
    used_today: Number(usedToday.rows[0].n),
  });
}
