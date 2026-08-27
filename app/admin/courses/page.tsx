"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  is_published: boolean;
  order_index: number;
  lesson_count: number;
};

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/courses");
    if (!r.ok) throw new Error("Failed to load courses");
    const d = await r.json();
    setCourses(d.courses);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function togglePublish(c: Course) {
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "courses",
        id: c.id,
        is_published: !c.is_published,
      }),
    });
    if (res.ok) await load();
  }

  async function move(c: Course, dir: -1 | 1) {
    const idx = courses.findIndex((x) => x.id === c.id);
    const swap = courses[idx + dir];
    if (!swap) return;
    const items = [
      { id: c.id, order_index: swap.order_index },
      { id: swap.id, order_index: c.order_index },
    ];
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "courses", items }),
    });
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Courses</h1>
          <p className="font-semibold text-[var(--pp-muted)]">
            Paths shown in the learner map.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2.5 text-sm font-black text-white"
        >
          New course
        </Link>
      </div>

      {error && <p className="font-bold text-red-600">{error}</p>}

      <div className="space-y-3">
        {courses.map((c, i) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[var(--pp-border)]"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${c.color}22`, color: c.color }}
            >
              {c.icon}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/courses/${c.id}`}
                className="font-black hover:text-[var(--pp-brand)]"
              >
                {c.title}
              </Link>
              <div className="text-sm font-semibold text-[var(--pp-muted)]">
                /{c.slug} · {c.lesson_count} lessons ·{" "}
                {c.is_published ? "Published" : "Draft"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(c, -1)}
                className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === courses.length - 1}
                onClick={() => move(c, 1)}
                className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => togglePublish(c)}
                className="rounded-xl border-2 border-[var(--pp-border)] px-3 py-1 text-sm font-black"
              >
                {c.is_published ? "Unpublish" : "Publish"}
              </button>
              <Link
                href={`/admin/preview/${c.slug}`}
                className="rounded-xl bg-[var(--pp-brand-soft)] px-3 py-1 text-sm font-black text-[var(--pp-brand)]"
              >
                Preview
              </Link>
              <Link
                href={`/admin/courses/${c.id}`}
                className="rounded-xl bg-[var(--pp-brand)] px-3 py-1 text-sm font-black text-white"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
