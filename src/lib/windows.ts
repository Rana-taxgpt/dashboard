import { CHUNK_DAYS, HISTORY_DAYS, PERIOD_DAYS, RECENT_DAYS } from "@/lib/constants";
import { addDays } from "@/lib/dates";

export type Window = { since: string; until: string };

export function planWindows(until: string, earliest: string | null) {
  const targetStart = addDays(until, -(HISTORY_DAYS - 1));
  const recentSince = addDays(until, -(RECENT_DAYS - 1));
  const recent: Window = { since: recentSince, until };
  let backfill: Window | null = null;

  if (!earliest || earliest > targetStart) {
    const end = earliest ? addDays(earliest, -1) : addDays(recentSince, -1);
    if (end >= targetStart) {
      const since = addDays(end, -(CHUNK_DAYS - 1));
      backfill = { since: since < targetStart ? targetStart : since, until: end };
    }
  }

  const currentSince = addDays(until, -(PERIOD_DAYS - 1));
  const previousUntil = addDays(currentSince, -1);
  const previousSince = addDays(previousUntil, -(PERIOD_DAYS - 1));

  return {
    recent,
    backfill,
    periods: [
      { period: "last_30_days", since: currentSince, until },
      { period: "previous_30_days", since: previousSince, until: previousUntil },
    ],
  };
}
