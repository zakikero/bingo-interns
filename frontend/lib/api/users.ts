/**
 * lib/api/users.ts
 */

import type { User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}
