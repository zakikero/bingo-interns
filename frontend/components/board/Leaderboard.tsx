"use client";

import { useEffect } from "react";
import { useAuth, useLeaderboard } from "@/lib/hooks";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const RANK_CLASS: Record<number, string> = {
  1: "rank-gold",
  2: "rank-silver",
  3: "rank-bronze",
};

interface LeaderboardProps {
  autoRefreshMs?: number;
}

export default function Leaderboard({ autoRefreshMs }: LeaderboardProps) {
  const { user } = useAuth();
  const { entries, totalInterns, loading, refetch } = useLeaderboard(10);

  // Auto-refresh when a submission is completed on the board
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("submission-completed", handler);
    return () => window.removeEventListener("submission-completed", handler);
  }, [refetch]);

  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = window.setInterval(() => refetch(), autoRefreshMs);
    return () => window.clearInterval(id);
  }, [autoRefreshMs, refetch]);

  const TOTAL = 25;

  return (
    <section className="board-card leaderboard-card">
      {/* Header */}
      <div className="board-header">
        <div>
          <p className="eyebrow">GLOW BINGO</p>
          <h2>Leaderboard</h2>
        </div>
        {!loading && (
          <div className="progress-pill progress-pill-compact">
            {totalInterns} participants
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading leaderboard…" size="md" />
      ) : entries.length === 0 ? (
        <p className="leaderboard-empty">No submissions yet — be the first!</p>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="podium">
            {entries.slice(0, 3).map((entry) => {
              const pct = Math.round(
                (entry.completed_activities / TOTAL) * 100,
              );
              const isMe = entry.user_id === user?.id;
              const displayName = entry.name || "Anonymous";
              return (
                <div
                  key={entry.user_id}
                  className={`podium-card podium-${entry.rank}${isMe ? " is-me" : ""}`}
                >
                  <span className="podium-medal">{MEDAL[entry.rank]}</span>
                  <p className="podium-name">
                    {displayName}
                    {isMe && <span className="you-badge">you</span>}
                  </p>
                  <p className="podium-score">
                    {entry.completed_activities}/{TOTAL}
                  </p>
                  <div className="lb-bar-track">
                    <div className="lb-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Ranking List (skip top-3 already shown in podium) */}
          <div className="lb-list">
            {entries.slice(3).map((entry) => {
              const pct = Math.round(
                (entry.completed_activities / TOTAL) * 100,
              );
              const isMe = entry.user_id === user?.id;
              const displayName = entry.name || "Anonymous";
              return (
                <div
                  key={entry.user_id}
                  className={`lb-row${isMe ? " is-me" : ""}${entry.rank <= 3 ? " lb-row-top" : ""}`}
                >
                  <span className={`lb-rank ${RANK_CLASS[entry.rank] ?? ""}`}>
                    {entry.rank <= 3 ? MEDAL[entry.rank] : entry.rank}
                  </span>

                  <div className="lb-identity">
                    <span className="lb-name">
                      {displayName}
                      {isMe && <span className="you-badge">you</span>}
                    </span>
                  </div>

                  <span className="lb-score">
                    {entry.completed_activities}
                    <span className="lb-total">/{TOTAL}</span>
                  </span>

                  <div className="lb-bar-track lb-bar-inline">
                    <div className="lb-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
