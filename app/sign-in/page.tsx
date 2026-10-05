"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInUser } from "../lib/auth";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await signInUser(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign In</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-black px-4 py-2 text-white"
        >
          {saving ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
