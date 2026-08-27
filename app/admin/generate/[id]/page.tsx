"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  type: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  created_at: string;
};

type Course = { id: string; title: string };

const CHECKLIST = [
  { id: "facts", label: "Facts look accurate (mainstream textbook psychology)" },
  { id: "answers", label: "Quiz answer indices and explanations are correct" },
  { id: "tone", label: "Tone matches the professor voice and is appropriate" },
] as const;

export default function ReviewDraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [draftText, setDraftText] = useState("");
  const [courseId, setCourseId] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/generation/${id}`).then(async (r) => {
        if (!r.ok) throw new Error("Draft not found");
        return r.json();
      }),
      fetch("/api/admin/courses").then((r) => r.json()),
    ])
      .then(([j, c]) => {
        setJob(j.job);
        setCourses(c.courses ?? []);
        const out = j.job.output ?? {};
        setDraftText(JSON.stringify(out, null, 2));
        if (typeof out.course_id === "string") setCourseId(out.course_id);
        else if (typeof j.job.input?.course_id === "string") {
          setCourseId(j.job.input.course_id);
        }
        if (typeof j.job.input?.name === "string") {
          setProfessorName(j.job.input.name);
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const allChecked = useMemo(
    () => CHECKLIST.every((c) => checks[c.id]),
    [checks],
  );

  async function saveEdits() {
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const parsed = JSON.parse(draftText) as Record<string, unknown>;
      const res = await fetch(`/api/admin/generation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setJob(data.job);
      setSavedMsg("Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!allChecked) return;
    setBusy(true);
    setError(null);
    try {
      let overrides: Record<string, unknown> | undefined;
      try {
        overrides = JSON.parse(draftText) as Record<string, unknown>;
      } catch {
        throw new Error("Draft JSON is invalid — fix before accepting");
      }

      const body: Record<string, unknown> = { overrides };
      if (job?.type === "content") {
        if (!courseId) throw new Error("Select a course to accept into");
        body.course_id = courseId;
      }
      if (job?.type === "professor" && professorName) {
        body.name = professorName;
      }

      const res = await fetch(`/api/admin/generation/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Accept failed");

      if (job?.type === "professor" && data.professor?.id) {
        router.push(`/admin/professors/${data.professor.id}`);
      } else if (job?.type === "content" && data.lesson?.id) {
        router.push(`/admin/lessons/${data.lesson.id}`);
      } else {
        router.push("/admin/generate");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
      setBusy(false);
    }
  }

  if (error && !job) {
    return <p className="font-bold text-red-600">{error}</p>;
  }
  if (!job) {
    return <p className="font-bold text-[var(--pp-muted)]">Loading draft…</p>;
  }

  const canAccept = job.status === "succeeded" && allChecked;

  return (
    <div>
      <Link
        href="/admin/generate"
        className="mb-4 inline-block text-sm font-extrabold text-[var(--pp-brand)]"
      >
        ← AI generate
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Review draft</h1>
          <p className="font-semibold text-[var(--pp-muted)]">
            {job.type} · {job.status} · {new Date(job.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {job.status === "failed" && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">
          Generation failed:{" "}
          {typeof job.output?.error === "string" ? job.output.error : "unknown"}
        </p>
      )}

      {job.status === "accepted" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-800">
          Already accepted into the CMS.
        </p>
      )}

      {job.type === "professor" && job.status === "succeeded" && (
        <label className="mb-4 block max-w-md">
          <span className="mb-1 block text-sm font-extrabold">Professor name</span>
          <input
            value={professorName}
            onChange={(e) => setProfessorName(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
          />
        </label>
      )}

      {job.type === "content" && job.status === "succeeded" && (
        <label className="mb-4 block max-w-md">
          <span className="mb-1 block text-sm font-extrabold">
            Accept into course
          </span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {job.status === "succeeded" && (
        <>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-extrabold">
              Draft JSON (editable)
            </span>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={22}
              className="w-full rounded-2xl border-2 border-[var(--pp-border)] bg-white p-4 font-mono text-xs font-semibold leading-relaxed outline-none focus:border-[var(--pp-brand)]"
              spellCheck={false}
            />
          </label>

          <section className="mb-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <h2 className="mb-2 text-lg font-black text-amber-950">
              Fact-check checklist
            </h2>
            <p className="mb-3 text-sm font-semibold text-amber-900/80">
              AI drafts are not published until you accept. Confirm before materializing.
            </p>
            <ul className="space-y-2">
              {CHECKLIST.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm font-bold text-amber-950">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!checks[c.id]}
                      onChange={(e) =>
                        setChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))
                      }
                    />
                    {c.label}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {error && <p className="mb-3 font-bold text-red-600">{error}</p>}
          {savedMsg && <p className="mb-3 font-bold text-emerald-700">{savedMsg}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={saveEdits}
              className="rounded-2xl border-2 border-[var(--pp-border)] px-5 py-2.5 text-sm font-black hover:border-[var(--pp-brand)] disabled:opacity-60"
            >
              Save edits
            </button>
            <button
              type="button"
              disabled={busy || !canAccept}
              onClick={accept}
              className="rounded-2xl bg-[var(--pp-brand)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              Accept into CMS
            </button>
          </div>
        </>
      )}

      {job.status !== "succeeded" && job.output && (
        <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-semibold ring-1 ring-[var(--pp-border)]">
          {JSON.stringify(job.output, null, 2)}
        </pre>
      )}
    </div>
  );
}
