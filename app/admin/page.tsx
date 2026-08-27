"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  counts: {
    courses: number;
    lessons: number;
    chapters: number;
    professors: number;
    published_courses: number;
  };
  recent_drafts: Array<{
    id: string;
    type: string;
    status: string;
    created_at: string;
  }>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="font-bold text-red-600">{error}</p>;
  }
  if (!stats) {
    return <p className="font-bold text-[var(--pp-muted)]">Loading dashboard…</p>;
  }

  const cards = [
    { label: "Courses", value: stats.counts.courses, href: "/admin/courses" },
    { label: "Published", value: stats.counts.published_courses, href: "/admin/courses" },
    { label: "Lessons", value: stats.counts.lessons, href: "/admin/courses" },
    { label: "Chapters", value: stats.counts.chapters, href: "/admin/courses" },
    { label: "Professors", value: stats.counts.professors, href: "/admin/professors" },
  ];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black">Dashboard</h1>
      <p className="mb-8 font-semibold text-[var(--pp-muted)]">
        Manage curriculum, professors, and publishing.
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--pp-border)] transition hover:ring-[var(--pp-brand)]"
          >
            <div className="text-3xl font-black text-[var(--pp-brand)]">{c.value}</div>
            <div className="mt-1 text-sm font-extrabold text-[#5b5470]">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <Link
          href="/admin/generate"
          className="inline-flex rounded-2xl bg-[var(--pp-brand)] px-4 py-2.5 text-sm font-black text-white"
        >
          AI generate
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--pp-border)]">
        <h2 className="mb-3 text-lg font-black">Recent AI drafts</h2>
        {stats.recent_drafts.length === 0 ? (
          <p className="text-sm font-semibold text-[var(--pp-muted)]">
            No generation jobs yet — open AI generate to draft a professor or lesson.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.recent_drafts.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/generate/${d.id}`}
                  className="flex items-center justify-between rounded-xl bg-[#f7f5fc] px-3 py-2 text-sm font-bold hover:bg-[var(--pp-brand-soft)]"
                >
                  <span>
                    {d.type} · {d.status}
                  </span>
                  <span className="text-[var(--pp-muted)]">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
