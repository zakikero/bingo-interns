/**
 * lib/api/leaderboard.ts
 */

export interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  completed_activities: number;
  rank: number;
}

export interface GlobalStats {
  total_users: number;
  total_activities: number;
  total_submissions: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/leaderboard/top?limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const response = await fetch(`${API_BASE_URL}/api/stats/global`);
  if (!response.ok) throw new Error("Failed to fetch global stats");
  return response.json();
}
