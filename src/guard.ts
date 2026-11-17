import { DurableObject } from "cloudflare:workers";
import type { Env, Limits } from "./env";

export type Verdict = { ok: true } | { ok: false; reason: "budget" | "rate_limited" };

const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10); // 2026-11-17

/**
 * A single global instance that every chat request goes through. It keeps the
 * estimated spend per UTC day and month, and counts messages per visitor.
 * Visitors are identified by a salted hash of their IP address, never the IP itself.
 */
export class ChatGuard extends DurableObject<Env> {
  private sql: SqlStorage;
  // Per-minute counts only need to survive a minute, so they stay in memory.
  private recent = new Map<string, number[]>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS spend (period TEXT PRIMARY KEY, usd REAL NOT NULL)`);
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS visitor_day (visitor TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (visitor, day))`,
    );
  }

  private spent(period: string): number {
    const row = this.sql.exec<{ usd: number }>(`SELECT usd FROM spend WHERE period = ?`, period).toArray()[0];
    return row ? row.usd : 0;
  }

  /** Decides whether a message may be sent, and counts it if so. */
  admit(visitor: string, limits: Limits): Verdict {
    const now = Date.now();
    const day = utcDay(now);

    if (this.spent(`m:${day.slice(0, 7)}`) >= limits.monthlyUsd || this.spent(`d:${day}`) >= limits.dailyUsd) {
      return { ok: false, reason: "budget" };
    }

    const lastMinute = (this.recent.get(visitor) ?? []).filter((t) => now - t < 60_000);
    if (lastMinute.length >= limits.ipPerMinute) return { ok: false, reason: "rate_limited" };

    this.sql.exec(`DELETE FROM visitor_day WHERE day <> ?`, day);
    const row = this.sql
      .exec<{ n: number }>(`SELECT n FROM visitor_day WHERE visitor = ? AND day = ?`, visitor, day)
      .toArray()[0];
    if ((row?.n ?? 0) >= limits.ipPerDay) return { ok: false, reason: "rate_limited" };

    this.sql.exec(
      `INSERT INTO visitor_day (visitor, day, n) VALUES (?, ?, 1) ON CONFLICT (visitor, day) DO UPDATE SET n = n + 1`,
      visitor,
      day,
    );
    lastMinute.push(now);
    this.recent.set(visitor, lastMinute);
    if (this.recent.size > 500) {
      for (const [key, times] of this.recent) if (now - times[times.length - 1] >= 60_000) this.recent.delete(key);
    }
    return { ok: true };
  }

  /** Adds the estimated cost of one answer to today's and this month's spend. */
  record(usd: number): void {
    if (!(usd > 0)) return;
    const day = utcDay(Date.now());
    for (const period of [`d:${day}`, `m:${day.slice(0, 7)}`]) {
      this.sql.exec(
        `INSERT INTO spend (period, usd) VALUES (?, ?) ON CONFLICT (period) DO UPDATE SET usd = usd + excluded.usd`,
        period,
        usd,
      );
    }
    this.sql.exec(`DELETE FROM spend WHERE period LIKE 'd:%' AND period <> ?`, `d:${day}`);
  }

  /** Today's and this month's estimated spend, for the logs. */
  usage(): { todayUsd: number; monthUsd: number } {
    const day = utcDay(Date.now());
    return { todayUsd: this.spent(`d:${day}`), monthUsd: this.spent(`m:${day.slice(0, 7)}`) };
  }
}
