/**
 * lib/api/submissions.ts
 */

import type { Submission } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function submitActivity(
  userId: string,
  activityId: string,
): Promise<Submission> {
  const response = await fetch(`${API_BASE_URL}/api/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, activity_id: activityId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Submission failed");
  }

  return response.json();
}

export async function getUserSubmissions(
  userId: string,
): Promise<Submission[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/submissions/user/${userId}`,
  );
  if (!response.ok) throw new Error("Failed to fetch submissions");
  return response.json();
}
