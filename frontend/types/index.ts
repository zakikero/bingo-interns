/**
 * types/index.ts
 *
 * Shared domain types used across the frontend.
 * These mirror the shape returned by the backend API.
 */

export interface User {
  id: string;
  username: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  isImageRequired: boolean;
}

export interface Submission {
  id?: string;
  user_id: string;
  activity_id: string;
  created_at?: string;
}
