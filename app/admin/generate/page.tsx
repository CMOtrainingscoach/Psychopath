"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Job = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  input: Record<string, unknown>;
};

export default function GenerateHubPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/generation")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load drafts");
        return r.json();
      })
      .then((d) => setJobs(d.jobs))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black">AI generate</h1>
      <p className="mb-8 font-semibold text-[var(--pp-muted)]">
        Draft professors and lessons with OpenAI, then review before publishing.
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/generate/professor"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--pp-border)] transition hover:ring-[var(--pp-brand)]"
        >
          <div className="text-lg font-black text-[var(--pp-brand)]">New professor</div>
          <p className="mt-2 text-sm font-semibold text-[var(--pp-muted)]">
            Persona, voice prompt, sample phrases, and suggested avatar.
          </p>
        </Link>
        <Link
          href="/admin/generate/content"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--pp-border)] transition hover:ring-[var(--pp-brand)]"
        >
          <div className="text-lg font-black text-[var(--pp-brand)]">Lesson content</div>
          <p className="mt-2 text-sm font-semibold text-[var(--pp-muted)]">
            Chapters, cards, quizzes, and checkpoint in a professor&apos;s voice.
          </p>
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--pp-border)]">
        <h2 className="mb-3 text-lg font-black">Recent drafts</h2>
        {error && <p className="font-bold text-red-600">{error}</p>}
        {jobs.length === 0 && !error ? (
          <p className="text-sm font-semibold text-[var(--pp-muted)]">
            No generation jobs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => {
              const label =
                j.type === "professor"
                  ? String(j.input?.name ?? "Professor")
                  : String(j.input?.topic ?? "Lesson");
              return (
                <li key={j.id}>
                  <Link
                    href={`/admin/generate/${j.id}`}
                    className="flex items-center justify-between rounded-xl bg-[#f7f5fc] px-3 py-2 text-sm font-bold hover:bg-[var(--pp-brand-soft)]"
                  >
                    <span>
                      {j.type} · {label} · {j.status}
                    </span>
                    <span className="text-[var(--pp-muted)]">
                      {new Date(j.created_at).toLocaleString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
