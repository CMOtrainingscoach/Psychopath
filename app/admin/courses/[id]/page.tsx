"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Professor = { id: string; name: string };
type Lesson = {
  id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  chapter_count: number;
};

export default function CourseEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const router = useRouter();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    color: "#6C5CE7",
    icon: "🧠",
    default_professor_id: "" as string,
    is_published: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/professors")
      .then((r) => r.json())
      .then((d) => setProfessors(d.professors ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/courses/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load course");
        return r.json();
      })
      .then((d) => {
        const c = d.course;
        setForm({
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle ?? "",
          description: c.description ?? "",
          color: c.color,
          icon: c.icon,
          default_professor_id: c.default_professor_id ?? "",
          is_published: c.is_published,
        });
        setLessons(d.lessons ?? []);
      })
      .catch((e) => setError(e.message));
  }, [isNew, params.id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      default_professor_id: form.default_professor_id || null,
    };
    const res = await fetch(
      isNew ? "/api/admin/courses" : `/api/admin/courses/${params.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(
        typeof d.error === "string"
          ? d.error
          : d.error?.fieldErrors
            ? JSON.stringify(d.error.fieldErrors)
            : "Save failed",
      );
      return;
    }
    const d = await res.json();
    if (isNew) router.replace(`/admin/courses/${d.course.id}`);
  }

  async function addLesson() {
    const title = prompt("Lesson title?");
    if (!title || isNew) return;
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: params.id,
        title,
        professor_id: form.default_professor_id || null,
        is_published: false,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/admin/lessons/${d.lesson.id}`);
    }
  }

  async function moveLesson(l: Lesson, dir: -1 | 1) {
    const idx = lessons.findIndex((x) => x.id === l.id);
    const swap = lessons[idx + dir];
    if (!swap) return;
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "lessons",
        items: [
          { id: l.id, order_index: swap.order_index },
          { id: swap.id, order_index: l.order_index },
        ],
      }),
    });
    const r = await fetch(`/api/admin/courses/${params.id}`);
    const d = await r.json();
    setLessons(d.lessons ?? []);
  }

  async function onDelete() {
    if (isNew || !confirm("Delete this course and all lessons?")) return;
    const res = await fetch(`/api/admin/courses/${params.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/courses");
  }

  return (
    <div>
      <Link href="/admin/courses" className="text-sm font-extrabold text-[var(--pp-brand)]">
        ← Courses
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">
          {isNew ? "New course" : form.title || "Edit course"}
        </h1>
        {!isNew && (
          <Link
            href={`/admin/preview/${form.slug}`}
            className="rounded-2xl bg-[var(--pp-brand-soft)] px-4 py-2 text-sm font-black text-[var(--pp-brand)]"
          >
            Preview as learner
          </Link>
        )}
      </div>

      <form
        onSubmit={onSave}
        className="mb-8 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[var(--pp-border)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-extrabold text-[var(--pp-muted)]">
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)]">
            Slug
            <input
              required
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)] sm:col-span-2">
            Subtitle
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)] sm:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)]">
            Color
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="mt-1 h-10 w-full"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)]">
            Icon (emoji)
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
            />
          </label>
          <label className="text-xs font-extrabold text-[var(--pp-muted)] sm:col-span-2">
            Default professor
            <select
              value={form.default_professor_id}
              onChange={(e) =>
                setForm({ ...form, default_professor_id: e.target.value })
              }
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
            >
              <option value="">— none —</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published
          </label>
        </div>

        {error && <p className="font-bold text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3 font-black text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save course"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-2xl border-2 border-red-200 px-5 py-3 font-black text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </form>

      {!isNew && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Lessons</h2>
            <button
              type="button"
              onClick={addLesson}
              className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2 text-sm font-black text-white"
            >
              Add lesson
            </button>
          </div>
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-[var(--pp-border)]"
              >
                <div className="flex-1 font-black">
                  <Link href={`/admin/lessons/${l.id}`} className="hover:text-[var(--pp-brand)]">
                    {l.title}
                  </Link>
                  <div className="text-xs font-semibold text-[var(--pp-muted)]">
                    {l.chapter_count} chapters · {l.is_published ? "Published" : "Draft"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveLesson(l, -1)}
                  className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === lessons.length - 1}
                  onClick={() => moveLesson(l, 1)}
                  className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
                >
                  ↓
                </button>
                <Link
                  href={`/admin/lessons/${l.id}`}
                  className="rounded-xl bg-[var(--pp-brand-soft)] px-3 py-1 text-sm font-black text-[var(--pp-brand)]"
                >
                  Edit
                </Link>
              </div>
            ))}
            {lessons.length === 0 && (
              <p className="font-semibold text-[var(--pp-muted)]">No lessons yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
