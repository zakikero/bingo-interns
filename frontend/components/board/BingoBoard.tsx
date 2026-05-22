"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  useSubmitActivity,
  useUserSubmissions,
  useAuth,
  useUserBoard,
} from "@/lib/hooks";
import BingoCell from "./BingoCell";
import ActivityModal from "./ActivityModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Activity } from "@/types";

export default function BingoBoard() {
  const { user } = useAuth();
  const { submit, loading: submitting } = useSubmitActivity();
  const { submissions, refetch: refetchSubmissions } = useUserSubmissions(
    user?.id ?? null,
  );
  const {
    activities: boardActivities,
    loading: boardLoading,
    error: boardError,
  } = useUserBoard(user?.id ?? null);

  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  // Optimistic set – instantly mark cells green before server round-trip confirms
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const displayActivities = boardActivities;

  // Surface API errors as a toast
  useEffect(() => {
    if (boardError) setError(boardError);
  }, [boardError]);

  // Auto-dismiss error toast after 4 s
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  // Merge server-known + optimistic completions
  const completedActivityIds = useMemo<Set<string>>(() => {
    const ids = new Set(submissions?.map((s) => s.activity_id) ?? []);
    optimisticIds.forEach((id) => ids.add(id));
    return ids;
  }, [submissions, optimisticIds]);

  const completedCount = completedActivityIds.size;

  // ── Bingo line detection (rows, columns, diagonals) ──
  const [bingoDismissed, setBingoDismissed] = useState(false);

  const hasBingo = useMemo(() => {
    if (displayActivities.length < 25) return false;
    // Build a set of grid positions (0-24) that are completed
    const donePositions = new Set<number>();
    displayActivities.forEach((a, i) => {
      if (completedActivityIds.has(a.id)) donePositions.add(i);
    });

    const lines: number[][] = [];
    // 5 rows
    for (let r = 0; r < 5; r++)
      lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    // 5 columns
    for (let c = 0; c < 5; c++)
      lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    // 2 diagonals
    lines.push([0, 6, 12, 18, 24]);
    lines.push([4, 8, 12, 16, 20]);

    return lines.some((line) => line.every((pos) => donePositions.has(pos)));
  }, [displayActivities, completedActivityIds]);

  // Stable callback for opening the modal
  const handleCellClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
  }, []);

  const handleSubmit = useCallback(
    async (
      activityId: string,
      image: File | null,
      textResponse: string | null,
    ): Promise<void> => {
      if (!user) return;

      setOptimisticIds((prev) => new Set(prev).add(activityId));

      try {
        let imageUrl: string | null = null;
        if (image) {
          const { uploadSubmissionImage } =
            await import("@/lib/api/submissions");
          imageUrl = await uploadSubmissionImage(user.id, activityId, image);
        }

        await submit(user.id, activityId, textResponse, imageUrl);
        refetchSubmissions();
        window.dispatchEvent(new Event("submission-completed"));
      } catch (err) {
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(activityId);
          return next;
        });
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [user, submit, refetchSubmissions],
  );

  return (
    <section className="board-card board-card-main">
      {/* Error toast */}
      {error &&
        createPortal(
          <div className="toast-error">
            <span>{error}</span>
            <button className="toast-close" onClick={() => setError(null)}>
              ×
            </button>
          </div>,
          document.body,
        )}

      {/* Bingo banner */}
      {hasBingo &&
        !bingoDismissed &&
        createPortal(
          <div className="bingo-banner">
            <span>
              🎉 Congratulations! Send a message to Melissa to receive your
              prize!
            </span>
            <button
              className="bingo-banner-close"
              onClick={() => setBingoDismissed(true)}
            >
              ×
            </button>
          </div>,
          document.body,
        )}

      {/* Header */}
      <div className="board-header">
        <div>
          <p className="eyebrow">FIKA BINGO</p>
          <h2>
            {user?.username
              ? `${user.username}'s Activity Board`
              : "My Activity Board"}
          </h2>
        </div>
        <div className="progress-pill progress-pill-compact">
          {completedCount}/25 complete
        </div>
      </div>

      {/* Grid */}
      {boardLoading ? (
        <LoadingSpinner message="Loading activities…" size="lg" />
      ) : displayActivities.length === 0 ? (
        <p className="leaderboard-empty">No activities available.</p>
      ) : (
        <div className="board-grid">
          {displayActivities.map((activity) => (
            <BingoCell
              key={activity.id}
              activity={activity}
              done={completedActivityIds.has(activity.id)}
              disabled={submitting}
              onClick={() => handleCellClick(activity)}
            />
          ))}
        </div>
      )}

      {/* Activity detail modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onSubmit={handleSubmit}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </section>
  );
}
