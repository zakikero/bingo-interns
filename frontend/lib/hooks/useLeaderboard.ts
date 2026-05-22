import { useState, useEffect, useCallback } from "react";
import { getTopUsers, getGlobalStats } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/api/leaderboard";

interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  totalInterns: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderboard(limit: number = 10): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalInterns, setTotalInterns] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [data, stats] = await Promise.all([getTopUsers(limit), getGlobalStats()]);
        if (!cancelled) {
          setEntries(data);
          setTotalInterns(stats.total_users);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit, tick]);

  return { entries, totalInterns, loading, error, refetch };
}
