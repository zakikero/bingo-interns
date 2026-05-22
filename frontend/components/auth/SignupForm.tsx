"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SignupForm() {
  const router = useRouter();
  const { register, loading, error } = useAuth();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [matchError, setMatchError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMatchError("Passwords do not match.");
      return;
    }
    setMatchError(null);
    try {
      await register(username, password);
      router.push("/board");
    } catch {
      // error is already captured in the hook
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {(error || matchError) && (
        <p className="form-error">{matchError ?? error}</p>
      )}

      <label htmlFor="signup-username">Username</label>
      <input
        id="signup-username"
        type="text"
        placeholder="your-username"
        autoComplete="username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="signup-password">Password</label>
      <PasswordInput
        id="signup-password"
        placeholder="Create a password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label htmlFor="signup-confirm-password">Confirm Password</label>
      <PasswordInput
        id="signup-confirm-password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (matchError) setMatchError(null);
        }}
      />

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => router.push("/login")}
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}
