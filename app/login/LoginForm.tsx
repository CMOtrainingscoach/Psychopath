"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/learn";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (err) throw err;
        setMessage("Check your email for a magic link.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.replace(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-4xl" aria-hidden>
          🧠
        </div>
        <h1 className="text-3xl font-black text-[var(--pp-ink)]">Welcome back</h1>
        <p className="mt-2 font-semibold text-[var(--pp-muted)]">
          Sign in to continue your psychology path.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-left text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
          EMAIL
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border-2 border-[var(--pp-border)] bg-white px-4 py-3 text-base font-bold text-[var(--pp-ink)] outline-none focus:border-[var(--pp-brand)]"
          />
        </label>

        {mode === "password" && (
          <label className="text-left text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
            PASSWORD
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-[var(--pp-border)] bg-white px-4 py-3 text-base font-bold text-[var(--pp-ink)] outline-none focus:border-[var(--pp-brand)]"
            />
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-[#fdecec] px-3 py-2 text-sm font-bold text-[#c62828]">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-[#e9f9ef] px-3 py-2 text-sm font-bold text-[#1f8a45]">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-2xl bg-[var(--pp-brand)] px-5 py-3.5 text-base font-black text-white shadow-md disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "magic" ? "Send magic link" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode((m) => (m === "password" ? "magic" : "password"))}
        className="mt-4 text-sm font-extrabold text-[var(--pp-brand)]"
      >
        {mode === "password" ? "Use magic link instead" : "Use password instead"}
      </button>

      <p className="mt-8 text-center text-sm font-bold text-[var(--pp-muted)]">
        New here?{" "}
        <Link href="/signup" className="text-[var(--pp-brand)]">
          Create an account
        </Link>
      </p>
    </main>
  );
}
