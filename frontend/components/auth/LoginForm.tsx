"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const { login, loading, error } = useAuth();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.push("/board");
    } catch {
      // error is already captured in the hook
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <label htmlFor="login-username">Username</label>
      <input
        id="login-username"
        type="text"
        placeholder="your-username"
        autoComplete="username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="login-password">Password</label>
      <PasswordInput
        id="login-password"
        placeholder="Enter password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => router.push("/signup")}
      >
        Need an account? Sign up
      </button>
    </form>
  );
}
