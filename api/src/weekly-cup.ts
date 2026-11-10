import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { applyCoinDelta } from "./coins.js";
import { getPool } from "./db.js";

/** Cup weeks follow the Napwood bay clock. */
export const WEEKLY_CUP_TIMEZONE = "Europe/London";

/** Brad Coins for last week’s sole cup winner. */
export const WEEKLY_CUP_PRIZE = 50;

type LondonParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 1=Mon … 7=Sun (ISO)
};

export type WeekWindow = {
  /** ISO week key in Europe/London, e.g. 2026-W46 */
  weekKey: string;
  /** Inclusive start (Monday 00:00:00.000 Europe/London) as UTC Date */
  startUtc: Date;
  /** Exclusive end (next Monday 00:00:00.000 Europe/London) as UTC Date */
  endUtc: Date;
};

function londonParts(date: Date): LondonParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: WEEKLY_CUP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const map = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: weekdayMap[map.weekday ?? "Mon"] ?? 1,
  };
}

/**
 * Convert a Europe/London wall-clock time to the corresponding UTC Date.
 * Handles GMT/BST by measuring the offset at a UTC guess.
 */
export function londonWallToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const seen = londonParts(new Date(utcGuess));
  const asIfUtc = Date.UTC(
    seen.year,
    seen.month - 1,
    seen.day,
    seen.hour,
    seen.minute,
    seen.second,
  );
  const offsetMs = asIfUtc - utcGuess;
  return new Date(utcGuess - offsetMs);
}

function addDaysYmd(
  year: number,
  month: number,
  day: number,
  deltaDays: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

/** ISO week number + week-year for a London calendar Y-M-D (Thursday rule). */
export function isoWeekKeyFromYmd(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  // ISO: move to Thursday of this week
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Monday 00:00 → next Monday 00:00 in Europe/London for the instant `now`. */
export function weekWindowContaining(now: Date): WeekWindow {
  const parts = londonParts(now);
  const monday = addDaysYmd(parts.year, parts.month, parts.day, -(parts.weekday - 1));
  const nextMonday = addDaysYmd(monday.year, monday.month, monday.day, 7);
  const startUtc = londonWallToUtc(monday.year, monday.month, monday.day, 0, 0, 0);
  const endUtc = londonWallToUtc(nextMonday.year, nextMonday.month, nextMonday.day, 0, 0, 0);
  const weekKey = isoWeekKeyFromYmd(monday.year, monday.month, monday.day);
  return { weekKey, startUtc, endUtc };
}

export function previousWeekWindow(now: Date): WeekWindow {
  const current = weekWindowContaining(now);
  return weekWindowContaining(new Date(current.startUtc.getTime() - 1));
}

export type WeeklyStanding = {
  userId: number;
  displayName: string;
  wins: number;
  rank: number;
};

/**
 * Count House + PvP wins in [start, end). Ties keep equal wins; rank is dense by wins then userId.
 */
export async function listWeeklyStandings(
  startUtc: Date,
  endUtc: Date,
): Promise<WeeklyStanding[]> {
  const pool = getPool();
  const [rows] = await pool.query<
    (RowDataPacket & { user_id: number; display_name: string; wins: number })[]
  >(
    `SELECT u.id AS user_id, u.display_name, COUNT(m.id) AS wins
     FROM users u
     INNER JOIN top_trumps_matches m
       ON (
         (m.challenger_user_id = u.id AND m.winner = 'challenger')
         OR (m.opponent_user_id = u.id AND m.winner = 'opponent')
       )
       AND m.created_at >= ?
       AND m.created_at < ?
     WHERE u.account_status = 'active'
     GROUP BY u.id, u.display_name
     ORDER BY wins DESC, u.id ASC`,
    [startUtc, endUtc],
  );

  return rows.map((row, index) => ({
    userId: Number(row.user_id),
    displayName: row.display_name,
    wins: Number(row.wins),
    rank: index + 1,
  }));
}

/**
 * Pick the cup winner: most wins; on a tie, lowest user id (sole prize — no split).
 */
export function pickWeeklyCupWinner(
  standings: WeeklyStanding[],
): WeeklyStanding | null {
  if (standings.length === 0) return null;
  const topWins = standings[0]!.wins;
  const tied = standings.filter((s) => s.wins === topWins);
  return tied.reduce((best, row) => (row.userId < best.userId ? row : best));
}

export type WeeklyCupAwardResult = {
  weekKey: string;
  alreadyAwarded: boolean;
  winnerUserId: number | null;
  displayName: string | null;
  wins: number;
  prizeAmount: number;
};

/**
 * Award last week’s cup once. Safe to call repeatedly (week_key PK).
 * No prize when nobody won a match that week — still records a zero-prize row.
 */
export async function ensurePreviousWeekCupAwarded(
  now: Date = new Date(),
): Promise<WeeklyCupAwardResult> {
  const prev = previousWeekWindow(now);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query<
      (RowDataPacket & {
        week_key: string;
        winner_user_id: number | null;
        win_count: number;
        prize_amount: number;
      })[]
    >(`SELECT week_key, winner_user_id, win_count, prize_amount
       FROM weekly_cup_awards WHERE week_key = ? FOR UPDATE`, [prev.weekKey]);

    if (existing[0]) {
      let displayName: string | null = null;
      if (existing[0].winner_user_id != null) {
        const [names] = await connection.query<(RowDataPacket & { display_name: string })[]>(
          `SELECT display_name FROM users WHERE id = ? LIMIT 1`,
          [existing[0].winner_user_id],
        );
        displayName = names[0]?.display_name ?? null;
      }
      await connection.commit();
      return {
        weekKey: prev.weekKey,
        alreadyAwarded: true,
        winnerUserId:
          existing[0].winner_user_id == null ? null : Number(existing[0].winner_user_id),
        displayName,
        wins: Number(existing[0].win_count),
        prizeAmount: Number(existing[0].prize_amount),
      };
    }

    const standings = await listWeeklyStandingsInConnection(
      connection,
      prev.startUtc,
      prev.endUtc,
    );
    const winner = pickWeeklyCupWinner(standings);
    const prizeAmount = winner ? WEEKLY_CUP_PRIZE : 0;

    if (winner && prizeAmount > 0) {
      await applyCoinDelta(connection, {
        userId: winner.userId,
        delta: prizeAmount,
        reason: "weekly_cup",
        note: `Weekly Top Trumps cup ${prev.weekKey}`,
      });
    }

    await connection.query(
      `INSERT INTO weekly_cup_awards (week_key, winner_user_id, win_count, prize_amount)
       VALUES (?, ?, ?, ?)`,
      [prev.weekKey, winner?.userId ?? null, winner?.wins ?? 0, prizeAmount],
    );
    await connection.commit();

    return {
      weekKey: prev.weekKey,
      alreadyAwarded: false,
      winnerUserId: winner?.userId ?? null,
      displayName: winner?.displayName ?? null,
      wins: winner?.wins ?? 0,
      prizeAmount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listWeeklyStandingsInConnection(
  connection: PoolConnection,
  startUtc: Date,
  endUtc: Date,
): Promise<WeeklyStanding[]> {
  const [rows] = await connection.query<
    (RowDataPacket & { user_id: number; display_name: string; wins: number })[]
  >(
    `SELECT u.id AS user_id, u.display_name, COUNT(m.id) AS wins
     FROM users u
     INNER JOIN top_trumps_matches m
       ON (
         (m.challenger_user_id = u.id AND m.winner = 'challenger')
         OR (m.opponent_user_id = u.id AND m.winner = 'opponent')
       )
       AND m.created_at >= ?
       AND m.created_at < ?
     WHERE u.account_status = 'active'
     GROUP BY u.id, u.display_name
     ORDER BY wins DESC, u.id ASC`,
    [startUtc, endUtc],
  );

  return rows.map((row, index) => ({
    userId: Number(row.user_id),
    displayName: row.display_name,
    wins: Number(row.wins),
    rank: index + 1,
  }));
}

export async function getWeeklyCupSnapshot(now: Date = new Date()) {
  const previousAward = await ensurePreviousWeekCupAwarded(now);
  const current = weekWindowContaining(now);
  const standings = await listWeeklyStandings(current.startUtc, current.endUtc);
  return {
    timezone: WEEKLY_CUP_TIMEZONE,
    weekKey: current.weekKey,
    weekStart: current.startUtc.toISOString(),
    weekEnd: current.endUtc.toISOString(),
    prizeAmount: WEEKLY_CUP_PRIZE,
    standings,
    previousAward: {
      weekKey: previousAward.weekKey,
      winnerUserId: previousAward.winnerUserId,
      displayName: previousAward.displayName,
      wins: previousAward.wins,
      prizeAmount: previousAward.prizeAmount,
      alreadyAwarded: previousAward.alreadyAwarded,
    },
  };
}
