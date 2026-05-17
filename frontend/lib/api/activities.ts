/**
 * lib/api/activities.ts
 */

import type { Activity } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities`);
  if (!response.ok) throw new Error("Failed to fetch activities");
  return response.json();
}

export async function getActivity(activityId: string): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`);
  if (!response.ok) throw new Error("Failed to fetch activity");
  return response.json();
}

export async function getUserBoard(userId: string): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/board`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch user board");
  }
  return response.json();
}
