"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/learn`,
        },
      });
      if (err) throw err;
      if (data.session) {
        router.replace("/learn");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
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
        <h1 className="text-3xl font-black text-[var(--pp-ink)]">Join PsychPath</h1>
        <p className="mt-2 font-semibold text-[var(--pp-muted)]">
          Create a free learner account and start earning XP.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-left text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
          DISPLAY NAME
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-2xl border-2 border-[var(--pp-border)] bg-white px-4 py-3 text-base font-bold text-[var(--pp-ink)] outline-none focus:border-[var(--pp-brand)]"
          />
        </label>
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
        <label className="text-left text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
          PASSWORD
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border-2 border-[var(--pp-border)] bg-white px-4 py-3 text-base font-bold text-[var(--pp-ink)] outline-none focus:border-[var(--pp-brand)]"
          />
        </label>

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
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm font-bold text-[var(--pp-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--pp-brand)]">
          Sign in
        </Link>
      </p>
    </main>
  );
}
