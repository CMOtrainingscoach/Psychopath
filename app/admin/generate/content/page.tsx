"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Professor = { id: string; name: string; tagline: string };
type Course = { id: string; title: string; slug: string };

export default function GenerateContentPage() {
  const router = useRouter();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professorId, setProfessorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [numChapters, setNumChapters] = useState(3);
  const [qPerChapter, setQPerChapter] = useState(3);
  const [checkpointQs, setCheckpointQs] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/professors").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
    ])
      .then(([p, c]) => {
        setProfessors(p.professors ?? []);
        setCourses(c.courses ?? []);
        if (p.professors?.[0]) setProfessorId(p.professors[0].id);
      })
      .catch(() => setError("Failed to load professors/courses"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const course = courses.find((c) => c.id === courseId);
      const res = await fetch("/api/admin/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor_id: professorId,
          topic,
          learning_objectives: objectives,
          course_id: courseId || undefined,
          course_title: course?.title,
          num_chapters: numChapters,
          questions_per_chapter: qPerChapter,
          checkpoint_questions: checkpointQs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error ?? "Generation failed");
        throw new Error(msg);
      }
      router.push(`/admin/generate/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/generate"
        className="mb-4 inline-block text-sm font-extrabold text-[var(--pp-brand)]"
      >
        ← AI generate
      </Link>
      <h1 className="mb-2 text-3xl font-black">Generate lesson</h1>
      <p className="mb-6 font-semibold text-[var(--pp-muted)]">
        Draft chapters + quizzes in a professor&apos;s voice. Review before accepting.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--pp-border)]"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Professor voice</span>
          <select
            required
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
          >
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.tagline}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">
            Target course (for Accept)
          </span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
          >
            <option value="">Select later on accept…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Topic</span>
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
            placeholder="e.g. Classical conditioning basics"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Learning objectives</span>
          <textarea
            required
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={4}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
            placeholder="Learners will explain UCS/CS/CR and give one clinical example…"
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold">Chapters</span>
            <input
              type="number"
              min={1}
              max={6}
              value={numChapters}
              onChange={(e) => setNumChapters(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold">Q / chapter</span>
            <input
              type="number"
              min={2}
              max={5}
              value={qPerChapter}
              onChange={(e) => setQPerChapter(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold">Checkpoint Qs</span>
            <input
              type="number"
              min={3}
              max={8}
              value={checkpointQs}
              onChange={(e) => setCheckpointQs(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
            />
          </label>
        </div>

        {error && <p className="font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || !professorId}
          className="rounded-2xl bg-[var(--pp-brand)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
        >
          {busy ? "Generating (may take a minute)…" : "Generate draft"}
        </button>
      </form>
    </div>
  );
}
