/**
 * lib/api/auth.ts
 *
 * Auth functions backed by the FastAPI username/password endpoints.
 */

import type { User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function requestAuth<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Authentication failed");
  }

  return response.json();
}

export async function registerUser(
  username: string,
  password: string,
): Promise<User> {
  return requestAuth<User>("/api/auth/register", { username, password });
}

export async function loginUser(
  username: string,
  password: string,
): Promise<User> {
  return requestAuth<User>("/api/auth/login", { username, password });
}

export async function logoutUser(): Promise<void> {
  // No server-side session yet. Client clears local state.
}
