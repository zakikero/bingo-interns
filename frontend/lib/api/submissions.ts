/**
 * lib/api/submissions.ts
 */

import type { Submission } from "@/types";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Upload an image file to the Supabase "activity-submissions" bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadSubmissionImage(userId: string, activityId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${activityId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("activity-submissions").upload(path, file, { upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from("activity-submissions").getPublicUrl(path);

  return data.publicUrl;
}

export async function submitActivity(userId: string, activityId: string): Promise<Submission> {
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

export async function getUserSubmissions(userId: string): Promise<Submission[]> {
  const response = await fetch(`${API_BASE_URL}/api/submissions/user/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch submissions");
  return response.json();
}
